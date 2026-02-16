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
      { href: 'module-1.html', label: 'Module 1' },
      { href: 'module-a-neuroscience.html', label: 'Theory' },
      { href: 'module-c-interventions.html', label: 'Practice' },
      { href: 'teacher-to-coach.html', label: 'Business' },
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
    document.querySelectorAll('.nav__links').forEach(function (links) {
      if (links.querySelector('a[href="store.html"]')) return;
      var store = document.createElement('a');
      store.href = 'store.html';
      store.className = 'nav__link';
      store.textContent = 'Store';
      store.setAttribute('data-analytics-event', 'nav_store_click');

      var authNode = links.querySelector('.nav__auth');
      var ctaNode = links.querySelector('.nav__link--cta');
      if (authNode) {
        links.insertBefore(store, authNode);
      } else if (ctaNode) {
        links.insertBefore(store, ctaNode);
      } else {
        links.appendChild(store);
      }
    });
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
    document.querySelectorAll('.nav__links').forEach(function (links) {
      if (links.querySelector('a[href="getting-started.html"]')) return;
      var a = document.createElement('a');
      a.href = 'getting-started.html';
      a.className = 'nav__link';
      a.textContent = 'Start Here';
      var first = links.querySelector('.nav__link');
      if (first) {
        links.insertBefore(a, first.nextSibling);
      } else {
        links.appendChild(a);
      }
    });
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
          '<a class="btn btn--secondary btn--sm" href="getting-started.html">Follow Parent Steps</a>' +
        '</article>' +
        '<article class="site-guide__card">' +
          '<h4>Educator Path</h4>' +
          '<p>Use pedagogy + intervention modules, then move into practical toolkits.</p>' +
          '<a class="btn btn--secondary btn--sm" href="module-b-pedagogy.html">Follow Educator Steps</a>' +
        '</article>' +
        '<article class="site-guide__card">' +
          '<h4>Coach Path</h4>' +
          '<p>Complete curriculum, enroll, and unlock tests, assignments, and review.</p>' +
          '<a class="btn btn--primary btn--sm" href="certification.html">Follow Coach Steps</a>' +
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
        question: 'In Barkley\'s model, which function must engage first before the others can run reliably?',
        options: ['Response inhibition', 'Processing speed', 'Task initiation', 'Reading comprehension'],
        answer: 0,
        rationale: 'Barkley frames inhibition as the gatekeeper that enables downstream executive functions.'
      },
      'module-2.html': {
        question: 'Which assessment behavior is most consistent with situational variability?',
        options: ['Consistent performance in every context', 'Strong output only in high-interest contexts', 'No skill development over time', 'Perfect behavior under sleep deprivation'],
        answer: 1,
        rationale: 'Situational variability means performance can swing dramatically by context and stimulation.'
      },
      'module-3.html': {
        question: 'What is the core shift from tutoring to EF coaching?',
        options: ['Teach more content faster', 'Replace assignments with motivation talks', 'Teach process and execution systems', 'Avoid goal setting'],
        answer: 2,
        rationale: 'EF coaching targets planning, follow-through, and self-regulation process, not just content delivery.'
      },
      'module-4.html': {
        question: 'In Get Ready, Do, Done, which stage comes first?',
        options: ['Do', 'Done', 'Get Ready', 'Review'],
        answer: 1,
        rationale: 'The model starts with Done (future picture), then Do (steps), then Get Ready (materials).'
      },
      'module-5.html': {
        question: 'Which intervention best reflects environmental scaffolding?',
        options: ['Rely only on willpower', 'Add visible timers and friction-reducing cues', 'Increase punishment frequency', 'Delay all supports until failure'],
        answer: 1,
        rationale: 'Environmental scaffolds externalize executive supports so action is easier to start and sustain.'
      },
      'module-6.html': {
        question: 'Which statement reflects ethical scope in EF coaching?',
        options: ['Diagnose mental disorders during intake', 'Provide psychotherapy if the client asks', 'Refer out when clinical risk exceeds coaching scope', 'Guarantee symptom remission in writing'],
        answer: 2,
        rationale: 'Coaches maintain scope boundaries and refer when needs move into clinical treatment.'
      },
      'module-a-neuroscience.html': {
        question: 'Why is the prefrontal cortex central to executive functioning?',
        options: ['It controls hair growth', 'It supports inhibition, planning, and regulation under load', 'It eliminates all emotional reactions', 'It matures fully by age 10'],
        answer: 1,
        rationale: 'PFC systems support top-down regulation, and maturation extends into young adulthood.'
      },
      'module-b-pedagogy.html': {
        question: 'Which move is most aligned with coaching pedagogy?',
        options: ['Give the student the answer immediately', 'Focus only on grading outcomes', 'Teach the student how to build repeatable process habits', 'Ignore environmental setup'],
        answer: 2,
        rationale: 'Coaching emphasizes process design, metacognition, and transferable execution habits.'
      },
      'module-c-interventions.html': {
        question: 'What is a core goal of backward planning?',
        options: ['Start with random tasks', 'Define the finished outcome first, then reverse-map steps', 'Avoid calendars', 'Work only when urgent'],
        answer: 1,
        rationale: 'Backward planning starts at the done-state and maps milestones in reverse order.'
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

    var anchor = document.getElementById('module-assessment-preview');
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
        '<a href="enroll.html" class="btn btn--primary btn--sm">Unlock Graded Assessments</a>' +
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
      'module-1.html': {
        text: 'Technical dive: EF impairment is modeled as a performance regulation problem across time. Key mechanisms include response inhibition gating, delayed reward discounting, and context-dependent executive load.',
        links: [
          { href: 'https://pubmed.ncbi.nlm.nih.gov/9000892/', label: 'Barkley 1997 (Psychological Bulletin)' },
          { href: 'https://www.russellbarkley.org/factsheets/ADHD_EF_and_SR.pdf', label: 'Barkley EF/SR Fact Sheet' }
        ]
      },
      'module-2.html': {
        text: 'Technical dive: intake quality depends on triangulating self-report, environmental constraints, and execution variance under realistic load.',
        links: [
          { href: 'Conv17-305-dawson-executive-skills-questionnaire.pdf', label: 'ESQ-R Source PDF' },
          { href: 'https://www.brownadhdclinic.com/brown-ef-model-adhd', label: 'Brown EF Model' }
        ]
      },
      'module-3.html': {
        text: 'Technical dive: coaching architecture depends on alliance quality, metacognitive prompt design, and point-of-performance behavior shaping.',
        links: [
          { href: 'https://coachingfederation.org/credentials-and-standards/core-competencies', label: 'ICF Core Competencies' },
          { href: 'scope-of-practice.html', label: 'Scope of Practice' }
        ]
      },
      'module-4.html': {
        text: 'Technical dive: temporal supports are strongest when combining future-state visualization, reverse sequencing, and externalized elapsed-time cues.',
        links: [
          { href: 'https://www.efpractice.com/getreadydodone', label: 'Get Ready Do Done' },
          { href: 'https://sarahwardidanmark.dk/wp-content/uploads/2021/05/WARD-360-grader.pdf', label: '360 Thinking Paper' }
        ]
      },
      'module-5.html': {
        text: 'Technical dive: intervention quality improves when you layer environmental engineering, initiation scaffolds, and emotion-regulation fallback protocols.',
        links: [
          { href: 'Enhancing-and-Practicing-Executive-Function-Skills-with-Children-from-Infancy-to-Adolescence-1.pdf', label: 'Harvard EF Activities PDF' },
          { href: 'resources.html#assessment', label: 'Assessment Tools' }
        ]
      },
      'module-6.html': {
        text: 'Technical dive: ethical reliability depends on scope boundaries, transparent standards, and consistent quality-control release workflows.',
        links: [
          { href: 'terms.html', label: 'Terms and Delivery Model' },
          { href: 'accreditation.html', label: 'Alignment Status' }
        ]
      },
      'curriculum.html': {
        text: 'Technical dive: curriculum integration follows Theory -> Practice -> Credential workflow, with open informational content and paid graded services.',
        links: [
          { href: 'getting-started.html', label: 'Guided Paths' },
          { href: 'certification.html', label: 'Capstone and Rubrics' }
        ]
      }
    };

    var model = deepDives[currentPage] || deepDives['curriculum.html'];
    var targets = document.querySelectorAll('.card, .callout, .hub-card');
    var limit = 16;
    var count = 0;
    targets.forEach(function (el) {
      if (count >= limit) return;
      if (el.querySelector('.learn-more-toggle')) return;
      if ((el.textContent || '').trim().length < 140) return;
      count += 1;

      var panelId = 'learn-more-' + Math.random().toString(36).slice(2, 8);
      var links = model.links.map(function (item) {
        return '<a href="' + item.href + '" target="_blank" rel="noopener">' + item.label + '</a>';
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
      wave.style.setProperty('--wave-x', Math.round(rect.left + rect.width / 2) + 'px');
      wave.style.setProperty('--wave-y', Math.round(rect.top + rect.height / 2) + 'px');
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
