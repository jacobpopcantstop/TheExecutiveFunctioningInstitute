const { json, parseBody } = require('./_common');
const { getActor, isPrivilegedRole } = require('./_authz');
const db = require('./_db');

const SUBMIT_RATE = new Map();

function normalize(text) {
  return String(text || '').trim().toLowerCase();
}

function getClientIp(event) {
  const forwarded = String(event.headers['x-forwarded-for'] || '').trim();
  if (forwarded) return forwarded.split(',')[0].trim();
  return String(event.headers['client-ip'] || event.headers['x-nf-client-connection-ip'] || '').trim();
}

function passRateLimit(key, windowMs, maxHits) {
  const now = Date.now();
  const list = (SUBMIT_RATE.get(key) || []).filter((ts) => now - ts < windowMs);
  if (list.length >= maxHits) {
    SUBMIT_RATE.set(key, list);
    return false;
  }
  list.push(now);
  SUBMIT_RATE.set(key, list);
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
    return matchesQ && matchesSpecialty && matchesMode;
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'GET') {
    const qs = event.queryStringParameters || {};
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
    const stats = {
      total: (listed.records || []).length,
      approved: (listed.records || []).filter((r) => String(r.moderation_status).toLowerCase() === 'approved').length,
      pending: (listed.records || []).filter((r) => String(r.moderation_status).toLowerCase() === 'pending').length,
      rejected: (listed.records || []).filter((r) => String(r.moderation_status).toLowerCase() === 'rejected').length
    };
    return json(200, {
      ok: true,
      records: filtered,
      count: filtered.length,
      include_pending: includePending,
      storage: listed.storage,
      stats
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
      if (!passRateLimit('ip:' + ip, 10 * 60 * 1000, 5)) return json(429, { ok: false, error: 'Too many submissions from this network. Please try later.' });
      if (!passRateLimit('email:' + email, 10 * 60 * 1000, 3)) return json(429, { ok: false, error: 'Too many submissions for this email. Please try later.' });

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
      return json(200, { ok: true, submitted: true, record_id: saved.record.id, storage: saved.storage });
    }

    if (action === 'update_listing') {
      const actor = await getActor(event);
      if (!isPrivilegedRole(actor.role)) return json(403, { ok: false, error: 'Privileged role required' });
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
      return json(200, { ok: true, updated: true, record: updated.record, storage: updated.storage });
    }

    if (action === 'moderate_listing') {
      const actor = await getActor(event);
      if (!isPrivilegedRole(actor.role)) return json(403, { ok: false, error: 'Privileged role required' });

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
      return json(200, { ok: true, moderated: true, record: updated.record, storage: updated.storage });
    }

    return json(400, { ok: false, error: 'Unsupported action' });
  }

  return json(405, { ok: false, error: 'Method not allowed' });
};
