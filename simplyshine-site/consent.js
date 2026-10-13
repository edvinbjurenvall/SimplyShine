/* ═══════════════════════════════════════════
   SimplyShine – Samtycke för mätning
   Google-taggen (Google Ads, och GA4 om ett ID läggs in i script.js)
   och Metricool laddas först när besökaren har klickat "Godkänn".
   Innan dess hämtas inga skript från Google eller Metricool och inga
   mätcookies sätts. Händelser (t.ex. bokningskonvertering) köas lokalt
   i dataLayer och skickas bara om besökaren godkänner.
   ═══════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY = 'simplyshine-consent-v1';
  var DAYS = 180;
  var GOOGLE_TAG_ID = 'AW-18409628541';
  var METRICOOL_HASH = 'f26e0ccd1158ecbdc38f9f561d5c568a';
  var loaded = false;

  function readChoice() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY));
      if (saved && saved.expires > Date.now() && (saved.choice === 'yes' || saved.choice === 'no')) return saved.choice;
    } catch (e) {}
    return null;
  }

  function saveChoice(choice) {
    try { localStorage.setItem(KEY, JSON.stringify({ choice: choice, expires: Date.now() + DAYS * 86400000 })); } catch (e) {}
  }

  function inject(src, onload) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    if (onload) s.onload = onload;
    document.head.appendChild(s);
  }

  function loadTrackers() {
    if (loaded) return;
    loaded = true;
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: 'granted',
        analytics_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted'
      });
    }
    inject('https://www.googletagmanager.com/gtag/js?id=' + GOOGLE_TAG_ID);
    inject('https://tracker.metricool.com/resources/be.js', function () {
      if (window.beTracker) window.beTracker.t({ hash: METRICOOL_HASH });
    });
  }

  function clearGoogleCookies() {
    var host = location.hostname;
    var domains = ['', host, '.' + host, '.simplyshine.se'];
    document.cookie.split(';').forEach(function (part) {
      var name = part.split('=')[0].trim();
      if (!/^(_ga|_gid|_gat|_gcl)/.test(name)) return;
      domains.forEach(function (d) {
        document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax' + (d ? '; domain=' + d : '');
      });
    });
  }

  function buildBanner() {
    var panel = document.createElement('section');
    panel.className = 'consent-banner';
    panel.setAttribute('aria-label', 'Val för cookies och mätning');
    panel.innerHTML =
      '<div class="consent-text">' +
        '<strong>Får vi mäta hur sajten och våra annonser fungerar?</strong>' +
        '<p>Om du godkänner använder vi Google Ads och Metricool för att se hur många som hittar hit och bokar via våra annonser. Inget av det startar förrän du har valt, och du kan boka lika enkelt utan att godkänna.</p>' +
        '<details><summary>Mer om ditt val</summary>' +
          '<p>Google och Metricool sätter cookies i din webbläsare och tar emot uppgifter om besöket, till exempel vilka sidor du tittar på och om du gör en bokning. Google kan koppla det till ditt Google-konto för annonsmätning. Vi skickar aldrig ditt namn, telefonnummer, adress eller registreringsnummer. Ditt val sparas i högst sex månader och du kan ändra det när som helst via Cookieinställningar längst ned på sidan. ' +
          '<a href="https://policies.google.com/technologies/partner-sites?hl=sv" target="_blank" rel="noopener noreferrer">Så använder Google uppgifterna</a>.</p>' +
        '</details>' +
      '</div>' +
      '<div class="consent-actions">' +
        '<button type="button" data-consent="no">Avvisa</button>' +
        '<button type="button" data-consent="yes">Godkänn</button>' +
      '</div>';
    return panel;
  }

  function init() {
    var choice = readChoice();
    if (choice === 'yes') loadTrackers();

    var panel = buildBanner();
    panel.hidden = choice !== null;
    document.body.appendChild(panel);

    var footer = document.querySelector('.footer-bottom') || document.querySelector('footer') || document.body;
    var settings = document.createElement('button');
    settings.type = 'button';
    settings.className = 'consent-settings';
    settings.textContent = 'Cookieinställningar';
    footer.appendChild(settings);

    var returnFocus = null;
    settings.addEventListener('click', function () {
      returnFocus = settings;
      panel.hidden = false;
      panel.querySelector('button').focus();
    });

    panel.querySelectorAll('[data-consent]').forEach(function (button) {
      button.addEventListener('click', function () {
        var next = button.getAttribute('data-consent');
        var wasLoaded = loaded;
        saveChoice(next);
        panel.hidden = true;
        if (returnFocus) returnFocus.focus();
        if (next === 'yes') {
          loadTrackers();
        } else if (wasLoaded) {
          // Återkallat samtycke: stoppa taggarna och rensa deras cookies.
          if (typeof window.gtag === 'function') {
            window.gtag('consent', 'update', { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
          }
          clearGoogleCookies();
          location.reload();
        }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
