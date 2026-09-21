'use strict';
// Shared ID supplied by the owner for both campaigns. Never send form fields to Meta.
function createCampaignPixel(env) {
  const { win, doc, storage, campaign, preview } = env;
  const pixelId = '1484805043065344';
  const key = 'simplyshine-marketing-consent-v1';
  const allowed = new Set(['PageView', 'Lead', 'Schedule']);
  let granted = false, initialized = false, pageViewed = false;
  const sent = new Set();
  const now = () => Date.now();
  function readConsent() {
    try { const saved = JSON.parse(storage.getItem(key)); return saved && saved.expires > now() && ['yes','no'].includes(saved.choice) ? saved.choice : null; } catch { return null; }
  }
  function init() {
    if (initialized || preview) return;
    if (!win.fbq) {
      const queue = function () { queue.callMethod ? queue.callMethod.apply(queue, arguments) : queue.queue.push(arguments); };
      queue.push = queue; queue.loaded = true; queue.version = '2.0'; queue.queue = [];
      win.fbq = queue; if (!win._fbq) win._fbq = queue;
    }
    win.fbq('consent', 'grant');
    win.fbq('set', 'autoConfig', false, pixelId);
    win.fbq('init', pixelId);
    const script = doc.createElement('script'); script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    doc.head.append(script); initialized = true;
  }
  function track(name, eventId) {
    if (!granted || !allowed.has(name)) return false;
    const dedup = `${name}:${eventId || 'once-per-page'}`;
    if (sent.has(dedup)) return false;
    if (name === 'PageView' && pageViewed) return false;
    const params = { content_name: `valkomstpaket-${campaign}`, content_category: campaign };
    // No estimated revenue, contact data, registration number or free-text fields.
    if (preview) {
      doc.dispatchEvent(new win.CustomEvent('campaign:pixel-preview', { detail: { event: name, pixelId, campaign, sent: false } }));
    } else {
      init(); win.fbq('trackSingle', pixelId, name, params, eventId ? { eventID: eventId } : {});
    }
    sent.add(dedup); if (name === 'PageView') pageViewed = true;
    return true;
  }
  function clearCookies() {
    const domains = ['', win.location.hostname, '.' + win.location.hostname, '.simplyshine.se'];
    for (const name of ['_fbp','_fbc']) for (const domain of domains) {
      doc.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax${domain ? '; domain=' + domain : ''}`;
    }
  }
  function setConsent(choice, persist = true) {
    granted = choice === 'yes';
    if (persist) try { storage.setItem(key, JSON.stringify({ choice: granted ? 'yes' : 'no', expires: now() + 180 * 86400000 })); } catch {}
    if (granted) {
      if (initialized && !preview) win.fbq('consent','grant');
      track('PageView');
    } else {
      if (initialized && !preview) win.fbq('consent','revoke');
      clearCookies();
    }
  }
  return { pixelId, readConsent, setConsent, track };
}
if (typeof module !== 'undefined' && module.exports) module.exports = createCampaignPixel;
if (typeof window !== 'undefined') {
  const campaign = document.body.dataset.campaign;
  if (['saro','hovas'].includes(campaign)) {
    const preview = document.documentElement.dataset.preview === 'true' || !['simplyshine.se','www.simplyshine.se'].includes(location.hostname);
    let storage; try { storage = localStorage; } catch { storage = { getItem:()=>null, setItem:()=>{} }; }
    const tracker = createCampaignPixel({ win:window, doc:document, storage, campaign, preview });
    window.SimplyShinePixel = tracker;
    const panel = document.createElement('section');
    panel.className = 'cookie-choice'; panel.setAttribute('aria-label','Val för marknadsföringscookies');
    panel.innerHTML = '<div><strong>Får vi mäta hur våra annonser fungerar?</strong><p>Om du godkänner använder vi Meta-pixeln och delar sidbesök och formulärhändelser med Meta för annonsmätning och anpassad annonsering. Du kan boka lika enkelt utan att godkänna.</p><details><summary>Mer om ditt val</summary><p>Meta kan koppla besöket till din enhet eller ditt konto. Vi skickar inte formulärets namn, telefonnummer eller mejladress till pixeln. Ditt val sparas i högst sex månader. Ändra när som helst via Cookieinställningar längst ned. <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">Metas integritetspolicy</a>.</p></details></div><div class="cookie-actions"><button type="button" data-cookie="no">Avvisa</button><button type="button" data-cookie="yes">Godkänn</button></div>';
    document.body.append(panel);
    const footer = document.querySelector('footer') || document.body;
    const settings = document.createElement('button'); settings.type='button'; settings.className='cookie-settings'; settings.textContent='Cookieinställningar'; footer.append(settings);
    let returnFocus;
    settings.addEventListener('click',()=>{returnFocus=settings;panel.hidden=false;panel.querySelector('button').focus();});
    panel.querySelectorAll('[data-cookie]').forEach(button=>button.addEventListener('click',()=>{tracker.setConsent(button.dataset.cookie);panel.hidden=true;returnFocus?.focus();}));
    if (preview) {
      const note=document.createElement('p');note.className='pixel-preview-note';note.textContent=`Meta-pixel ${tracker.pixelId} · Testläge: inget skickas till Meta.`;footer.append(note);
      document.addEventListener('campaign:pixel-preview',event=>{note.textContent=`Meta-pixel ${tracker.pixelId} · Simulerat: ${event.detail.event} (${campaign}). Inget skickat.`;});
    }
    document.addEventListener('campaign:lead-sent', event => { if(event.detail?.campaign===`${campaign}-valkomstpaket`)tracker.track('Lead',event.detail.eventId); });
    document.addEventListener('campaign:booking-sent', event => { if(event.detail?.campaign===`${campaign}-valkomstpaket`)tracker.track('Schedule',event.detail.eventId); });
    const saved = tracker.readConsent(); panel.hidden = saved !== null;
    if(saved)tracker.setConsent(saved,false);
    window.addEventListener('storage',event=>{if(event.key==='simplyshine-marketing-consent-v1'){const choice=tracker.readConsent();tracker.setConsent(choice||'no',false);panel.hidden=choice!==null;}});
  }
}
