const crypto = require('crypto');
const { json, parseBody, requiredEnv } = require('./_common');
const { getActor, isPrivilegedRole } = require('./_authz');
const db = require('./_db');

function normalize(text) {
  return String(text || '').trim().toLowerCase();
}

function getClientIp(event) {
  const forwarded = String(event.headers['x-forwarded-for'] || '').trim();
  if (forwarded) return forwarded.split(',')[0].trim();
  return String(event.headers['client-ip'] || event.headers['x-nf-client-connection-ip'] || '').trim();
}

function csrfSecret() {
  return requiredEnv('EFI_CSRF_SIGNING_SECRET') || 'efi-dev-csrf-secret';
}

function signCsrfPayload(raw) {
  return crypto.createHmac('sha256', csrfSecret()).update(raw).digest('hex');
}

function encodeBase64Url(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value) {
  return Buffer.from(String(value || ''), 'base64url').toString('utf8');
}

function issueCsrfToken(actor) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    role: actor.role || 'unknown',
    email: actor.email || null,
    iat: now,
    exp: now + (20 * 60)
  };
  const raw = JSON.stringify(payload);
  const encoded = encodeBase64Url(raw);
  const sig = signCsrfPayload(encoded);
  return `${encoded}.${sig}`;
}

function verifyCsrfToken(token, actor) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return false;
  const encoded = parts[0];
  const providedSig = parts[1];
  const expectedSig = signCsrfPayload(encoded);
  if (providedSig !== expectedSig) return false;

  let payload = null;
  try {
    payload = JSON.parse(decodeBase64Url(encoded));
  } catch (err) {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  if (!payload || !payload.exp || payload.exp < now) return false;
  if (String(payload.role || '') !== String(actor.role || '')) return false;
  if (payload.email && actor.email && String(payload.email).toLowerCase() !== String(actor.email).toLowerCase()) return false;
  return true;
}

function isValidState(state) {
  return /^[A-Za-z]{2}$/.test(String(state || '').trim());
}

function isValidZip(zip) {
  return /^\d{5}(?:-\d{4})?$/.test(String(zip || '').trim());
}

function filterRecords(records, query) {
  const q = normalize(query.q);
  const specialty = normalize(query.specialty);
  const mode = normalize(query.mode);
  const moderationStatus = normalize(query.moderation_status);
  const verificationStatus = normalize(query.verification_status);
  return (records || []).filter((record) => {
    const haystack = normalize([
      record.name,
      record.city,
      record.state,
      record.zip,
      record.specialty,
      record.credential_id
    ].join(' '));
    const matchesQ = !q || haystack.includes(q);
    const matchesSpecialty = !specialty || normalize(record.specialty) === specialty;
    const modes = Array.isArray(record.delivery_modes) ? record.delivery_modes.map(normalize) : [];
    const matchesMode = !mode || modes.includes(mode);
    const matchesModeration = !moderationStatus || normalize(record.moderation_status) === moderationStatus;
    const matchesVerification = !verificationStatus || normalize(record.verification_status) === verificationStatus;
    return matchesQ && matchesSpecialty && matchesMode && matchesModeration && matchesVerification;
  });
}

