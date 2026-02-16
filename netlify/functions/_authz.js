const { requiredEnv } = require('./_common');

function hasSupabaseAuth() {
  return !!(requiredEnv('SUPABASE_URL') && requiredEnv('SUPABASE_ANON_KEY'));
}

async function getSupabaseUserFromBearer(token) {
  const url = requiredEnv('SUPABASE_URL');
  const anon = requiredEnv('SUPABASE_ANON_KEY');
  const res = await fetch(`${url}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) return null;
  return data;
}

function extractBearerToken(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
}

async function getActor(event) {
  const adminKey = requiredEnv('EFI_ADMIN_API_KEY');
  const suppliedAdminKey = String(event.headers['x-efi-admin-key'] || event.headers['X-EFI-ADMIN-KEY'] || '').trim();
  if (adminKey && suppliedAdminKey && suppliedAdminKey === adminKey) {
    return { role: 'admin', email: null, source: 'admin_key' };
  }

  const token = extractBearerToken(event);
  if (!token || !hasSupabaseAuth()) return { role: 'guest', email: null, source: 'none' };

  const user = await getSupabaseUserFromBearer(token).catch(() => null);
  if (!user) return { role: 'guest', email: null, source: 'token_invalid' };
  const role = (user.app_metadata && user.app_metadata.role) || 'learner';
  return { role, email: user.email || null, source: 'supabase_token' };
}

function isPrivilegedRole(role) {
  return role === 'admin' || role === 'reviewer';
}

module.exports = {
  getActor,
  isPrivilegedRole
};
