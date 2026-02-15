/* ============================================
   ESQ-R Interactive Assessment
   Scoring, Chart, and Recommendations Engine
   ============================================ */

(function () {
  'use strict';

  /* --- Skill Definitions --- */
  var SKILLS = [
    { id: 'response-inhibition',       name: 'Response Inhibition',       domain: 'doing',    questions: ['q1','q2','q3'],     color: '#e74c3c' },
    { id: 'working-memory',            name: 'Working Memory',            domain: 'thinking', questions: ['q4','q5','q6'],     color: '#3498db' },
    { id: 'emotional-control',         name: 'Emotional Control',         domain: 'doing',    questions: ['q7','q8','q9'],     color: '#e67e22' },
    { id: 'sustained-attention',       name: 'Sustained Attention',       domain: 'doing',    questions: ['q10','q11','q12'],  color: '#9b59b6' },
    { id: 'task-initiation',           name: 'Task Initiation',           domain: 'doing',    questions: ['q13','q14','q15'],  color: '#1abc9c' },
    { id: 'planning',                  name: 'Planning',                  domain: 'thinking', questions: ['q16','q17','q18'],  color: '#2980b9' },
    { id: 'organization',              name: 'Organization',              domain: 'thinking', questions: ['q19','q20','q21'],  color: '#8e44ad' },
    { id: 'time-management',           name: 'Time Management',           domain: 'thinking', questions: ['q22','q23','q24'],  color: '#2c3e50' },
    { id: 'goal-directed-persistence', name: 'Goal-Directed Persistence', domain: 'doing',    questions: ['q25','q26','q27'],  color: '#27ae60' },
    { id: 'flexibility',               name: 'Flexibility',               domain: 'doing',    questions: ['q28','q29','q30'],  color: '#f39c12' },
    { id: 'metacognition',             name: 'Metacognition',             domain: 'thinking', questions: ['q31','q32','q33'],  color: '#16a085' },
    { id: 'stress-tolerance',          name: 'Stress Tolerance',          domain: 'doing',    questions: ['q34','q35','q36'],  color: '#c0392b' }
  ];

  /* --- Strategy Recommendations --- */
  var STRATEGIES = {
    'response-inhibition': {
      summary: 'You may act or speak before fully thinking things through, leading to regret or impulsive decisions.',
      strategies: [
        'Practice the "10-Second Rule": When you feel the urge to respond, count to 10 silently before acting. This activates Barkley\'s inhibition mechanism.',
        'Use physical "pause cues" \u2014 a rubber band on the wrist, a Post-it on your monitor \u2014 as environmental reminders to stop and think.',
        'Before sending emails or texts when emotional, save as draft and revisit after 15 minutes. This externalizes the inhibition process.'
      ]
    },
    'working-memory': {
      summary: 'You may struggle to hold information in mind, forget instructions, or lose track of multi-step tasks.',
      strategies: [
        'Externalize your working memory: Write everything down immediately. Use a single "capture" notebook or app for all incoming information.',
        'Use checklists for any task with more than two steps. Post them where the task happens (Barkley\'s "point of performance" principle).',
        'Practice "verbal rehearsal" \u2014 repeat instructions back aloud or whisper them to yourself to engage your verbal working memory (the Mind\'s Voice).'
      ]
    },
    'emotional-control': {
      summary: 'Frustration, anxiety, or strong emotions may interfere with your ability to stay productive and on-task.',
      strategies: [
        'Identify your "Wall of Awful" \u2014 the emotional barriers (shame, dread, boredom) that build up around tasks. Naming the emotion reduces its power.',
        'Create a personal "emotional regulation toolkit": deep breathing, brief physical movement, or stepping away for 2 minutes before re-engaging.',
        'Use a 1\u201310 emotional intensity scale before tasks. If you\u2019re above a 7, deploy a regulation strategy before attempting the task.'
      ]
    },
    'sustained-attention': {
      summary: 'Maintaining focus on tasks \u2014 especially low-interest ones \u2014 may be difficult. This reflects Brown\'s "situational variability."',
      strategies: [
        'Use the Pomodoro Technique: 25 minutes of focused work, then a 5-minute break. This externalizes attention management with a timer.',
        'Modify your environment to reduce distractions: noise-canceling headphones, website blockers, phone in another room during focus blocks.',
        'Add stimulation to low-interest tasks: background music, body doubling (working alongside someone), or gamifying the task with mini-rewards.'
      ]
    },
    'task-initiation': {
      summary: 'Getting started on tasks is a major barrier, even when you know what needs to be done. This is not laziness \u2014 it\u2019s an activation deficit.',
      strategies: [
        'Use "launch rituals" \u2014 a specific 2-minute sequence (sit down, open materials, set timer) that signals your brain to shift into work mode.',
        'Apply the "2-Minute Rule": commit to just 2 minutes of work. Starting is the hardest part; momentum often carries you forward.',
        'Use body doubling or accountability partners. Having someone present (even virtually) activates the social motivation circuit that bypasses the initiation deficit.'
      ]
    },
    'planning': {
      summary: 'You may dive into tasks without a clear plan, leading to inefficiency, missed steps, or feeling overwhelmed by complexity.',
      strategies: [
        'Use Ward\'s "Get Ready, Do, Done" backward planning: Start by visualizing the finished product, then list the steps backward to the present.',
        'Before any project, answer three questions: (1) What does "done" look like? (2) What steps are needed? (3) What materials do I need?',
        'Use project templates with pre-built step sequences. Don\u2019t rely on your brain to generate plans from scratch each time.'
      ]
    },
    'organization': {
      summary: 'Physical and digital spaces may be disorganized, making it hard to find things and contributing to lost time and stress.',
      strategies: [
        'Create a "launch pad" \u2014 one designated spot near your door for everything you need when leaving (keys, wallet, bag). This is an environmental modification per Barkley.',
        'Adopt a "one-touch" rule: handle papers and emails once. File, act on, or discard immediately rather than creating "deal with later" piles.',
        'Schedule a weekly 15-minute "organization reset" for both physical and digital spaces. Regularity prevents entropy.'
      ]
    },
    'time-management': {
      summary: 'You may struggle with "time blindness" \u2014 difficulty estimating how long things take, leading to lateness and missed deadlines.',
      strategies: [
        'Use analog clocks and Time Timers to make time visual and concrete. Digital displays don\u2019t engage the spatial sense of time passing.',
        'Practice "prediction vs. reality" tracking: Before a task, estimate the time needed. After, record the actual time. Review weekly to calibrate your internal clock.',
        'Build in "transition time" buffers between all appointments and tasks. If you think something takes 30 minutes, schedule 45.'
      ]
    },
    'goal-directed-persistence': {
      summary: 'You may start strong but struggle to maintain effort over time, abandoning goals when initial motivation fades.',
      strategies: [
        'Break long-term goals into weekly "milestone" checkpoints with tangible deliverables. This shortens the temporal horizon (addresses Barkley\'s "temporal myopia").',
        'Create visual progress trackers (habit charts, progress bars) that make incremental progress visible and rewarding.',
        'Pair long-term goals with accountability structures: a coach, study group, or public commitment. External scaffolding sustains what internal motivation cannot.'
      ]
    },
    'flexibility': {
      summary: 'Changes in routine, unexpected events, or alternative approaches may cause significant distress or rigidity.',
      strategies: [
        'Practice "Plan B Thinking": For every plan, proactively identify one alternative. "If X doesn\u2019t work, I\u2019ll do Y." This pre-loads cognitive flexibility.',
        'Use "transition warnings" for yourself: set a 5-minute alert before switching tasks or leaving for appointments to prepare mentally.',
        'When you notice yourself getting stuck on one approach, physically move (stand up, change rooms) to disrupt the rigidity pattern and engage new perspective-taking.'
      ]
    },
    'metacognition': {
      summary: 'Self-monitoring and self-awareness of your own thinking processes may be limited, making it hard to evaluate your work or adjust strategies.',
      strategies: [
        'Use a "Stop, Reflect, Adjust" routine at natural task breakpoints. Ask: "How am I doing? Is this approach working? What should I change?"',
        'Keep a brief daily reflection journal: What went well? What didn\u2019t? What will I do differently tomorrow? This trains the metacognitive muscle.',
        'Use rubrics or checklists to evaluate your own work before submitting it. External criteria compensate for limited internal self-assessment.'
      ]
    },
    'stress-tolerance': {
      summary: 'High-pressure situations or multiple simultaneous demands may cause you to shut down, freeze, or become overwhelmed.',
      strategies: [
        'Build a personal "stress protocol": a 3-step sequence you always follow when overwhelmed (e.g., breathe for 1 minute, write down what\u2019s stressing you, pick the one most important task).',
        'Practice "triage" thinking: When overwhelmed, list everything on your plate, then mark each as "urgent," "important," or "can wait." Do only the urgent items first.',
        'Strengthen your stress capacity gradually by practicing with controlled low-stakes challenges. Exposure builds tolerance over time.'
      ]
    }
  };

  /* --- DOM References --- */
  var form = document.getElementById('esqr-form');
  var progressFill = document.getElementById('progress-fill');
  var progressText = document.getElementById('progress-text');
  var errorMsg = document.getElementById('esqr-error');
  var resultsSection = document.getElementById('esqr-results');
  var downloadPngBtn = document.getElementById('esqr-download-png-btn');
  var downloadPdfBtn = document.getElementById('esqr-download-pdf-btn');
  var shareBtn = document.getElementById('esqr-share-btn');
  var shareStatus = document.getElementById('esqr-share-status');
  var historyEl = document.getElementById('esqr-history');
  var lastResultsPayload = null;
  var HISTORY_KEY = 'efi_esqr_history';

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

  if (!form) return;

  /* --- Progress Tracking --- */
  var totalQuestions = 36;

  function updateProgress() {
    var answered = form.querySelectorAll('input[type="radio"]:checked').length;
    var pct = Math.round((answered / totalQuestions) * 100);
    progressFill.style.width = pct + '%';
    progressText.textContent = answered + ' of ' + totalQuestions + ' answered';
    var bar = progressFill.closest('.esqr-progress');
    if (bar) {
      bar.setAttribute('aria-valuenow', answered);
    }
  }

  form.addEventListener('change', updateProgress);

  /* --- Scoring --- */
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

  /* --- Chart Rendering (pure CSS/HTML bar chart) --- */
  function renderChart(scores) {
    var container = document.getElementById('esqr-chart');
    container.innerHTML = '';

    var maxScore = 7;
    var thinkingSkills = SKILLS.filter(function (s) { return s.domain === 'thinking'; })
      .sort(function (a, b) { return scores[b.id] - scores[a.id]; });
    var doingSkills = SKILLS.filter(function (s) { return s.domain === 'doing'; })
      .sort(function (a, b) { return scores[b.id] - scores[a.id]; });

    var html = '<div class="esqr-bars">';

    // Thinking group (left)
    html += '<div class="esqr-domain-group">';
    html += '<div class="esqr-domain-label esqr-domain-label--thinking">Thinking</div>';
    html += '<div class="esqr-domain-bars">';
    thinkingSkills.forEach(function (skill) {
      var score = scores[skill.id];
      var pct = (score / maxScore) * 100;
      html += '<div class="esqr-bar-group">';
      html += '<div class="esqr-bar-wrapper">';
      html += '<div class="esqr-bar esqr-bar--thinking" style="height:' + pct + '%;" title="' + skill.name + ': ' + score + '/7">';
      html += '<span class="esqr-bar__value">' + score + '</span>';
      html += '</div></div>';
      html += '<div class="esqr-bar__label">' + skill.name + '</div>';
      html += '</div>';
    });
    html += '</div></div>';

    // Doing group (right)
    html += '<div class="esqr-domain-group">';
    html += '<div class="esqr-domain-label esqr-domain-label--doing">Doing</div>';
    html += '<div class="esqr-domain-bars">';
    doingSkills.forEach(function (skill) {
      var score = scores[skill.id];
      var pct = (score / maxScore) * 100;
      html += '<div class="esqr-bar-group">';
      html += '<div class="esqr-bar-wrapper">';
      html += '<div class="esqr-bar esqr-bar--doing" style="height:' + pct + '%;" title="' + skill.name + ': ' + score + '/7">';
      html += '<span class="esqr-bar__value">' + score + '</span>';
      html += '</div></div>';
      html += '<div class="esqr-bar__label">' + skill.name + '</div>';
      html += '</div>';
    });
    html += '</div></div>';

    html += '</div>';
    html += '<div class="esqr-chart-legend">';
    html += '<span class="esqr-legend-item"><span class="esqr-legend-dot" style="background:var(--color-primary-light);"></span> Thinking</span>';
    html += '<span class="esqr-legend-item"><span class="esqr-legend-dot" style="background:var(--color-accent);"></span> Doing</span>';
    html += '</div>';

    container.innerHTML = html;
  }

  /* --- Strengths & Weaknesses --- */
  function renderResults(scores) {
    var sorted = SKILLS.map(function (skill) {
      return { id: skill.id, name: skill.name, domain: skill.domain, score: scores[skill.id] };
    }).sort(function (a, b) { return b.score - a.score; });

    var top3 = sorted.slice(0, 3);
    var bottom3 = sorted.slice(-3).reverse();

    // Render strengths
    var strengthsHtml = '';
    top3.forEach(function (s) {
      strengthsHtml += '<div class="esqr-result-card esqr-result-card--strength">';
      strengthsHtml += '<div class="esqr-result-card__header">';
      strengthsHtml += '<strong>' + s.name + '</strong>';
      strengthsHtml += '<span class="esqr-result-card__score">' + s.score + '/7</span>';
      strengthsHtml += '</div>';
      strengthsHtml += '<span class="esqr-result-card__domain">' + s.domain + '</span>';
      strengthsHtml += '</div>';
    });
    document.getElementById('strengths-list').innerHTML = strengthsHtml;

    // Render weaknesses with strategies
    var weakHtml = '';
    bottom3.forEach(function (s) {
      var strat = STRATEGIES[s.id];
      weakHtml += '<div class="esqr-result-card esqr-result-card--weakness">';
      weakHtml += '<div class="esqr-result-card__header">';
      weakHtml += '<strong>' + s.name + '</strong>';
      weakHtml += '<span class="esqr-result-card__score">' + s.score + '/7</span>';
      weakHtml += '</div>';
      weakHtml += '<span class="esqr-result-card__domain">' + s.domain + '</span>';
      weakHtml += '<p class="esqr-result-card__summary">' + strat.summary + '</p>';
      weakHtml += '<h5>Recommended Strategies:</h5>';
      weakHtml += '<ul class="esqr-result-card__strategies">';
      strat.strategies.forEach(function (str) {
        weakHtml += '<li>' + str + '</li>';
      });
      weakHtml += '</ul>';
      weakHtml += '</div>';
    });
    document.getElementById('weaknesses-list').innerHTML = weakHtml;

    // Domain averages
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

    localStorage.setItem('efi_esqr_results', JSON.stringify(lastResultsPayload));
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

  function setShareStatus(message) {
    if (shareStatus) shareStatus.textContent = message;
  }

  function renderResultsImageBlob() {
    if (!resultsSection || resultsSection.hidden) {
      return Promise.reject(new Error('Generate your profile first, then export.'));
    }
    if (!window.html2canvas) {
      return Promise.reject(new Error('Export engine did not load. Please refresh and try again.'));
    }
    return window.html2canvas(resultsSection, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false
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
        if (!window.jspdf || !window.jspdf.jsPDF) {
          throw new Error('PDF engine did not load. Please refresh and try again.');
        }
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

  /* --- Form Submit --- */
  renderHistory();
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

})();
