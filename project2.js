// ---------- respect reduced motion ----------
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- custom cursor ----------
const cursor = document.getElementById('cursor');

if (cursor && !prefersReducedMotion && matchMedia('(hover:hover)').matches) {
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let posX = mouseX;
  let posY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function renderCursor() {
    // simple lerp for a smooth trailing feel
    posX += (mouseX - posX) * 0.18;
    posY += (mouseY - posY) * 0.18;
    cursor.style.transform = `translate(${posX}px, ${posY}px) translate(-50%, -50%)`;
    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);

  document.querySelectorAll('[data-hover], .work-row, a, button').forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-active'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
  });
} else if (cursor) {
  cursor.style.display = 'none';
}

// ---------- curtain wipe reveal on scroll ----------
const curtainSections = document.querySelectorAll('.curtain-wrap');

if (curtainSections.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-open');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.35 }
  );

  curtainSections.forEach((section) => observer.observe(section));
}

// ---------- floating pill navbar on scroll ----------
const nav = document.querySelector('.nav');

if (nav) {
  const PILL_THRESHOLD = 40;
  let ticking = false;

  function updateNavState() {
    nav.classList.toggle('is-pill', window.scrollY > PILL_THRESHOLD);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateNavState);
      ticking = true;
    }
  }, { passive: true });

  updateNavState();
}

// ---------- mobile menu ----------
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');

if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}
