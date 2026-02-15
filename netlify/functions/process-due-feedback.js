const { json, fanout } = require('./_common');
const db = require('./_db');

exports.config = {
  schedule: '*/30 * * * *'
};

exports.handler = async function (event) {
  const expected = String(process.env.EFI_SUBMISSIONS_CRON_SECRET || '').trim();
  const supplied = String((event.headers && (event.headers['x-efi-cron-secret'] || event.headers['X-EFI-Cron-Secret'])) || '').trim();
  const isScheduled = String((event.headers && event.headers['x-nf-event']) || '').toLowerCase() === 'schedule';

  if (!isScheduled && expected && supplied !== expected) {
    return json(401, { ok: false, error: 'Unauthorized' });
  }

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
};
