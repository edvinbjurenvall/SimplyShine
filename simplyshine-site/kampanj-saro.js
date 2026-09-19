'use strict';

// Same schedule and recipient as /boka. Availability is not an atomic reservation.
const CampaignBooking = (() => {
  const endpoint = 'https://hook.eu1.make.com/jrwx2iw09w0ji981viprgabgrvtu2oyr';
  const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const slotsFor = date => [0, 6].includes(date.getDay()) ? ['10:00'] : ['08:00', '11:00', '13:00', '16:00'];
  const validBlocked = value => Array.isArray(value) && value.every(slot => slot && /^\d{4}-\d{2}-\d{2}$/.test(slot.date) && /^\d{2}:\d{2}$/.test(slot.time));
  const availableSlots = (date, blocked) => slotsFor(date).filter(time => !blocked.some(slot => slot.date === dateKey(date) && slot.time === time));
  function windowFor(date) {
    const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const first = new Date(today); first.setDate(first.getDate() + 1);
    const last = new Date(today); last.setMonth(last.getMonth() + 1);
    return { first, last };
  }
  function buildPayload(values, date, time, params) {
    const payload = {
      namn: values.namn.trim(), telefon: values.telefon.trim(), email: values.email.trim(),
      adress: values.adress.trim(), bil: values.bil.trim(),
      paket: 'Välkomstpaket Särö – 2 495 kr',
      tillagg: 'Lädervård eller textilrengöring av sätena samt glasförsegling av vindrutan – ingår',
      datum: date, tid: time, rabattkod: '', rabatt: '',
      meddelande: `[Särö välkomstpaket: slutpris 2 495 kr per bil. Välkomstrabatten är redan avdragen. Sätesvård och glasförsegling ingår.]\n${values.meddelande || ''}`,
      kampanj: 'saro-valkomstpaket', pris: 2495, valuta: 'SEK'
    };
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const value = params.get(key); if (value) payload[key] = value.slice(0, 200);
    }
    return payload;
  }
  function init() {
    const form = document.getElementById('campaign-booking'); if (!form) return;
    const el = id => document.getElementById(id);
    const preview = !['simplyshine.se', 'www.simplyshine.se'].includes(location.hostname);
    const todayParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const part = key => Number(todayParts.find(p => p.type === key).value);
    const today = new Date(part('year'), part('month') - 1, part('day'));
    const { first, last } = windowFor(today);
    let month = new Date(first.getFullYear(), first.getMonth(), 1);
    let blocked = [], selectedDate = '', selectedTime = '', loading = false, sending = false;
    const monthText = new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' });
    const dayText = new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
    const parse = value => new Date(value + 'T12:00:00');
    const monthIndex = date => date.getFullYear() * 12 + date.getMonth();
    const params = new URLSearchParams(location.search);
    function message(text) { el('form-status').textContent = text; }
    function clearSelection() {
      selectedTime = ''; el('details').hidden = true;
      el('selection').textContent = 'Välj ett datum för att se tider.';
    }
    function renderTimes() {
      el('times').replaceChildren();
      if (!selectedDate) return;
      const date = parse(selectedDate);
      availableSlots(date, blocked).forEach(time => {
        const button = document.createElement('button'); button.type = 'button';
        button.textContent = time; button.setAttribute('aria-pressed', String(time === selectedTime));
        button.addEventListener('click', () => {
          selectedTime = time; el('details').hidden = false;
          el('selection').textContent = `${dayText.format(date)} kl. ${time}`;
          message(''); renderTimes();
        });
        el('times').append(button);
      });
      if (!selectedTime) el('selection').textContent = `Välj en tid ${dayText.format(date)}.`;
    }
    function renderCalendar() {
      el('month-name').textContent = monthText.format(month);
      el('prev-month').disabled = monthIndex(month) <= monthIndex(first);
      el('next-month').disabled = monthIndex(month) >= monthIndex(last);
      el('days').replaceChildren();
      const offset = (month.getDay() + 6) % 7;
      for (let i = 0; i < offset; i++) el('days').append(document.createElement('span'));
      const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      for (let day = 1; day <= count; day++) {
        const date = new Date(month.getFullYear(), month.getMonth(), day);
        const key = dateKey(date), button = document.createElement('button');
        button.type = 'button'; button.textContent = String(day);
        button.disabled = loading || date < first || date > last || availableSlots(date, blocked).length === 0;
        button.setAttribute('aria-label', dayText.format(date));
        button.setAttribute('aria-pressed', String(selectedDate === key));
        button.addEventListener('click', () => {
          selectedDate = key; clearSelection(); message(''); renderCalendar(); renderTimes();
        });
        el('days').append(button);
      }
    }
    async function getBlocked() {
      const response = await fetch('/blocked-slots.json', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('availability');
      const result = await response.json();
      if (!validBlocked(result)) throw new Error('availability');
      return result;
    }
    async function loadCalendar() {
      loading = true; el('calendar').hidden = true; el('retry-calendar').hidden = true;
      el('calendar-status').textContent = 'Hämtar bokningsbara tider…';
      try {
        blocked = await getBlocked(); loading = false; renderCalendar();
        el('calendar').hidden = false; el('calendar-status').textContent = '';
      } catch {
        el('calendar-status').textContent = 'Vi kunde inte hämta tiderna. Försök igen eller ring 073-060 43 03 så hjälper vi dig.';
        el('retry-calendar').hidden = false;
      }
    }
    for (const [id, delta] of [['prev-month', -1], ['next-month', 1]]) {
      el(id).addEventListener('click', () => {
        month = new Date(month.getFullYear(), month.getMonth() + delta, 1); renderCalendar();
      });
    }
    el('retry-calendar').addEventListener('click', loadCalendar);
    form.addEventListener('submit', async event => {
      event.preventDefault(); if (sending) return;
      if (!selectedDate || !selectedTime) { message('Välj datum och tid först.'); return; }
      if (!form.reportValidity()) return;
      const values = Object.fromEntries(new FormData(form));
      if (['namn', 'telefon', 'email', 'adress', 'bil'].some(key => !values[key]?.trim())) {
        message('Fyll i alla obligatoriska uppgifter.'); return;
      }
      // A preview must never send test bookings to the live automation.
      if (preview) {
        message('Förhandsvisning: formuläret är kontrollerat, men ingen bokning har skickats.');
        el('form-status').focus(); return;
      }
      sending = true; const submit = form.querySelector('[type=submit]');
      submit.disabled = true; submit.textContent = 'Kontrollerar tiden…'; message('');
      try {
        blocked = await getBlocked();
        if (!availableSlots(parse(selectedDate), blocked).includes(selectedTime)) {
          clearSelection(); renderCalendar(); renderTimes();
          message('Den valda tiden är inte längre tillgänglig. Välj en annan tid.'); return;
        }
        submit.textContent = 'Skickar bokning…';
        const response = await fetch(endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload(values, selectedDate, selectedTime, params)),
          signal: AbortSignal.timeout(20000)
        });
        if (!response.ok) throw new Error('rejected');
        form.hidden = true; el('success').hidden = false;
        el('success-time').textContent = `Din valda tid: ${dayText.format(parse(selectedDate))} kl. ${selectedTime}.`;
        el('success').focus();
        // Local event only. No advertising pixel or cookies are loaded here.
        document.dispatchEvent(new CustomEvent('campaign:booking-sent', { detail: { campaign: 'saro-valkomstpaket', value: 2495, currency: 'SEK' } }));
      } catch (error) {
        message(error.message === 'availability' ? 'Tiderna kunde inte kontrolleras. Försök igen om en stund eller ring 073-060 43 03.' : 'Vi kunde inte bekräfta att bokningen kom fram. Ring 073-060 43 03 innan du skickar igen, så undviker vi en dubbelbokning.');
        el('form-status').focus();
      } finally {
        sending = false; submit.disabled = false; submit.textContent = 'Boka min tid – 2 495 kr ↗';
      }
    });
    if ('IntersectionObserver' in window) {
      const sticky = document.querySelector('.mobile-book');
      new IntersectionObserver(entries => sticky.classList.toggle('is-hidden', entries[0].isIntersecting), { threshold: 0 }).observe(el('boka'));
    }
    loadCalendar();
  }
  return { dateKey, slotsFor, validBlocked, availableSlots, windowFor, buildPayload, init };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = CampaignBooking;
if (typeof document !== 'undefined') CampaignBooking.init();
