const crypto = require('crypto');
const { requiredEnv } = require('./_common');

const MEM = {
  progress: new Map(),
  purchases: new Map(),
  payments: new Map(),
  submissions: new Map(),
  leads: new Map(),
  events: new Map()
};

function nowIso() {
  return new Date().toISOString();
}

function hasSupabase() {
  return !!(requiredEnv('SUPABASE_URL') && requiredEnv('SUPABASE_SERVICE_ROLE_KEY'));
}

async function supabaseRequest(path, { method = 'GET', body } = {}) {
  const url = requiredEnv('SUPABASE_URL');
  const key = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation'
  };

  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (err) { data = null; }
  if (!res.ok) {
    const msg = data && (data.message || data.error) ? (data.message || data.error) : `Supabase request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

async function upsertProgress(email, progress) {
  const normalized = String(email || '').trim().toLowerCase();
  const updated_at = nowIso();

  if (hasSupabase()) {
    try {
      await supabaseRequest('efi_user_progress', {
        method: 'POST',
        body: [{ email: normalized, progress, updated_at }]
      });
      return { storage: 'supabase', updated_at };
    } catch (err) {
      // fall through to memory
    }
  }

  MEM.progress.set(normalized, { email: normalized, progress, updated_at });
  return { storage: 'memory', updated_at };
}

async function getProgress(email) {
  const normalized = String(email || '').trim().toLowerCase();

  if (hasSupabase()) {
    try {
      const rows = await supabaseRequest(`efi_user_progress?email=eq.${encodeURIComponent(normalized)}&select=email,progress,updated_at&limit=1`);
      if (Array.isArray(rows) && rows.length) {
        return { found: true, progress: rows[0].progress, updated_at: rows[0].updated_at, storage: 'supabase' };
      }
      return { found: false, progress: null, updated_at: null, storage: 'supabase' };
    } catch (err) {
      // fall through
    }
  }

  const row = MEM.progress.get(normalized);
  return { found: !!row, progress: row ? row.progress : null, updated_at: row ? row.updated_at : null, storage: 'memory' };
}

async function addPurchase(email, purchase) {
  const normalized = String(email || '').trim().toLowerCase();
  const list = MEM.purchases.get(normalized) || [];
  list.push(purchase);
  MEM.purchases.set(normalized, list);

  if (hasSupabase()) {
    try {
      await supabaseRequest('efi_user_purchases', {
        method: 'POST',
        body: [{
          id: purchase.id,
          email: normalized,
          purchased_at: purchase.date || nowIso(),
          total: Number(purchase.total || 0),
          items: purchase.items || [],
          receipt: purchase.receipt || null,
          credential_id: purchase.credentialId || null
        }]
      });
      return { storage: 'supabase' };
    } catch (err) {
      return { storage: 'memory' };
    }
  }

  return { storage: 'memory' };
}

async function listPurchases(email) {
  const normalized = String(email || '').trim().toLowerCase();

  if (hasSupabase()) {
    try {
      const rows = await supabaseRequest(`efi_user_purchases?email=eq.${encodeURIComponent(normalized)}&select=id,purchased_at,total,items,receipt,credential_id&order=purchased_at.desc`);
      return {
        storage: 'supabase',
        purchases: (rows || []).map((r) => ({
          id: r.id,
          date: r.purchased_at,
          total: Number(r.total || 0),
          items: r.items || [],
          receipt: r.receipt || null,
          credentialId: r.credential_id || null
        }))
      };
    } catch (err) {
      // fall through
    }
  }

  return { storage: 'memory', purchases: MEM.purchases.get(normalized) || [] };
}

async function savePaymentIntent(paymentIntentId, payload) {
  const id = String(paymentIntentId || '').trim();
  if (!id) return { ok: false, storage: 'memory' };

  MEM.payments.set(id, { id, ...payload, updated_at: nowIso() });

  if (hasSupabase()) {
    try {
      await supabaseRequest('efi_payments', {
        method: 'POST',
        body: [{
          payment_intent_id: id,
          status: String(payload.status || 'unknown'),
          email: payload.email || null,
          amount: payload.amount || null,
          currency: payload.currency || null,
          raw: payload.raw || null,
          updated_at: nowIso()
        }]
      });
      return { ok: true, storage: 'supabase' };
    } catch (err) {
      return { ok: true, storage: 'memory' };
    }
  }

  return { ok: true, storage: 'memory' };
}

async function hasVerifiedPayment(paymentIntentId) {
  const id = String(paymentIntentId || '').trim();
  if (!id) return false;

  if (hasSupabase()) {
    try {
      const rows = await supabaseRequest(`efi_payments?payment_intent_id=eq.${encodeURIComponent(id)}&status=eq.succeeded&select=payment_intent_id&limit=1`);
      if (Array.isArray(rows) && rows.length) return true;
    } catch (err) {
      // fall through
    }
  }

  const cached = MEM.payments.get(id);
  return !!(cached && cached.status === 'succeeded');
}

function buildSubmissionId() {
  return 'sub_' + crypto.randomBytes(8).toString('hex');
}

async function createSubmission(row) {
  const id = row.id || buildSubmissionId();
  const stored = {
    id,
    email: String(row.email || '').trim().toLowerCase(),
    kind: String(row.kind || 'module'),
    module_id: row.module_id ? String(row.module_id) : null,
    evidence_url: String(row.evidence_url || '').trim(),
    notes: String(row.notes || '').trim(),
    status: String(row.status || 'submitted'),
    score: row.score == null ? null : Number(row.score),
    feedback: row.feedback || null,
    submitted_at: row.submitted_at || nowIso(),
    release_at: row.release_at || null,
    notified_at: row.notified_at || null
  };

  MEM.submissions.set(id, stored);

  if (hasSupabase()) {
    try {
      await supabaseRequest('efi_submissions', {
        method: 'POST',
        body: [stored]
      });
      return { storage: 'supabase', submission: stored };
    } catch (err) {
      return { storage: 'memory', submission: stored };
    }
  }

  return { storage: 'memory', submission: stored };
}

async function updateSubmission(id, patch) {
  const existing = MEM.submissions.get(id);
  if (!existing) return null;
  const next = { ...existing, ...patch };
  MEM.submissions.set(id, next);

  if (hasSupabase()) {
    try {
      await supabaseRequest(`efi_submissions?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: patch
      });
    } catch (err) {
      // fallback silently
    }
  }

  return next;
}

