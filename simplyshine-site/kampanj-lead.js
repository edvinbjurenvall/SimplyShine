'use strict';
const CampaignLead = (() => {
  const areas = { hovas: 'Hovås, Billdal eller Askim', saro: 'Särö' };
  const attribution = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const maxAge = 60 * 60 * 1000;
  function campaign() { return document.body.dataset.campaign; }
  function key() { return `simplyshine-offer-${campaign()}`; }
  function read() {
    try {
      const value = JSON.parse(sessionStorage.getItem(key()));
      if (!value || Date.now() - value.createdAt > maxAge || value.campaign !== campaign()) { clear(); return null; }
      return value;
    } catch { return null; }
  }
  function clear() { try { sessionStorage.removeItem(key()); } catch {} }
  function save(value) { try { sessionStorage.setItem(key(), JSON.stringify(value)); } catch {} }
  function buildPayload(values, area, params, id) {
    if (!areas[area]) throw new Error('Unknown campaign');
    const payload = { typ: 'hamtat-erbjudande', lead_id: id, namn: values.namn.trim(), telefon: values.telefon.trim(), email: values.email.trim(), omrade: areas[area], kampanj: `${area}-valkomstpaket`, pris: 2495, valuta: 'SEK', bokningslank: `https://simplyshine.se/${area}-boka`, status: 'Intresseanmälan – inte bokad' };
    for (const name of attribution) { const value = params.get(name); if (value) payload[name] = value.slice(0, 200); }
    return payload;
  }
  function init() {
    const area = campaign(); if (!areas[area]) return;
    if (document.body.dataset.stage === 'booking') {
      const saved = read();
      if (saved?.submitted) {
        const form = document.getElementById('campaign-booking');
        for (const name of ['namn', 'telefon', 'email']) if (form.elements[name]) form.elements[name].value = saved.values[name];
        document.getElementById('lead-prefill-status').textContent = saved.preview ? 'Förhandsvisning: ingen intresseanmälan skickades. Välj en tid för att prova nästa steg.' : 'Erbjudandet är hämtat. Dina kontaktuppgifter är redan ifyllda.';
      }
      return;
    }
    const form = document.getElementById('campaign-lead'); if (!form) return;
    const status = document.getElementById('lead-status');
    const submit = form.querySelector('[type=submit]');
    const params = new URLSearchParams(location.search);
    const preview = !['simplyshine.se', 'www.simplyshine.se'].includes(location.hostname);
    let sending = false;
    let id = read()?.id || crypto.randomUUID();
    form.addEventListener('submit', async event => {
      event.preventDefault(); if (sending || !form.reportValidity()) return;
      const values = Object.fromEntries(new FormData(form));
      if (['namn', 'telefon', 'email'].some(name => !values[name]?.trim())) { status.textContent = 'Fyll i namn, mobilnummer och mejladress.'; status.focus(); return; }
      sending = true; submit.disabled = true; submit.textContent = 'Hämtar erbjudandet…'; status.textContent = '';
      try {
        if (!preview) {
          const configResponse = await fetch('/kampanj-lead-config.json', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
          if (!configResponse.ok) throw new Error('config');
          const { endpoint } = await configResponse.json();
          if (!/^https:\/\/hook\.eu1\.make\.com\/[a-z0-9]+$/.test(endpoint)) throw new Error('config');
          const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload(values, area, params, id)), signal: AbortSignal.timeout(40000) });
          if (!response.ok) throw new Error('delivery');
          const receipt = await response.json();
          if (receipt.ok !== true) throw new Error('delivery');
        }
        save({ values, id, campaign: area, createdAt: Date.now(), submitted: true, preview });
        const next = new URL(`/${area}-boka`, location.origin);
        for (const name of attribution) if (params.has(name)) next.searchParams.set(name, params.get(name).slice(0, 200));
        location.assign(next.href);
      } catch (error) {
        status.textContent = error.message === 'config' ? 'Erbjudandeformuläret är tillfälligt otillgängligt. Ring 073-060 43 03 så hjälper vi dig.' : 'Vi kunde inte bekräfta att uppgifterna kom fram. Försök igen eller ring 073-060 43 03.';
        status.focus();
      } finally { sending = false; submit.disabled = false; submit.textContent = 'Hämta erbjudandet nu ↗'; }
    });
    if ('IntersectionObserver' in window) {
      const sticky = document.querySelector('.mobile-book');
      if (sticky) new IntersectionObserver(entries => sticky.classList.toggle('is-hidden', entries[0].isIntersecting)).observe(document.getElementById('hamta'));
    }
  }
  return { buildPayload, read, clear, init };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = CampaignLead;
if (typeof window !== 'undefined') { window.CampaignLead = CampaignLead; CampaignLead.init(); }
