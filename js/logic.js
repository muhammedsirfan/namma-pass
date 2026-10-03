// Pure matching and pricing logic (no DOM), so it can be tested in Node.
(function (root) {
  const SPEED = 18;   // km/h in peak traffic
  const ROAD = 1.3;   // straight line to road distance factor
  const WAIT = 3;     // minutes waited at each pickup
  const TRIPS = 44;   // 22 working days x 2 trips
  const SLOTS = [540, 570, 600]; // reach-work-by times in minutes (9:00, 9:30, 10:00)

  function hav(a, b) {
    const R = 6371, t = Math.PI / 180;
    const dl = (b[0] - a[0]) * t, dn = (b[1] - a[1]) * t;
    const x = Math.sin(dl / 2) ** 2 + Math.cos(a[0] * t) * Math.cos(b[0] * t) * Math.sin(dn / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  const road = (a, b) => hav(a, b) * ROAD;

  function rng(seed) {
    let a = seed | 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Simulated riders who have already registered for the pass.
  function makePool(D, count, seed) {
    const r = rng(seed || 11);
    const dests = Object.keys(D.DESTS);
    const weights = [0.28, 0.32, 0.22, 0.18];
    const pool = [];
    for (let i = 0; i < count; i++) {
      let x = r(), k = 0;
      while (k < dests.length - 1 && x > weights[k]) { x -= weights[k]; k++; }
      const dest = dests[k];
      const homes = D.DEST_HOMES[dest];
      const home = homes[Math.floor(r() * homes.length)];
      const c = D.AREAS[home];
      pool.push({
        id: "p" + i,
        name: D.NAMES[Math.floor(r() * D.NAMES.length)],
        area: home,
        pos: [c[0] + (r() - 0.5) * 0.014, c[1] + (r() - 0.5) * 0.014],
        dest: dest,
        slot: SLOTS[Math.floor(r() * SLOTS.length)]
      });
    }
    return pool;
  }

  // Order stops farthest-first, then work out each rider's ride time and pickup time.
  function evaluate(members, dest, arrive) {
    const o = members.slice().sort((a, b) => road(b.pos, dest) - road(a.pos, dest));
    const n = o.length;
    const leg = o.map((m, i) => road(m.pos, i < n - 1 ? o[i + 1].pos : dest));
    const out = new Array(n);
    let rem = 0;
    for (let i = n - 1; i >= 0; i--) {
      rem += leg[i];
      const ride = rem / SPEED * 60 + WAIT * (n - 1 - i);
      const solo = road(o[i].pos, dest) / SPEED * 60;
      out[i] = Object.assign({}, o[i], {
        km: road(o[i].pos, dest),
        ride: ride,
        solo: solo,
        extra: Math.max(0, ride - solo),
        pickup: arrive - ride
      });
    }
    return out;
  }

  function candidates(me, pool, slot, radiusKm) {
    return pool
      .filter(r => r.dest === me.dest && r.slot === slot && hav(r.pos, me.pos) <= (radiusKm || 4))
      .sort((a, b) => hav(a.pos, me.pos) - hav(b.pos, me.pos));
  }

  // Build a group around "me". A group needs at least 3 riders and must keep
  // every rider's extra travel time under capMin.
  function findGroup(me, pool, maxSize, capMin, destPos) {
    const near = candidates(me, pool, me.slot);
    let mem = [me].concat(near.slice(0, maxSize - 1));
    let ev = evaluate(mem, destPos, me.slot);
    while (mem.length >= 3 && Math.max.apply(null, ev.map(x => x.extra)) > capMin) {
      let far = null, fd = -1;
      mem.forEach(m => { if (m.id !== "me") { const d = hav(m.pos, me.pos); if (d > fd) { fd = d; far = m; } } });
      mem = mem.filter(m => m !== far);
      ev = evaluate(mem, destPos, me.slot);
    }
    if (mem.length < 3) return { ok: false, near: near, have: near.length + 1 };
    return { ok: true, members: ev };
  }

  // Zero-commission pricing: the group pays 1.4x the solo fare, split equally,
  // and the driver collects all of it.
  const soloFare = km => Math.round(30 + 8 * km);
  function price(rows) {
    const n = rows.length;
    const out = rows.map(r => {
      const fare = soloFare(r.km);
      return Object.assign({}, r, { fare: fare, seat: Math.round(fare * 1.4 / n) });
    });
    const collected = out.reduce((s, r) => s + r.seat, 0);
    const meanFare = out.reduce((s, r) => s + r.fare, 0) / n;
    return { rows: out, n: n, collected: collected, meanFare: meanFare, meanSeat: collected / n };
  }

  const api = { SPEED, ROAD, WAIT, TRIPS, SLOTS, hav, road, makePool, evaluate, candidates, findGroup, soloFare, price };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NP = api;
})(typeof window !== "undefined" ? window : globalThis);
