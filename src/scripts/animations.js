// src/scripts/animations.js
//
// Premium scroll experience: Lenis for smooth-scroll momentum, GSAP +
// ScrollTrigger for entrance/parallax/scrub animations. Everything here
// degrades to a static, fully-usable page when the visitor has
// prefers-reduced-motion set — no smooth scroll hijacking, no motion,
// content simply present.

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export function initAnimations() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger);

  let lenis = null;

  if (!reduced) {
    // ---- Smooth scroll ----
    lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1 - Math.pow(2, -10 * t)), // exponential ease-out
      smoothWheel: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // Smooth in-page anchor navigation via Lenis instead of native jump.
    // Links use "/#section" so they also work correctly from other pages
    // (About, Contact, Blog) — only intercept when the link actually points
    // at a section on the page we're currently on; otherwise let the browser
    // navigate there normally.
    document.querySelectorAll('a[href*="#"]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href) return;
      const hashIndex = href.indexOf('#');
      if (hashIndex === -1) return;
      const hash = href.slice(hashIndex);
      const path = href.slice(0, hashIndex);
      const onSamePage = path === '' || path === window.location.pathname;
      if (!onSamePage || hash.length < 2) return;
      const target = document.querySelector(hash);
      if (!target) return;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -64, duration: 1.3 });
      });
    });
  }

  // ---- Nav: shrink + shadow once the page has scrolled a little ----
  const nav = document.getElementById('nav');
  if (nav) {
    ScrollTrigger.create({
      start: 'top -80',
      onUpdate: (self) => nav.classList.toggle('scrolled', self.scroll() > 80),
      onToggle: (self) => nav.classList.toggle('scrolled', self.scroll() > 80),
    });
  }

  // ---- FAQ accordion — smooth height animation, one open at a time ----
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    gsap.set(answer, { height: 0 });

    const closeItem = (el) => {
      const a = el.querySelector('.faq-answer');
      el.classList.remove('open');
      gsap.to(a, { height: 0, duration: 0.4, ease: 'power2.inOut', onComplete: () => ScrollTrigger.refresh() });
    };
    const openItem = (el) => {
      const a = el.querySelector('.faq-answer');
      el.classList.add('open');
      gsap.set(a, { height: 'auto' });
      const fullHeight = a.offsetHeight;
      gsap.fromTo(
        a, { height: 0 },
        {
          height: fullHeight, duration: 0.45, ease: 'power2.out',
          onComplete: () => {
            if (el.classList.contains('open')) gsap.set(a, { height: 'auto' });
            ScrollTrigger.refresh();
          },
        }
      );
    };
    const toggle = () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach((el) => { if (el !== item) closeItem(el); });
      isOpen ? closeItem(item) : openItem(item);
    };
    q.addEventListener('click', toggle);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

  // ---- "Why Now" gap accordion ----
  document.querySelectorAll('.gap-q').forEach((q) => {
    q.addEventListener('click', () => {
      const item = q.closest('.gap-item');
      const isOpen = item.classList.contains('open');
      item.closest('.gap-box').querySelectorAll('.gap-item.open').forEach((i) => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
      ScrollTrigger.refresh();
    });
  });

  // ---- Live scanner demo + any simple success-message forms (Contact, Blog notify) ----
  // These run regardless of prefers-reduced-motion — they're functional UI,
  // not decorative motion. The `reduced` flag just swaps the transitions
  // for instant show/hide.
  initLiveDemo(reduced);
  initSimpleForms(reduced);

  if (reduced) {
    // Make sure everything is simply visible, no animation at all.
    gsap.set('.reveal, .hero-copy > *, .quantum-hero, .section-header > *', {
      clearProps: 'all',
    });
    animateCounts(true);
    return;
  }

  // ==========================================================
  // HERO — staggered entrance on load
  // ==========================================================
  gsap.set('.hero-badge, .hero h1, .hero-sub, .hero-ctas > a, .hero-trust > span', {
    opacity: 0, y: 22,
  });
  gsap.set('.quantum-hero', { opacity: 0, scale: 0.93, y: 10 });

  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.85 } });
  heroTl
    .to('.hero-badge', { opacity: 1, y: 0 })
    .to('.hero h1', { opacity: 1, y: 0 }, '-=0.55')
    .to('.hero-sub', { opacity: 1, y: 0 }, '-=0.55')
    .to('.hero-ctas > a', { opacity: 1, y: 0, stagger: 0.1 }, '-=0.5')
    .to('.hero-trust > span', { opacity: 1, y: 0, stagger: 0.07 }, '-=0.45')
    .to('.quantum-hero', { opacity: 1, scale: 1, y: 0, duration: 1.1, ease: 'power2.out' }, '-=0.8');

  // Gentle parallax drift on the hero glow + qubit field as the hero scrolls by
  gsap.to('.scan-glow', {
    yPercent: 18,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.4 },
  });
  gsap.to('.qbit-field', {
    yPercent: -10,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.4 },
  });

  // ==========================================================
  // SECTION HEADLINES — reveal as they enter view
  // ==========================================================
  gsap.utils.toArray('.section-header').forEach((header) => {
    const parts = header.querySelectorAll('.eyebrow, .section-headline, .section-sub');
    if (!parts.length) return;
    gsap.from(parts, {
      opacity: 0, y: 26, filter: 'blur(6px)',
      duration: 0.75, ease: 'power3.out', stagger: 0.09,
      scrollTrigger: { trigger: header, start: 'top 85%' },
    });
  });
  // The "Why Now" section headline isn't wrapped in .section-header — handle directly
  document.querySelectorAll('.problem-grid > div > .eyebrow').forEach((el) => {
    const group = el.parentElement.querySelectorAll('.eyebrow, .section-headline, .shift-tag');
    gsap.from(group, {
      opacity: 0, y: 24, filter: 'blur(6px)',
      duration: 0.75, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  // ==========================================================
  // GENERIC CARD REVEALS — .reveal elements, batched + staggered
  // ==========================================================
  gsap.set('.reveal', { opacity: 0, y: 28, scale: 0.96, filter: 'blur(5px)' });
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
        duration: 0.7, ease: 'power3.out', stagger: 0.09,
      }),
  });

  // ==========================================================
  // "WHY NOW" — timeline items + stat pills trickle in
  // ==========================================================
  gsap.from('.mini-timeline-item', {
    opacity: 0, x: -16,
    duration: 0.55, ease: 'power2.out', stagger: 0.1,
    scrollTrigger: { trigger: '.mini-timeline', start: 'top 85%' },
  });
  gsap.from('.stat-pill', {
    opacity: 0, y: 14,
    duration: 0.55, ease: 'power2.out', stagger: 0.1,
    scrollTrigger: { trigger: '.stat-pill-row', start: 'top 90%' },
  });
  gsap.from('.gap-item', {
    opacity: 0, x: 16,
    duration: 0.55, ease: 'power2.out', stagger: 0.09,
    scrollTrigger: { trigger: '.gap-box', start: 'top 85%' },
  });

  // ==========================================================
  // SOLUTION STEPPER — scrubbed directly to scroll position
  // ==========================================================
  const stepperEl = document.getElementById('stepper');
  const fill = document.getElementById('stepperFill');
  const dot = document.getElementById('stepperDot');
  const steps = gsap.utils.toArray('.step');
  if (stepperEl && fill) {
    gsap.from('.step', {
      opacity: 0, y: 22,
      duration: 0.6, ease: 'power2.out', stagger: 0.08,
      scrollTrigger: { trigger: stepperEl, start: 'top 80%' },
    });
    ScrollTrigger.create({
      trigger: stepperEl,
      start: 'top 72%',
      end: 'bottom 55%',
      scrub: 0.5,
      onUpdate: (self) => {
        const pct = self.progress * 100;
        fill.style.width = pct + '%';
        if (dot) {
          dot.style.left = pct + '%';
          dot.classList.toggle('on', self.progress > 0.01 && self.progress < 0.999);
        }
        const activeCount = Math.round(self.progress * steps.length);
        steps.forEach((s, i) => s.classList.toggle('active', i < activeCount));
      },
    });
  }

  // ==========================================================
  // PRICING — featured card gets a little extra emphasis on entrance
  // ==========================================================
  gsap.from('.pricing-card.featured', {
    scale: 0.94, opacity: 0,
    duration: 0.8, ease: 'back.out(1.4)',
    scrollTrigger: { trigger: '.pricing-grid', start: 'top 82%' },
  });

  // ==========================================================
  // FINAL CTA — headline + buttons rise together
  // ==========================================================
  gsap.from('.final-cta h2, .final-cta p, .final-ctas', {
    opacity: 0, y: 24, filter: 'blur(4px)',
    duration: 0.75, ease: 'power3.out', stagger: 0.1,
    scrollTrigger: { trigger: '.final-cta', start: 'top 82%' },
  });

  // ==========================================================
  // FOOTER — circuit traces "power on" as the footer enters view
  // ==========================================================
  const footerCircuit = document.querySelector('.footer-circuit');
  if (footerCircuit) {
    gsap.fromTo(
      footerCircuit,
      { opacity: 0 },
      {
        opacity: 0.9, duration: 1.2, ease: 'power2.out',
        scrollTrigger: { trigger: 'footer', start: 'top 90%' },
      }
    );
  }

  // ==========================================================
  // READINESS STATS — count up + score ring, once visible
  // ==========================================================
  ScrollTrigger.create({
    trigger: '.scan-stats-row',
    start: 'top 90%',
    once: true,
    onEnter: () => animateCounts(false),
  });

  // ==========================================================
  // Pointer parallax tilt on the hero visual (desktop only)
  // ==========================================================
  const scanStage = document.querySelector('.scan-stage');
  if (scanStage && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const heroVisual = document.querySelector('.quantum-hero');
    heroVisual?.addEventListener('mousemove', (e) => {
      const rect = scanStage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      gsap.to(scanStage, { rotateY: dx * 6, rotateX: -dy * 6, duration: 0.4, ease: 'power2.out' });
    });
    heroVisual?.addEventListener('mouseleave', () => {
      gsap.to(scanStage, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power3.out' });
    });
  }
}

