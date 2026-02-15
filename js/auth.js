/* ============================================
   EFI Authentication & User State Module
   localStorage-based auth for demo purposes
   ============================================ */

var EFI = window.EFI || {};

EFI.Auth = (function () {
  'use strict';

  var USERS_KEY = 'efi_users';
  var SESSION_KEY = 'efi_session';
  var CART_KEY = 'efi_cart';
  var PURCHASES_KEY = 'efi_purchases';
  var ACCESS_TOKEN_KEY = 'efi_access_token';
  var REFRESH_TOKEN_KEY = 'efi_refresh_token';

  function apiFetch(path, opts) {
    if (!window.fetch) return Promise.reject(new Error('Browser does not support fetch.'));
    return fetch(path, opts || {}).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok || data.ok === false) {
          throw new Error(data.error || 'Request failed');
        }
        return data;
      });
    });
  }

  function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
  }

  function setManagedTokens(accessToken, refreshToken) {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  function clearManagedTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  /* --- Helpers --- */
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch (e) { return {}; }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function hashPasswordLegacy(pw) {
    // Legacy hash retained for migration of older local demo users.
    var hash = 0;
    for (var i = 0; i < pw.length; i++) {
      var ch = pw.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash |= 0;
    }
    return 'h' + Math.abs(hash).toString(36);
  }

  function bytesToBase64(bytes) {
    var binary = '';
    bytes.forEach(function (b) { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  function base64ToBytes(base64) {
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function hashPassword(pw, saltBase64) {
    if (!window.crypto || !window.crypto.subtle) {
      return { algo: 'legacy', digest: hashPasswordLegacy(pw) };
    }

    var saltBytes = saltBase64 ? base64ToBytes(saltBase64) : window.crypto.getRandomValues(new Uint8Array(16));
    var keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(pw),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    var derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 120000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    return {
      algo: 'pbkdf2-sha256',
      salt: bytesToBase64(saltBytes),
      digest: bytesToBase64(new Uint8Array(derivedBits))
    };
  }

  function getDefaultProgress() {
    return {
      modules: {},
      esqrCompleted: false,
      submissions: {},
      capstone: { status: 'not_submitted' }
    };
  }

  function normalizeProgress(progress) {
    var merged = progress || {};
    if (!merged.modules) merged.modules = {};
    if (!merged.submissions) merged.submissions = {};
    if (!merged.capstone) merged.capstone = { status: 'not_submitted' };
    if (!merged.capstone.status) merged.capstone.status = 'not_submitted';
    if (typeof merged.esqrCompleted !== 'boolean') merged.esqrCompleted = false;
    return merged;
  }

  /* --- Auth API --- */
  async function register(name, email, password) {
    try {
      var managed = await apiFetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: name,
          email: email,
          password: password
        })
      });
      if (managed && managed.ok && managed.user) {
        setManagedTokens(managed.access_token || '', managed.refresh_token || '');
        setSession({
          email: managed.user.email,
          name: managed.user.name || managed.user.email,
          mode: 'managed',
          role: managed.user.role || 'learner',
          createdAt: managed.user.createdAt || new Date().toISOString(),
          progress: managed.user.progress || getDefaultProgress(),
          purchases: managed.user.purchases || []
        });
        return { ok: true, user: getCurrentUser() };
      }
    } catch (managedErr) {}

    var users = getUsers();
    var key = email.toLowerCase().trim();
    if (users[key]) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }
    var hashed = await hashPassword(password);
    users[key] = {
      name: name.trim(),
      email: key,
      role: 'learner',
      passwordHash: hashed.digest,
      passwordSalt: hashed.salt || null,
      passwordAlgo: hashed.algo,
      createdAt: new Date().toISOString(),
      progress: getDefaultProgress(),
      purchases: []
    };
    saveUsers(users);
    setSession(users[key]);
    apiFetch('/api/sync-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: key, progress: users[key].progress })
    }).catch(function () {});
    return { ok: true, user: users[key] };
  }

  async function login(email, password) {
    try {
      var managed = await apiFetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: email,
          password: password
        })
      });
      if (managed && managed.ok && managed.user) {
        setManagedTokens(managed.access_token || '', managed.refresh_token || '');
        setSession({
          email: managed.user.email,
          name: managed.user.name || managed.user.email,
          mode: 'managed',
          role: managed.user.role || 'learner',
          createdAt: managed.user.createdAt || new Date().toISOString(),
          progress: managed.user.progress || getDefaultProgress(),
          purchases: managed.user.purchases || []
        });
        return { ok: true, user: getCurrentUser() };
      }
    } catch (managedErr) {}

    var users = getUsers();
    var key = email.toLowerCase().trim();
    var user = users[key];
    if (!user) {
      return { ok: false, error: 'No account found with this email address.' };
    }
    var isValid = false;
    if ((user.passwordAlgo || 'legacy') === 'pbkdf2-sha256') {
      var hashed = await hashPassword(password, user.passwordSalt);
      isValid = hashed.digest === user.passwordHash;
    } else {
      isValid = hashPasswordLegacy(password) === user.passwordHash;
      if (isValid) {
        var migrated = await hashPassword(password);
        user.passwordHash = migrated.digest;
        user.passwordSalt = migrated.salt || null;
        user.passwordAlgo = migrated.algo;
        users[key] = user;
        saveUsers(users);
      }
    }

    if (!isValid) {
      return { ok: false, error: 'Incorrect password. Please try again.' };
    }
    apiFetch('/api/sync-progress?email=' + encodeURIComponent(key))
      .then(function (remote) {
        if (remote && remote.ok && remote.progress) {
          user.progress = normalizeProgress(remote.progress);
          users[key] = user;
          saveUsers(users);
        }
      }).catch(function () {});
    setSession(user);
    return { ok: true, user: user };
  }

  function logout() {
    var token = getAccessToken();
    if (token) {
      apiFetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout', access_token: token })
      }).catch(function () {});
    }
    clearManagedTokens();
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
  }

  function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      email: user.email,
      name: user.name,
      mode: user.mode || 'prototype',
      role: user.role || 'learner',
      createdAt: user.createdAt || new Date().toISOString(),
      progress: user.progress || getDefaultProgress(),
      purchases: user.purchases || [],
      loggedInAt: new Date().toISOString()
    }));
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  }

  function getCurrentUser() {
    var session = getSession();
    if (!session) return null;
    if (session.mode === 'managed') {
      var managedUser = {
        name: session.name,
        email: session.email,
        role: session.role || 'learner',
        createdAt: session.createdAt || session.loggedInAt,
        progress: normalizeProgress(session.progress || getDefaultProgress()),
        purchases: Array.isArray(session.purchases) ? session.purchases : []
      };
      return managedUser;
    }
    var users = getUsers();
    var user = users[session.email] || null;
    if (user && !user.role) user.role = 'learner';
    if (user && user.progress) user.progress = normalizeProgress(user.progress);
    return user;
  }

  function getRole() {
    var user = getCurrentUser();
    return user ? (user.role || 'learner') : 'guest';
  }

  function hasRole(roles) {
    var role = getRole();
    if (!Array.isArray(roles)) roles = [roles];
    return roles.indexOf(role) !== -1;
  }

  function requireRole(roles, redirectPath) {
    if (!requireAuth()) return false;
    if (hasRole(roles)) return true;
    window.location.href = redirectPath || 'dashboard.html';
    return false;
  }

  function exportPrototypeData() {
    return {
      users: getUsers(),
      session: getSession(),
      cart: getCart(),
      exportedAt: new Date().toISOString(),
      version: 1
    };
  }

  function importPrototypeData(payload) {
    if (!payload || typeof payload !== 'object') {
      return { ok: false, error: 'Invalid import payload.' };
    }
    if (payload.users && typeof payload.users === 'object') {
      localStorage.setItem(USERS_KEY, JSON.stringify(payload.users));
    }
    if (payload.session && typeof payload.session === 'object') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(payload.session));
    }
    if (Array.isArray(payload.cart)) {
      localStorage.setItem(CART_KEY, JSON.stringify(payload.cart));
    }
    updateCartBadge();
    return { ok: true };
  }

  function resetPrototypeData() {
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem('efi_esqr_results');
    localStorage.removeItem('efi_esqr_history');
    localStorage.removeItem('efi_client_errors');
    return { ok: true };
  }

  function updateUser(updates) {
    var session = getSession();
    if (!session) return false;
    if (session.mode === 'managed') {
      var next = {
        email: session.email,
        name: updates && updates.name ? updates.name : session.name,
        mode: 'managed',
        role: session.role || 'learner',
        createdAt: session.createdAt || new Date().toISOString(),
        progress: updates && updates.progress ? normalizeProgress(updates.progress) : normalizeProgress(session.progress || getDefaultProgress()),
        purchases: updates && updates.purchases ? updates.purchases : (session.purchases || [])
      };
      setSession(next);
      if (next.progress) {
        apiFetch('/api/sync-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: next.email, progress: next.progress })
        }).catch(function () {});
      }
      return true;
    }
    var users = getUsers();
    var user = users[session.email];
    if (!user) return false;
    for (var key in updates) {
      if (updates.hasOwnProperty(key)) {
        user[key] = updates[key];
      }
    }
    users[session.email] = user;
    saveUsers(users);
    if (updates && updates.progress) {
      apiFetch('/api/sync-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, progress: updates.progress })
      }).catch(function () {});
    }
    return true;
  }

  function isLoggedIn() {
    return getSession() !== null;
  }

  function requireAuth() {
    if (!isLoggedIn()) {
      var current = window.location.pathname.split('/').pop();
      window.location.href = 'login.html?redirect=' + encodeURIComponent(current);
      return false;
    }
    return true;
  }

  /* --- Cart --- */
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
  }

  function addToCart(item) {
    var cart = getCart();
    // Prevent duplicates
    var exists = cart.some(function (c) { return c.id === item.id; });
    if (exists) return cart;
    cart.push(item);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
    return cart;
  }

  function removeFromCart(itemId) {
    var cart = getCart().filter(function (c) { return c.id !== itemId; });
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
    return cart;
  }

  function clearCart() {
    localStorage.setItem(CART_KEY, JSON.stringify([]));
    updateCartBadge();
  }

  function getCartTotal() {
    return getCart().reduce(function (sum, item) { return sum + item.price; }, 0);
  }

  function updateCartBadge() {
    var badges = document.querySelectorAll('.cart-badge');
    var count = getCart().length;
    badges.forEach(function (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  }

  /* --- Purchases --- */
  function getPurchases() {
    var user = getCurrentUser();
    return user ? (user.purchases || []) : [];
  }

  function addPurchase(items) {
    var user = getCurrentUser();
    if (!user) return Promise.reject(new Error('Please log in first.'));

    return apiFetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'issue_purchase',
        email: user.email,
        items: items
      })
    }).then(function (res) {
      var purchase = res.purchase || {
        id: 'ord-' + Date.now().toString(36),
        date: new Date().toISOString(),
        items: items,
        total: items.reduce(function (s, i) { return s + i.price; }, 0)
      };
      purchase.receipt = res.receipt || null;
      purchase.credentialId = res.credential_id || null;
      var purchases = user.purchases || [];
      purchases.push(purchase);
      updateUser({ purchases: purchases });
      clearCart();
      return purchase;
    });
  }

  function hasPurchased(productId) {
    var purchases = getPurchases();
    return purchases.some(function (p) {
      return p.items.some(function (item) { return item.id === productId; });
    });
  }

  function getLatestReceiptFor(productId) {
    var purchases = getPurchases();
    var token = null;
    purchases.forEach(function (p) {
      var match = (p.items || []).some(function (item) { return item.id === productId; });
      if (match && p.receipt) token = p.receipt;
    });
    return token;
  }

  function verifyPurchasedProduct(productId, credentialId) {
    var receipt = getLatestReceiptFor(productId);
    if (!receipt) return Promise.resolve({ ok: false, verified: false, error: 'No signed purchase receipt found.' });
    var qs = '?receipt=' + encodeURIComponent(receipt) + '&product=' + encodeURIComponent(productId);
    if (credentialId) qs += '&credential_id=' + encodeURIComponent(credentialId);
    return apiFetch('/api/verify' + qs, { method: 'GET' })
      .catch(function (err) { return { ok: false, verified: false, error: err.message }; });
  }

  function getCertificationStatus(userArg) {
    var user = userArg || getCurrentUser();
    if (!user) {
      return {
        modulesCompleted: 0,
        allModulesCompleted: false,
        capstonePassed: false,
        certificatePurchased: false,
        framedCertificatePurchased: false,
        eligibleForCertificate: false,
        fullyCertified: false
      };
    }

    user.progress = normalizeProgress(user.progress);
    var moduleIds = ['1', '2', '3', '4', '5', '6'];
    var modulesCompleted = moduleIds.filter(function (id) { return !!user.progress.modules[id]; }).length;
    var allModulesCompleted = modulesCompleted === moduleIds.length;
    var capstonePassed = user.progress.capstone.status === 'passed';
    var certificatePurchased = (user.purchases || []).some(function (p) {
      return p.items.some(function (i) { return i.id === 'certificate'; });
    });
    var framedCertificatePurchased = (user.purchases || []).some(function (p) {
      return p.items.some(function (i) { return i.id === 'certificate-frame'; });
    });
    var eligibleForCertificate = allModulesCompleted && capstonePassed;

    return {
      modulesCompleted: modulesCompleted,
      allModulesCompleted: allModulesCompleted,
      capstonePassed: capstonePassed,
      certificatePurchased: certificatePurchased,
      framedCertificatePurchased: framedCertificatePurchased,
      eligibleForCertificate: eligibleForCertificate,
      fullyCertified: eligibleForCertificate && certificatePurchased
    };
  }

  function submitCapstone(evidenceUrl, notes) {
    var user = getCurrentUser();
    if (!user) return Promise.resolve({ ok: false, error: 'Please log in first.' });
    return apiFetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'submit_capstone',
        email: user.email,
        evidence_url: (evidenceUrl || '').trim(),
        notes: (notes || '').trim()
      })
    }).then(function (res) {
      user.progress = normalizeProgress(user.progress);
      user.progress.capstone = {
        status: 'feedback_pending_release',
        submittedAt: new Date().toISOString(),
        evidenceUrl: (evidenceUrl || '').trim(),
        notes: (notes || '').trim(),
        releaseAt: res.release_at
      };
      updateUser({ progress: user.progress });
      return { ok: true, capstone: user.progress.capstone, release_at: res.release_at };
    }).catch(function (err) {
      return { ok: false, error: err.message };
    });
  }

  function runAutoGrading() {
    var user = getCurrentUser();
    if (!user) return Promise.resolve({ ok: false, error: 'Please log in first.' });
    return apiFetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'process_due_feedback' })
    }).then(function () {
      return apiFetch('/api/submissions?email=' + encodeURIComponent(user.email), { method: 'GET' });
    }).then(function (res) {
      user.progress = normalizeProgress(user.progress);
      (res.submissions || []).forEach(function (submission) {
        if (submission.kind === 'module' && submission.module_id) {
          user.progress.submissions[String(submission.module_id)] = {
            status: submission.status,
            submittedAt: submission.submitted_at,
            evidenceUrl: submission.evidence_url,
            notes: submission.notes,
            releaseAt: submission.release_at,
            score: submission.score,
            feedback: submission.feedback
          };
          if (submission.feedback_available && typeof submission.score === 'number') {
            user.progress.modules[String(submission.module_id)] = submission.score >= 75;
          }
        }
        if (submission.kind === 'capstone') {
          user.progress.capstone = {
            status: submission.feedback_available ? (submission.score >= 75 ? 'passed' : 'needs-revision') : 'feedback_pending_release',
            submittedAt: submission.submitted_at,
            releaseAt: submission.release_at,
            score: submission.score,
            feedback: submission.feedback
          };
        }
      });
      updateUser({ progress: user.progress });
      return { ok: true, progress: user.progress, status: getCertificationStatus(user) };
    }).catch(function (err) {
      return { ok: false, error: err.message };
    });
  }

  function saveModuleSubmission(moduleId, evidenceUrl, notes) {
    var user = getCurrentUser();
    if (!user) return Promise.resolve({ ok: false, error: 'Please log in first.' });
    return apiFetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'submit_module',
        email: user.email,
        module_id: String(moduleId),
        evidence_url: (evidenceUrl || '').trim(),
        notes: (notes || '').trim()
      })
    }).then(function (res) {
      user.progress = normalizeProgress(user.progress);
      var key = String(moduleId);
      user.progress.submissions[key] = {
        status: 'feedback_pending_release',
        submittedAt: new Date().toISOString(),
        evidenceUrl: (evidenceUrl || '').trim(),
        notes: (notes || '').trim(),
        releaseAt: res.release_at
      };
      updateUser({ progress: user.progress });
      return { ok: true, submission: user.progress.submissions[key], release_at: res.release_at };
    }).catch(function (err) {
      return { ok: false, error: err.message };
    });
  }

  /* --- Nav Auth UI --- */
  function initNavAuth() {
    var session = getSession();
    var authLinks = document.querySelectorAll('.nav__auth');
    authLinks.forEach(function (el) {
      if (session) {
        var user = getCurrentUser();
        var opsLink = (user && (user.role === 'admin' || user.role === 'reviewer'))
          ? '<a href="admin.html" class="nav__link">Admin</a>'
          : '';
        el.innerHTML = '<a href="dashboard.html" class="nav__link">Dashboard</a>' +
          opsLink +
          '<a href="store.html" class="nav__link" style="position:relative;">Store <span class="cart-badge">0</span></a>';
      } else {
        el.innerHTML = '<a href="login.html" class="nav__link">Login</a>' +
          '<a href="store.html" class="nav__link">Store</a>';
      }
      updateCartBadge();
    });

    if (window.EFI && typeof window.EFI.highlightActiveNavLinks === 'function') {
      window.EFI.highlightActiveNavLinks();
    }
  }

  function refreshManagedSession() {
    var session = getSession();
    var token = getAccessToken();
    if (!session || session.mode !== 'managed' || !token) return Promise.resolve();
    return apiFetch('/api/auth?action=me', {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token }
    }).then(function (res) {
      if (!res || !res.ok || !res.user) return;
      setSession({
        email: res.user.email,
        name: res.user.name || res.user.email,
        mode: 'managed',
        role: res.user.role || 'learner',
        createdAt: res.user.createdAt || session.createdAt,
        progress: res.user.progress || session.progress || getDefaultProgress(),
        purchases: res.user.purchases || session.purchases || []
      });
    }).catch(function () {});
  }

  /* Init on page load */
  document.addEventListener('DOMContentLoaded', function () {
    refreshManagedSession().finally(function () {
      initNavAuth();
      updateCartBadge();
    });
  });

  return {
    register: register,
    login: login,
    logout: logout,
    getSession: getSession,
    getCurrentUser: getCurrentUser,
    updateUser: updateUser,
    isLoggedIn: isLoggedIn,
    requireAuth: requireAuth,
    getCart: getCart,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    getCartTotal: getCartTotal,
    getPurchases: getPurchases,
    addPurchase: addPurchase,
    hasPurchased: hasPurchased,
    getLatestReceiptFor: getLatestReceiptFor,
    verifyPurchasedProduct: verifyPurchasedProduct,
    getCertificationStatus: getCertificationStatus,
    submitCapstone: submitCapstone,
    runAutoGrading: runAutoGrading,
    saveModuleSubmission: saveModuleSubmission
    ,getRole: getRole
    ,hasRole: hasRole
    ,requireRole: requireRole
    ,exportPrototypeData: exportPrototypeData
    ,importPrototypeData: importPrototypeData
    ,resetPrototypeData: resetPrototypeData
    ,refreshManagedSession: refreshManagedSession
  };
})();

window.EFI = EFI;
