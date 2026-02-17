const { ASSET_MAP, verifySignature, requiredEnv } = require('./_common');

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const q = event.queryStringParameters || {};
  const asset = q.asset || '';
  const exp = Number(q.exp || 0);
  const sig = q.sig || '';

  if (!ASSET_MAP[asset]) return { statusCode: 404, body: 'Unknown asset' };
  if (!exp || Math.floor(Date.now() / 1000) > exp) return { statusCode: 410, body: 'Link expired' };

  const secret = requiredEnv('EFI_DOWNLOAD_SIGNING_SECRET');
  if (!secret) return { statusCode: 500, body: 'Download signing is not configured' };
  const payload = `${asset}:${exp}`;
  if (!verifySignature(payload, sig, secret)) return { statusCode: 403, body: 'Invalid signature' };

  return {
    statusCode: 302,
    headers: {
      Location: '/' + ASSET_MAP[asset],
      'Cache-Control': 'no-store'
    },
    body: ''
  };
};
