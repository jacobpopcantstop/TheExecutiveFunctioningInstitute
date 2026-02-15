const crypto = require('crypto');
const { json, parseBody, fanout } = require('./_common');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });
  const body = await parseBody(event);
  if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });

  const name = String(body.event_name || '').trim();
  if (!name) return json(400, { ok: false, error: 'event_name is required' });

  const evt = {
    event_id: 'evt_' + crypto.randomBytes(6).toString('hex'),
    at: new Date().toISOString(),
    event_name: name,
    page: String(body.page || ''),
    source: String(body.source || ''),
    properties: body.properties && typeof body.properties === 'object' ? body.properties : {},
    context: {
      user_agent: event.headers['user-agent'] || '',
      ip_hint: event.headers['x-forwarded-for'] || ''
    }
  };

  const delivery = await fanout({ type: 'analytics_event', event: evt });
  return json(200, { ok: true, event_id: evt.event_id, delivery });
};
