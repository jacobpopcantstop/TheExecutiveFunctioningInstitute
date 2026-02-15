const crypto = require('crypto');
const { json, requiredEnv } = require('./_common');
const db = require('./_db');

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
  const obj = payload.data && payload.data.object ? payload.data.object : {};
  let paymentIntentId = '';
  let email = '';
  let amount = null;
  let currency = null;
  let status = 'unknown';

  if (eventType === 'payment_intent.succeeded') {
    paymentIntentId = String(obj.id || '');
    email = String((obj.receipt_email || (obj.metadata && obj.metadata.email) || '')).toLowerCase();
    amount = typeof obj.amount_received === 'number' ? obj.amount_received / 100 : null;
    currency = String(obj.currency || '').toUpperCase();
    status = 'succeeded';
  } else if (eventType === 'checkout.session.completed') {
    paymentIntentId = String(obj.payment_intent || '');
    email = String((obj.customer_details && obj.customer_details.email) || (obj.metadata && obj.metadata.email) || '').toLowerCase();
    amount = typeof obj.amount_total === 'number' ? obj.amount_total / 100 : null;
    currency = String(obj.currency || '').toUpperCase();
    status = 'succeeded';
  } else if (eventType === 'payment_intent.payment_failed') {
    paymentIntentId = String(obj.id || '');
    email = String((obj.receipt_email || (obj.metadata && obj.metadata.email) || '')).toLowerCase();
    amount = typeof obj.amount === 'number' ? obj.amount / 100 : null;
    currency = String(obj.currency || '').toUpperCase();
    status = 'failed';
  }

  if (paymentIntentId) {
    await db.savePaymentIntent(paymentIntentId, {
      status,
      email: email || null,
      amount,
      currency,
      raw: payload
    });
  }

  return json(200, { ok: true, received: true, event_type: eventType, payment_intent_id: paymentIntentId || null });
};