async function listSubmissions(email) {
  const normalized = String(email || '').trim().toLowerCase();

  if (hasSupabase()) {
    try {
      const rows = await supabaseRequest(`efi_submissions?email=eq.${encodeURIComponent(normalized)}&select=*&order=submitted_at.desc`);
      return { storage: 'supabase', submissions: rows || [] };
    } catch (err) {
      // fall through
    }
  }

  const rows = [];
  MEM.submissions.forEach((value) => {
    if (value.email === normalized) rows.push(value);
  });
  rows.sort((a, b) => String(b.submitted_at).localeCompare(String(a.submitted_at)));
  return { storage: 'memory', submissions: rows };
}

async function getDueFeedback(now) {
  const cutoff = now || nowIso();

  if (hasSupabase()) {
    try {
      const rows = await supabaseRequest(`efi_submissions?status=eq.feedback_ready&notified_at=is.null&release_at=lte.${encodeURIComponent(cutoff)}&select=*`);
      return { storage: 'supabase', submissions: rows || [] };
    } catch (err) {
      // fall through
    }
  }

  const due = [];
  MEM.submissions.forEach((value) => {
    if (value.status === 'feedback_ready' && !value.notified_at && value.release_at && value.release_at <= cutoff) due.push(value);
  });
  return { storage: 'memory', submissions: due };
}

async function saveLead(lead) {
  const id = String(lead.lead_id || '').trim();
  if (!id) return { ok: false, storage: 'memory' };
  MEM.leads.set(id, lead);

  if (hasSupabase()) {
    try {
      await supabaseRequest('efi_leads', {
        method: 'POST',
        body: [{
          lead_id: id,
          captured_at: lead.captured_at || nowIso(),
          email: lead.email || null,
          name: lead.name || null,
          source: lead.source || null,
          lead_type: lead.lead_type || null,
          consent: lead.consent || {},
          campaign: lead.campaign || null,
          metadata: lead.metadata || {},
          context: lead.context || {}
        }]
      });
      return { ok: true, storage: 'supabase' };
    } catch (err) {
      return { ok: true, storage: 'memory' };
    }
  }

  return { ok: true, storage: 'memory' };
}

async function saveEvent(evt) {
  const id = String(evt.event_id || '').trim();
  if (!id) return { ok: false, storage: 'memory' };
  MEM.events.set(id, evt);

  if (hasSupabase()) {
    try {
      await supabaseRequest('efi_events', {
        method: 'POST',
        body: [{
          event_id: id,
          at: evt.at || nowIso(),
          event_name: evt.event_name || '',
          page: evt.page || null,
          source: evt.source || null,
          properties: evt.properties || {},
          context: evt.context || {}
        }]
      });
      return { ok: true, storage: 'supabase' };
    } catch (err) {
      return { ok: true, storage: 'memory' };
    }
  }

  return { ok: true, storage: 'memory' };
}

module.exports = {
  hasSupabase,
  upsertProgress,
  getProgress,
  addPurchase,
  listPurchases,
  savePaymentIntent,
  hasVerifiedPayment,
  createSubmission,
  updateSubmission,
  listSubmissions,
  getDueFeedback,
  saveLead,
  saveEvent
};
