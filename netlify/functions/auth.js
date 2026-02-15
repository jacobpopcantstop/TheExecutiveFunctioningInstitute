const { json, parseBody, requiredEnv } = require('./_common');
const db = require('./_db');

function hasSupabaseAuth() {
  return !!(requiredEnv('SUPABASE_URL') && requiredEnv('SUPABASE_ANON_KEY'));
}

async function supabaseAuth(path, { method = 'GET', body, token } = {}) {
  const url = requiredEnv('SUPABASE_URL');
  const anon = requiredEnv('SUPABASE_ANON_KEY');

  const headers = {
    apikey: anon,
    'Content-Type': 'application/json'
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${url}/auth/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    const msg = data && (data.msg || data.error_description || data.error) ? (data.msg || data.error_description || data.error) : 'Authentication request failed';
    throw new Error(msg);
  }
  return data;
}

function safeUser(data) {
  const user = data && data.user ? data.user : data;
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || user.email,
    role: (user.app_metadata && user.app_metadata.role) || 'learner',
    createdAt: user.created_at || new Date().toISOString()
  };
}

async function hydrateUserState(user) {
  if (!user || !user.email) return { progress: null, purchases: [] };
  const progress = await db.getProgress(user.email).catch(() => ({ progress: null }));
  const purchases = await db.listPurchases(user.email).catch(() => ({ purchases: [] }));
  return {
    progress: progress.progress || null,
    purchases: purchases.purchases || []
  };
}

exports.handler = async function (event) {
  if (event.httpMethod === 'GET') {
    const action = String((event.queryStringParameters || {}).action || '').trim();
    if (action === 'config') {
      return json(200, {
        ok: true,
        mode: hasSupabaseAuth() ? 'managed' : 'prototype',
        provider: hasSupabaseAuth() ? 'supabase' : 'local'
      });
    }

    if (action === 'me') {
      const authHeader = event.headers.authorization || event.headers.Authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      if (!token) return json(401, { ok: false, error: 'Missing bearer token' });
      if (!hasSupabaseAuth()) return json(503, { ok: false, error: 'Managed auth is not configured' });
      const profile = await supabaseAuth('user', { method: 'GET', token });
      const user = safeUser(profile);
      const state = await hydrateUserState(user);
      return json(200, { ok: true, user: { ...user, progress: state.progress, purchases: state.purchases } });
    }

    return json(400, { ok: false, error: 'Unsupported action' });
  }

  if (event.httpMethod === 'POST') {
    const body = await parseBody(event);
    if (!body) return json(400, { ok: false, error: 'Invalid JSON body' });

    const action = String(body.action || '').trim();
    if (!hasSupabaseAuth()) return json(503, { ok: false, error: 'Managed auth is not configured' });

    if (action === 'register') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const name = String(body.name || '').trim();
      if (!email || !email.includes('@')) return json(400, { ok: false, error: 'Valid email required' });
      if (password.length < 6) return json(400, { ok: false, error: 'Password must be at least 6 characters' });

      const auth = await supabaseAuth('signup', {
        method: 'POST',
        body: {
          email,
          password,
          data: { full_name: name || email }
        }
      });

      const user = safeUser(auth);
      const session = auth.session || null;
      if (user && user.email) {
        await db.upsertProgress(user.email, {
          modules: {},
          esqrCompleted: false,
          submissions: {},
          capstone: { status: 'not_submitted' }
        }).catch(() => {});
      }

      return json(200, {
        ok: true,
        user,
        access_token: session ? session.access_token : null,
        refresh_token: session ? session.refresh_token : null
      });
    }

    if (action === 'login') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const auth = await supabaseAuth('token?grant_type=password', {
        method: 'POST',
        body: { email, password }
      });

      const user = safeUser(auth);
      const state = await hydrateUserState(user);
      return json(200, {
        ok: true,
        user: { ...user, progress: state.progress, purchases: state.purchases },
        access_token: auth.access_token,
        refresh_token: auth.refresh_token
      });
    }

    if (action === 'logout') {
      const token = String(body.access_token || '').trim();
      if (token) {
        await supabaseAuth('logout', { method: 'POST', token }).catch(() => {});
      }
      return json(200, { ok: true });
    }

    return json(400, { ok: false, error: 'Unsupported action' });
  }

  return json(405, { ok: false, error: 'Method not allowed' });
};