// ---- Live scanner demo (Hero "Get Risk Assessment" scrolls here) ----
// Front-end only for now: it validates input, runs a simulated scan
// sequence, and lands on an email-capture state. What happens after
// someone submits their email is intentionally left for later.
function initLiveDemo(reduced) {
  const form = document.getElementById('demoForm');
  if (!form) return;

  const input = document.getElementById('demoInput');
  const scanningEl = document.getElementById('demoScanning');
  const statusEl = document.getElementById('demoScanStatus');
  const resultEl = document.getElementById('demoResult');
  const resetBtn = document.getElementById('demoReset');
  const emailBtn = document.getElementById('demoEmailBtn');

  const steps = [
    'Connecting to endpoint…',
    'Capturing the handshake…',
    'Identifying algorithms…',
    'Checking against NIST PQC standards…',
    'Compiling your report…',
  ];

  const reveal = (el) => {
    el.hidden = false;
    if (!reduced) gsap.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!input.value.trim()) { input.focus(); return; }

    form.hidden = true;
    resultEl.hidden = true;
    reveal(scanningEl);

    let i = 0;
    statusEl.textContent = steps[0];
    const stepMs = reduced ? 250 : 650;
    const interval = setInterval(() => {
      i += 1;
      if (i < steps.length) statusEl.textContent = steps[i];
    }, stepMs);

    setTimeout(() => {
      clearInterval(interval);
      scanningEl.hidden = true;
      reveal(resultEl);
    }, steps.length * stepMs + 300);
  });

  resetBtn?.addEventListener('click', () => {
    resultEl.hidden = true;
    input.value = '';
    reveal(form);
    input.focus();
  });

  emailBtn?.addEventListener('click', () => {
    const emailInput = document.getElementById('demoEmail');
    if (emailInput && emailInput.value.trim()) {
      const label = emailBtn.querySelector('span');
      if (label) label.textContent = "You're on the list";
      emailBtn.disabled = true;
    } else {
      emailInput?.focus();
    }
  });
}

