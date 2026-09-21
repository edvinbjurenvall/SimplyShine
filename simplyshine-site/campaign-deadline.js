'use strict';
const CampaignDeadline = (() => {
  // Midnight after 30 September in Europe/Stockholm (CEST). Never reset per visitor.
  const endsAt = Date.parse('2026-10-01T00:00:00+02:00');
  const isOpen = (now = Date.now()) => now < endsAt;
  function remaining(now = Date.now()) {
    const minutes = Math.max(0, Math.floor((endsAt - now) / 60000));
    const days = Math.floor(minutes / 1440), hours = Math.floor(minutes % 1440 / 60), mins = minutes % 60;
    return { days, hours, minutes: mins, expired: !isOpen(now) };
  }
  function init() {
    function render() {
      const left = remaining();
      const text = left.expired ? 'Erbjudandet har avslutats.' : `${left.days} dagar · ${left.hours} tim · ${left.minutes} min kvar`;
      for(const el of document.querySelectorAll('[data-countdown]'))el.textContent=text;
      for(const el of document.querySelectorAll('[data-deadline-heading]'))el.textContent=left.expired?'Kampanjen är avslutad':(endsAt-Date.now()<=3*86400000?'Sista chansen – boka senast 30 september':'Boka senast 30 september');
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
    render();setInterval(render,30000);
    window.addEventListener('pageshow',render);
    document.addEventListener('visibilitychange',render);
  }
  return { endsAt, isOpen, remaining, init };
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CampaignDeadline;
if(typeof window!=='undefined'){window.CampaignDeadline=CampaignDeadline;CampaignDeadline.init();}
