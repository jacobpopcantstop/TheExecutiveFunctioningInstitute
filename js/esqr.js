/* ============================================
   ESQ-R Interactive Assessment
   Config-driven scoring, chart, and recommendations
   ============================================ */

(function () {
  'use strict';

  var form = document.getElementById('esqr-form');
  if (!form) return;

  var progressFill = document.getElementById('progress-fill');
  var progressText = document.getElementById('progress-text');
  var errorMsg = document.getElementById('esqr-error');
  var resultsSection = document.getElementById('esqr-results');
  var downloadPngBtn = document.getElementById('esqr-download-png-btn');
  var downloadPdfBtn = document.getElementById('esqr-download-pdf-btn');
  var shareBtn = document.getElementById('esqr-share-btn');
  var shareStatus = document.getElementById('esqr-share-status');
  var historyEl = document.getElementById('esqr-history');
  var leadForm = document.getElementById('esqr-lead-form');
  var leadStatus = document.getElementById('esqr-lead-status');

  var HISTORY_KEY = 'efi_esqr_history';
  var RESULT_KEY = 'efi_esqr_results';
  var SKILLS = [];
  var STRATEGIES = {};
  var totalQuestions = 36;
  var lastResultsPayload = null;

  function setShareStatus(message) {
    if (shareStatus) shareStatus.textContent = message;
  }

  function setLeadStatus(message) {
    if (leadStatus) leadStatus.textContent = message;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-src="' + src + '"]');
      if (existing) {
        if (existing.getAttribute('data-loaded') === '1') {
          resolve();
        } else {
          existing.addEventListener('load', function () { resolve(); }, { once: true });
          existing.addEventListener('error', function () { reject(new Error('Failed loading ' + src)); }, { once: true });
        }
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.defer = true;
      s.setAttribute('data-src', src);
      s.onload = function () {
        s.setAttribute('data-loaded', '1');
        resolve();
      };
      s.onerror = function () { reject(new Error('Failed loading ' + src)); };
      document.head.appendChild(s);
    });
  }

  function ensureCanvasEngine() {
    if (window.html2canvas) return Promise.resolve();
    return loadScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
  }

  function ensurePdfEngine() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
    return loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
  }

  function loadConfig() {
    return fetch('data/esqr-config.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('Unable to load ESQ-R config.');
        return res.json();
      })
      .then(function (cfg) {
        SKILLS = Array.isArray(cfg.skills) ? cfg.skills : [];
        STRATEGIES = cfg.strategies && typeof cfg.strategies === 'object' ? cfg.strategies : {};
        if (!SKILLS.length) throw new Error('ESQ-R skills configuration missing.');
      });
  }

  function renderHistory() {
    if (!historyEl) return;
    var history = [];
    try { history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch (e) { history = []; }
    if (!history.length) {
      historyEl.style.display = 'none';
      return;
    }
    var html = '<h4 style="margin-bottom:var(--space-sm);">Recent ESQ-R Snapshots</h4><ul class="checklist">';
    history.slice(-5).reverse().forEach(function (entry) {
      html += '<li>' + new Date(entry.generatedAt).toLocaleString() + ' &mdash; Top strengths: ' + entry.strengths.map(function (s) { return s.name; }).join(', ') + '</li>';
    });
    html += '</ul>';
    historyEl.innerHTML = html;
    historyEl.style.display = 'block';
  }

  function updateProgress() {
    var answered = form.querySelectorAll('input[type="radio"]:checked').length;
    var pct = Math.round((answered / totalQuestions) * 100);
    progressFill.style.width = pct + '%';
    progressText.textContent = answered + ' of ' + totalQuestions + ' answered';
    var bar = progressFill.closest('.esqr-progress');
    if (bar) bar.setAttribute('aria-valuenow', answered);
  }

  function getScores() {
    var scores = {};
    SKILLS.forEach(function (skill) {
      var sum = 0;
      var count = 0;
      skill.questions.forEach(function (qName) {
        var checked = form.querySelector('input[name="' + qName + '"]:checked');
        if (checked) {
          sum += parseInt(checked.value, 10);
          count++;
        }
      });
      scores[skill.id] = count > 0 ? +(sum / count).toFixed(1) : 0;
    });
    return scores;
  }

  function isComplete() {
    for (var i = 1; i <= totalQuestions; i++) {
      if (!form.querySelector('input[name="q' + i + '"]:checked')) return false;
    }
    return true;
  }

  function renderChart(scores) {
    var container = document.getElementById('esqr-chart');
    container.innerHTML = '';

    var maxScore = 7;
    var thinkingSkills = SKILLS.filter(function (s) { return s.domain === 'thinking'; })
      .sort(function (a, b) { return scores[b.id] - scores[a.id]; });
    var doingSkills = SKILLS.filter(function (s) { return s.domain === 'doing'; })
      .sort(function (a, b) { return scores[b.id] - scores[a.id]; });

    var html = '<div class="esqr-bars">';

    html += '<div class="esqr-domain-group"><div class="esqr-domain-label esqr-domain-label--thinking">Thinking</div><div class="esqr-domain-bars">';
    thinkingSkills.forEach(function (skill) {
      var score = scores[skill.id];
      var pct = (score / maxScore) * 100;
      html += '<div class="esqr-bar-group"><div class="esqr-bar-wrapper">';
      html += '<div class="esqr-bar esqr-bar--thinking" style="height:' + pct + '%;" title="' + skill.name + ': ' + score + '/7">';
      html += '<span class="esqr-bar__value">' + score + '</span></div></div>';
      html += '<div class="esqr-bar__label">' + skill.name + '</div></div>';
    });
    html += '</div></div>';

    html += '<div class="esqr-domain-group"><div class="esqr-domain-label esqr-domain-label--doing">Doing</div><div class="esqr-domain-bars">';
    doingSkills.forEach(function (skill) {
      var score = scores[skill.id];
      var pct = (score / maxScore) * 100;
      html += '<div class="esqr-bar-group"><div class="esqr-bar-wrapper">';
      html += '<div class="esqr-bar esqr-bar--doing" style="height:' + pct + '%;" title="' + skill.name + ': ' + score + '/7">';
      html += '<span class="esqr-bar__value">' + score + '</span></div></div>';
      html += '<div class="esqr-bar__label">' + skill.name + '</div></div>';
    });
    html += '</div></div></div>';

    html += '<div class="esqr-chart-legend">';
    html += '<span class="esqr-legend-item"><span class="esqr-legend-dot" style="background:var(--color-primary-light);"></span> Thinking</span>';
    html += '<span class="esqr-legend-item"><span class="esqr-legend-dot" style="background:var(--color-accent);"></span> Doing</span>';
    html += '</div>';

    container.innerHTML = html;
  }

  function renderResults(scores) {
    var sorted = SKILLS.map(function (skill) {
      return { id: skill.id, name: skill.name, domain: skill.domain, score: scores[skill.id] };
    }).sort(function (a, b) { return b.score - a.score; });

    var top3 = sorted.slice(0, 3);
    var bottom3 = sorted.slice(-3).reverse();

    var strengthsHtml = '';
    top3.forEach(function (s) {
      strengthsHtml += '<div class="esqr-result-card esqr-result-card--strength">';
      strengthsHtml += '<div class="esqr-result-card__header"><strong>' + s.name + '</strong><span class="esqr-result-card__score">' + s.score + '/7</span></div>';
      strengthsHtml += '<span class="esqr-result-card__domain">' + s.domain + '</span></div>';
    });
    document.getElementById('strengths-list').innerHTML = strengthsHtml;

    var weakHtml = '';
    bottom3.forEach(function (s) {
      var strat = STRATEGIES[s.id] || { summary: 'No strategy profile available.', strategies: [] };
      weakHtml += '<div class="esqr-result-card esqr-result-card--weakness">';
      weakHtml += '<div class="esqr-result-card__header"><strong>' + s.name + '</strong><span class="esqr-result-card__score">' + s.score + '/7</span></div>';
      weakHtml += '<span class="esqr-result-card__domain">' + s.domain + '</span>';
      weakHtml += '<p class="esqr-result-card__summary">' + strat.summary + '</p><h5>Recommended Strategies:</h5><ul class="esqr-result-card__strategies">';
      (strat.strategies || []).forEach(function (str) { weakHtml += '<li>' + str + '</li>'; });
      weakHtml += '</ul></div>';
    });
    document.getElementById('weaknesses-list').innerHTML = weakHtml;

    var thinkingSkills = SKILLS.filter(function (s) { return s.domain === 'thinking'; });
    var doingSkills = SKILLS.filter(function (s) { return s.domain === 'doing'; });
    var thinkingAvg = thinkingSkills.reduce(function (sum, s) { return sum + scores[s.id]; }, 0) / thinkingSkills.length;
    var doingAvg = doingSkills.reduce(function (sum, s) { return sum + scores[s.id]; }, 0) / doingSkills.length;

    document.getElementById('thinking-avg').textContent = thinkingAvg.toFixed(1) + ' / 7';
    document.getElementById('doing-avg').textContent = doingAvg.toFixed(1) + ' / 7';

    lastResultsPayload = {
      generatedAt: new Date().toISOString(),
      strengths: top3,
      growthAreas: bottom3,
      domainAverages: {
        thinking: Number(thinkingAvg.toFixed(2)),
        doing: Number(doingAvg.toFixed(2))
      },
      allScores: scores
    };

    localStorage.setItem(RESULT_KEY, JSON.stringify(lastResultsPayload));
    var history = [];
    try { history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch (e) { history = []; }
    history.push(lastResultsPayload);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-20)));
    renderHistory();
  }

  function buildShareText() {
    if (!lastResultsPayload) return '';
    var strengths = lastResultsPayload.strengths.map(function (s) { return s.name + ' (' + s.score + '/7)'; }).join(', ');
    var growth = lastResultsPayload.growthAreas.map(function (s) { return s.name + ' (' + s.score + '/7)'; }).join(', ');
    return 'My EFI ESQ-R summary\nStrengths: ' + strengths + '\nGrowth areas: ' + growth + '\nThinking avg: ' + lastResultsPayload.domainAverages.thinking + '/7\nDoing avg: ' + lastResultsPayload.domainAverages.doing + '/7';
  }

  function renderResultsImageBlob() {
    if (!resultsSection || resultsSection.hidden) {
      return Promise.reject(new Error('Generate your profile first, then export.'));
    }
    return ensureCanvasEngine().then(function () {
      return window.html2canvas(resultsSection, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });
    }).then(function (canvas) {
      return new Promise(function (resolve) {
        canvas.toBlob(function (blob) {
          resolve({ blob: blob, canvas: canvas });
        }, 'image/png');
      });
    });
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function bindActions() {
    form.addEventListener('change', updateProgress);

    if (downloadPngBtn) {
      downloadPngBtn.addEventListener('click', function () {
        renderResultsImageBlob().then(function (result) {
          if (!result.blob) throw new Error('Unable to render PNG export.');
          downloadBlob(result.blob, 'efi-esqr-results-' + new Date().toISOString().slice(0, 10) + '.png');
          setShareStatus('PNG downloaded.');
        }).catch(function (err) {
          setShareStatus(err.message || 'Unable to export PNG.');
        });
      });
    }

    if (downloadPdfBtn) {
      downloadPdfBtn.addEventListener('click', function () {
        renderResultsImageBlob().then(function (result) {
          return ensurePdfEngine().then(function () {
            var jsPDF = window.jspdf.jsPDF;
            var pageWidth = 210;
            var pageHeight = 297;
            var margin = 10;
            var contentWidth = pageWidth - (margin * 2);
            var contentHeight = (result.canvas.height * contentWidth) / result.canvas.width;
            var pdf = new jsPDF('p', 'mm', 'a4');
            var imageData = result.canvas.toDataURL('image/png');
            var y = margin;
            var heightLeft = contentHeight;

            pdf.addImage(imageData, 'PNG', margin, y, contentWidth, contentHeight);
            heightLeft -= (pageHeight - margin * 2);

            while (heightLeft > 0) {
              y = heightLeft - contentHeight + margin;
              pdf.addPage();
              pdf.addImage(imageData, 'PNG', margin, y, contentWidth, contentHeight);
              heightLeft -= (pageHeight - margin * 2);
            }

            pdf.save('efi-esqr-results-' + new Date().toISOString().slice(0, 10) + '.pdf');
            setShareStatus('PDF downloaded.');
          });
        }).catch(function (err) {
          setShareStatus(err.message || 'Unable to export PDF.');
        });
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', function () {
        var text = buildShareText();
        if (!text) {
          setShareStatus('Generate your profile first, then share.');
          return;
        }

        renderResultsImageBlob().then(function (result) {
          if (navigator.canShare && navigator.share && result.blob) {
            var file = new File([result.blob], 'efi-esqr-results.png', { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              return navigator.share({
                title: 'My EFI ESQ-R Results',
                text: text,
                files: [file]
              }).then(function () {
                setShareStatus('Results snapshot shared successfully.');
                return;
              });
            }
          }

          if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text).then(function () {
              setShareStatus('Device does not support file sharing here. Summary copied to clipboard instead.');
            });
          }
          throw new Error('Sharing is not supported on this browser.');
        }).catch(function (err) {
          setShareStatus(err.message || 'Unable to share results.');
        });
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!isComplete()) {
        errorMsg.hidden = false;
        errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      errorMsg.hidden = true;
      var scores = getScores();
      renderChart(scores);
      renderResults(scores);
      resultsSection.hidden = false;
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  loadConfig()
    .then(function () {
      bindActions();
      updateProgress();
      renderHistory();
    })
    .catch(function (err) {
      if (errorMsg) {
        errorMsg.hidden = false;
        errorMsg.textContent = err.message || 'Unable to initialize ESQ-R right now.';
      }
    });
})();
    if (leadForm) {
      leadForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var nameEl = document.getElementById('esqr-lead-name');
        var emailEl = document.getElementById('esqr-lead-email');
        var consentEl = document.getElementById('esqr-lead-consent');
        var email = emailEl ? String(emailEl.value || '').trim() : '';
        var name = nameEl ? String(nameEl.value || '').trim() : '';
        var consent = !!(consentEl && consentEl.checked);

        if (!email || email.indexOf('@') === -1) {
          setLeadStatus('Enter a valid email to save your results.');
          return;
        }
        if (!consent) {
          setLeadStatus('Consent is required to subscribe.');
          return;
        }
        setLeadStatus('Saving...');
        fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            email: email,
            consent: true,
            lead_type: 'esqr_results',
            source: 'esqr_assessment'
          })
        }).then(function (res) {
          if (!res.ok) throw new Error('Unable to save right now.');
          return res.json();
        }).then(function () {
          setLeadStatus('Saved. Check your inbox for tools and offers.');
          if (window.EFI && EFI.Analytics && EFI.Analytics.track) {
            EFI.Analytics.track('esqr_lead_capture', { source: 'esqr_assessment' });
          }
        }).catch(function (err) {
          setLeadStatus(err.message || 'Unable to save right now.');
        });
      });
    }
