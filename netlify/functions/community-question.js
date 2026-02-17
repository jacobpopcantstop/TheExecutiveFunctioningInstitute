const crypto = require('crypto');
const { json, parseBody } = require('./_common');
const db = require('./_db');

function getClientIp(event) {
  const forwarded = String(event.headers['x-forwarded-for'] || '').trim();
  if (forwarded) return forwarded.split(',')[0].trim();
  return String(event.headers['client-ip'] || event.headers['x-nf-client-connection-ip'] || '').trim() || 'unknown';
}

function sanitize(text, maxLen) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' });
  }

  const body = await parseBody(event);
  if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });

  const topic = sanitize(body.topic, 64);
  const priority = sanitize(body.priority, 32).toLowerCase();
  const question = sanitize(body.question, 1200);
  const consent = !!body.consent;

  if (!consent) return json(400, { ok: false, error: 'Consent is required' });
  if (!topic) return json(400, { ok: false, error: 'Topic is required' });
  if (!question || question.length < 20) return json(400, { ok: false, error: 'Question must be at least 20 characters' });
  if (!['normal', 'high'].includes(priority)) return json(400, { ok: false, error: 'Priority must be normal or high' });

  const ip = getClientIp(event);
  const limited = await db.consumeRateLimit('community-q:' + ip, 10 * 60 * 1000, 5);
  if (!limited.allowed) return json(429, { ok: false, error: 'Too many submissions from this network. Please try later.' });

  const eventId = 'community_' + crypto.randomBytes(8).toString('hex');
  const saved = await db.saveEvent({
    event_id: eventId,
    at: new Date().toISOString(),
    event_name: 'community_question_submitted',
    page: 'community.html',
    source: 'community_hub',
    properties: {
      topic,
      priority,
      question
    },
    context: {
      ip,
      ua: event.headers['user-agent'] || null
    }
  });

  return json(200, { ok: true, submitted: true, event_id: eventId, storage: saved.storage });
};
