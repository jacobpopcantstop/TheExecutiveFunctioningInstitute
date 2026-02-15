const { json, parseBody } = require('./_common');
const db = require('./_db');

exports.handler = async function (event) {
  const method = event.httpMethod;

  if (method === 'GET') {
    const email = String((event.queryStringParameters || {}).email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email query parameter is required' });
    const record = await db.getProgress(email);
    return json(200, { ok: true, found: record.found, progress: record.progress, updated_at: record.updated_at, storage: record.storage });
  }

  if (method === 'POST') {
    const body = await parseBody(event);
    if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });

    const email = String(body.email || '').trim().toLowerCase();
    const progress = body.progress && typeof body.progress === 'object' ? body.progress : null;
    if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email is required' });
    if (!progress) return json(400, { ok: false, error: 'progress object is required' });

    const result = await db.upsertProgress(email, progress);
    return json(200, { ok: true, updated_at: result.updated_at, storage: result.storage });
  }

  return json(405, { ok: false, error: 'Method not allowed' });
};
