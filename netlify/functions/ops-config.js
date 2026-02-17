const { jsonHeaders } = require('./_common');
const { getActor, isPrivilegedRole } = require('./_authz');

function checkVar(name, options = {}) {
  const value = process.env[name];
  const exists = typeof value === 'string' && value.trim().length > 0;
  const minLength = options.minLength || 0;
  const strong = !exists ? false : (value.trim().length >= minLength);
  return {
    name,
    exists,
    strong
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: jsonHeaders(),
      body: JSON.stringify({ ok: false, error: 'Method not allowed' })
    };
  }

  const actor = await getActor(event);
  if (!isPrivilegedRole(actor.role)) {
    return {
      statusCode: 403,
      headers: jsonHeaders(),
      body: JSON.stringify({ ok: false, error: 'Admin or reviewer role required' })
    };
  }

  const checks = [
    checkVar('EFI_CRM_WEBHOOK_URL'),
    checkVar('EFI_ESP_WEBHOOK_URL'),
    checkVar('EFI_DOWNLOAD_SIGNING_SECRET', { minLength: 24 }),
    checkVar('EFI_PURCHASE_SIGNING_SECRET', { minLength: 24 }),
    checkVar('SUPABASE_URL'),
    checkVar('SUPABASE_ANON_KEY', { minLength: 24 }),
    checkVar('SUPABASE_SERVICE_ROLE_KEY', { minLength: 24 }),
    checkVar('GEMINI_API_KEY', { minLength: 16 }),
    checkVar('STRIPE_WEBHOOK_SECRET', { minLength: 16 }),
    checkVar('EFI_SUBMISSIONS_CRON_SECRET', { minLength: 16 }),
    checkVar('EFI_ADMIN_API_KEY', { minLength: 24 })
  ];

  const missing = checks.filter((x) => !x.exists).map((x) => x.name);
  const weak = checks.filter((x) => x.exists && !x.strong).map((x) => x.name);

  return {
    statusCode: 200,
    headers: jsonHeaders(),
    body: JSON.stringify({
      ok: true,
      actor_role: actor.role,
      generated_at: new Date().toISOString(),
      checks,
      summary: {
        required_total: checks.length,
        configured: checks.length - missing.length,
        missing_count: missing.length,
        weak_count: weak.length,
        launch_ready: missing.length === 0 && weak.length === 0
      },
      missing,
      weak
    })
  };
};
