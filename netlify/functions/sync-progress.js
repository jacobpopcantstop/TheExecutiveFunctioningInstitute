const { json, parseBody } = require('./_common');

const CACHE_KEY = '__EFI_PROGRESS_CACHE__';

function getCache() {
  if (!global[CACHE_KEY]) global[CACHE_KEY] = new Map();
  return global[CACHE_KEY];
}

exports.handler = async function (event) {
  const method = event.httpMethod;

  if (method === 'GET') {
    const email = String((event.queryStringParameters || {}).email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email query parameter is required' });
    const cache = getCache();
    const record = cache.get(email);
    return json(200, { ok: true, found: !!record, progress: record ? record.progress : null, updated_at: record ? record.updated_at : null, storage: 'function-memory' });
  }

  if (method === 'POST') {
    const body = await parseBody(event);
    if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });

    const email = String(body.email || '').trim().toLowerCase();
    const progress = body.progress && typeof body.progress === 'object' ? body.progress : null;
    if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email is required' });
    if (!progress) return json(400, { ok: false, error: 'progress object is required' });

    const cache = getCache();
    const updated_at = new Date().toISOString();
    cache.set(email, { progress, updated_at });

    return json(200, { ok: true, updated_at, storage: 'function-memory' });
  }

  return json(405, { ok: false, error: 'Method not allowed' });
};
