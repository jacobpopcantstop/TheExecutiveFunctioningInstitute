const crypto = require('crypto');
const { json, parseBody, requiredEnv } = require('./_common');

function b64urlEncode(input) {
  return Buffer.from(input).toString('base64url');
}

function b64urlDecode(input) {
  return Buffer.from(String(input || ''), 'base64url').toString('utf8');
}

function signingSecret() {
  return requiredEnv('EFI_PURCHASE_SIGNING_SECRET') || requiredEnv('EFI_DOWNLOAD_SIGNING_SECRET') || 'efi-dev-signing-secret';
}

function sign(payload) {
  return crypto.createHmac('sha256', signingSecret()).update(payload).digest('base64url');
}

function makeReceipt(payloadObj) {
  const payload = b64urlEncode(JSON.stringify(payloadObj));
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function verifyReceiptToken(token) {
  if (!token || token.indexOf('.') === -1) return { ok: false, error: 'Invalid receipt token' };
  const parts = token.split('.');
  const payload = parts[0];
  const signature = parts[1];
  if (!payload || !signature) return { ok: false, error: 'Invalid receipt token' };

  const expected = sign(payload);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, error: 'Signature mismatch' };
  }

  try {
    const decoded = JSON.parse(b64urlDecode(payload));
    return { ok: true, receipt: decoded };
  } catch (err) {
    return { ok: false, error: 'Malformed receipt payload' };
  }
}

function makeCredentialId(email) {
  const lower = String(email || '').toLowerCase();
  let h = 0;
  for (let i = 0; i < lower.length; i++) {
    h = ((h << 5) - h) + lower.charCodeAt(i);
    h |= 0;
  }
  return 'EFI-CEFC-' + Math.abs(h).toString(36).toUpperCase().substring(0, 8);
}

function issuePurchase(body) {
  const email = String(body.email || '').trim().toLowerCase();
  const items = Array.isArray(body.items) ? body.items : [];
  if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email is required' });
  if (!items.length) return json(400, { ok: false, error: 'At least one item is required' });

  const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const now = new Date().toISOString();
  const purchase = {
    id: 'ord_' + crypto.randomBytes(6).toString('hex'),
    date: now,
    total,
    items: items,
    verification: {
      mode: process.env.EFI_STRIPE_ENFORCE === 'true' ? 'stripe_required' : 'server_signed'
    }
  };

  if (process.env.EFI_STRIPE_ENFORCE === 'true' && !body.payment_intent_id) {
    return json(402, {
      ok: false,
      error: 'Live mode requires payment_intent_id validated by Stripe webhook.'
    });
  }

  const receiptPayload = {
    v: 1,
    purchase_id: purchase.id,
    issued_at: now,
    email,
    items: items.map((i) => String(i.id || '')),
    credential_id: makeCredentialId(email)
  };

  const receipt = makeReceipt(receiptPayload);
  return json(200, {
    ok: true,
    purchase,
    receipt,
    credential_id: receiptPayload.credential_id
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'POST') {
    const body = await parseBody(event);
    if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });
    if (body.action === 'issue_purchase') {
      return issuePurchase(body);
    }
    return json(400, { ok: false, error: 'Unsupported action' });
  }

  if (event.httpMethod === 'GET') {
    const receiptToken = String((event.queryStringParameters || {}).receipt || '').trim();
    const productId = String((event.queryStringParameters || {}).product || '').trim();
    const credentialId = String((event.queryStringParameters || {}).credential_id || '').trim().toUpperCase();

    const checked = verifyReceiptToken(receiptToken);
    if (!checked.ok) return json(403, { ok: false, error: checked.error });

    const receipt = checked.receipt;
    const hasProduct = !productId || (Array.isArray(receipt.items) && receipt.items.indexOf(productId) !== -1);
    const credentialMatches = !credentialId || String(receipt.credential_id || '').toUpperCase() === credentialId;

    return json(200, {
      ok: hasProduct && credentialMatches,
      verified: hasProduct && credentialMatches,
      receipt: {
        purchase_id: receipt.purchase_id,
        issued_at: receipt.issued_at,
        items: receipt.items || [],
        credential_id: receipt.credential_id || null
      },
      checks: {
        product: hasProduct,
        credential: credentialMatches
      }
    });
  }

  return json(405, { ok: false, error: 'Method not allowed' });
};
