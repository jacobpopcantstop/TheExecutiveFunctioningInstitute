const crypto = require('crypto');

const ASSET_MAP = {
  'gap-analyzer': 'docs/assets/executive-function-skills-gap-analyzer.pdf',
  'launch-plan': 'docs/assets/90-day-coaching-business-launch-plan.pdf'
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

async function parseBody(event) {
  try {
    return event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    return null;
  }
}

function baseUrl(event) {
  const host = event.headers['x-forwarded-host'] || event.headers.host;
  const proto = event.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

function signPayload(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function verifySignature(payload, signature, secret) {
  const expected = signPayload(payload, secret);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature || ''), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function requiredEnv(name) {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
}

async function fanout(payload) {
  const targets = [
    requiredEnv('EFI_CRM_WEBHOOK_URL'),
    requiredEnv('EFI_ESP_WEBHOOK_URL')
  ].filter(Boolean);

  if (!targets.length) {
    console.log('[EFI_LEAD_FALLOUT]', JSON.stringify(payload));
    return { delivered: false, targets: 0 };
  }

  const results = await Promise.all(targets.map(async (url) => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { url, ok: res.ok, status: res.status };
    } catch (err) {
      return { url, ok: false, status: 0, error: err.message };
    }
  }));

  return { delivered: results.some((r) => r.ok), targets: targets.length, results };
}

module.exports = {
  ASSET_MAP,
  json,
  parseBody,
  baseUrl,
  signPayload,
  verifySignature,
  normalizeEmail,
  requiredEnv,
  fanout
};
