const { ASSET_MAP, json, baseUrl, signPayload, requiredEnv } = require('./_common');

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') return json(405, { ok: false, error: 'Method not allowed' });

  const asset = (event.queryStringParameters && event.queryStringParameters.asset) || '';
  if (!ASSET_MAP[asset]) return json(404, { ok: false, error: 'Unknown asset' });

  const secret = requiredEnv('EFI_DOWNLOAD_SIGNING_SECRET');
  if (!secret) return json(500, { ok: false, error: 'Download signing is not configured' });
  const expires = Math.floor(Date.now() / 1000) + 60 * 15;
  const payload = `${asset}:${expires}`;
  const sig = signPayload(payload, secret);

  const url = `${baseUrl(event)}/api/download-file?asset=${encodeURIComponent(asset)}&exp=${expires}&sig=${sig}`;
  return json(200, { ok: true, url, expires });
};
