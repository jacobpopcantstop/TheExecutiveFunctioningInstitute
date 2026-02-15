const crypto = require('crypto');
const { json, parseBody, normalizeEmail, fanout } = require('./_common');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });
  const body = await parseBody(event);
  if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });

  const email = normalizeEmail(body.email);
  const name = String(body.name || '').trim();
  const source = String(body.source || 'unknown').trim();
  const leadType = String(body.lead_type || 'general').trim();
  const consent = !!body.consent;

  if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email is required' });
  if (!consent) return json(400, { ok: false, error: 'Consent is required' });

  const lead = {
    lead_id: 'lead_' + crypto.randomBytes(6).toString('hex'),
    captured_at: new Date().toISOString(),
    email,
    name,
    source,
    lead_type: leadType,
    consent: {
      accepted: true,
      accepted_at: new Date().toISOString(),
      policy_version: '2026-02-15'
    },
    context: {
      user_agent: event.headers['user-agent'] || '',
      ip_hint: event.headers['x-forwarded-for'] || ''
    }
  };

  const delivery = await fanout({ type: 'lead_capture', lead });
  return json(200, { ok: true, lead_id: lead.lead_id, delivery });
};
