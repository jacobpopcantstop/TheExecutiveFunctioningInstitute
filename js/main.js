/* ============================================
   The Executive Function Institute
   Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  // --- Mobile Navigation Toggle ---
  const navToggle = document.querySelector('.nav__toggle');
  const navLinks = document.querySelector('.nav__links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
      const isOpen = navLinks.classList.contains('open');
      navToggle.setAttribute('aria-expanded', isOpen);
      navToggle.innerHTML = isOpen
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    });

    // Close nav when clicking a link
    navLinks.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
      });
    });
  }

  // --- Sticky Nav Shadow ---
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 10) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // --- Accordion ---
  document.querySelectorAll('.accordion__header').forEach(function (header) {
    header.addEventListener('click', function () {
      var item = this.closest('.accordion__item');
      var body = item.querySelector('.accordion__body');
      var content = item.querySelector('.accordion__content');
      var isActive = item.classList.contains('active');

      // Close all others in the same accordion
      var accordion = item.closest('.accordion');
      accordion.querySelectorAll('.accordion__item').forEach(function (otherItem) {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          otherItem.querySelector('.accordion__body').style.maxHeight = '0';
        }
      });

      // Toggle current
      if (isActive) {
        item.classList.remove('active');
        body.style.maxHeight = '0';
      } else {
        item.classList.add('active');
        body.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });

  // --- Tabs ---
  document.querySelectorAll('.tabs').forEach(function (tabGroup) {
    var buttons = tabGroup.querySelectorAll('.tabs__btn');
    var panels = tabGroup.querySelectorAll('.tabs__panel');

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = this.getAttribute('data-tab');

        buttons.forEach(function (b) { b.classList.remove('active'); });
        panels.forEach(function (p) { p.classList.remove('active'); });

        this.classList.add('active');
        tabGroup.querySelector('[data-panel="' + target + '"]').classList.add('active');
      });
    });
  });

  // --- Back to Top ---
  var backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 500) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }, { passive: true });

    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Scroll Reveal Animation ---
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

  // --- Active nav link highlighting ---
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('nav__link--active');
    }
  });

  // --- Contact Form Handler ---
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = contactForm.querySelector('.btn');
      var originalText = btn.textContent;
      btn.textContent = 'Message Sent!';
      btn.style.backgroundColor = 'var(--color-accent)';
      setTimeout(function () {
        btn.textContent = originalText;
        btn.style.backgroundColor = '';
        contactForm.reset();
      }, 3000);
    });
  }

});
