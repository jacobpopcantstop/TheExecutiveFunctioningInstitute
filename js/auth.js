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
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
  }

  function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      email: user.email,
      name: user.name,
      loggedInAt: new Date().toISOString()
    }));
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  }

  function getCurrentUser() {
    var session = getSession();
    if (!session) return null;
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
    if (!user) return { ok: false, error: 'Please log in first.' };
    user.progress = normalizeProgress(user.progress);
    user.progress.capstone = {
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      evidenceUrl: (evidenceUrl || '').trim(),
      notes: (notes || '').trim()
    };
    updateUser({ progress: user.progress });
    return { ok: true, capstone: user.progress.capstone };
  }

  function runAutoGrading() {
    var user = getCurrentUser();
    if (!user) return { ok: false, error: 'Please log in first.' };
    user.progress = normalizeProgress(user.progress);

    Object.keys(user.progress.submissions).forEach(function (moduleId) {
      var submission = user.progress.submissions[moduleId];
      if (!submission || submission.status === 'passed') return;
      var evidence = (submission.evidenceUrl || '') + ' ' + (submission.notes || '');
      var score = Math.max(70, Math.min(98, 70 + evidence.length % 29));
      submission.score = score;
      submission.status = score >= 75 ? 'passed' : 'needs-revision';
      submission.gradedAt = new Date().toISOString();
      user.progress.modules[moduleId] = submission.status === 'passed';
    });

    if (user.progress.capstone && user.progress.capstone.status === 'submitted') {
      var hasCapstoneReview = (user.purchases || []).some(function (p) {
        return p.items.some(function (i) { return i.id === 'capstone-review'; });
      });
      if (hasCapstoneReview) {
        user.progress.capstone.status = 'passed';
        user.progress.capstone.gradedAt = new Date().toISOString();
        user.progress.capstone.score = 92;
      } else {
        user.progress.capstone.status = 'awaiting-payment';
      }
    }

    updateUser({ progress: user.progress });
    return { ok: true, progress: user.progress, status: getCertificationStatus(user) };
  }

  function saveModuleSubmission(moduleId, evidenceUrl, notes) {
    var user = getCurrentUser();
    if (!user) return { ok: false, error: 'Please log in first.' };
    user.progress = normalizeProgress(user.progress);
    var key = String(moduleId);
    user.progress.submissions[key] = {
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      evidenceUrl: (evidenceUrl || '').trim(),
      notes: (notes || '').trim()
    };
    updateUser({ progress: user.progress });
    return { ok: true, submission: user.progress.submissions[key] };
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

  /* Init on page load */
  document.addEventListener('DOMContentLoaded', function () {
    initNavAuth();
    updateCartBadge();
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
  };
})();

window.EFI = EFI;
