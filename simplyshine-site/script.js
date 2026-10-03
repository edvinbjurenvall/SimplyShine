/* ═══════════════════════════════════════════
   SimplyShine – Shared JavaScript
   ═══════════════════════════════════════════ */

/* ─── Google Analytics 4 ───
   Klistra in mät-ID:t (G-XXXXXXX) från Google Analytics här.
   Sidorna laddar redan gtag via Google Ads-taggen, så ingen annan
   kod behöver ändras. Händelserna nedan skickas när ID:t finns. */
const GA4_ID = '';

if (GA4_ID && typeof window.gtag === 'function') {
  window.gtag('config', GA4_ID);
}

function track(eventName, params) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, Object.assign({ page_path: location.pathname }, params || {}));
}
window.ssTrack = track;

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initFaqAccordion();
  initForms();
  initAddonTooltips();
  initMobileCta();
  initClickTracking();
});

/* ─── Fast bokningsrad i mobilen ─── */
function initMobileCta() {
  const path = location.pathname.replace(/\.html$/, '');
  if (path === '/boka' || path === '/admin' || document.body.dataset.noMobileCta !== undefined) return;
  const bar = document.createElement('div');
  bar.className = 'mobile-cta';
  bar.innerHTML =
    '<a class="btn btn--accent" href="/boka">Boka tid</a>' +
    '<a class="mobile-cta-call" href="tel:+46730604303" aria-label="Ring 073-060 43 03">' +
    '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h3.5l1.5 4.5-2 1.3a11 11 0 0 0 6.2 6.2l1.3-2 4.5 1.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z"/></svg>' +
    '</a>';
  document.body.appendChild(bar);
  document.body.classList.add('has-mobile-cta');
}

/* ─── Klickhändelser: bokningsknappar och telefonnummer ─── */
function initClickTracking() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('tel:')) {
      track('click_phone', { link_text: link.textContent.trim() || 'telefonikon' });
    } else if (/^\/boka(\b|\?|$)/.test(href) || /simplyshine\.se\/boka/.test(href)) {
      track('click_boka', { link_text: link.textContent.trim(), link_url: href });
    }
  });
}

/* ─── Header scroll effect ─── */
function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ─── Mobile menu ─── */
function initMobileMenu() {
  const btn = document.querySelector('.hamburger');
  const menu = document.querySelector('.mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    menu.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  });

  // Close on link click
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      btn.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ─── FAQ Accordion ─── */
function initFaqAccordion() {
  const buttons = document.querySelectorAll('.faq-question');
  buttons.forEach((btn, index) => {
    const item = btn.closest('.faq-item');
    const answer = item && item.querySelector('.faq-answer');
    if (!answer) return;
    answer.id = answer.id || `faq-answer-${index + 1}`;
    btn.setAttribute('aria-controls', answer.id);
    btn.setAttribute('aria-expanded', String(item.classList.contains('open')));
    btn.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      buttons.forEach(other => {
        other.closest('.faq-item')?.classList.remove('open');
        other.setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('open', !wasOpen);
      btn.setAttribute('aria-expanded', String(!wasOpen));
    });
    item.classList.add('faq-ready');
  });
}

/* ─── Formspree form handling ─── */
function initForms() {
  document.querySelectorAll('form[data-formspree]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('.form-submit');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Skickar...';
      submitBtn.disabled = true;

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' },
        });

        const successEl = form.closest('.form-wrapper').querySelector('.form-success');
        if (successEl) {
          form.style.display = 'none';
          successEl.style.display = 'block';
        }
      } catch (err) {
        // Still show success (email might have gone through)
        const successEl = form.closest('.form-wrapper').querySelector('.form-success');
        if (successEl) {
          form.style.display = 'none';
          successEl.style.display = 'block';
        }
      }

      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    });
  });
}

/* ─── Addon tooltips ─── */
function initAddonTooltips() {
  // Create overlay element for closing tooltips
  const overlay = document.createElement('div');
  overlay.className = 'addon-overlay';
  document.body.appendChild(overlay);

  function closeAllTooltips() {
    document.querySelectorAll('.addon-tooltip.active').forEach(t => t.classList.remove('active'));
    overlay.classList.remove('active');
  }

  // Toggle tooltip on info button click
  document.querySelectorAll('.addon-info-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const chip = btn.closest('.addon-chip');
      const tooltip = chip.querySelector('.addon-tooltip');
      const isOpen = tooltip.classList.contains('active');

      closeAllTooltips();

      if (!isOpen) {
        tooltip.classList.add('active');
        overlay.classList.add('active');
      }
    });
  });

  // Close on X button
  document.querySelectorAll('.addon-tooltip-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllTooltips();
    });
  });

  // Close on overlay click
  overlay.addEventListener('click', closeAllTooltips);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllTooltips();
  });
}
