(function () {
  var csrfToken = '';
  var lastAuditLogs = [];
  var lastConfigChecks = [];
  var lastCmsRecords = [];

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toCsvValue(value) {
    var text = String(value == null ? '' : value);
    if (/[",\n]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
    return text;
  }

  function downloadCsv(filename, headers, rows) {
    var lines = [headers.map(toCsvValue).join(',')];
    (rows || []).forEach(function (row) {
      lines.push((row || []).map(toCsvValue).join(','));
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(function () {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
  }

  function setStatus(message) {
    var status = byId('directory-moderation-status');
    if (status) status.textContent = message;
  }

  function setCmsStatus(message) {
    var status = byId('cms-status');
    if (status) status.textContent = message;
  }

  function authHeaders() {
    var token = window.EFI && window.EFI.Auth && typeof window.EFI.Auth.getAccessToken === 'function'
      ? window.EFI.Auth.getAccessToken()
      : '';
    return token ? { Authorization: 'Bearer ' + token } : {};
  }

  function secureHeaders() {
    var headers = Object.assign({}, authHeaders());
    if (csrfToken) headers['X-EFI-CSRF'] = csrfToken;
    return headers;
  }

  function ensureCsrfToken() {
    if (csrfToken) return Promise.resolve(csrfToken);
    return fetch('/api/coach-directory?action=csrf', {
      headers: authHeaders()
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (payload) {
        if (!res.ok || payload.ok === false || !payload.csrf) throw new Error(payload.error || 'Unable to issue CSRF token');
        csrfToken = payload.csrf;
        return csrfToken;
      });
    });
  }

  function moderateListing(id, moderationStatus, verificationStatus, notes) {
    return ensureCsrfToken().then(function () {
      return fetch('/api/coach-directory', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, secureHeaders()),
        body: JSON.stringify({
          action: 'moderate_listing',
          id: id,
          moderation_status: moderationStatus,
          verification_status: verificationStatus,
          moderation_notes: notes || ''
        })
      });
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (payload) {
        if (!res.ok || payload.ok === false) throw new Error(payload.error || 'Moderation failed');
        return payload;
      });
    });
  }

  function archiveListing(id, notes) {
    return ensureCsrfToken().then(function () {
      return fetch('/api/coach-directory', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, secureHeaders()),
        body: JSON.stringify({
          action: 'archive_listing',
          id: id,
          moderation_notes: notes || 'Archived in CMS'
        })
      });
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (payload) {
        if (!res.ok || payload.ok === false) throw new Error(payload.error || 'Archive failed');
        return payload;
      });
    });
  }

  function updateListing(id, patch) {
    return ensureCsrfToken().then(function () {
      return fetch('/api/coach-directory', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, secureHeaders()),
        body: JSON.stringify(Object.assign({
          action: 'update_listing',
          id: id
        }, patch || {}))
      });
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (payload) {
        if (!res.ok || payload.ok === false) throw new Error(payload.error || 'Listing update failed');
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
      var location = [row.city, row.state, row.zip].filter(Boolean).join(', ');
      return (
        '<tr data-directory-id="' + escapeHtml(row.id) + '">' +
          '<td><strong>' + escapeHtml(row.name || 'Unknown') + '</strong><br><span style="font-size:0.85rem;color:var(--color-text-muted);">ID: ' + escapeHtml(row.credential_id || 'Pending') + '</span></td>' +
          '<td>' + escapeHtml(location || 'Unspecified') + '</td>' +
          '<td>' + escapeHtml(row.specialty || 'Unspecified') + '</td>' +
          '<td>' + escapeHtml(row.verification_status || 'pending') + '</td>' +
          '<td>' + escapeHtml(row.moderation_status || 'pending') + '</td>' +
          '<td><input class="form-control js-dir-note" type="text" placeholder="Add moderation note" value="' + escapeHtml(row.moderation_notes || '') + '" /></td>' +
          '<td>' +
            '<div class="button-group">' +
              '<button type="button" class="btn btn--sm btn--secondary js-dir-approve">Approve</button>' +
              '<button type="button" class="btn btn--sm btn--ghost js-dir-reject">Reject</button>' +
              '<button type="button" class="btn btn--sm btn--ghost js-dir-edit">Edit</button>' +
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
      var status = (row.moderation_status || 'pending') + ' / ' + (row.verification_status || 'pending');
      var reviewedAt = row.last_reviewed || row.updated_at || '';
      return (
        '<tr>' +
          '<td>' + escapeHtml(row.name || 'Unknown') + '</td>' +
          '<td>' + escapeHtml(status) + '</td>' +
          '<td>' + escapeHtml(row.reviewer_email || 'Unassigned') + '</td>' +
          '<td>' + escapeHtml(reviewedAt ? new Date(reviewedAt).toLocaleString() : 'N/A') + '</td>' +
          '<td>' + escapeHtml(row.moderation_notes || 'None') + '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function renderCmsRecords(records) {
    var body = byId('cms-body');
    if (!body) return;
    if (!records.length) {
      body.innerHTML = '<tr><td colspan="8">No records match current filters.</td></tr>';
      return;
    }
    body.innerHTML = records.map(function (row) {
      var location = [row.city, row.state, row.zip].filter(Boolean).join(', ');
      var updated = row.updated_at ? new Date(row.updated_at).toLocaleString() : 'N/A';
      return (
        '<tr data-cms-id="' + escapeHtml(row.id) + '">' +
          '<td><strong>' + escapeHtml(row.name || 'Unknown') + '</strong><br><small>' + escapeHtml(row.credential_id || 'No credential') + '</small></td>' +
          '<td>' + escapeHtml(row.email || '') + '</td>' +
          '<td>' + escapeHtml(location) + '</td>' +
          '<td>' + escapeHtml(row.specialty || '') + '</td>' +
          '<td>' + escapeHtml(row.verification_status || 'pending') + '</td>' +
          '<td>' + escapeHtml(row.moderation_status || 'pending') + '</td>' +
          '<td>' + escapeHtml(updated) + '</td>' +
          '<td><div class="button-group">' +
            '<button type="button" class="btn btn--sm btn--ghost js-cms-edit">Edit</button>' +
            '<button type="button" class="btn btn--sm btn--secondary js-cms-approve">Approve</button>' +
            '<button type="button" class="btn btn--sm btn--ghost js-cms-archive">Archive</button>' +
          '</div></td>' +
        '</tr>'
      );
    }).join('');
  }

  function bindModerationActions() {
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
          .then(function () { return Promise.all([loadQueue(), loadCmsRecords()]); })
          .catch(function (err) { setStatus(err.message || 'Unable to approve listing.'); })
          .finally(function () { target.disabled = false; });
      }

      if (target.classList.contains('js-dir-reject')) {
        target.disabled = true;
        moderateListing(id, 'rejected', 'pending', notes || 'Rejected in admin queue')
          .then(function () { return Promise.all([loadQueue(), loadCmsRecords()]); })
          .catch(function (err) { setStatus(err.message || 'Unable to reject listing.'); })
          .finally(function () { target.disabled = false; });
      }

      if (target.classList.contains('js-dir-edit')) {
        target.disabled = true;
        var currentName = row.children[0] ? row.children[0].innerText.split('\n')[0] : '';
        var currentCityStateZip = row.children[1] ? row.children[1].innerText : '';
        var currentSpecialty = row.children[2] ? row.children[2].innerText : '';
        var name = window.prompt('Update name', currentName) || currentName;
        var location = window.prompt('Update location as City, ST, ZIP', currentCityStateZip) || currentCityStateZip;
        var specialty = window.prompt('Update specialty', currentSpecialty) || currentSpecialty;
        var parts = location.split(',').map(function (x) { return x.trim(); });
        updateListing(id, {
          name: name,
          city: parts[0] || '',
          state: parts[1] || '',
          zip: parts[2] || '',
          specialty: specialty
        })
          .then(function () { return Promise.all([loadQueue(), loadCmsRecords()]); })
          .catch(function (err) { setStatus(err.message || 'Unable to update listing.'); })
          .finally(function () { target.disabled = false; });
      }
    });
  }

  function bindCmsActions() {
    var body = byId('cms-body');
    if (!body) return;
    body.addEventListener('click', function (event) {
      var target = event.target;
      if (!target || !target.closest('tr')) return;
      var row = target.closest('tr');
      var id = row.getAttribute('data-cms-id');
      if (!id) return;
      var record = (lastCmsRecords || []).find(function (r) { return String(r.id) === String(id); }) || {};

      if (target.classList.contains('js-cms-edit')) {
        target.disabled = true;
        var name = window.prompt('Update name', record.name || '') || record.name || '';
        var location = window.prompt('Update location as City, ST, ZIP', [record.city, record.state, record.zip].filter(Boolean).join(', ')) || '';
        var specialty = window.prompt('Update specialty', record.specialty || '') || record.specialty || '';
        var website = window.prompt('Update website', record.website || '') || record.website || '';
        var parts = location.split(',').map(function (x) { return x.trim(); });
        updateListing(id, {
          name: name,
          city: parts[0] || '',
          state: parts[1] || '',
          zip: parts[2] || '',
          specialty: specialty,
          website: website
        })
          .then(function () { return Promise.all([loadQueue(), loadCmsRecords()]); })
          .catch(function (err) { setCmsStatus(err.message || 'Unable to update record.'); })
          .finally(function () { target.disabled = false; });
      }

      if (target.classList.contains('js-cms-approve')) {
        target.disabled = true;
        moderateListing(id, 'approved', 'verified', 'Approved in CMS table')
          .then(function () { return Promise.all([loadQueue(), loadCmsRecords()]); })
          .catch(function (err) { setCmsStatus(err.message || 'Unable to approve record.'); })
          .finally(function () { target.disabled = false; });
      }

      if (target.classList.contains('js-cms-archive')) {
        target.disabled = true;
        var notes = window.prompt('Archive note', 'Archived in CMS') || 'Archived in CMS';
        archiveListing(id, notes)
          .then(function () { return Promise.all([loadQueue(), loadCmsRecords()]); })
          .catch(function (err) { setCmsStatus(err.message || 'Unable to archive record.'); })
          .finally(function () { target.disabled = false; });
      }
    });
  }

  function readCmsFilters() {
    return {
      q: (byId('cms-search') && byId('cms-search').value || '').trim(),
      moderation_status: (byId('cms-moderation') && byId('cms-moderation').value || '').trim(),
      verification_status: (byId('cms-verification') && byId('cms-verification').value || '').trim()
    };
  }

  function loadQueue() {
    setStatus('Loading pending records...');
    return fetch('/api/coach-directory?include_pending=1&audit=1&audit_limit=200&limit=500', {
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
        var pending = all.filter(function (row) {
          return String(row.moderation_status || '').toLowerCase() === 'pending';
        });
        lastAuditLogs = payload.audit_logs || [];
        var reviewed = lastAuditLogs.slice(0, 20).map(function (log) {
          return {
            name: (log.metadata && (log.metadata.name || log.metadata.city || 'Directory Record')) || 'Directory Record',
            moderation_status: (log.metadata && log.metadata.moderation_status) || log.action || 'updated',
            verification_status: (log.metadata && log.metadata.verification_status) || 'n/a',
            reviewer_email: log.actor_email || 'Unassigned',
            last_reviewed: log.created_at,
            updated_at: log.created_at,
            moderation_notes: (log.metadata && (log.metadata.moderation_notes || log.metadata.notes)) || ''
          };
        });
        if (!reviewed.length) {
          reviewed = all
            .filter(function (row) {
              return String(row.moderation_status || '').toLowerCase() !== 'pending';
            })
            .sort(function (a, b) {
              return String(b.last_reviewed || b.updated_at || '').localeCompare(String(a.last_reviewed || a.updated_at || ''));
            })
            .slice(0, 20);
        }
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

  function loadCmsRecords() {
    var filters = readCmsFilters();
    var params = new URLSearchParams({
      include_pending: '1',
      limit: '500'
    });
    if (filters.q) params.set('q', filters.q);
    if (filters.moderation_status) params.set('moderation_status', filters.moderation_status);
    if (filters.verification_status) params.set('verification_status', filters.verification_status);
    setCmsStatus('Loading CMS records...');
    return fetch('/api/coach-directory?' + params.toString(), {
      headers: authHeaders()
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (payload) {
          if (!res.ok || payload.ok === false) throw new Error(payload.error || 'Unable to load CMS records');
          return payload;
        });
      })
      .then(function (payload) {
        lastCmsRecords = payload.records || [];
        renderCmsRecords(lastCmsRecords);
        setCmsStatus('CMS loaded: ' + (payload.total_filtered || lastCmsRecords.length) + ' record(s) match filters.');
      })
      .catch(function (err) {
        lastCmsRecords = [];
        renderCmsRecords([]);
        setCmsStatus(err.message || 'Unable to load CMS records.');
      });
  }

  function renderOpsConfig(payload) {
    var status = byId('ops-config-status');
    var body = byId('ops-config-body');
    if (!status || !body) return;

    var checks = (payload && payload.checks) || [];
    lastConfigChecks = checks.slice();
    if (!checks.length) {
      status.textContent = 'No config data returned.';
      body.innerHTML = '<tr><td colspan="3">No config data.</td></tr>';
      return;
    }

    body.innerHTML = checks.map(function (item) {
      return (
        '<tr>' +
          '<td><code>' + escapeHtml(item.name) + '</code></td>' +
          '<td>' + (item.exists ? 'Yes' : 'No') + '</td>' +
          '<td>' + (item.exists ? (item.strong ? 'Pass' : 'Weak') : 'N/A') + '</td>' +
        '</tr>'
      );
    }).join('');

    if (payload.summary && payload.summary.launch_ready) {
      status.textContent = 'All required launch variables are configured.';
      return;
    }
    var missing = (payload && payload.missing) || [];
    var weak = (payload && payload.weak) || [];
    status.textContent = 'Missing: ' + (missing.length ? missing.join(', ') : 'none') + '. Weak: ' + (weak.length ? weak.join(', ') : 'none') + '.';
  }

  function loadOpsConfig() {
    var status = byId('ops-config-status');
    var body = byId('ops-config-body');
    if (!status || !body) return Promise.resolve();
    status.textContent = 'Loading config checks...';
    return fetch('/api/ops-config', {
      headers: authHeaders()
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (payload) {
          if (!res.ok || payload.ok === false) throw new Error(payload.error || 'Unable to load config checks');
          return payload;
        });
      })
      .then(renderOpsConfig)
      .catch(function (err) {
        status.textContent = err.message || 'Unable to load config checks.';
        body.innerHTML = '<tr><td colspan="3">Config checks unavailable.</td></tr>';
      });
  }

  function bindExportActions() {
    var auditBtn = byId('directory-audit-export-btn');
    if (auditBtn) {
      auditBtn.addEventListener('click', function () {
        if (!lastAuditLogs.length) {
          setStatus('No audit records loaded to export yet.');
          return;
        }
        var rows = lastAuditLogs.map(function (log) {
          return [
            log.id || '',
            log.created_at || '',
            log.actor_role || '',
            log.actor_email || '',
            log.action || '',
            log.target_id || '',
            JSON.stringify(log.metadata || {})
          ];
        });
        downloadCsv(
          'efi-directory-audit-' + new Date().toISOString().slice(0, 10) + '.csv',
          ['id', 'created_at', 'actor_role', 'actor_email', 'action', 'target_id', 'metadata'],
          rows
        );
      });
    }

    var configBtn = byId('ops-config-export-btn');
    if (configBtn) {
      configBtn.addEventListener('click', function () {
        if (!lastConfigChecks.length) {
          var status = byId('ops-config-status');
          if (status) status.textContent = 'No config checks loaded to export yet.';
          return;
        }
        var rows = lastConfigChecks.map(function (item) {
          return [item.name, item.exists ? 'yes' : 'no', item.strong ? 'pass' : 'weak'];
        });
        downloadCsv(
          'efi-launch-config-' + new Date().toISOString().slice(0, 10) + '.csv',
          ['variable', 'configured', 'strength'],
          rows
        );
      });
    }

    var cmsExportBtn = byId('cms-export-btn');
    if (cmsExportBtn) {
      cmsExportBtn.addEventListener('click', function () {
        if (!lastCmsRecords.length) {
          setCmsStatus('No CMS records loaded to export.');
          return;
        }
        var rows = lastCmsRecords.map(function (r) {
          return [
            r.id || '',
            r.name || '',
            r.email || '',
            r.city || '',
            r.state || '',
            r.zip || '',
            r.specialty || '',
            Array.isArray(r.delivery_modes) ? r.delivery_modes.join('|') : '',
            r.credential_id || '',
            r.verification_status || '',
            r.moderation_status || '',
            r.updated_at || ''
          ];
        });
        downloadCsv(
          'efi-directory-records-' + new Date().toISOString().slice(0, 10) + '.csv',
          ['id', 'name', 'email', 'city', 'state', 'zip', 'specialty', 'delivery_modes', 'credential_id', 'verification_status', 'moderation_status', 'updated_at'],
          rows
        );
      });
    }
  }

  function bindCmsFilterControls() {
    var refreshBtn = byId('cms-refresh-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadCmsRecords);
    ['cms-search', 'cms-moderation', 'cms-verification'].forEach(function (id) {
      var el = byId(id);
      if (!el) return;
      el.addEventListener(id === 'cms-search' ? 'input' : 'change', loadCmsRecords);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!byId('directory-moderation-body')) return;
    bindModerationActions();
    bindCmsActions();
    bindCmsFilterControls();
    bindExportActions();
    loadQueue();
    loadCmsRecords();
    loadOpsConfig();
  });
})();
