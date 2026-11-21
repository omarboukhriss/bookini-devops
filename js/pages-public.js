/* Bookini — public pages: home, search, provider profile, how it works, login, register + booking modal. */

const Pages = {};

Pages.home = ({ user }) => {
  const all = Providers.all(), favs = user && user.role === 'client' ? Favs.ids(user.id) : [];
  const top = all.slice().sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount).slice(0, 4);
  const nb = DB.get('bookings').length;
  const av = n => U.avatarFor(n);
  return `
  <section class="hero"><div class="container hero-in">
    <div class="hero-copy"><span class="pill">✨ Trusted local professionals</span>
      <h1>Find the right professional for your needs</h1>
      <p>Discover trusted service providers, book appointments, communicate directly, and get the service you need.</p>
      <div class="hero-cta"><a class="btn btn-primary btn-lg" href="#/search">Find a Service →</a><a class="btn btn-outline-light btn-lg" href="#/register?role=provider">Become a Service Provider</a></div>
      <small class="hero-note">Free to join · No credit card required</small></div>
    <div class="hero-mock" aria-hidden="true"><div class="mock"><div class="mock-bar"><i></i><i></i><i></i><span>Bookini · My appointments</span></div>
      <div class="mock-body"><div class="mock-row"><img class="avatar" src="${av('Ahmed Ben Ali')}"><div><b>Ahmed Ben Ali</b><small>Men's Haircut · 15:00</small></div><span class="badge b-confirmed">Confirmed</span></div>
      <div class="mock-row"><img class="avatar" src="${av('Sara Trabelsi')}"><div><b>Sara Trabelsi</b><small>Colouring · Thu 11:00</small></div><span class="badge b-pending">Pending</span></div>
      <div class="mock-row"><img class="avatar" src="${av('Lina Haddad')}"><div><b>Lina Haddad</b><small>Training · Completed</small></div><span class="stars" style="--p:100%">★★★★★</span></div>
      <div class="mock-slots"><span>09:00</span><span>09:30</span><span class="on">10:00</span><span>10:30</span><span>14:00</span><span>14:30</span></div></div></div>
      <div class="mock-phone"><b>🔔 Appointment confirmed</b><small>Ahmed accepted your request</small></div></div></div></section>
  <section class="strip"><div class="container strip-in"><div><b>${all.length}+</b><span>Verified providers</span></div><div><b>${nb}+</b><span>Appointments booked</span></div><div><b>${DB.get('reviews').length}+</b><span>Real reviews</span></div><div><b>13</b><span>Service categories</span></div></div></section>
  <section class="container sec"><div class="sec-h"><h2>Popular categories</h2><p class="muted">Pick a category to browse providers.</p></div>
    <div class="cat-grid">${CATS.map(c => `<a class="cat" href="#/search?category=${c.id}"><span>${c.icon}</span>${c.name}</a>`).join('')}</div></section>
  <section class="container sec"><div class="sec-h row between wrap"><div><h2>Top-rated providers</h2><p class="muted">Loved by clients across Tunisia.</p></div><a class="btn btn-ghost" href="#/search">See all →</a></div>
    <div class="grid cards">${top.map(p => UI.providerCard(p, user, favs)).join('')}</div></section>
  <section class="sec alt"><div class="container"><div class="sec-h center"><h2>How Bookini works</h2></div>
    <div class="steps">${[['🔎', 'Search', 'Browse providers by category, city, rating and price.'], ['📅', 'Book', 'Pick a service, a date and a free time slot in seconds.'], ['💬', 'Chat', 'Message the provider and get a confirmation.'], ['⭐', 'Review', 'Rate your experience and help others choose.']].map((s, i) => `<div class="step card"><div class="step-n">${i + 1}</div><div class="step-i">${s[0]}</div><h3>${s[1]}</h3><p class="muted">${s[2]}</p></div>`).join('')}</div></div></section>
  <section class="container sec"><div class="cta"><div><h2>Are you a professional?</h2><p>Create your profile, list your services, set your hours and start receiving bookings.</p></div><a class="btn btn-primary btn-lg" href="#/register?role=provider">Join as a provider</a></div></section>`;
};

