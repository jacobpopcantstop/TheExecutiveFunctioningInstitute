(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str || '')));
    return div.innerHTML;
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
      body.innerHTML = '<tr><td colspan="7">No pending listings.</td></tr>';
      setStatus('No pending listings in moderation queue.');
      return;
    }

    setStatus(records.length + ' pending listing' + (records.length === 1 ? '' : 's') + ' loaded.');
    body.innerHTML = records.map(function (row) {
      var location = [row.city, row.state, row.zip].filter(Boolean).map(escapeHTML).join(', ');
      return (
        '<tr data-directory-id="' + escapeHTML(row.id) + '">' +
          '<td><strong>' + escapeHTML(row.name || 'Unknown') + '</strong><br><span style="font-size:0.85rem;color:var(--color-text-muted);">ID: ' + escapeHTML(row.credential_id || 'Pending') + '</span></td>' +
          '<td>' + (location || 'Unspecified') + '</td>' +
          '<td>' + escapeHTML(row.specialty || 'Unspecified') + '</td>' +
          '<td>' + escapeHTML(row.verification_status || 'pending') + '</td>' +
          '<td>' + escapeHTML(row.moderation_status || 'pending') + '</td>' +
          '<td><input class="form-control js-dir-note" type="text" placeholder="Add moderation note" value="' + escapeHTML(row.moderation_notes || '') + '" /></td>' +
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

  function renderHistory(records) {
    var body = byId('directory-history-body');
    if (!body) return;
    if (!records.length) {
      body.innerHTML = '<tr><td colspan="5">No reviewed records yet.</td></tr>';
      return;
    }
    body.innerHTML = records.map(function (row) {
      var status = escapeHTML((row.moderation_status || 'pending') + ' / ' + (row.verification_status || 'pending'));
      var reviewedAt = row.last_reviewed || row.updated_at || '';
      return (
        '<tr>' +
          '<td>' + escapeHTML(row.name || 'Unknown') + '</td>' +
          '<td>' + status + '</td>' +
          '<td>' + escapeHTML(row.reviewer_email || 'Unassigned') + '</td>' +
          '<td>' + (reviewedAt ? escapeHTML(new Date(reviewedAt).toLocaleString()) : 'N/A') + '</td>' +
          '<td>' + escapeHTML(row.moderation_notes || 'None') + '</td>' +
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
      var noteInput = row.querySelector('.js-dir-note');
      var notes = noteInput ? noteInput.value : '';

      if (target.classList.contains('js-dir-approve')) {
        target.disabled = true;
        moderateListing(id, 'approved', 'verified', notes || 'Approved in admin queue')
          .then(loadQueue)
          .catch(function (err) { setStatus(err.message || 'Unable to approve listing.'); })
          .finally(function () { target.disabled = false; });
      }

      if (target.classList.contains('js-dir-reject')) {
        target.disabled = true;
        moderateListing(id, 'rejected', 'pending', notes || 'Rejected in admin queue')
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
        var all = payload.records || [];
        var pending = (payload.records || []).filter(function (row) {
          return String(row.moderation_status || '').toLowerCase() === 'pending';
        });
        var reviewed = all
          .filter(function (row) {
            return String(row.moderation_status || '').toLowerCase() !== 'pending';
          })
          .sort(function (a, b) {
            return String(b.last_reviewed || b.updated_at || '').localeCompare(String(a.last_reviewed || a.updated_at || ''));
          })
          .slice(0, 12);
        renderRows(pending);
        renderHistory(reviewed);
      })
      .catch(function (err) {
        var body = byId('directory-moderation-body');
        if (body) body.innerHTML = '<tr><td colspan="7">Queue unavailable.</td></tr>';
        var history = byId('directory-history-body');
        if (history) history.innerHTML = '<tr><td colspan="5">History unavailable.</td></tr>';
        setStatus(err.message || 'Unable to load queue.');
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!byId('directory-moderation-body')) return;
    bindActions();
    loadQueue();
  });
})();
