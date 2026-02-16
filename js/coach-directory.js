(function () {
  var body = document.getElementById('dir-body');
  if (!body) return;

  var searchInput = document.getElementById('dir-search');
  var specialtySelect = document.getElementById('dir-specialty');
  var modeSelect = document.getElementById('dir-mode');
  var resetBtn = document.getElementById('dir-reset');
  var countEl = document.getElementById('dir-count');

  var records = [];

  function normalize(text) {
    return String(text || '').toLowerCase().trim();
  }

  function isPublicRecord(record) {
    return record.verification_status === 'verified' && record.moderation_status === 'approved';
  }

  function updateSpecialtyOptions(publicRecords) {
    var specialties = {};
    publicRecords.forEach(function (record) {
      specialties[record.specialty] = true;
    });
    Object.keys(specialties).sort().forEach(function (name) {
      var option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      specialtySelect.appendChild(option);
    });
  }

  function matchesFilters(record) {
    var query = normalize(searchInput.value);
    var specialty = specialtySelect.value;
    var mode = modeSelect.value;
    var haystack = normalize(
      [
        record.name,
        record.city,
        record.state,
        record.zip,
        record.specialty,
        record.credential_id
      ].join(' ')
    );
    var matchesQuery = !query || haystack.indexOf(query) !== -1;
    var matchesSpecialty = !specialty || record.specialty === specialty;
    var modes = Array.isArray(record.delivery_modes) ? record.delivery_modes : [];
    var matchesMode = !mode || modes.indexOf(mode) >= 0;
    return matchesQuery && matchesSpecialty && matchesMode;
  }

  function formatDelivery(modes) {
    if (!Array.isArray(modes) || !modes.length) return 'Not listed';
    return modes.map(function (mode) {
      return mode === 'in-person' ? 'In-person' : 'Virtual';
    }).join(' + ');
  }

  function render() {
    var publicRecords = records.filter(isPublicRecord);
    var filtered = publicRecords.filter(matchesFilters);

    if (!filtered.length) {
      body.innerHTML = '<tr><td colspan="5">No coaches found for those filters.</td></tr>';
      countEl.textContent = '0 results';
      return;
    }

    body.innerHTML = filtered.map(function (record) {
      var profile = record.website
        ? '<a href="' + record.website + '" target="_blank" rel="noopener">Profile</a>'
        : '<a href="verify.html?credential=' + encodeURIComponent(record.credential_id) + '">Verify ID</a>';
      var location = [record.city, record.state, record.zip].filter(Boolean).join(', ');
      return (
        '<tr>' +
          '<td><strong>' + record.name + '</strong><br><span style="font-size:0.85rem;color:var(--color-text-muted);">ID: ' + record.credential_id + '</span></td>' +
          '<td>' + location + '</td>' +
          '<td>' + record.specialty + '</td>' +
          '<td>' + formatDelivery(record.delivery_modes) + '</td>' +
          '<td>' + profile + '</td>' +
        '</tr>'
      );
    }).join('');

    countEl.textContent = filtered.length + ' result' + (filtered.length === 1 ? '' : 's');
  }

  function bindEvents() {
    searchInput.addEventListener('input', render);
    specialtySelect.addEventListener('change', render);
    modeSelect.addEventListener('change', render);
    resetBtn.addEventListener('click', function () {
      searchInput.value = '';
      specialtySelect.value = '';
      modeSelect.value = '';
      render();
    });
  }

  function fallbackData() {
    return {
      records: [
        {
          name: 'Jordan Ellis',
          city: 'Austin',
          state: 'TX',
          zip: '78704',
          specialty: 'Student EF',
          delivery_modes: ['virtual', 'in-person'],
          website: '',
          credential_id: 'EFI-CEFC-2026-001',
          verification_status: 'verified',
          moderation_status: 'approved'
        }
      ]
    };
  }

  function init(data) {
    records = (data && data.records) || [];
    var publicRecords = records.filter(isPublicRecord);
    updateSpecialtyOptions(publicRecords);
    bindEvents();
    render();
  }

  fetch('/api/coach-directory', { cache: 'no-cache' })
    .then(function (response) {
      if (!response.ok) throw new Error('directory api failed');
      return response.json();
    })
    .then(function (payload) {
      if (!payload || payload.ok === false || !Array.isArray(payload.records)) {
        throw new Error('directory api invalid payload');
      }
      init({ records: payload.records });
    })
    .catch(function () {
      return fetch('data/coach-directory.json', { cache: 'no-cache' })
        .then(function (response) {
          if (!response.ok) throw new Error('directory seed fetch failed');
          return response.json();
        })
        .then(init);
    })
    .catch(function () {
      init(fallbackData());
    });
})();
