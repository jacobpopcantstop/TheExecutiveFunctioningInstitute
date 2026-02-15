const crypto = require('crypto');
const { json, parseBody, normalizeEmail, fanout } = require('./_common');
const db = require('./_db');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });
  const body = await parseBody(event);
  if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });

  const email = normalizeEmail(body.email);
  const name = String(body.name || '').trim();
  const source = String(body.source || 'unknown').trim();
  const leadType = String(body.lead_type || 'general').trim();
  const consent = !!body.consent;
  const nowIso = new Date().toISOString();
  const discountPercent = Number(body.discount_percent || 40);
  const requestedCode = String(body.offer_code || '').trim().toUpperCase();
  const offerCode = requestedCode || (leadType === 'esqr_results' ? 'ESQR40' : '');
  const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {};

  if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email is required' });
  if (!consent) return json(400, { ok: false, error: 'Consent is required' });

  const lead = {
    lead_id: 'lead_' + crypto.randomBytes(6).toString('hex'),
    captured_at: nowIso,
    email,
    name,
    source,
    lead_type: leadType,
    consent: {
      accepted: true,
      accepted_at: nowIso,
      policy_version: '2026-02-15'
    },
    campaign: offerCode ? {
      offer_code: offerCode,
      discount_percent: discountPercent
    } : null,
    metadata,
    context: {
      user_agent: event.headers['user-agent'] || '',
      ip_hint: event.headers['x-forwarded-for'] || ''
    }
  };

  const storage = await db.saveLead(lead);
  const delivery = await fanout({ type: 'lead_capture', lead });
  return json(200, {
    ok: true,
    lead_id: lead.lead_id,
    offer_code: offerCode || null,
    storage: storage.storage,
    delivery
  });
};
