(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function setStatus(message) {
    var status = byId('directory-moderation-status');
    if (status) status.textContent = message;
  }

  function authHeaders() {
    var token = window.EFI && window.EFI.Auth && typeof window.EFI.Auth.getAccessToken === 'function'
      ? window.EFI.Auth.getAccessToken()
      : '';
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  function moderateListing(id, moderationStatus, verificationStatus, notes) {
    return fetch('/api/coach-directory', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify({
        action: 'moderate_listing',
        id: id,
        moderation_status: moderationStatus,
        verification_status: verificationStatus,
        moderation_notes: notes || ''
      })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (payload) {
        if (!res.ok || payload.ok === false) throw new Error(payload.error || 'Moderation failed');
        return payload;
      });
    });
  }

  function renderRows(records) {
    var body = byId('directory-moderation-body');
    if (!body) return;

    if (!records.length) {
      body.innerHTML = '<tr><td colspan="6">No pending listings.</td></tr>';
      setStatus('No pending listings in moderation queue.');
      return;
    }

    setStatus(records.length + ' pending listing' + (records.length === 1 ? '' : 's') + ' loaded.');
    body.innerHTML = records.map(function (row) {
      var location = [row.city, row.state, row.zip].filter(Boolean).join(', ');
      return (
        '<tr data-directory-id="' + row.id + '">' +
          '<td><strong>' + (row.name || 'Unknown') + '</strong><br><span style="font-size:0.85rem;color:var(--color-text-muted);">ID: ' + (row.credential_id || 'Pending') + '</span></td>' +
          '<td>' + (location || 'Unspecified') + '</td>' +
          '<td>' + (row.specialty || 'Unspecified') + '</td>' +
          '<td>' + (row.verification_status || 'pending') + '</td>' +
          '<td>' + (row.moderation_status || 'pending') + '</td>' +
          '<td>' +
            '<div class="button-group">' +
              '<button type="button" class="btn btn--sm btn--secondary js-dir-approve">Approve</button>' +
              '<button type="button" class="btn btn--sm btn--ghost js-dir-reject">Reject</button>' +
            '</div>' +
          '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function bindActions() {
    var body = byId('directory-moderation-body');
    if (!body) return;
    body.addEventListener('click', function (event) {
      var target = event.target;
      if (!target || !target.closest('tr')) return;
      var row = target.closest('tr');
      var id = row.getAttribute('data-directory-id');
      if (!id) return;

      if (target.classList.contains('js-dir-approve')) {
        target.disabled = true;
        moderateListing(id, 'approved', 'verified', 'Approved in admin queue')
          .then(loadQueue)
          .catch(function (err) { setStatus(err.message || 'Unable to approve listing.'); })
          .finally(function () { target.disabled = false; });
      }

      if (target.classList.contains('js-dir-reject')) {
        target.disabled = true;
        moderateListing(id, 'rejected', 'pending', 'Rejected in admin queue')
          .then(loadQueue)
          .catch(function (err) { setStatus(err.message || 'Unable to reject listing.'); })
          .finally(function () { target.disabled = false; });
      }
    });
  }

  function loadQueue() {
    setStatus('Loading pending records...');
    return fetch('/api/coach-directory?include_pending=1', {
      headers: authHeaders()
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (payload) {
          if (!res.ok || payload.ok === false) throw new Error(payload.error || 'Unable to load moderation queue');
          return payload;
        });
      })
      .then(function (payload) {
        var pending = (payload.records || []).filter(function (row) {
          return String(row.moderation_status || '').toLowerCase() === 'pending';
        });
        renderRows(pending);
      })
      .catch(function (err) {
        var body = byId('directory-moderation-body');
        if (body) body.innerHTML = '<tr><td colspan="6">Queue unavailable.</td></tr>';
        setStatus(err.message || 'Unable to load queue.');
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!byId('directory-moderation-body')) return;
    bindActions();
    loadQueue();
  });
})();