// ---- Reusable "submit -> success message" pattern ----
// Any <form data-success="..."> gets this behavior for free: on submit,
// swap the form for a success panel using the message in data-success.
// Used by the Contact page form and the Blog "notify me" form — no backend
// wired up yet, but the interaction is real and consistent site-wide.
function initSimpleForms(reduced) {
  document.querySelectorAll('form[data-success]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const invalid = form.querySelector(':invalid');
      if (invalid) { invalid.focus(); return; }

      const message = form.dataset.success;
      const successEl = document.createElement('div');
      successEl.className = 'form-success';
      successEl.innerHTML =
        '<div class="form-success-icon">' +
        '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.4">' +
        '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>' +
        '<p>' + message + '</p>';
      form.replaceWith(successEl);
      if (!reduced) gsap.fromTo(successEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
    });
  });
}

function animateCounts(instant) {
  document.querySelectorAll('.count').forEach((el) => {
    const target = parseInt(el.dataset.target, 10);
    if (instant) {
      el.textContent = target;
      return;
    }
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 1.4,
      ease: 'power3.out',
      onUpdate: () => { el.textContent = Math.round(obj.val); },
    });
  });
  const ring = document.getElementById('scoreRing');
  if (ring) {
    const circumference = 131.9;
    const target = circumference * (1 - 0.87);
    if (instant) {
      ring.style.strokeDashoffset = target;
    } else {
      gsap.to(ring, { strokeDashoffset: target, duration: 1.4, ease: 'power3.out' });
    }
  }
}
