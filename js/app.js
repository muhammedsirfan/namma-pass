(function () {
  'use strict';
  const D = window.NP_DATA, N = window.NP;
  const $ = id => document.getElementById(id);
  const CAP = 15;
  const ARRIVE = [[540, '9:00 AM'], [570, '9:30 AM'], [600, '10:00 AM']];
  const LEAVE = [[1050, '5:30 PM'], [1080, '6:00 PM'], [1110, '6:30 PM']];
  const PLANS = [['monthly', 'Monthly'], ['q3', '3 months, price locked'], ['h6', '6 months, price locked']];
  const EMP = [[0, 'Nothing (I pay)'], [50, '50% of my pass'], [100, 'All of my pass']];
  const POOL = N.makePool(D, 220, 11);
  const S = { form: null, res: null, priced: null, last: null, confirmed: false, joined: false, absent: {}, tab: 'rider' };
  let map = null, layer = null;

  const inr = v => '₹' + Math.round(v).toLocaleString('en-IN');
  function fmt(m) {
    m = Math.round(m);
    let h = Math.floor(m / 60); const mm = m % 60, ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + String(mm).padStart(2, '0') + ' ' + ap;
  }
  const label = (list, v) => (list.find(x => String(x[0]) === String(v)) || [0, ''])[1];
  function fill(sel, items, val) {
    sel.innerHTML = items.map(x => `<option value="${x[0]}"${String(x[0]) === String(val) ? ' selected' : ''}>${x[1]}</option>`).join('');
  }

  /* ---------- map ---------- */
  function initMap() {
    if (typeof L === 'undefined') {
      $('map').innerHTML = '<p style="padding:16px" class="sub">The map could not load. Check your internet connection and refresh. Everything else still works.</p>';
      return;
    }
    map = L.map('map', { scrollWheelZoom: false }).setView([12.98, 77.64], 11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    layer = L.layerGroup().addTo(map);
  }
  function pin(cls, text) {
    return L.divIcon({ className: '', html: `<div class="pin ${cls}">${text}</div>`, iconSize: [26, 26], iconAnchor: [13, 13] });
  }
  function draw(rows, destName, grey, note) {
    if (!map) return;
    layer.clearLayers();
    const dest = D.DESTS[destName], pts = [dest];
    if (rows.length) {
      L.polyline(rows.map(r => r.pos).concat([dest]), { color: '#14202B', weight: 3, dashArray: '6 6', opacity: 0.8 }).addTo(layer);
    }
    rows.forEach((r, i) => {
      const m = L.marker(r.pos, { icon: pin(r.id === 'me' ? 'me' : '', i + 1) }).addTo(layer);
      m.bindTooltip((i + 1) + '. ' + (r.id === 'me' ? 'You' : r.name) + ', ' + r.area);
      pts.push(r.pos);
    });
    (grey || []).forEach(r => {
      L.marker(r.pos, { icon: pin('grey', '') }).addTo(layer).bindTooltip(r.name + ', ' + r.area + ' (registered)');
      pts.push(r.pos);
    });
    L.marker(dest, { icon: pin('end', '★') }).addTo(layer).bindTooltip(destName);
    map.fitBounds(L.latLngBounds(pts).pad(0.25));
    if (note) $('mapnote').textContent = note;
  }
  const NOTE = 'Numbered stops are pickups in order. The dashed line joins the stops and is not the road route. Locations are approximate.';

  /* ---------- rider ---------- */
  function readForm() {
    return {
      home: $('home').value, dest: $('dest').value,
      arrive: +$('arrive').value, leave: +$('leave').value,
      vehicle: document.querySelector('input[name=veh]:checked').value,
      plan: $('plan').value, emp: +$('emp').value
    };
  }
  function find() {
    const f = readForm();
    S.form = f; S.confirmed = false; S.joined = false; S.absent = {};
    const me = { id: 'me', name: 'You', area: f.home, pos: D.AREAS[f.home], dest: f.dest, slot: f.arrive };
    const res = N.findGroup(me, POOL, f.vehicle === 'auto' ? 3 : 4, CAP, D.DESTS[f.dest]);
    S.res = res;
    if (res.ok) { S.priced = N.price(res.members); S.last = { f: f, priced: S.priced }; }
    renderRider(); drawRider();
  }
  function drawRider() {
    if (!S.res) return;
    if (S.res.ok) draw(S.priced.rows, S.form.dest, [], NOTE);
    else draw([{ id: 'me', name: 'You', area: S.form.home, pos: D.AREAS[S.form.home] }], S.form.dest, S.res.near, 'Grey dots are riders already registered on your corridor. You need 3 riders to start a group.');
  }
  function renderRider() {
    const out = $('riderOut'), f = S.form, res = S.res;
    if (!res.ok) {
      const have = res.have;
      const hints = ARRIVE.filter(a => a[0] !== f.arrive).map(a => {
        const me = { dest: f.dest, pos: D.AREAS[f.home] };
        return { t: a[1], c: N.candidates(me, POOL, a[0]).length + 1 };
      }).filter(h => h.c >= 3);
      out.innerHTML = `
        <div class="card">
          <div class="banner warn"><b>Not enough riders on your route yet</b></div>
          <p>${have >= 3 ? 'Riders near you are too spread out to keep everyone under ' + CAP + ' extra minutes.' : (have === 1 ? 'You are the first rider' : have + ' riders (including you)') + ' registered for ' + f.home + ' to ' + f.dest + ' reaching work by ' + fmt(f.arrive) + '. A group needs at least 3.'}</p>
          <div class="dots" aria-label="${have} of 3 riders">${[0, 1, 2].map(i => `<div class="dot${i < have ? ' on' : ''}"></div>`).join('')}</div>
          <p class="sub">This is how Namma Pass opens a corridor: the app asks who wants a pass, and a route goes live only when enough neighbours register.</p>
          ${hints.length ? `<h3>Try another time</h3><p class="sub">${hints.map(h => `${h.t} has ${h.c} riders near you`).join('. ')}.</p>` : ''}
          <button class="btn primary" id="join" type="button">${S.joined ? 'You are on the waitlist' : 'Join the waitlist'}</button>
          ${S.joined ? '<p class="sub" style="margin-top:8px">Demo only. In the real app you would get a message when 3 riders are ready.</p>' : ''}
        </div>`;
      const j = $('join'); if (j) j.onclick = () => { S.joined = true; renderRider(); };
      return;
    }
    const p = S.priced, me = p.rows.find(r => r.id === 'me'), cab = f.vehicle === 'cab';
    const full = cab ? 4 : 3;
    const soloM = me.fare * N.TRIPS, passM = me.seat * N.TRIPS, payM = passM * (1 - f.emp / 100);
    const saving = Math.round((1 - me.seat / me.fare) * 100);
    const planNote = f.plan === 'monthly' ? 'Pay month to month.' : `Your seat price is locked for ${f.plan === 'q3' ? '3' : '6'} months, even if fares change.`;
    const stops = p.rows.map((r, i) => `
      <li><span class="num${r.id === 'me' ? ' me' : ''}">${i + 1}</span>
        <div>${r.id === 'me' ? '<b>You</b>' : r.name}<small>${r.area}${r.id === 'me' ? ', +' + Math.round(r.extra) + ' min vs a solo ride' : ''}</small></div>
        <span class="time">${fmt(r.pickup)}</span></li>`).join('');
    out.innerHTML = `
      <div class="card">
        <div class="banner ok"><b>Your group is ready</b><br>${p.n} riders from nearby, one regular driver, Monday to Friday.</div>
        <h2>Your morning pickup</h2>
        <ul class="timeline">${stops}
          <li><span class="num end">★</span><div><b>${f.dest}</b><small>Everyone arrives together</small></div><span class="time">${fmt(f.arrive)}</span></li>
        </ul>
        <p class="sub" style="margin-top:8px">Evening: leave work at ${fmt(f.leave)}. Same group, same driver, stops in reverse. Each pickup waits ${N.WAIT} minutes at most.</p>
        <h3>Your regular driver</h3>
        <div class="person"><div class="avatar" aria-hidden="true">RK</div>
          <div><b>Ramesh K.</b> (demo driver)<br><span class="sub">4.8 stars, 6 years driving, ${cab ? 'mini cab' : 'auto'}. Backup driver: Suresh M.</span></div></div>
      </div>
      <div class="card">
        <h2>What you pay</h2>
        <div class="price"><span class="big">${inr(me.seat)}</span><span>per trip</span><span class="chip good">${saving}% less than a solo ride</span></div>
        <div class="cmp" aria-label="Monthly cost, solo versus pass">
          <div class="bar solo" style="width:100%">Solo ride: ${inr(soloM)} a month</div>
          <div class="bar pass" style="width:${Math.max(28, Math.round(passM / soloM * 100))}%">Pass: ${inr(passM)} a month</div>
        </div>
        <table class="t" style="margin-top:10px">
          <tr><td>Monthly pass (${N.TRIPS} trips)</td><td>${inr(passM)}</td></tr>
          ${f.emp ? `<tr><td>Your employer pays (${f.emp}%)</td><td>${inr(passM * f.emp / 100)}</td></tr>` : ''}
          <tr><td><b>You pay each month</b></td><td>${inr(payM)}</td></tr>
        </table>
        <p class="sub" style="margin-top:8px">${planNote} ${p.n < full ? `Your ${cab ? 'cab' : 'auto'} has room for ${full - p.n} more. When ${full - p.n === 1 ? 'someone joins' : 'they join'}, your seat drops to about ${inr(me.fare * 1.4 / full)}.` : ''}</p>
        <h3>Simple rules</h3>
        <ul class="rules">
          <li>Same pickup order and times every weekday.</li>
          <li>Public holidays and your own leave: no reduction, your seat stays reserved.</li>
          <li>If the driver does not turn up or the app fails, that day is credited to your next payment.</li>
          <li>No refund for a month already started.</li>
        </ul>
        ${S.confirmed ? '' : '<button class="btn primary" id="confirm" type="button" style="margin-top:12px">Confirm my pass</button>'}
      </div>
      ${S.confirmed ? `
      <div class="card">
        <div class="banner ok"><b>You're booked.</b> Your first ride is next Monday at ${fmt(me.pickup)}.</div>
        <p>You'll pay <b>${inr(payM)}</b> a month, by UPI straight to your driver, on a fixed date. The app only keeps the schedule.</p>
        <p class="sub">Demo only. No payment is taken and no booking is made. Open the driver tab to see what Ramesh sees for this group.</p>
      </div>` : ''}`;
    const c = $('confirm'); if (c) c.onclick = () => { S.confirmed = true; renderRider(); };
  }

  /* ---------- driver ---------- */
  function renderDriver() {
    const el = $('v-driver');
    if (!S.last) {
      el.innerHTML = `<div class="card"><h2>No group yet</h2><p class="sub">The driver view shows the group a rider has just joined. Go to "I'm a rider" and press "Find my group" first.</p><button class="btn primary" type="button" id="goRider">Go to the rider view</button></div>`;
      $('goRider').onclick = () => setTab('rider');
      return;
    }
    const f = S.last.f, p = S.last.priced;
    const nm = r => r.id === 'me' ? 'You (as a rider)' : r.name;
    const present = p.rows.filter(r => !S.absent[r.id]);
    const ev = N.evaluate(present, D.DESTS[f.dest], f.arrive);
    const sub = f.vehicle === 'auto' ? 25 : 90;
    const perTrip = p.collected, perDay = perTrip * 2 - sub, soloDay = p.meanFare * 2 - sub, month = perDay * 22;
    const absentRows = p.rows.filter(r => S.absent[r.id]);
    $('v-driver').innerHTML = `
      <div class="card">
        <div class="person"><div class="avatar" aria-hidden="true">RK</div>
          <div><b>Ramesh K.</b> (demo driver)<br><span class="sub">${f.vehicle === 'auto' ? 'Auto' : 'Mini cab'}, regular group Monday to Friday</span></div></div>
      </div>
      <div class="card">
        <h2>This morning's trip</h2>
        <p class="sub">Reach ${f.dest} by ${fmt(f.arrive)}. Same riders every day, so no new bookings to accept.</p>
        <ul class="timeline">
          ${ev.map((r, i) => `<li><span class="num${r.id === 'me' ? ' me' : ''}">${i + 1}</span><div>${nm(r)}<small>${r.area}, wait up to ${N.WAIT} min</small></div><span class="time">${fmt(r.pickup)}</span></li>`).join('')}
          <li><span class="num end">★</span><div><b>${f.dest}</b></div><span class="time">${fmt(f.arrive)}</span></li>
        </ul>
        <h3>Is anyone on leave today?</h3>
        <div>${p.rows.map(r => `<label class="leave"><input type="checkbox" data-id="${r.id}" ${S.absent[r.id] ? 'checked' : ''}> ${nm(r)} is on leave</label>`).join('')}</div>
        ${absentRows.length ? `<div class="banner ok" style="margin-top:8px">The route is shorter today, but you are still paid for ${absentRows.length === 1 ? 'that seat' : 'those seats'}. Leave and holidays do not reduce the fare.</div>` : ''}
      </div>
      <div class="card">
        <h2>What you earn</h2>
        <table class="t">
          <tr><td>Every seat fare, per trip (no commission)</td><td>${inr(perTrip)}</td></tr>
          <tr><td>Two peak trips a day</td><td>${inr(perTrip * 2)}</td></tr>
          <tr><td>Daily app subscription (${f.vehicle === 'auto' ? 'auto' : 'cab'}, assumed)</td><td>- ${inr(sub)}</td></tr>
          <tr><td><b>Net per working day</b></td><td>${inr(perDay)}</td></tr>
          <tr><td>About 22 working days</td><td>${inr(month)}</td></tr>
        </table>
        <p class="sub" style="margin-top:8px">The same two trips with one rider each would pay about ${inr(soloDay)} a day after the subscription. The rest of the day you take normal rides as usual.</p>
      </div>`;
    el.querySelectorAll('input[data-id]').forEach(c => c.onchange = () => {
      S.absent[c.dataset.id] = c.checked; renderDriver(); drawDriver();
    });
  }
  function drawDriver() {
    if (!S.last) return;
    const f = S.last.f, p = S.last.priced;
    const present = p.rows.filter(r => !S.absent[r.id]);
    const ev = N.evaluate(present, D.DESTS[f.dest], f.arrive);
    draw(ev, f.dest, p.rows.filter(r => S.absent[r.id]), 'Grey dots are riders on leave today. They are still paid for.');
  }

  /* ---------- employer ---------- */
  function renderEmployer() {
    const base = S.last ? S.last.priced : null;
    const pass = base ? base.meanSeat * N.TRIPS : 1540, solo = base ? base.meanFare * N.TRIPS : 4400;
    const gsize = base ? base.n : 4;
    $('v-employer').innerHTML = `
      <div class="card">
        <h2>Commute benefit for your team</h2>
        <p class="sub">Many companies already pay a travel allowance. With Namma Pass the company buys seats for employees instead, and drivers get a steady monthly income.</p>
        <label class="field"><span>Employees who commute: <b id="enV">60</b></span><input id="en" type="range" min="10" max="300" step="10" value="60"></label>
        <label class="field"><span>Company pays</span>
          <select id="es"><option value="100">All of the pass</option><option value="50">Half of the pass</option><option value="0">Nothing (employees pay)</option></select></label>
        <div id="eOut"></div>
      </div>
      <p class="sub">Uses the average from the group you matched in the rider view (${inr(pass)} per employee per month on the pass, ${inr(solo)} on solo cabs). Illustrative.</p>`;
    const calc = () => {
      const n = +$('en').value, share = +$('es').value / 100;
      $('enV').textContent = n;
      const company = n * pass * share, soloAll = n * solo, empPays = n * pass * (1 - share);
      $('eOut').innerHTML = `
        <table class="t">
          <tr><td>Company pays per month</td><td>${inr(company)}</td></tr>
          <tr><td>Employees pay per month (each ${inr(pass * (1 - share))})</td><td>${inr(empPays)}</td></tr>
          <tr><td>Same trips on solo cabs, per month</td><td>${inr(soloAll)}</td></tr>
          <tr><td><b>Total saving each month</b></td><td>${inr(soloAll - n * pass)}</td></tr>
          <tr><td>Vehicles on the road at peak</td><td>${Math.ceil(n / gsize)} instead of ${n}</td></tr>
        </table>
        <p class="sub" style="margin-top:8px">Also: employees arrive on time with a fixed pickup, and the company gets a monthly usage report.</p>`;
    };
    $('en').oninput = calc; $('es').onchange = calc; calc();
  }

  /* ---------- about ---------- */
  function renderAbout() {
    $('v-about').innerHTML = `
      <div class="card">
        <h2>The problem</h2>
        <p>Millions of people travel the same way every weekday. Solo cabs are expensive, buses and school vans make many stops, informal carpools are unreliable, and shared autos are often overloaded.</p>
        <h2 style="margin-top:14px">The idea</h2>
        <p>Group 3 or 4 neighbours who reach the same workplace at the same time. Give them one regular driver, fixed pickup times, and a monthly price. The group pays 1.4 times the solo fare, so the driver earns more per trip and the platform takes no commission.</p>
        <h3>Rules this prototype follows</h3>
        <ul class="rules">
          <li>Service runs only at peak times: about 7 to 10 AM and 3 to 6 PM. Drivers take normal rides the rest of the day.</li>
          <li>Each rider's extra travel time is capped at ${CAP} minutes against a solo ride.</li>
          <li>A group needs at least 3 riders. A corridor opens only when enough people register.</li>
          <li>Longer plans lock the price. They are not discounted.</li>
          <li>Payments go straight from rider to driver.</li>
        </ul>
        <h3>What is simulated</h3>
        <p class="sub">The 220 other riders, the driver, and the fare formula (₹30 plus ₹8 per road km) are made up. Pickup times use 18 km/h peak speed and a road distance of 1.3 times the straight line. Real data would replace all of this.</p>
        <h3>More</h3>
        <p><a href="docs/NammaPass_Proposal.pdf">Read the full proposal (PDF)</a><br>
        <a href="simulator.html">Open the analyst simulation</a>, which runs 250 riders at once and shows totals.</p>
      </div>`;
  }

  /* ---------- tabs ---------- */
  function setTab(t) {
    S.tab = t;
    ['rider', 'driver', 'employer', 'about'].forEach(k => {
      $('v-' + k).hidden = k !== t;
      $('t-' + k).setAttribute('aria-selected', k === t ? 'true' : 'false');
    });
    $('stage').classList.toggle('wide', t === 'employer' || t === 'about');
    if (t === 'driver') { renderDriver(); drawDriver(); if (!S.last && map) { layer.clearLayers(); } }
    if (t === 'employer') renderEmployer();
    if (t === 'rider') { drawRider(); $('mapnote').textContent = NOTE; }
    if (map) setTimeout(() => { map.invalidateSize(); if (t === 'rider') drawRider(); if (t === 'driver') drawDriver(); }, 60);
  }

  /* ---------- start ---------- */
  fill($('home'), Object.keys(D.AREAS).map(k => [k, k]), 'HSR Layout');
  fill($('dest'), Object.keys(D.DESTS).map(k => [k, k]), 'Embassy Tech Village (ORR)');
  fill($('arrive'), ARRIVE, 570);
  fill($('leave'), LEAVE, 1080);
  fill($('plan'), PLANS, 'monthly');
  fill($('emp'), EMP, 0);
  $('find').onclick = find;
  document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
  renderAbout();
  initMap();
  find();
})();
