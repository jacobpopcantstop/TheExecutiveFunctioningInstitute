const crypto = require('crypto');
const { json, requiredEnv } = require('./_common');

function verifyStripeSignature(rawBody, headerValue, secret) {
  if (!headerValue || !secret) return false;
  const parts = String(headerValue).split(',');
  const tsPart = parts.find((p) => p.startsWith('t='));
  const sigPart = parts.find((p) => p.startsWith('v1='));
  if (!tsPart || !sigPart) return false;

  const ts = tsPart.substring(2);
  const provided = sigPart.substring(3);
  const signedPayload = `${ts}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });

  const rawBody = event.body || '';
  const stripeSecret = requiredEnv('STRIPE_WEBHOOK_SECRET');
  const demoSecret = requiredEnv('EFI_WEBHOOK_DEMO_SECRET');

  if (stripeSecret) {
    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    if (!verifyStripeSignature(rawBody, sig, stripeSecret)) {
      return json(400, { ok: false, error: 'Invalid Stripe signature' });
    }
  } else if (demoSecret) {
    const header = event.headers['x-efi-webhook-secret'] || '';
    if (header !== demoSecret) return json(401, { ok: false, error: 'Invalid demo webhook secret' });
  } else {
    return json(503, { ok: false, error: 'Webhook secret not configured' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    return json(400, { ok: false, error: 'Invalid JSON payload' });
  }

  const eventType = String(payload.type || 'unknown');

  // Persistence hook:
  // On production, persist successful checkout events in your DB and associate
  // purchase status with the authenticated user account before fulfillment.
  console.log('[EFI_STRIPE_WEBHOOK_EVENT]', JSON.stringify({ type: eventType, id: payload.id || null }));

  return json(200, { ok: true, received: true, event_type: eventType });
};
