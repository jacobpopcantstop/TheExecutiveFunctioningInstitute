const { json, parseBody } = require('./_common');
const { getActor, isPrivilegedRole } = require('./_authz');
const db = require('./_db');

function normalize(text) {
  return String(text || '').trim().toLowerCase();
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
    return json(200, {
      ok: true,
      records: filtered,
      count: filtered.length,
      include_pending: includePending,
      storage: listed.storage
    });
  }

  if (event.httpMethod === 'POST') {
    const body = await parseBody(event);
    if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });
    const action = String(body.action || '').trim();

    if (action === 'submit_listing') {
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const city = String(body.city || '').trim();
      const state = String(body.state || '').trim();
      const zip = String(body.zip || '').trim();
      const specialty = String(body.specialty || '').trim();
      if (!name || !email || !email.includes('@')) return json(400, { ok: false, error: 'Valid name and email are required' });
      if (!city || !state || !zip || !specialty) return json(400, { ok: false, error: 'City, state, ZIP, and specialty are required' });

      const saved = await db.upsertDirectoryRecord({
        name,
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
