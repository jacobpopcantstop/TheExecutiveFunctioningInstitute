const { json, parseBody, fanout } = require('./_common');
const db = require('./_db');
const ai = require('./_ai_rubric');

function cronSecretMatches(input) {
  const expected = String(process.env.EFI_SUBMISSIONS_CRON_SECRET || '').trim();
  if (!expected) return true;
  return String(input || '').trim() === expected;
}

function releaseAt24h() {
  return new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString();
}

function visibleSubmission(row, nowIso) {
  const releaseAt = row.release_at || null;
  const isReleased = !releaseAt || releaseAt <= nowIso;
  return {
    id: row.id,
    kind: row.kind,
    module_id: row.module_id,
    evidence_url: row.evidence_url,
    notes: row.notes,
    status: row.status,
    submitted_at: row.submitted_at,
    release_at: releaseAt,
    feedback_available: isReleased,
    score: isReleased ? row.score : null,
    feedback: isReleased ? row.feedback : null
  };
}

async function submit(body) {
  const email = String(body.email || '').trim().toLowerCase();
  const kind = String(body.kind || 'module');
  const moduleId = body.module_id ? String(body.module_id) : null;
  const evidenceUrl = String(body.evidence_url || '').trim();
  const notes = String(body.notes || '').trim();

  if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email is required' });
  if (!evidenceUrl) return json(400, { ok: false, error: 'evidence_url is required' });
  if (kind === 'module' && !moduleId) return json(400, { ok: false, error: 'module_id is required for module submissions' });

  const graded = await ai.gradeSubmission({
    kind,
    module_id: moduleId,
    evidence_url: evidenceUrl,
    notes
  });

  const submissionRow = await db.createSubmission({
    email,
    kind,
    module_id: moduleId,
    evidence_url: evidenceUrl,
    notes,
    status: 'feedback_ready',
    score: graded.score,
    feedback: graded,
    submitted_at: new Date().toISOString(),
    release_at: releaseAt24h(),
    notified_at: null
  });

  await db.upsertProgress(email, {
    modules: {},
    submissions: {},
    capstone: { status: kind === 'capstone' ? 'submitted' : 'not_submitted' },
    esqrCompleted: false
  }).catch(() => {});

  return json(200, {
    ok: true,
    submission_id: submissionRow.submission.id,
    release_at: submissionRow.submission.release_at,
    status: 'queued_for_release',
    message: 'Submission reviewed by rubric engine. Feedback unlocks after 24 hours.'
  });
}

async function listForUser(email) {
  const now = new Date().toISOString();
  const rows = await db.listSubmissions(email);
  return json(200, {
    ok: true,
    storage: rows.storage,
    submissions: (rows.submissions || []).map((r) => visibleSubmission(r, now))
  });
}

async function processDueFeedback() {
  const due = await db.getDueFeedback(new Date().toISOString());
  let notified = 0;

  for (const row of (due.submissions || [])) {
    await fanout({
      type: 'feedback_ready',
      email: row.email,
      submission_id: row.id,
      kind: row.kind,
      module_id: row.module_id,
      score: row.score,
      release_at: row.release_at
    });
    await db.updateSubmission(row.id, { notified_at: new Date().toISOString() });
    notified++;
  }

  return json(200, { ok: true, queued: (due.submissions || []).length, notified, storage: due.storage });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'GET') {
    const email = String((event.queryStringParameters || {}).email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email query parameter is required' });
    return listForUser(email);
  }

  if (event.httpMethod === 'POST') {
    const body = await parseBody(event);
    if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });

    const action = String(body.action || '').trim();
    if (action === 'submit_module') {
      return submit({
        email: body.email,
        kind: 'module',
        module_id: body.module_id,
        evidence_url: body.evidence_url,
        notes: body.notes
      });
    }
    if (action === 'submit_capstone') {
      return submit({
        email: body.email,
        kind: 'capstone',
        module_id: null,
        evidence_url: body.evidence_url,
        notes: body.notes
      });
    }
    if (action === 'process_due_feedback') {
      if (!cronSecretMatches(body.secret || (event.headers['x-efi-cron-secret'] || event.headers['X-EFI-Cron-Secret']))) {
        return json(401, { ok: false, error: 'Unauthorized feedback processor invocation' });
      }
      return processDueFeedback();
    }
    return json(400, { ok: false, error: 'Unsupported action' });
  }

  return json(405, { ok: false, error: 'Method not allowed' });
};