Pages.how = () => `<div class="container page"><div class="page-head center"><h1>How it works</h1><p class="muted">One simple flow for clients, one for providers.</p></div>
  <div class="grid two">
    <div class="card pad"><h2>👤 For clients</h2><ol class="flow">${['Register', 'Search providers', 'View provider profile', 'Contact provider', 'Select service, date & time', 'Send booking request', 'Wait for confirmation', 'Attend appointment', 'Rate the provider'].map(s => `<li>${s}</li>`).join('')}</ol><a class="btn btn-primary" href="#/register?role=client">Create client account</a></div>
    <div class="card pad"><h2>🛠️ For providers</h2><ol class="flow">${['Register', 'Create your profile', 'Add your services', 'Set your availability', 'Receive booking requests', 'Accept or decline', 'Chat with the client', 'Complete the appointment', 'Receive a review'].map(s => `<li>${s}</li>`).join('')}</ol><a class="btn btn-primary" href="#/register?role=provider">Create provider account</a></div></div></div>`;

Pages.search = ({ query, user }) => {
  const all = Providers.all(), cities = [...new Set(all.map(p => p.city))].sort(), favs = user && user.role === 'client' ? Favs.ids(user.id) : [];
  const html = `<div class="container page"><div class="page-head"><h1>Find Services</h1><p class="muted">Search trusted professionals and book in minutes.</p></div>
    <form id="sf" class="card filters" autocomplete="off">
      <input class="f-q" type="search" name="q" placeholder="Search by name, service, category or location" value="${esc(query.q || '')}" aria-label="Search">
      <select name="category" aria-label="Category"><option value="">All categories</option>${CATS.map(c => `<option value="${c.id}" ${query.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
      <select name="city" aria-label="Location"><option value="">All locations</option>${cities.map(c => `<option>${esc(c)}</option>`).join('')}</select>
      <select name="rating" aria-label="Rating"><option value="0">Any rating</option><option value="4">4★ &amp; up</option><option value="4.5">4.5★ &amp; up</option></select>
      <select name="price" aria-label="Price"><option value="0">Any price</option><option value="20">Up to 20 DT</option><option value="50">Up to 50 DT</option><option value="100">Up to 100 DT</option><option value="200">Up to 200 DT</option></select>
      <select name="avail" aria-label="Availability"><option value="">Any availability</option><option value="today">Open today</option><option value="weekend">Open on weekends</option></select>
      <select name="sort" aria-label="Sort"><option value="rating">Top rated</option><option value="reviews">Most reviewed</option><option value="price">Lowest price</option></select>
      <button type="reset" class="btn btn-ghost">Reset</button></form>
    <div class="muted count" id="count"></div><div id="results" class="grid cards">${UI.skeleton(6)}</div></div>`;
  return { html, init() {
    const f = document.getElementById('sf'), res = document.getElementById('results');
    function run() {
      const d = Object.fromEntries(new FormData(f)), q = (d.q || '').toLowerCase().trim();
      let l = all.filter(p => {
        if (q && ![p.name, p.title, catName(p.category), p.city, ...p.services.map(s => s.name)].join(' ').toLowerCase().includes(q)) return false;
        if (d.category && p.category !== d.category) return false;
        if (d.city && p.city !== d.city) return false;
        if (+d.rating && p.rating < +d.rating) return false;
        if (+d.price && (p.minPrice === null || p.minPrice > +d.price)) return false;
        if (d.avail === 'today' && !p.availability[new Date().getDay()].open) return false;
        if (d.avail === 'weekend' && !(p.availability[6].open || p.availability[0].open)) return false;
        return true;
      });
      l.sort(d.sort === 'price' ? (a, b) => (a.minPrice ?? 1e9) - (b.minPrice ?? 1e9) : d.sort === 'reviews' ? (a, b) => b.reviewCount - a.reviewCount : (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      document.getElementById('count').textContent = `${l.length} provider${l.length === 1 ? '' : 's'} found`;
      res.innerHTML = l.length ? l.map(p => UI.providerCard(p, user, favs)).join('') : `<div class="span-all">${UI.empty('🔍', 'No providers match your search. Try changing your filters.')}</div>`;
    }
    f.addEventListener('input', run); f.addEventListener('change', run); f.addEventListener('reset', () => setTimeout(run));
    f.addEventListener('submit', e => e.preventDefault());
    setTimeout(run, 250);
  } };
};

Pages.providerProfile = ({ params, user }) => {
  const p = Providers.full(params.id);
  if (!p) return `<div class="container page">${UI.empty('🤷', 'This provider could not be found.', '<a class="btn btn-primary" href="#/search">Browse providers</a>')}</div>`;
  const isClient = !user || user.role === 'client', own = user && user.id === p.id;
  const fav = user && user.role === 'client' && Favs.has(user.id, p.id);
  const reviews = Reviews.forProvider(p.id);
  const dist = [5, 4, 3, 2, 1].map(n => ({ n, c: reviews.filter(r => r.rating === n).length }));
  return `<div class="container page prof">
    <section class="card prof-head"><img class="avatar xl" src="${p.avatar}" alt="${esc(p.name)}">
      <div class="prof-id"><h1>${esc(p.name)}</h1><div class="prof-t">${esc(p.title)}</div>
        <div class="chips"><span class="chip">${catIcon(p.category)} ${esc(catName(p.category))}</span><span class="chip">📍 ${esc(p.city)}, Tunisia</span><span class="chip">🏅 ${p.experience} year${p.experience === 1 ? '' : 's'} experience</span></div>
        <div class="rate">${UI.stars(p.rating, true)} <b>${p.reviewCount ? p.rating.toFixed(1) : 'New'}</b> <span class="muted">(${p.reviewCount} review${p.reviewCount === 1 ? '' : 's'})</span></div>
        <div class="muted small">📞 ${esc(p.phone)} · ✉️ ${esc(p.email)}</div></div>
      <div class="prof-cta">${isClient ? `<button class="btn btn-primary btn-lg" data-act="book" data-id="${p.id}">Book Appointment</button><a class="btn btn-ghost" href="#/messages/${p.id}" data-act="contact" data-id="${p.id}">💬 Contact Provider</a><button class="btn btn-ghost heart-btn ${fav ? 'on' : ''}" data-act="fav" data-id="${p.id}" data-label="1">${fav ? '♥ Remove from Favorites' : '♡ Add to Favorites'}</button>` : own ? '<a class="btn btn-primary" href="#/profile">Edit my profile</a>' : ''}</div></section>
    <div class="prof-cols"><div>
      <section class="card pad"><h2>About</h2><p class="pre">${esc(p.about || 'This provider has not written a description yet.')}</p></section>
      <section class="card pad"><h2>Services</h2>${p.services.length ? `<div class="svc-list">${p.services.map(s => `<div class="svc"><div><b>${esc(s.name)}</b><div class="muted small">${esc(s.description)}</div><div class="muted small">⏱ ${s.duration} minutes</div></div><div class="svc-r"><b>${s.price} DT</b>${isClient ? `<button class="btn btn-primary btn-sm" data-act="book" data-id="${p.id}" data-svc="${s.id}">Book</button>` : ''}</div></div>`).join('')}</div>` : UI.empty('🧰', 'This provider has not added any services yet.')}</section>
      <section class="card pad"><h2>Gallery</h2>${p.gallery.length ? `<div class="gallery">${p.gallery.map((g, i) => `<button class="g-item" data-act="lightbox" data-pid="${p.id}" data-i="${i}"><img src="${g.src}" alt="${esc(g.caption || 'Work sample')}" loading="lazy"></button>`).join('')}</div>` : UI.empty('🖼️', 'No photos yet.')}</section>
      <section class="card pad"><h2>Reviews</h2>${reviews.length ? `<div class="rev-sum"><div class="rev-big"><b>${p.rating.toFixed(1)}</b><span>/ 5</span>${UI.stars(p.rating, true)}<small class="muted">Based on ${p.reviewCount} review${p.reviewCount === 1 ? '' : 's'}</small></div>
        <div class="bars">${dist.map(d => `<div><span>${d.n}★</span><div class="bar"><i style="width:${p.reviewCount ? d.c / p.reviewCount * 100 : 0}%"></i></div><span>${d.c}</span></div>`).join('')}</div></div>
        <div class="rev-list">${reviews.map(r => { const c = DB.find('users', u => u.id === r.clientId) || { name: 'Client' }; return `<div class="rev"><div class="row gap">${UI.avatar(c, 'sm')}<div><b>${esc(c.name)}</b><div>${UI.stars(r.rating)} <span class="muted small">${U.fmtDate(r.createdAt.slice(0, 10))}</span></div></div></div>${r.comment ? `<p>“${esc(r.comment)}”</p>` : ''}${r.reply ? `<div class="reply"><b>Reply from ${esc(p.name.split(' ')[0])}</b><p>${esc(r.reply)}</p></div>` : ''}</div>`; }).join('')}</div>` : UI.empty('⭐', "This provider doesn't have any reviews yet.")}</section></div>
      <aside><section class="card pad sticky"><h2>Availability</h2><table class="avail">${DAY_ORDER.map(i => { const d = p.availability[i]; return `<tr class="${d.open ? '' : 'closed'}"><td>${DAYS[i]}</td><td>${d.open ? `${d.start} - ${d.end}` : 'Closed'}</td></tr>`; }).join('')}</table>
        ${isClient ? `<button class="btn btn-primary block-btn" data-act="book" data-id="${p.id}">Book Appointment</button>` : ''}</section></aside></div></div>`;
};

/* ---------- Booking modal ---------- */
function openBooking(pid, preSvc) {
  const user = Auth.current();
  if (!user) { UI.toast('Please log in as a client to book.', 'info'); location.hash = '#/login?next=' + encodeURIComponent('/provider/' + pid); return; }
  if (user.role !== 'client') { UI.toast('Only clients can book appointments.', 'error'); return; }
  const p = Providers.full(pid);
  if (!p || !p.services.length) { UI.toast('This provider has not added any services yet.', 'error'); return; }
  UI.modal(`<h3>Book with ${esc(p.name)}</h3><form id="bk" data-form="booking" autocomplete="off">
    <label class="field">Service<select name="serviceId">${p.services.map(s => `<option value="${s.id}" ${s.id === preSvc ? 'selected' : ''}>${esc(s.name)} — ${s.price} DT · ${s.duration} min</option>`).join('')}</select></label>
    <label class="field">Date<input type="date" name="date" min="${U.today()}" max="${U.addDays(180)}"></label>
    <div class="field">Available times<div id="slots" class="slots"><span class="muted small">Choose a date to see available times.</span></div></div>
    <label class="field">Message to provider (optional)<textarea name="message" rows="2" maxlength="500" placeholder="I would like a haircut and beard trim."></textarea></label>
    <div id="sum" class="summary" hidden></div><div class="form-error" hidden></div>
    <button class="btn btn-primary btn-lg block-btn" type="submit">Send Booking Request</button></form>`, true);
  const f = document.getElementById('bk'); f._time = '';
  const svc = () => p.services.find(s => s.id === f.serviceId.value);
  function sum() {
    const s = svc(), el = document.getElementById('sum');
    if (!f._time || !f.date.value) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `<h4>Booking summary</h4><dl><dt>Provider</dt><dd>${esc(p.name)}</dd><dt>Service</dt><dd>${esc(s.name)}</dd><dt>Date</dt><dd>${U.fmtDate(f.date.value)}</dd><dt>Time</dt><dd>${f._time}</dd><dt>Duration</dt><dd>${s.duration} minutes</dd><dt>Price</dt><dd>${s.price} DT</dd></dl>`;
  }
  function slots() {
    f._time = ''; const box = document.getElementById('slots'), d = f.date.value;
    if (!d) { box.innerHTML = '<span class="muted small">Choose a date to see available times.</span>'; return sum(); }
    const l = Bookings.slots(pid, d, svc().duration);
    box.innerHTML = l.length ? l.map(t => `<button type="button" class="slot" data-t="${t}">${t}</button>`).join('') : `<span class="muted small">${p.availability[U.dow(d)].open ? 'No free times left on this date.' : 'The provider is closed on this day.'} Try another date.</span>`;
    sum();
  }
  f.date.addEventListener('change', slots); f.serviceId.addEventListener('change', slots);
  document.getElementById('slots').addEventListener('click', e => {
    const b = e.target.closest('.slot'); if (!b) return;
    f._time = b.dataset.t; document.querySelectorAll('#slots .slot').forEach(x => x.classList.toggle('on', x === b)); sum();
  });
  // pre-select first date with free times
  for (let i = 0; i < 30; i++) { const d = U.addDays(i); if (Bookings.slots(pid, d, svc().duration).length) { f.date.value = d; break; } }
  slots();
}

/* ---------- Auth pages ---------- */
Pages.login = ({ query }) => `<div class="container auth"><div class="card pad auth-card"><h1>Welcome back</h1><p class="muted">Log in to manage your bookings.</p>
  <form data-form="login" novalidate><label class="field">Email<input type="email" name="email" autocomplete="username" placeholder="you@example.com"></label>
  <label class="field">Password<input type="password" name="password" autocomplete="current-password" placeholder="••••••"></label>
  <div class="form-error" hidden></div><button class="btn btn-primary btn-lg block-btn" type="submit">Log in</button></form>
  <p class="muted center">No account? <a class="lnk" href="#/register">Register</a></p></div>
  <div class="card pad auth-card demo"><h2>Demo accounts</h2><p class="muted small">Try the platform instantly. Password for all demo accounts: <b>123456</b></p>
    <div class="demo-box"><b>Demo Client</b><div class="small">client@demo.com / 123456</div><button class="btn btn-ghost btn-sm" data-act="demo-login" data-role="client">Login as Demo Client</button></div>
    <div class="demo-box"><b>Demo Provider</b><div class="small">provider@demo.com / 123456</div><button class="btn btn-ghost btn-sm" data-act="demo-login" data-role="provider">Login as Demo Provider</button></div>
    <p class="note warn small">⚠️ Demo only. Passwords are stored in plain text in your browser (localStorage) — this is not secure authentication.</p>
    <button class="linkbtn small" data-act="reset-demo">Reset demo data</button></div></div>`;

Pages.register = ({ query }) => {
  const role = query.role === 'provider' ? 'provider' : 'client', pr = role === 'provider';
  return `<div class="container auth"><div class="card pad auth-card wide"><h1>Create your account</h1>
  <div class="tabs"><a class="${!pr ? 'on' : ''}" href="#/register?role=client">👤 I'm a client</a><a class="${pr ? 'on' : ''}" href="#/register?role=provider">🛠️ I'm a provider</a></div>
  <form data-form="register" novalidate><input type="hidden" name="role" value="${role}">
    <div class="avatar-pick"><img class="avatar lg avatar-prev" src="${U.avatarFor('?')}" alt=""><label class="btn btn-ghost btn-sm">Profile picture (optional)<input type="file" accept="image/*" data-avatar hidden></label></div>
    <div class="grid two g12"><label class="field">Full name<input name="name" autocomplete="name"></label><label class="field">Email<input type="email" name="email" autocomplete="email"></label>
    <label class="field">Phone number<input type="tel" name="phone" placeholder="+216 20 123 456" autocomplete="tel"></label>
    ${pr ? `<label class="field">Service category<select name="category"><option value="">Select…</option>${CATS.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></label><label class="field">City / location<input name="city" list="cities" placeholder="Tunis"><datalist id="cities">${['Tunis', 'Ariana', 'Sfax', 'Sousse', 'Monastir', 'Bizerte', 'Nabeul', 'Gabès', 'Kairouan', 'Djerba'].map(c => `<option>${c}</option>`).join('')}</datalist></label>` : ''}
    <label class="field">Password<input type="password" name="password" autocomplete="new-password"></label><label class="field">Confirm password<input type="password" name="confirm" autocomplete="new-password"></label></div>
    <div class="form-error" hidden></div><p class="muted small">⚠️ Demo only: your password is stored unencrypted in this browser.</p>
    <button class="btn btn-primary btn-lg block-btn" type="submit">Create ${pr ? 'provider' : 'client'} account</button></form>
  <p class="muted center">Already registered? <a class="lnk" href="#/login">Log in</a></p></div></div>`;
};

Pages.notFound = () => `<div class="container page">${UI.empty('🧭', 'Page not found.', '<a class="btn btn-primary" href="#/">Back to home</a>')}</div>`;