function toCsvValue(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toDirectoryCsv(records) {
  const rows = [
    [
      'id',
      'name',
      'email',
      'city',
      'state',
      'zip',
      'specialty',
      'delivery_modes',
      'website',
      'credential_id',
      'verification_status',
      'moderation_status',
      'reviewer_email',
      'updated_at'
    ]
  ];
  (records || []).forEach((record) => {
    rows.push([
      record.id || '',
      record.name || '',
      record.email || '',
      record.city || '',
      record.state || '',
      record.zip || '',
      record.specialty || '',
      Array.isArray(record.delivery_modes) ? record.delivery_modes.join('|') : '',
      record.website || '',
      record.credential_id || '',
      record.verification_status || '',
      record.moderation_status || '',
      record.reviewer_email || '',
      record.updated_at || ''
    ]);
  });
  return rows.map((row) => row.map(toCsvValue).join(',')).join('\n');
}

function toAuditCsv(logs) {
  const rows = [[
    'id',
    'created_at',
    'actor_role',
    'actor_email',
    'action',
    'target_type',
    'target_id',
    'ip',
    'metadata'
  ]];
  (logs || []).forEach((log) => {
    rows.push([
      log.id || '',
      log.created_at || '',
      log.actor_role || '',
      log.actor_email || '',
      log.action || '',
      log.target_type || '',
      log.target_id || '',
      log.ip || '',
      JSON.stringify(log.metadata || {})
    ]);
  });
  return rows.map((row) => row.map(toCsvValue).join(',')).join('\n');
}

exports.handler = async function (event) {
  if (event.httpMethod === 'GET') {
    const qs = event.queryStringParameters || {};
    if (String(qs.action || '').trim() === 'csrf') {
      const actor = await getActor(event);
      if (!isPrivilegedRole(actor.role)) return json(403, { ok: false, error: 'Privileged role required' });
      return json(200, { ok: true, csrf: issueCsrfToken(actor), expires_in_sec: 1200 });
    }

    if (qs.email) {
      const email = String(qs.email || '').trim().toLowerCase();
      if (!email.includes('@')) return json(400, { ok: false, error: 'Valid email query parameter is required' });
      const found = await db.findDirectoryByEmail(email);
      const statuses = (found.records || []).map((row) => ({
        id: row.id,
        credential_id: row.credential_id || null,
        moderation_status: row.moderation_status || 'pending',
        verification_status: row.verification_status || 'pending',
        last_reviewed: row.last_reviewed || null,
        updated_at: row.updated_at || null
      }));
      return json(200, { ok: true, records: statuses, count: statuses.length, storage: found.storage });
    }

    const includePendingRequested = String(qs.include_pending || '').trim() === '1';
    let includePending = false;

    if (includePendingRequested) {
      const actor = await getActor(event);
      if (!isPrivilegedRole(actor.role)) {
        return json(403, { ok: false, error: 'Privileged access required for pending listings' });
      }
      includePending = true;
    }

    const listed = await db.listDirectory({ includePending });
    const filtered = filterRecords(listed.records, qs);
    const offset = Math.max(0, parseInt(String(qs.offset || '0'), 10) || 0);
    const limitRaw = parseInt(String(qs.limit || '200'), 10);
    const limit = Math.max(1, Math.min(500, Number.isFinite(limitRaw) ? limitRaw : 200));
    const paged = filtered.slice(offset, offset + limit);
    const stats = {
      total: (listed.records || []).length,
      approved: (listed.records || []).filter((r) => String(r.moderation_status).toLowerCase() === 'approved').length,
      pending: (listed.records || []).filter((r) => String(r.moderation_status).toLowerCase() === 'pending').length,
      rejected: (listed.records || []).filter((r) => String(r.moderation_status).toLowerCase() === 'rejected').length,
      archived: (listed.records || []).filter((r) => String(r.moderation_status).toLowerCase() === 'archived').length
    };
    let auditLogs = [];
    if (includePending && String(qs.audit || '').trim() === '1') {
      const requestedLimit = Math.max(1, Math.min(1000, parseInt(String(qs.audit_limit || '100'), 10) || 100));
      const logs = await db.listAuditLogs({ targetType: 'directory_record', limit: requestedLimit });
      auditLogs = logs.logs || [];
    }
    if (String(qs.format || '').trim().toLowerCase() === 'csv' && includePending) {
      const kind = String(qs.export || 'directory').trim().toLowerCase();
      const csvText = kind === 'audit' ? toAuditCsv(auditLogs) : toDirectoryCsv(filtered);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Cache-Control': 'no-store',
          'Content-Disposition': `attachment; filename="efi-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`
        },
        body: csvText
      };
    }
    return json(200, {
      ok: true,
      records: paged,
      count: paged.length,
      total_filtered: filtered.length,
      offset,
      limit,
      include_pending: includePending,
      storage: listed.storage,
      stats,
      audit_logs: auditLogs
    });
  }

  if (event.httpMethod === 'POST') {
    const body = await parseBody(event);
    if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });
    const action = String(body.action || '').trim();

    if (action === 'submit_listing') {
      const honeypot = String(body.company || '').trim();
      if (honeypot) return json(400, { ok: false, error: 'Invalid submission payload' });

      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const city = String(body.city || '').trim();
      const state = String(body.state || '').trim();
      const zip = String(body.zip || '').trim();
      const specialty = String(body.specialty || '').trim();

      if (!name || !email || !email.includes('@')) return json(400, { ok: false, error: 'Valid name and email are required' });
      if (!city || !state || !zip || !specialty) return json(400, { ok: false, error: 'City, state, ZIP, and specialty are required' });
      if (!isValidState(state)) return json(400, { ok: false, error: 'State must be a 2-letter code' });
      if (!isValidZip(zip)) return json(400, { ok: false, error: 'ZIP must be 5 digits or ZIP+4 format' });

      const ip = getClientIp(event) || 'unknown';
      const ipLimit = await db.consumeRateLimit('dir-ip:' + ip, 10 * 60 * 1000, 5);
      if (!ipLimit.allowed) return json(429, { ok: false, error: 'Too many submissions from this network. Please try later.' });
      const emailLimit = await db.consumeRateLimit('dir-email:' + email, 10 * 60 * 1000, 3);
      if (!emailLimit.allowed) return json(429, { ok: false, error: 'Too many submissions for this email. Please try later.' });

      const existingByEmail = await db.findDirectoryByEmail(email);
      const hasRecentPending = (existingByEmail.records || []).some((row) => {
        const isPending = String(row.moderation_status || '').toLowerCase() === 'pending';
        return isPending && normalize(row.specialty) === normalize(specialty) && normalize(row.city) === normalize(city);
      });
      if (hasRecentPending) {
        return json(409, { ok: false, error: 'A similar listing request is already pending review for this email.' });
      }

      const saved = await db.upsertDirectoryRecord({
        name,
        email,
        city,
        state,
        zip,
        specialty,
        delivery_modes: Array.isArray(body.delivery_modes) ? body.delivery_modes : [],
        website: body.website || '',
        credential_id: body.credential_id || null,
        bio: body.bio || null,
        verification_status: 'pending',
        moderation_status: 'pending'
      });
      await db.saveAuditLog({
        actor_role: 'public',
        actor_email: email,
        action: 'directory.submit_listing',
        target_type: 'directory_record',
        target_id: saved.record.id,
        ip,
        user_agent: event.headers['user-agent'] || null,
        metadata: {
          name,
          city,
          state,
          specialty,
          moderation_status: 'pending'
        }
      });
      return json(200, { ok: true, submitted: true, record_id: saved.record.id, storage: saved.storage });
    }

    if (action === 'update_listing') {
      const actor = await getActor(event);
      if (!isPrivilegedRole(actor.role)) return json(403, { ok: false, error: 'Privileged role required' });
      const csrfToken = event.headers['x-efi-csrf'] || event.headers['X-EFI-CSRF'] || '';
      if (!verifyCsrfToken(csrfToken, actor)) return json(403, { ok: false, error: 'CSRF validation failed' });
      const id = String(body.id || '').trim();
      if (!id) return json(400, { ok: false, error: 'id is required' });

      const patch = {};
      ['name', 'email', 'city', 'state', 'zip', 'specialty', 'website', 'credential_id', 'bio'].forEach((key) => {
        if (body[key] != null) patch[key] = body[key];
      });
      if (Array.isArray(body.delivery_modes)) patch.delivery_modes = body.delivery_modes;

      if (patch.state != null && !isValidState(patch.state)) return json(400, { ok: false, error: 'State must be a 2-letter code' });
      if (patch.zip != null && !isValidZip(patch.zip)) return json(400, { ok: false, error: 'ZIP must be 5 digits or ZIP+4 format' });

      const updated = await db.updateDirectoryRecord(id, patch);
      if (!updated) return json(404, { ok: false, error: 'Directory record not found' });
      await db.saveAuditLog({
        actor_role: actor.role,
        actor_email: actor.email,
        action: 'directory.update_listing',
        target_type: 'directory_record',
        target_id: id,
        ip: getClientIp(event) || null,
        user_agent: event.headers['user-agent'] || null,
        metadata: {
          name: updated.record.name || null,
          notes: 'Listing fields updated by reviewer/admin',
          patch
        }
      });
      return json(200, { ok: true, updated: true, record: updated.record, storage: updated.storage });
    }

    if (action === 'moderate_listing') {
      const actor = await getActor(event);
      if (!isPrivilegedRole(actor.role)) return json(403, { ok: false, error: 'Privileged role required' });
      const csrfToken = event.headers['x-efi-csrf'] || event.headers['X-EFI-CSRF'] || '';
      if (!verifyCsrfToken(csrfToken, actor)) return json(403, { ok: false, error: 'CSRF validation failed' });

      const id = String(body.id || '').trim();
      const moderationStatus = normalize(body.moderation_status);
      const verificationStatus = normalize(body.verification_status || 'verified');
      if (!id) return json(400, { ok: false, error: 'id is required' });
      if (!['approved', 'rejected', 'pending'].includes(moderationStatus)) {
        return json(400, { ok: false, error: 'moderation_status must be approved, rejected, or pending' });
      }
      if (!['verified', 'pending', 'rejected'].includes(verificationStatus)) {
        return json(400, { ok: false, error: 'verification_status must be verified, pending, or rejected' });
      }

      const updated = await db.moderateDirectoryRecord(id, {
        moderation_status: moderationStatus,
        verification_status: verificationStatus,
        moderation_notes: body.moderation_notes || '',
        reviewer_email: actor.email || body.reviewer_email || null,
        last_reviewed: new Date().toISOString()
      });
      if (!updated) return json(404, { ok: false, error: 'Directory record not found' });
      await db.saveAuditLog({
        actor_role: actor.role,
        actor_email: actor.email,
        action: 'directory.moderate_listing',
        target_type: 'directory_record',
        target_id: id,
        ip: getClientIp(event) || null,
        user_agent: event.headers['user-agent'] || null,
        metadata: {
          name: updated.record.name || null,
          moderation_status: moderationStatus,
          verification_status: verificationStatus,
          moderation_notes: body.moderation_notes || ''
        }
      });
      return json(200, { ok: true, moderated: true, record: updated.record, storage: updated.storage });
    }

    if (action === 'archive_listing') {
      const actor = await getActor(event);
      if (!isPrivilegedRole(actor.role)) return json(403, { ok: false, error: 'Privileged role required' });
      const csrfToken = event.headers['x-efi-csrf'] || event.headers['X-EFI-CSRF'] || '';
      if (!verifyCsrfToken(csrfToken, actor)) return json(403, { ok: false, error: 'CSRF validation failed' });
      const id = String(body.id || '').trim();
      if (!id) return json(400, { ok: false, error: 'id is required' });
      const archived = await db.moderateDirectoryRecord(id, {
        moderation_status: 'archived',
        verification_status: 'pending',
        moderation_notes: body.moderation_notes || 'Archived in CMS',
        reviewer_email: actor.email || null,
        last_reviewed: new Date().toISOString()
      });
      if (!archived) return json(404, { ok: false, error: 'Directory record not found' });
      await db.saveAuditLog({
        actor_role: actor.role,
        actor_email: actor.email,
        action: 'directory.archive_listing',
        target_type: 'directory_record',
        target_id: id,
        ip: getClientIp(event) || null,
        user_agent: event.headers['user-agent'] || null,
        metadata: {
          name: archived.record.name || null,
          moderation_status: 'archived',
          moderation_notes: body.moderation_notes || 'Archived in CMS'
        }
      });
      return json(200, { ok: true, archived: true, record: archived.record, storage: archived.storage });
    }

    return json(400, { ok: false, error: 'Unsupported action' });
  }

  return json(405, { ok: false, error: 'Method not allowed' });
};
