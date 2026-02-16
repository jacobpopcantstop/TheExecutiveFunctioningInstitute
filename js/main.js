/* ============================================
   The Executive Functioning Institute
   Main JavaScript
   ============================================ */

/* Apply saved theme immediately to prevent flash */
(function () {
  var saved = localStorage.getItem('efi_theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

document.addEventListener('DOMContentLoaded', function () {

  function highlightActiveNavLinks() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link').forEach(function (link) {
      link.classList.remove('nav__link--active');
      link.removeAttribute('aria-current');

      var href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('nav__link--active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  window.EFI = window.EFI || {};
  window.EFI.highlightActiveNavLinks = highlightActiveNavLinks;

  (function initTelemetry() {
    var KEY = 'efi_client_errors';
    function post(payload) {
      if (!window.fetch) return Promise.resolve();
      return fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {});
    }
    function read() {
      try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
    }
    function write(list) {
      localStorage.setItem(KEY, JSON.stringify(list.slice(-50)));
    }
    function log(type, payload) {
      var list = read();
      var item = { type: type, payload: payload, at: new Date().toISOString(), page: window.location.pathname };
      list.push(item);
      write(list);
      post({
        event_name: 'client_error',
        page: window.location.pathname.split('/').pop() || 'index.html',
        source: 'telemetry',
        properties: item
      });
    }
    window.EFI.Telemetry = {
      getErrors: read,
      clearErrors: function () { localStorage.removeItem(KEY); },
      log: log
    };
    window.addEventListener('error', function (e) {
      log('error', { message: e.message, source: e.filename, line: e.lineno, col: e.colno });
    });
    window.addEventListener('unhandledrejection', function (e) {
      log('promise_rejection', { reason: String(e.reason) });
    });
  })();

  (function initAnalytics() {
    function post(payload) {
      if (!window.fetch) return Promise.resolve();
      return fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {});
    }

    function track(eventName, properties) {
      var page = window.location.pathname.split('/').pop() || 'index.html';
      var params = new URLSearchParams(window.location.search || '');
      var source = params.get('utm_source') || params.get('source') || document.referrer || 'direct';
      return post({
        event_name: eventName,
        page: page,
        source: source,
        properties: properties || {}
      });
    }

    window.EFI.Analytics = {
      track: track
    };

    track('page_view', {
      title: document.title
    });

    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('[data-analytics-event]') : null;
      if (!el) return;
      track(el.getAttribute('data-analytics-event'), {
        label: el.getAttribute('data-analytics-label') || el.textContent.trim().slice(0, 80)
      });
    });
  })();

  (function injectFooterLegalLinks() {
    var footers = document.querySelectorAll('.footer__bottom');
    if (!footers.length) return;
    footers.forEach(function (footerBottom) {
      if (footerBottom.querySelector('.footer__legal')) return;
      var legal = document.createElement('span');
      legal.className = 'footer__legal';
      legal.innerHTML = '<a href="privacy.html">Privacy</a> &middot; <a href="terms.html">Terms</a> &middot; <a href="verify.html">Verify Certificate</a>';
      footerBottom.appendChild(legal);
    });
  })();

  (function injectTopicClusters() {
    return;
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (document.querySelector('.topic-clusters')) return;
    var nav = document.querySelector('.nav');
    if (!nav || !nav.parentNode) return;

    var clusters = [
      { href: 'module-a-neuroscience.html', label: 'Theory', pages: ['module-a-neuroscience.html', 'barkley-model-guide.html', 'barkley-vs-brown.html', 'brown-clusters-tool.html', 'ward-360-thinking.html', 'further-sources.html'] },
      { href: 'module-c-interventions.html', label: 'Practice', pages: ['module-b-pedagogy.html', 'module-c-interventions.html', 'community.html', 'scope-of-practice.html'] },
      { href: 'teacher-to-coach.html', label: 'Business', pages: ['teacher-to-coach.html', 'educator-launchpad.html', 'coach-directory.html', 'accreditation.html', 'gap-analyzer.html', 'launch-plan.html'] }
    ];

    var wrap = document.createElement('div');
    wrap.className = 'topic-clusters';
    var inner = document.createElement('div');
    inner.className = 'topic-clusters__inner';
    clusters.forEach(function (cluster) {
      var a = document.createElement('a');
      a.className = 'topic-clusters__link';
      if (cluster.pages.indexOf(currentPage) >= 0) a.classList.add('topic-clusters__link--active');
      a.href = cluster.href;
      a.textContent = cluster.label;
      inner.appendChild(a);
    });
    wrap.appendChild(inner);
    nav.insertAdjacentElement('afterend', wrap);
    document.body.classList.add('has-topic-clusters');
    if (!document.querySelector('.hero') && !document.querySelector('.page-header')) {
      document.body.classList.add('has-topic-clusters-plain');
    }
  })();

  (function normalizePrimaryNav() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage === 'admin.html') return;

    var primaryLinks = [
      { href: 'index.html', label: 'Home' },
      { href: 'getting-started.html', label: 'Start Here' },
      { href: 'curriculum.html', label: 'Curriculum' },
      { href: 'resources.html', label: 'Resources' },
      { href: 'store.html', label: 'Store' },
      { href: 'certification.html', label: 'Certification' }
    ];

    document.querySelectorAll('.nav__links').forEach(function (links) {
      var existingAuth = links.querySelector('.nav__auth');
      var authHtml = existingAuth ? existingAuth.innerHTML : '';
      var html = '';

      primaryLinks.forEach(function (item) {
        html += '<a href="' + item.href + '" class="nav__link">' + item.label + '</a>';
      });

      html += '<span class="nav__auth">' + authHtml + '</span>';
      html += '<a href="enroll.html" class="nav__link nav__link--cta">Enroll</a>';
      links.innerHTML = html;
    });
  })();

  (function ensureStoreVisibility() {
    return;
  })();

  (function injectFloatingStoreCTA() {
    if (!document.body.hasAttribute('data-enable-floating-store')) return;
    if (window.location.pathname.split('/').pop() === 'store.html') return;
    if (window.location.pathname.split('/').pop() === 'checkout.html') return;
    if (document.querySelector('.floating-store-cta')) return;
    var cta = document.createElement('a');
    cta.href = 'store.html';
    cta.className = 'floating-store-cta';
    cta.textContent = 'Open Store';
    cta.setAttribute('data-analytics-event', 'floating_store_click');
    document.body.appendChild(cta);
  })();

  (function injectGettingStartedNavLink() {
    return;
  })();

  (function injectGettingStartedFooterLink() {
    document.querySelectorAll('.footer__links').forEach(function (list) {
      if (list.querySelector('a[href="getting-started.html"]')) return;
      if (!list.querySelector('a[href="curriculum.html"]')) return;
      var item = document.createElement('li');
      item.innerHTML = '<a href="getting-started.html">Getting Started</a>';
      var curriculum = list.querySelector('a[href="curriculum.html"]');
      if (curriculum && curriculum.parentNode && curriculum.parentNode.nextSibling) {
        list.insertBefore(item, curriculum.parentNode.nextSibling);
      } else {
        list.appendChild(item);
      }
    });
  })();

  (function injectGettingStartedPrompts() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage === 'index.html') return;
    if (['resources.html', 'curriculum.html'].indexOf(currentPage) === -1) return;
    if (document.getElementById('getting-started-guide-card')) return;
    var headerContainer = document.querySelector('.page-header .container');
    if (!headerContainer) return;
    var card = document.createElement('div');
    card.id = 'getting-started-guide-card';
    card.className = 'card';
    card.style.marginTop = 'var(--space-xl)';
    card.innerHTML =
      '<h3 style="margin-top:0;">New to EFI?</h3>' +
      '<p style="color:var(--color-text-light);">Use the guided path for parents, educators, and professionals to find the right starting sequence in under 30 minutes.</p>' +
      '<div class="button-group" style="margin-top:var(--space-md);">' +
      '<a href="getting-started.html" class="btn btn--primary btn--sm">Open Getting Started Guide</a>' +
      '<a href="esqr.html" class="btn btn--secondary btn--sm">Take Free ESQ-R</a>' +
      '</div>';
    headerContainer.appendChild(card);
  })();

  (function injectSiteGuide() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPage !== 'getting-started.html') return;
    if (document.querySelector('.site-guide')) return;

    var mount = document.querySelector('.page-header .container') || document.querySelector('main .container');
    if (!mount) return;

    var guide = document.createElement('div');
    guide.className = 'site-guide';
    guide.innerHTML =
      '<div class="site-guide__head">' +
        '<p class="site-guide__title">Where should I start?</p>' +
        '<p class="site-guide__hint">Pick your path and follow the sequence. You can always switch tracks.</p>' +
      '</div>' +
      '<div class="site-guide__grid">' +
        '<article class="site-guide__card">' +
          '<h4>Parent Path</h4>' +
          '<p>Learn key EF concepts, run ESQ-R, then apply home interventions.</p>' +
          '<a class="btn btn--secondary btn--sm" href="#path-parent">Follow Parent Steps</a>' +
        '</article>' +
        '<article class="site-guide__card">' +
          '<h4>Educator Path</h4>' +
          '<p>Use pedagogy + intervention modules, then move into practical toolkits.</p>' +
          '<a class="btn btn--secondary btn--sm" href="#path-educator">Follow Educator Steps</a>' +
        '</article>' +
        '<article class="site-guide__card">' +
          '<h4>Coach Path</h4>' +
          '<p>Complete curriculum, enroll, and unlock tests, assignments, and review.</p>' +
          '<a class="btn btn--primary btn--sm" href="#path-coach">Follow Coach Steps</a>' +
        '</article>' +
      '</div>' +
      '<div class="site-guide__quicklinks">' +
        '<a href="curriculum.html">Curriculum</a>' +
        '<a href="esqr.html">Free ESQ-R</a>' +
        '<a href="resources.html">Resource Hub</a>' +
        '<a href="store.html">Store</a>' +
        '<a href="dashboard.html">Dashboard</a>' +
      '</div>';
    mount.appendChild(guide);
  })();

  (function injectRoadmapHubLinks() {
    return;
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (['index.html', 'curriculum.html', 'resources.html'].indexOf(currentPage) === -1) return;
    if (document.getElementById('roadmap-hub-links')) return;
    var anchor = document.querySelector('main .cta-section') || document.querySelector('main section:last-of-type');
    if (!anchor || !anchor.parentNode) return;

    var section = document.createElement('section');
    section.id = 'roadmap-hub-links';
    section.className = 'section section--alt';
    section.innerHTML =
      '<div class=\"container\">' +
        '<div class=\"section-header\">' +
          '<span class=\"section-header__tag\">Topic Clusters</span>' +
          '<h2>Theory, Practice, Business</h2>' +
          '<p>Follow the internal learning path: theory pages feed practice pages, then transition into certification and business implementation.</p>' +
        '</div>' +
        '<div class=\"content-hub-grid\">' +
          '<article class=\"hub-card\"><h3>Theory</h3><p>Neuroscience and model hubs for Barkley, Brown, and comparative framing.</p><a class=\"btn btn--secondary btn--sm\" href=\"module-a-neuroscience.html\">Open Theory Hub</a> <a class=\"btn btn--secondary btn--sm\" href=\"further-sources.html\">Further Sources</a></article>' +
          '<article class=\"hub-card\"><h3>Practice</h3><p>Intervention playbooks, pedagogy shift tools, and 360 Thinking implementation.</p><a class=\"btn btn--secondary btn--sm\" href=\"module-c-interventions.html\">Open Practice Hub</a></article>' +
          '<article class=\"hub-card\"><h3>Business</h3><p>Teacher-to-coach transition assets, launch funnels, and directory/community growth pages.</p><a class=\"btn btn--secondary btn--sm\" href=\"teacher-to-coach.html\">Open Business Hub</a></article>' +
        '</div>' +
      '</div>';

    anchor.parentNode.insertBefore(section, anchor);
  })();

  (function reduceEnrollButtons() {
    var all = Array.prototype.slice.call(document.querySelectorAll('main a[href="enroll.html"]'));
    if (all.length <= 1) return;
    all.forEach(function (link, index) {
      if (index === 0) return;
      link.href = 'certification.html';
      if (/\bbtn\b/.test(link.className)) {
        link.textContent = 'View Certification';
      }
    });
  })();

  (function injectModuleReadingPanel() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var readingByModule = {
      'module-1.html': [
        { title: 'Barkley (2012): Executive Functions, What They Are', url: 'https://www.routledge.com/Executive-Functions-What-They-Are-How-They-Work-and-Why-They-Evolved/Barkley/p/book/9781462506965' },
        { title: 'Harvard Center on the Developing Child: InBrief', url: 'https://developingchild.harvard.edu/resources/inbrief-executive-function/' }
      ],
      'module-2.html': [
        { title: 'Dawson & Guare ESQ-R materials', url: 'resources.html#assessments' },
        { title: 'BRIEF-2 overview', url: 'https://www.parinc.com/Products/Pkey/39' }
      ],
      'module-3.html': [
        { title: 'Dawson & Guare coaching framework excerpts', url: 'resources.html#reading' },
        { title: 'ICF Core Competencies', url: 'https://coachingfederation.org/credentials-and-standards/core-competencies' }
      ],
      'module-4.html': [
        { title: 'Sarah Ward 360 Thinking tools', url: 'resources.html#tools' },
        { title: 'Time blindness and scaffolding talk', url: 'resources.html#video' }
      ],
      'module-5.html': [
        { title: 'Harvard EF skill-building guide', url: 'https://developingchild.harvard.edu/resource-guides/guide-executive-function/' },
        { title: 'Enhancing & Practicing EF Skills (paper)', url: 'Enhancing-and-Practicing-Executive-Function-Skills-with-Children-from-Infancy-to-Adolescence-1.pdf' }
      ],
      'module-6.html': [
        { title: 'ICF Code of Ethics', url: 'https://coachingfederation.org/ethics/code-of-ethics' },
        { title: 'Certification requirements and rubric', url: 'certification.html' }
      ]
    };

    var requiredReadings = readingByModule[currentPage];
    if (!requiredReadings) return;

    var moduleContainer = document.querySelector('main .container');
    var anchorSection = document.querySelector('main .cta-section') || document.querySelector('main section:last-of-type');
    if (!moduleContainer || !anchorSection || document.getElementById('module-reading-highlight')) return;

    var card = document.createElement('div');
    card.id = 'module-reading-highlight';
    card.className = 'card module-reading-highlight';
    var html = '<div class="module-reading-highlight__title"><h3 style="margin-bottom:0;">Required Further Reading</h3><span class="module-reading-highlight__badge">Required</span></div>';
    html += '<p style="margin-top:var(--space-sm);color:var(--color-text-light);">Complete these references before marking this module done. They are used by rubric-based grading and capstone evaluation.</p>';
    html += '<ul class="checklist" style="margin-top:var(--space-md);">';
    requiredReadings.forEach(function (reading) {
      var external = /^https?:/.test(reading.url);
      html += '<li><a href="' + reading.url + '"' + (external ? ' target="_blank" rel="noopener"' : '') + '>' + reading.title + '</a></li>';
    });
    html += '</ul>';
    html += '<a href="resources.html#reading" class="btn btn--secondary btn--sm" style="margin-top:var(--space-md);">Open Complete Reading Packet</a>';
    card.innerHTML = html;

    anchorSection.parentNode.insertBefore(card, anchorSection);
  })();

  (function injectModuleCitationPanel() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var citationByModule = {
      'module-1.html': ['Barkley (2012)', 'Brown (2013)', 'Harvard Center on the Developing Child'],
      'module-2.html': ['Dawson & Guare ESQ-R', 'BRIEF-2 Technical Manual', 'Barkley Point-of-Performance principle'],
      'module-3.html': ['Dawson & Guare intervention framework', 'ICF Core Competencies'],
      'module-4.html': ['Ward & Jacobsen 360 Thinking', 'Temporal management literature'],
      'module-5.html': ['Harvard EF activities guide', 'ADHD/ASD coaching adaptations literature'],
      'module-6.html': ['ICF Code of Ethics', 'NBEFC guidance', 'Scope of practice resources']
    };
    var citations = citationByModule[currentPage];
    if (!citations || document.getElementById('module-citation-panel')) return;
    var anchorSection = document.querySelector('main .cta-section') || document.querySelector('main section:last-of-type');
    if (!anchorSection || !anchorSection.parentNode) return;
    var panel = document.createElement('div');
    panel.id = 'module-citation-panel';
    panel.className = 'card module-reading-highlight';
    var html = '<div class="module-reading-highlight__title"><h3 style="margin-bottom:0;">Evidence & Citation Check</h3><span class="module-reading-highlight__badge">Reviewed</span></div>';
    html += '<p style="margin-top:var(--space-sm);color:var(--color-text-light);">This module currently maps to the following foundational references:</p><ul class="checklist" style="margin-top:var(--space-md);">';
    citations.forEach(function (item) { html += '<li>' + item + '</li>'; });
    html += '</ul><a href="resources.html#reading" class="btn btn--secondary btn--sm" style="margin-top:var(--space-md);">Open Reading Citations</a>';
    panel.innerHTML = html;
    anchorSection.parentNode.insertBefore(panel, anchorSection);
  })();

  (function injectModuleAssessmentPreview() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var previewByModule = {
      'module-1.html': { test: 'Unit Test 1: Inhibition + Time Blindness', assignment: 'Assignment 1.1 Temporal Horizon Analysis' },
      'module-2.html': { test: 'Unit Test 2: Intake + Assessment Interpretation', assignment: 'Assignment 2.1 Intake Simulation Packet' },
      'module-3.html': { test: 'Unit Test 3: Coaching Architecture + Ethics', assignment: 'Assignment 3.1 Ethics & Competency Portfolio' },
      'module-4.html': { test: 'Unit Test 4: 360 Thinking + Time Systems', assignment: 'Assignment 4.1 Applied Method Integration' },
      'module-5.html': { test: 'Unit Test 5: Special Population Strategy Design', assignment: 'Assignment 5.1 Intervention Design Project' },
      'module-6.html': { test: 'Unit Test 6: Practice Ops + Credential Standards', assignment: 'Assignment 6.1 Launch Kit Capstone' }
    };

    var item = previewByModule[currentPage];
    if (!item || document.getElementById('module-assessment-preview')) return;
    var anchorSection = document.querySelector('main .cta-section') || document.querySelector('main section:last-of-type');
    if (!anchorSection || !anchorSection.parentNode) return;

    var panel = document.createElement('div');
    panel.id = 'module-assessment-preview';
    panel.className = 'card module-reading-highlight';
    panel.innerHTML =
      '<div class="module-reading-highlight__title"><h3 style="margin-bottom:0;">Tests + Assignments Preview</h3><span class="module-reading-highlight__badge">Enrollment Required</span></div>' +
      '<p style="margin-top:var(--space-sm);color:var(--color-text-light);">This module includes one graded unit test and one applied assignment. Public pages show the framework; full assessment tools, scoring, and credential feedback unlock after paid enrollment.</p>' +
      '<ul class="checklist" style="margin-top:var(--space-md);">' +
      '<li><strong>Test Preview:</strong> ' + item.test + '</li>' +
      '<li><strong>Assignment Preview:</strong> ' + item.assignment + '</li>' +
      '</ul>' +
      '<div class="button-group" style="margin-top:var(--space-md);">' +
      '<a href="enroll.html" class="btn btn--primary btn--sm">Enroll to Unlock Assessments</a>' +
      '<a href="store.html" class="btn btn--secondary btn--sm">View Certification Pricing</a>' +
      '</div>';
    anchorSection.parentNode.insertBefore(panel, anchorSection);
  })();

  (function injectModuleKnowledgeCheck() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var checks = {
      'module-1.html': {
        question: 'A learner can explain a plan but fails under time pressure and emotional friction. Which mechanism is MOST likely failing first in Barkley\'s sequence?',
        options: ['Lexical retrieval', 'Response inhibition under load', 'Long-term semantic memory', 'Phonological decoding'],
        answer: 1,
        rationale: 'In Barkley\'s model, inhibition failure under load prevents downstream use of self-talk, future simulation, and emotional modulation.'
      },
      'module-2.html': {
        question: 'Which intake interpretation best distinguishes skill deficit from performance variability?',
        options: ['One low homework grade proves a global skill deficit', 'High-interest success with low-interest collapse suggests context-dependent performance failure', 'High IQ eliminates EF concerns', 'Parent report alone should override all other data'],
        answer: 1,
        rationale: 'Performance swings by context indicate regulation/load mismatch, not necessarily absent underlying skill knowledge.'
      },
      'module-3.html': {
        question: 'Which session design best reflects EF coaching rather than tutoring?',
        options: ['Content reteach -> worksheet correction -> score review', 'Goal definition -> execution plan -> friction review -> transfer rep in a second context', 'Lecture on motivation -> homework reminder', 'Open discussion with no measurable next action'],
        answer: 2,
        rationale: 'Coaching architecture emphasizes execution systems, monitoring, and transfer, not only content accuracy.'
      },
      'module-4.html': {
        question: 'In Ward\'s framework, which sequence produces stronger prospective planning accuracy?',
        options: ['Get Ready -> Do -> Done', 'Do -> Done -> Reflect', 'Done -> Do -> Get Ready', 'Do -> Get Ready -> Done'],
        answer: 1,
        rationale: 'Done-first planning forces future-state representation before task sequencing and material prep.'
      },
      'module-5.html': {
        question: 'A client underestimates task duration by ~2.5x across four weeks. What is the strongest intervention next step?',
        options: ['Ask for more effort and confidence', 'Apply a personalized correction factor to planning and validate with timed reps', 'Remove all timers to reduce anxiety', 'Switch goals weekly to maintain novelty'],
        answer: 1,
        rationale: 'Prediction-vs-actual data should directly calibrate future planning via correction multipliers and repeated measurement.'
      },
      'module-6.html': {
        question: 'Which practice is most defensible in an ethics audit?',
        options: ['Promise diagnostic conclusions after ESQ-R review', 'Guarantee specific symptom outcomes in writing', 'Document scope boundaries, refer when risk exceeds coaching remit, and preserve consent records', 'Share full session content with parents without client agreement'],
        answer: 2,
        rationale: 'Ethical reliability depends on scope clarity, referral discipline, and documented consent/confidentiality controls.'
      },
      'module-a-neuroscience.html': {
        question: 'Which statement best matches developmental neuroscience of executive function?',
        options: ['PFC systems mature early in childhood, so adolescent EF variance is mostly motivational', 'PFC-regulated inhibition and planning networks continue maturing into young adulthood, increasing dependence on external scaffolds in adolescence', 'EF depends mostly on occipital cortex maturation', 'Emotion and EF are independent systems with minimal interaction'],
        answer: 1,
        rationale: 'EF regulation is developmentally prolonged, and external supports remain critical through adolescence.'
      },
      'module-b-pedagogy.html': {
        question: 'Which intervention pairing most directly supports process transfer?',
        options: ['Content reteaching + grading rubric review', 'Minimal prompt hierarchy + second-context transfer repetition', 'Longer lecture + increased homework volume', 'Open encouragement without implementation cues'],
        answer: 2,
        rationale: 'Transfer requires scaffolded execution plus repetition in new contexts with fading prompts.'
      },
      'module-c-interventions.html': {
        question: 'In backward planning, what most improves completion reliability?',
        options: ['Start with task list brainstorm and estimate later', 'Define done-state quality criteria, reverse-sequence milestones, then pre-commit start triggers', 'Focus only on due date reminders', 'Delay planning until motivation rises'],
        answer: 1,
        rationale: 'Reliability improves when end-state definition, milestone sequencing, and start-trigger commitment are linked.'
      },
      'curriculum.html': {
        question: 'What unlocks graded tests, assignment review, and credential workflows?',
        options: ['Reading a single free article', 'Paid enrollment in certification services', 'Visiting the home page twice', 'Creating a community comment'],
        answer: 1,
        rationale: 'Core information is open, while graded assessments and credential review are part of paid certification services.'
      }
    };

    var check = checks[currentPage];
    if (!check || document.getElementById('module-knowledge-check')) return;

    var anchor = document.getElementById('module-knowledge-check-anchor') || document.getElementById('module-assessment-preview');
    if (!anchor) {
      var sections = Array.prototype.slice.call(document.querySelectorAll('main section'));
      anchor = sections.find(function (section) {
        return /module navigation/i.test(section.textContent || '') || !!section.querySelector('a[href^="module-"]');
      }) || document.querySelector('main .cta-section') || document.querySelector('main section:last-of-type');
    }
    if (!anchor || !anchor.parentNode) return;

    var wrap = document.createElement('div');
    wrap.id = 'module-knowledge-check';
    wrap.className = 'card module-quiz';

    var optionsHtml = '';
    check.options.forEach(function (option, index) {
      optionsHtml +=
        '<label class="module-quiz__option">' +
          '<input type="radio" name="knowledge-check" value="' + index + '">' +
          '<span>' + option + '</span>' +
        '</label>';
    });

    wrap.innerHTML =
      '<div class="module-reading-highlight__title">' +
        '<h3 style="margin-bottom:0;">Quick Knowledge Check</h3>' +
        '<span class="module-reading-highlight__badge">1 Question</span>' +
      '</div>' +
      '<p class="module-quiz__question">' + check.question + '</p>' +
      '<div class="module-quiz__options">' + optionsHtml + '</div>' +
      '<div class="button-group" style="margin-top:var(--space-md);">' +
        '<button type="button" class="btn btn--secondary btn--sm" id="knowledge-check-submit">Check Answer</button>' +
        '<a href="store.html" class="btn btn--primary btn--sm">View Graded Path</a>' +
      '</div>' +
      '<div id="knowledge-check-result" aria-live="polite"></div>';

    anchor.parentNode.insertBefore(wrap, anchor);

    var submit = document.getElementById('knowledge-check-submit');
    var result = document.getElementById('knowledge-check-result');
    if (!submit || !result) return;

    submit.addEventListener('click', function () {
      var selected = wrap.querySelector('input[name="knowledge-check"]:checked');
      if (!selected) {
        result.className = 'module-quiz__result module-quiz__result--no';
        result.textContent = 'Choose an option first, then submit.';
        return;
      }
      var chosen = Number(selected.value);
      var correct = chosen === check.answer;
      result.className = 'module-quiz__result ' + (correct ? 'module-quiz__result--ok' : 'module-quiz__result--no');
      result.textContent = (correct ? 'Correct. ' : 'Not quite. ') + check.rationale;
      try {
        localStorage.setItem('efi_quiz_' + currentPage, JSON.stringify({
          correct: correct,
          selected: chosen,
          at: new Date().toISOString()
        }));
      } catch (e) {}
    });
  })();

  (function injectLearnMorePanels() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (!/^module-|^curriculum\.html$/.test(currentPage)) return;
    var deepDives = {
      'module-b-pedagogy.html': [
        { match: ['planning'], text: 'Planning-first protocols reduce cognitive switching cost and make error sources visible before execution starts.', links: [{ href: 'module-c-interventions.html', label: 'Intervention Frameworks' }, { href: 'https://www.smartbutscatteredkids.com/resources/esq-r-self-report-assessment-tool/', label: 'ESQ-R Framework' }] },
        { match: ['reflection'], text: 'Prompted reflection is a metacognitive training loop: identify breakdown point, isolate friction variable, and define the next behavior test.', links: [{ href: 'module-3.html', label: 'Coaching Framework' }, { href: 'https://coachingfederation.org/credentials-and-standards/core-competencies', label: 'ICF Core Competencies' }] },
        { match: ['transfer'], text: 'Transfer fails when success is context-bound. Second-context reps with reduced prompting are required to build independent execution.', links: [{ href: 'module-4.html', label: 'Applied Methodologies' }, { href: 'further-sources.html', label: 'Further Sources' }] },
        { match: ['template'], text: 'Session templates are decision scaffolds: fixed block timing reduces drift and preserves coaching focus on execution rather than topic drift.', links: [{ href: 'resources.html#forms', label: 'Template Library' }, { href: 'module-6.html', label: 'Professional Practice' }] },
        { match: ['implementation'], text: 'Wrapping content tutoring inside pre-plan and post-adaptation loops converts one-time compliance into repeatable self-management.', links: [{ href: 'scope-of-practice.html', label: 'Scope Guidance' }, { href: 'certification.html', label: 'Certification Standards' }] }
      ],
      'module-c-interventions.html': [
        { match: ['backward'], text: 'Backward planning improves reliability by externalizing dependency chains and exposing hidden prep work before deadline pressure spikes.', links: [{ href: 'module-4.html', label: 'Time Systems' }, { href: 'resources.html#forms', label: 'Planning Templates' }] },
        { match: ['time blindness'], text: 'Time blindness interventions work best when elapsed time is made visible and correction factors are rehearsed against real task data.', links: [{ href: 'module-5.html', label: 'Prediction Calibration' }, { href: 'further-sources.html', label: 'Cited Sources' }] },
        { match: ['metacognitive'], text: 'Metacognitive prompts should target plan quality, derail detection, and recovery procedure rather than general encouragement.', links: [{ href: 'module-3.html', label: 'Coaching Prompts' }, { href: 'resources.html#reading', label: 'Prompt References' }] }
      ],
      'module-1.html': [
        { match: ['inhibition'], text: 'Inhibition enables temporal self-control by delaying immediate response so working memory and self-directed speech can engage.', links: [{ href: 'https://pubmed.ncbi.nlm.nih.gov/9000892/', label: 'Barkley 1997' }, { href: 'barkley-model-guide.html', label: 'Model Guide' }] },
        { match: ['time blindness'], text: 'Temporal discounting compresses future consequence salience, which is why near-term cues dominate behavior under EF strain.', links: [{ href: 'https://www.youtube.com/watch?v=wmV8HQUuPEk', label: 'Barkley Time Blindness Segment' }, { href: 'module-5.html', label: 'Applied Interventions' }] },
        { match: ['prefrontal'], text: 'PFC development is prolonged, so environmental supports are compensatory design features, not shortcuts.', links: [{ href: 'module-a-neuroscience.html', label: 'Neuroscience Hub' }, { href: 'further-sources.html', label: 'Further Sources' }] }
      ],
      'module-2.html': [
        { match: ['intake'], text: 'A strong intake triangulates self-report, collateral patterns, and context variance to avoid over- or under-identification.', links: [{ href: 'resources.html#assessment', label: 'Assessment Tools' }, { href: 'brown-clusters-tool.html', label: 'Brown Clusters Tool' }] },
        { match: ['esq-r'], text: 'ESQ-R profiles are most actionable when translated into two-week behavior targets with observable completion criteria.', links: [{ href: 'Conv17-305-dawson-executive-skills-questionnaire.pdf', label: 'ESQ-R PDF' }, { href: 'dashboard.html', label: 'Dashboard Tracking' }] },
        { match: ['brief'], text: 'Rating-scale interpretation should prioritize cross-setting discrepancies and function-level bottlenecks, not single-score labels.', links: [{ href: 'resources.html#reading', label: 'Reading Packets' }, { href: 'module-3.html', label: 'Coaching Architecture' }] }
      ],
      'module-3.html': [
        { match: ['alliance'], text: 'Alliance quality predicts adherence: collaboratively framed goals outperform directive compliance-based planning.', links: [{ href: 'scope-of-practice.html', label: 'Scope + Alliance Boundaries' }, { href: 'https://coachingfederation.org/credentials-and-standards/core-competencies', label: 'ICF Core Competencies' }] },
        { match: ['goals'], text: 'Goal quality improves when targets are behavior-specific, time-bounded, and tied to environmental trigger design.', links: [{ href: 'module-b-pedagogy.html', label: 'Pedagogy Translation' }, { href: 'resources.html#forms', label: 'Template Forms' }] },
        { match: ['ethics'], text: 'Scope-safe coaching requires explicit referral thresholds and documentation discipline in every high-risk context.', links: [{ href: 'module-6.html', label: 'Professional Practice' }, { href: 'terms.html', label: 'Terms + Delivery Model' }] }
      ],
      'module-4.html': [
        { match: ['get ready'], text: 'GDD is a prospective sequencing scaffold: define final-state fidelity first, then derive execution operations and setup constraints.', links: [{ href: 'https://www.efpractice.com/getreadydodone', label: 'Get Ready Do Done' }, { href: 'ward-360-thinking.html', label: 'Ward 360 Thinking' }] },
        { match: ['clock'], text: 'Analog visual time cues convert abstract duration into spatial volume, reducing temporal estimation error.', links: [{ href: 'module-5.html', label: 'Time Correction Practice' }, { href: 'resources.html#forms', label: 'Visual Clock Tools' }] },
        { match: ['offload'], text: 'Cognitive offloading should be placed at point-of-performance to reduce working-memory leakage during transitions.', links: [{ href: 'module-c-interventions.html', label: 'Intervention Frameworks' }, { href: 'resources.html#forms', label: 'Offloading Templates' }] }
      ],
      'module-5.html': [
        { match: ['task initiation'], text: 'Initiation breakdown is often affective friction, so treatment should lower activation energy before demanding persistence.', links: [{ href: 'module-3.html', label: 'Coaching Framework' }, { href: 'resources.html#reading', label: 'Applied Readings' }] },
        { match: ['prediction'], text: 'Prediction-error tracking yields individualized correction factors that materially improve planning realism.', links: [{ href: 'images/time-correction-chart.svg', label: 'Time Correction Chart' }, { href: 'module-4.html', label: 'Method Foundations' }] },
        { match: ['special populations'], text: 'Population adaptations should preserve EF principles while adjusting pacing, language, and sensory/context load.', links: [{ href: 'resources.html', label: 'Resource Hub' }, { href: 'scope-of-practice.html', label: 'Scope Boundaries' }] }
      ],
      'module-6.html': [
        { match: ['ethics'], text: 'Ethics implementation depends on process reliability: consent capture, documentation quality, and repeatable referral standards.', links: [{ href: 'certification.html', label: 'Certification QA' }, { href: 'terms.html', label: 'Terms' }] },
        { match: ['practice'], text: 'Practice systems should separate delivery quality metrics from commercial metrics to avoid scope drift and over-promising.', links: [{ href: 'teacher-to-coach.html', label: 'Business Path' }, { href: 'accreditation.html', label: 'Alignment Status' }] },
        { match: ['launch'], text: 'Launch readiness is demonstrated by operational consistency: intake-to-feedback workflow, retention plan, and policy hygiene.', links: [{ href: 'launch-plan.html', label: '90-Day Launch Plan' }, { href: 'dashboard.html', label: 'Dashboard Workflow' }] }
      ],
      'curriculum.html': [
        { match: ['module 1'], text: 'Module sequence is dependency-aware: theory precedes assessment, then coaching architecture, then interventions and professional operations.', links: [{ href: 'module-1.html', label: 'Module 1' }, { href: 'module-2.html', label: 'Module 2' }] },
        { match: ['assignment'], text: 'Assignments are designed as skill transfer tests, not content recitation: plan quality and execution consistency are weighted heavily.', links: [{ href: 'certification.html', label: 'Rubrics + Capstone' }, { href: 'store.html', label: 'Graded Services' }] },
        { match: ['free'], text: 'Open information reduces access barriers, while paid layers fund grading, credential verification, and reviewed performance feedback.', links: [{ href: 'resources.html', label: 'Free Resources' }, { href: 'getting-started.html', label: 'Role-Based Start Guide' }] }
      ],
      'module-a-neuroscience.html': [
        { match: ['prefrontal'], text: 'PFC-dependent regulation is highly load-sensitive, which is why performance drops under stress despite intact conceptual understanding.', links: [{ href: 'https://pubmed.ncbi.nlm.nih.gov/9000892/', label: 'Barkley 1997' }, { href: 'further-sources.html', label: 'Source Hub' }] },
        { match: ['inhibition'], text: 'Inhibition operates as a gating process that protects future-oriented goal models from interference by immediate cues.', links: [{ href: 'https://www.russellbarkley.org/factsheets/ADHD_EF_and_SR.pdf', label: 'Barkley EF/SR Fact Sheet' }, { href: 'barkley-model-guide.html', label: 'Barkley Guide' }] },
        { match: ['coaching'], text: 'Coaching translates neuroscience by externalizing planning and memory demands so execution does not depend on internal load alone.', links: [{ href: 'module-b-pedagogy.html', label: 'Pedagogy Shift' }, { href: 'module-c-interventions.html', label: 'Intervention Stack' }] }
      ]
    };

    var fallback = {
      text: 'Deeper technical note: map each tactic to mechanism (inhibition, working memory, emotional regulation, or prospective sequencing) before applying it in practice.',
      links: [{ href: 'further-sources.html', label: 'Further Sources' }, { href: 'certification.html', label: 'Rubric Standards' }]
    };

    var sectionDeepDives = {
      'module-b-pedagogy.html': {
        'from "what is the answer?" to "how will you run the process?"': {
          text: 'This shift changes the unit of analysis from content correctness to execution reliability. You are training future independent performance, not just immediate task completion.',
          links: [{ href: 'module-3.html', label: 'Coaching Architecture' }, { href: 'scope-of-practice.html', label: 'Scope Boundaries' }]
        },
        'pedagogical core moves': {
          text: 'Core moves are operational levers: plan definition, friction monitoring, and transfer checks. Without these, coaching devolves into ad-hoc tutoring.',
          links: [{ href: 'module-c-interventions.html', label: 'Interventions' }, { href: 'resources.html#forms', label: 'Implementation Templates' }]
        },
        'applied session templates': {
          text: 'Template fidelity matters because fixed timing protects reflection and transfer windows that are often skipped when sessions drift.',
          links: [{ href: 'module-6.html', label: 'Practice Ops' }, { href: 'certification.html', label: 'Rubric Expectations' }]
        },
        'module b source links': {
          text: 'Use source links as implementation anchors: each resource should map to a concrete coaching behavior you can observe, score, and iterate.',
          links: [{ href: 'further-sources.html', label: 'Further Sources Hub' }, { href: 'resources.html#source-access', label: 'Source Access Notes' }]
        }
      },
      'module-c-interventions.html': {
        'open intervention brief infrastructure': {
          text: 'Intervention briefs should specify trigger conditions, start behaviors, and failure recovery rules so clients can execute without live supervision.',
          links: [{ href: 'module-4.html', label: 'Applied Methods' }, { href: 'resources.html#forms', label: 'Downloadable Tools' }]
        },
        'intervention frameworks': {
          text: 'Framework quality is determined by repeatability under stress. Build systems that survive distraction, fatigue, and low-motivation states.',
          links: [{ href: 'module-5.html', label: 'Special Populations' }, { href: 'brown-clusters-tool.html', label: 'Cluster Mapping' }]
        }
      },
      'module-1.html': {
        'the neuropsychology of self-regulation': {
          text: 'Self-regulation should be modeled as delayed action control across time, with inhibition serving as gating for future-oriented behavior.',
          links: [{ href: 'https://pubmed.ncbi.nlm.nih.gov/9000892/', label: 'Primary Paper' }, { href: 'barkley-model-guide.html', label: 'Model Translation' }]
        },
        'the prefrontal cortex: the brain\'s ceo': {
          text: 'Use this section to teach load sensitivity: strong conceptual knowledge can still collapse when working-memory and inhibition demands spike together.',
          links: [{ href: 'module-a-neuroscience.html', label: 'Neuroscience Module' }, { href: 'module-5.html', label: 'Applied Time/Load Supports' }]
        }
      },
      'module-5.html': {
        'time management: curing "time blindness"': {
          text: 'Time systems should be treated as measurement systems. Prediction error data drives correction factors that improve planning validity.',
          links: [{ href: 'images/time-correction-chart.svg', label: 'Time Correction Chart' }, { href: 'resources.html#forms', label: 'Time Tools' }]
        },
        'task initiation: overcoming the "wall of awful"': {
          text: 'Initiation interventions should reduce threat and lower friction in the first 90 seconds of task contact. Start behavior beats motivation talk.',
          links: [{ href: 'module-3.html', label: 'Coaching Scripts' }, { href: 'module-c-interventions.html', label: 'Intervention Stack' }]
        },
        'special populations & transitions': {
          text: 'Adapt delivery surface, not core mechanism. Preserve EF principles while tuning language, structure, and sensory/context load.',
          links: [{ href: 'scope-of-practice.html', label: 'Scope & Referral' }, { href: 'resources.html', label: 'Resource Hub' }]
        }
      }
    };

    function normalizeHeading(value) {
      return (value || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function pickSectionModel(el, currentPage) {
      var byPage = sectionDeepDives[currentPage];
      if (!byPage) return null;
      var section = el.closest ? el.closest('section') : null;
      if (!section) return null;
      var headingEl = section.querySelector('h2, h3');
      var key = normalizeHeading(headingEl ? headingEl.textContent : '');
      return byPage[key] || null;
    }

    function pickModel(el, pageModels, index) {
      if (!pageModels || !pageModels.length) return fallback;
      var text = (el.textContent || '').toLowerCase();
      var matched = pageModels.find(function (entry) {
        return (entry.match || []).some(function (token) { return text.indexOf(token) >= 0; });
      });
      return matched || pageModels[index % pageModels.length] || fallback;
    }

    var targets = document.querySelectorAll('.card, .callout, .hub-card');
    var limit = 16;
    var count = 0;
    targets.forEach(function (el) {
      if (count >= limit) return;
      if (el.querySelector('.learn-more-toggle')) return;
      if ((el.textContent || '').trim().length < 140) return;
      count += 1;
      var model = pickSectionModel(el, currentPage) || pickModel(el, deepDives[currentPage], count);

      var panelId = 'learn-more-' + Math.random().toString(36).slice(2, 8);
      var links = model.links.map(function (item) {
        var external = /^https?:\/\//.test(item.href);
        return '<a href="' + item.href + '"' + (external ? ' target="_blank" rel="noopener"' : '') + '>' + item.label + '</a>';
      }).join(' &bull; ');

      var wrap = document.createElement('div');
      wrap.style.marginTop = 'var(--space-sm)';
      wrap.innerHTML =
        '<button type="button" class="btn btn--secondary btn--sm learn-more-toggle" aria-expanded="false" aria-controls="' + panelId + '">Learn More</button>' +
        '<div id="' + panelId + '" class="notice" style="display:none;margin-top:var(--space-sm);">' +
          '<p style="margin-bottom:var(--space-sm);">' + model.text + '</p>' +
          '<p style="margin-bottom:0;font-size:0.86rem;">Sources: ' + links + '</p>' +
        '</div>';
      el.appendChild(wrap);

      var toggle = wrap.querySelector('.learn-more-toggle');
      var panel = wrap.querySelector('#' + panelId);
      if (!toggle || !panel) return;
      toggle.addEventListener('click', function () {
        var open = panel.style.display !== 'none';
        panel.style.display = open ? 'none' : 'block';
        toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });
  })();

  (function injectModuleToc() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (!/^module-(1|2|3|4|5|6|a-neuroscience|b-pedagogy|c-interventions)\.html$/.test(currentPage)) return;
    if (document.querySelector('.module-toc')) return;
    var main = document.querySelector('main');
    if (!main) return;

    var sections = Array.prototype.slice.call(main.querySelectorAll('section'));
    var targets = [];
    sections.forEach(function (section, idx) {
      var heading = section.querySelector('h2');
      if (!heading) return;
      var text = (heading.textContent || '').trim();
      if (!text) return;
      if (!section.id) section.id = 'section-' + (idx + 1);
      targets.push({ id: section.id, label: text });
    });
    if (targets.length < 3) return;

    var wrap = document.createElement('div');
    wrap.className = 'module-layout';
    var toc = document.createElement('aside');
    toc.className = 'module-toc';
    toc.setAttribute('aria-label', 'Table of contents');
    var list = '<h3>On This Page</h3><ul>';
    targets.forEach(function (item) {
      list += '<li><a href="#' + item.id + '">' + item.label + '</a></li>';
    });
    list += '</ul>';
    toc.innerHTML = list;

    var content = document.createElement('div');
    content.className = 'module-main';
    while (main.firstChild) content.appendChild(main.firstChild);
    wrap.appendChild(content);
    wrap.appendChild(toc);
    main.appendChild(wrap);
  })();

  /* --- Dark Mode Toggle --- */
  (function () {
    var THEME_KEY = 'efi_theme';

    // Create toggle button in nav
    var navInner = document.querySelector('.nav__inner');
    if (navInner) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dark-toggle';
      btn.setAttribute('aria-label', 'Toggle dark mode');
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      btn.textContent = isDark ? '\u2600' : '\u263E';
      btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';

      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        var next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(THEME_KEY, next);
        btn.textContent = next === 'dark' ? '\u2600' : '\u263E';
        btn.title = next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
      });

      // Insert before the mobile toggle button
      var mobileToggle = navInner.querySelector('.nav__toggle');
      if (mobileToggle) {
        navInner.insertBefore(btn, mobileToggle);
      } else {
        navInner.appendChild(btn);
      }
    }
  })();

  /* --- SVG Icon Templates --- */
  var hamburgerSVG = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  var closeSVG = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  /* --- Mobile Navigation Toggle --- */
  var navToggle = document.querySelector('.nav__toggle');
  var navLinks = document.querySelector('.nav__links');

  function closeNav() {
    if (navToggle && navLinks) {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.innerHTML = hamburgerSVG;
    }
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.contains('open');
      if (isOpen) {
        closeNav();
      } else {
        navLinks.classList.add('open');
        navToggle.setAttribute('aria-expanded', 'true');
        navToggle.innerHTML = closeSVG;
      }
    });

    // Close nav when clicking a link
    navLinks.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        closeNav();
      });
    });

    // Close nav on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        closeNav();
        navToggle.focus();
      }
    });

    // Close nav when clicking outside
    document.addEventListener('click', function (e) {
      if (!navLinks.classList.contains('open')) return;
      if (navLinks.contains(e.target) || navToggle.contains(e.target)) return;
      closeNav();
    });
  }

  (function initLogoWave() {
    var logo = document.querySelector('.nav .nav__logo');
    if (!logo) return;

    logo.addEventListener('click', function (e) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var href = logo.getAttribute('href');
      if (!href) return;

      var rect = logo.getBoundingClientRect();
      var wave = document.createElement('span');
      wave.className = 'nav-pixel-wave';
      var centerX = Math.round(rect.left + rect.width / 2);
      var centerY = Math.round(rect.top + rect.height / 2);
      wave.style.setProperty('--wave-x', centerX + 'px');
      wave.style.setProperty('--wave-y', centerY + 'px');
      var savedDir = localStorage.getItem('efi_wave_direction');
      var direction = savedDir === '-1' ? -1 : 1;
      localStorage.setItem('efi_wave_direction', String(direction));
      var count = 20;
      var baseRadius = 10;
      var travel = 56;
      for (var i = 0; i < count; i += 1) {
        var px = document.createElement('span');
        px.className = 'nav-pixel';
        var theta = (Math.PI * 2 * i / count) * direction;
        var dx = Math.cos(theta) * travel;
        var dy = Math.sin(theta) * travel;
        var startX = Math.cos(theta) * baseRadius;
        var startY = Math.sin(theta) * baseRadius;
        px.style.left = (centerX + startX) + 'px';
        px.style.top = (centerY + startY) + 'px';
        px.style.setProperty('--dx', dx + 'px');
        px.style.setProperty('--dy', dy + 'px');
        px.style.setProperty('--burst-delay', (i % 5) * 14 + 'ms');
        wave.appendChild(px);
      }
      document.body.appendChild(wave);

      var currentPage = window.location.pathname.split('/').pop() || 'index.html';
      if (currentPage !== href) {
        e.preventDefault();
        setTimeout(function () {
          window.location.href = href;
        }, 210);
      }

      setTimeout(function () { wave.remove(); }, 760);
    });
  })();

  /* --- Sticky Nav Shadow + Back-to-Top (single throttled scroll handler) --- */
  var nav = document.querySelector('.nav');
  var backToTop = document.querySelector('.back-to-top');
  var ticking = false;

  function onScroll() {
    if (nav) {
      nav.classList.toggle('scrolled', window.scrollY > 10);
    }
    if (backToTop) {
      backToTop.classList.toggle('visible', window.scrollY > 500);
    }
    ticking = false;
  }

  if (nav || backToTop) {
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
  }

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --- Accordion --- */
  document.querySelectorAll('.accordion').forEach(function (accordion) {
    var headers = accordion.querySelectorAll('.accordion__header');

    headers.forEach(function (header, index) {
      // Ensure ARIA attributes
      var item = header.closest('.accordion__item');
      var body = item ? item.querySelector('.accordion__body') : null;
      if (!body) return;

      // Generate IDs if missing
      if (!header.id) header.id = 'accordion-header-' + Math.random().toString(36).substr(2, 6);
      if (!body.id) body.id = 'accordion-panel-' + Math.random().toString(36).substr(2, 6);

      header.setAttribute('role', 'button');
      header.setAttribute('aria-controls', body.id);
      header.setAttribute('tabindex', '0');
      body.setAttribute('role', 'region');
      body.setAttribute('aria-labelledby', header.id);

      var isActive = item.classList.contains('active');
      header.setAttribute('aria-expanded', isActive ? 'true' : 'false');

      function toggleAccordion() {
        var isCurrentlyActive = item.classList.contains('active');
        var content = item.querySelector('.accordion__content');

        // Close all others in the same accordion
        accordion.querySelectorAll('.accordion__item').forEach(function (otherItem) {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            var otherBody = otherItem.querySelector('.accordion__body');
            var otherHeader = otherItem.querySelector('.accordion__header');
            if (otherBody) otherBody.style.maxHeight = '0';
            if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current
        if (isCurrentlyActive) {
          item.classList.remove('active');
          body.style.maxHeight = '0';
          header.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('active');
          body.style.maxHeight = (content ? content.scrollHeight : body.scrollHeight) + 'px';
          header.setAttribute('aria-expanded', 'true');
        }
      }

      header.addEventListener('click', toggleAccordion);
      header.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleAccordion();
        }
        // Arrow key navigation between accordion headers
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          var nextIndex = e.key === 'ArrowDown'
            ? (index + 1) % headers.length
            : (index - 1 + headers.length) % headers.length;
          headers[nextIndex].focus();
        }
        if (e.key === 'Home') {
          e.preventDefault();
          headers[0].focus();
        }
        if (e.key === 'End') {
          e.preventDefault();
          headers[headers.length - 1].focus();
        }
      });
    });
  });

  /* --- Tabs --- */
  document.querySelectorAll('.tabs').forEach(function (tabGroup) {
    var tabList = tabGroup.querySelector('.tabs__list');
    var buttons = tabGroup.querySelectorAll('.tabs__btn');
    var panels = tabGroup.querySelectorAll('.tabs__panel');

    if (!tabList || buttons.length === 0) return;

    // Set ARIA roles
    tabList.setAttribute('role', 'tablist');

    buttons.forEach(function (btn, index) {
      var target = btn.getAttribute('data-tab');
      var panel = tabGroup.querySelector('[data-panel="' + target + '"]');

      // Generate IDs if missing
      if (!btn.id) btn.id = 'tab-' + Math.random().toString(36).substr(2, 6);
      if (panel && !panel.id) panel.id = 'tabpanel-' + Math.random().toString(36).substr(2, 6);

      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-controls', panel ? panel.id : '');
      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', btn.id);
        panel.setAttribute('tabindex', '0');
      }

      var isActive = btn.classList.contains('active');
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.setAttribute('tabindex', isActive ? '0' : '-1');

      btn.addEventListener('click', function () {
        activateTab(tabGroup, buttons, panels, index);
      });

      btn.addEventListener('keydown', function (e) {
        var nextIndex;
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          nextIndex = (index + 1) % buttons.length;
          activateTab(tabGroup, buttons, panels, nextIndex);
          buttons[nextIndex].focus();
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          nextIndex = (index - 1 + buttons.length) % buttons.length;
          activateTab(tabGroup, buttons, panels, nextIndex);
          buttons[nextIndex].focus();
        }
        if (e.key === 'Home') {
          e.preventDefault();
          activateTab(tabGroup, buttons, panels, 0);
          buttons[0].focus();
        }
        if (e.key === 'End') {
          e.preventDefault();
          var last = buttons.length - 1;
          activateTab(tabGroup, buttons, panels, last);
          buttons[last].focus();
        }
      });
    });
  });

  function activateTab(tabGroup, buttons, panels, activeIndex) {
    buttons.forEach(function (b, i) {
      var isActive = i === activeIndex;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      b.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    panels.forEach(function (p) {
      p.classList.remove('active');
    });
    var target = buttons[activeIndex].getAttribute('data-tab');
    var panel = tabGroup.querySelector('[data-panel="' + target + '"]');
    if (panel) panel.classList.add('active');
  }

  /* --- Scroll Reveal Animation --- */
  if ('IntersectionObserver' in window) {
    var observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    var fadeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(function (el) {
      fadeObserver.observe(el);
    });

    // Stagger children
    var staggerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var children = entry.target.children;
          Array.from(children).forEach(function (child, i) {
            setTimeout(function () {
              child.classList.add('visible');
            }, i * 100);
          });
          staggerObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.stagger').forEach(function (el) {
      staggerObserver.observe(el);
    });
  } else {
    // Fallback: show everything immediately
    document.querySelectorAll('.fade-in, .stagger > *').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* --- Active nav link highlighting --- */
  highlightActiveNavLinks();

  /* --- Enrollment / Contact Form Handler --- */
  var form = document.getElementById('contact-form') || document.getElementById('enroll-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"], .btn');
      if (!btn) return;
      var originalText = btn.textContent;
      btn.textContent = 'Submitted! Thank you.';
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = originalText;
        btn.disabled = false;
        form.reset();
      }, 3000);
    });
  }

});
