'use strict';
const CampaignDeadline = (() => {
  // Midnight after 30 September in Europe/Stockholm (CEST). Never reset per visitor.
  const endsAt = Date.parse('2026-10-01T00:00:00+02:00');
  const isOpen = (now = Date.now()) => now < endsAt;
  function remaining(now = Date.now()) {
    const secondsLeft = Math.max(0, Math.ceil((endsAt - now) / 1000));
    const minutes = Math.floor(secondsLeft / 60);
    const days = Math.floor(minutes / 1440), hours = Math.floor(minutes % 1440 / 60), mins = minutes % 60;
    return { days, hours, totalHours: Math.floor(secondsLeft / 3600), minutes: mins, seconds: secondsLeft % 60, expired: !isOpen(now) };
  }
  function init() {
    function render() {
      const now = Date.now();
      const left = remaining(now);
      const stockholmDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
      const lastDay = stockholmDate === '2026-09-30';
      const penultimateDay = stockholmDate === '2026-09-29';
      for (const el of document.querySelectorAll('[data-time-part]')) el.textContent = String(left[el.dataset.timePart]).padStart(2, '0');
      for (const el of document.querySelectorAll('[data-urgency-label]')) el.textContent = lastDay ? 'Sista dagen – stänger ikväll' : 'Sista chansen';
      for (const el of document.querySelectorAll('[data-urgency-short]')) el.textContent = lastDay ? 'Slutar ikväll · 23.59' : penultimateDay ? 'Slutar imorgon · 23.59' : 'Slutar 30 sep · 23.59';
      const text = left.expired ? 'Erbjudandet har avslutats.' : `${left.totalHours} tim · ${String(left.minutes).padStart(2, '0')} min · ${String(left.seconds).padStart(2, '0')} sek kvar`;
      for(const el of document.querySelectorAll('[data-countdown]'))el.textContent=text;
      for(const el of document.querySelectorAll('[data-deadline-heading]'))el.textContent=left.expired?'Kampanjen är avslutad':(endsAt-now<=3*86400000?'Sista chansen – boka senast 30 september':'Boka senast 30 september');
      if(left.expired) {
        for(const form of document.querySelectorAll('.lead-form, #campaign-lead, #campaign-booking')){
          for(const el of form.querySelectorAll('input, textarea, button'))el.disabled=true;
        }
        for(const button of document.querySelectorAll('[data-offer], button[type="submit"]')){button.disabled=true;button.textContent='Erbjudandet har avslutats';}
        for(const el of document.querySelectorAll('[data-expired]'))el.hidden=false;
        for(const el of document.querySelectorAll('[data-deadline-active]'))el.hidden=true;
      }
    }
    document.addEventListener('submit',event=>{
      if(!isOpen() && event.target.matches('.lead-form, #campaign-lead, #campaign-booking')) {event.preventDefault();event.stopImmediatePropagation();render();}
    },true);
    render();setInterval(render,1000);
    window.addEventListener('pageshow',render);
    document.addEventListener('visibilitychange',render);
  }
  return { endsAt, isOpen, remaining, init };
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CampaignDeadline;
if(typeof window!=='undefined'){window.CampaignDeadline=CampaignDeadline;CampaignDeadline.init();}
