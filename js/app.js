/* Bookini — app shell: router, global actions (data-act) and form handlers (data-form). */

const ROUTES = [
  ['/', 'home'], ['/search', 'search'], ['/provider/:id', 'providerProfile'], ['/how', 'how'],
  ['/login', 'login', { guest: true }], ['/register', 'register', { guest: true }],
  ['/dashboard', 'dashboard', { role: 'any' }], ['/appointments', 'appointments', { role: 'any' }],
  ['/requests', 'requests', { role: 'provider' }], ['/services', 'services', { role: 'provider' }],
  ['/availability', 'availability', { role: 'provider' }], ['/reviews', 'reviews', { role: 'provider' }],
  ['/favorites', 'favorites', { role: 'client' }], ['/messages', 'messages', { role: 'any' }],
  ['/messages/:id', 'messages', { role: 'any' }], ['/notifications', 'notifications', { role: 'any' }],
  ['/profile', 'profile', { role: 'any' }], ['/settings', 'settings', { role: 'any' }]
];

const App = {
  go(h) { if (location.hash === h) App.render(true); else location.hash = h; },
  render(keepScroll) {
    const hash = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = hash.split('?'), query = Object.fromEntries(new URLSearchParams(qs || ''));
    let route = null; const params = {};
    for (const [pat, page, opt] of ROUTES) {
      const names = [], re = new RegExp('^' + pat.replace(/:(\w+)/g, (_, n) => { names.push(n); return '([^/]+)'; }) + '/?$'), m = path.match(re);
      if (m) { route = { page, opt: opt || {} }; names.forEach((n, i) => params[n] = decodeURIComponent(m[i + 1])); break; }
    }
    if (!route) route = { page: 'notFound', opt: {} };
    const user = Auth.current();
    if (route.opt.guest && user) return location.replace('#/dashboard');
    if (route.opt.role) {
      if (!user) { UI.toast('Please log in to continue.', 'error'); return location.replace('#/login?next=' + encodeURIComponent(hash)); }
      if (route.opt.role !== 'any' && user.role !== route.opt.role) { UI.toast('Unauthorized access.', 'error'); return location.replace('#/dashboard'); }
    }
    if (user) Notif.checkReminders(user);
    const out = Pages[route.page]({ params, query, user }), html = typeof out === 'string' ? out : out.html;
    document.getElementById('app').innerHTML = html;
    document.getElementById('nav').innerHTML = UI.navbar(user, path);
    document.getElementById('footer').innerHTML = UI.footer();
    document.title = 'Bookini – ' + ({ home: 'Find the right professional', search: 'Find Services', login: 'Login', register: 'Register', how: 'How it works' }[route.page] || 'Dashboard');
    if (!keepScroll) window.scrollTo(0, 0);
    if (out.init) out.init();
  }
};

const need = role => { const u = Auth.current(); if (!u) { UI.toast('Please log in first.', 'error'); location.hash = '#/login'; return null; } if (role && u.role !== role) { UI.toast('Unauthorized access.', 'error'); return null; } return u; };
const fin = (r, ok) => { if (!r.ok) { UI.toast(r.error, 'error'); return false; } UI.toast(ok); UI.close(); App.render(true); return true; };

const Actions = {
  'toggle-nav'() { document.getElementById('navlinks').classList.toggle('open'); },
  bell() { const p = document.getElementById('bellpop'), u = Auth.current(); if (!p || !u) return; p.innerHTML = UI.bellList(u); p.hidden = !p.hidden; },
  'close-modal'() { UI.close(); },
  'confirm-yes'() { const r = UI._res; UI._res = null; UI.close(); r && r(true); },
  'confirm-no'() { UI.close(); },
  logout() { Auth.logout(); UI.toast('You have been logged out.', 'info'); App.go('#/'); },
  'demo-login'(el) { const r = Auth.login(el.dataset.role === 'client' ? 'client@demo.com' : 'provider@demo.com', '123456'); if (!r.ok) return UI.toast('Demo data missing — click "Reset demo data".', 'error'); UI.toast('Logged in as demo ' + el.dataset.role + '.'); App.go('#/dashboard'); },
  async 'reset-demo'() { if (await UI.confirm('Reset demo data?', 'This erases everything stored by Bookini in this browser and restores the demo data.', 'Reset', true)) { seedDemoData(true); UI.toast('Demo data restored.'); App.go('#/login'); } },
  fav(el) {
    const u = Auth.current(); if (!u) { UI.toast('Please log in as a client to save favorites.', 'info'); location.hash = '#/login'; return; }
    if (u.role !== 'client') return UI.toast('Only clients can save favorites.', 'error');
    const id = el.dataset.id, on = Favs.has(u.id, id);
    on ? Favs.remove(u.id, id) : Favs.add(u.id, id);
    UI.toast(on ? 'Provider removed from favorites.' : 'Provider added to favorites.', on ? 'info' : 'success');
    if (location.hash.startsWith('#/favorites')) return App.render(true);
    document.querySelectorAll(`[data-act=fav][data-id="${id}"]`).forEach(b => { b.classList.toggle('on', !on); b.textContent = el.dataset.label ? (!on ? '♥ Remove from Favorites' : '♡ Add to Favorites') : (!on ? '♥' : '♡'); });
  },
  book(el) { openBooking(el.dataset.id, el.dataset.svc); },
  contact(el) { const u = Auth.current(); if (!u) { UI.toast('Please log in to contact a provider.', 'info'); location.hash = '#/login?next=' + encodeURIComponent('/messages/' + el.dataset.id); return; } location.hash = '#/messages/' + el.dataset.id; },
  respond(el) {
    const b = DB.find('bookings', x => x.id === el.dataset.id), c = el.dataset.do === 'confirm';
    UI.modal(`<h3>${c ? 'Confirm' : 'Decline'} appointment</h3><p class="muted">${esc(b.serviceName)} · ${U.fmtShort(b.date)} at ${b.time}</p><form data-form="respond" novalidate><input type="hidden" name="id" value="${b.id}"><input type="hidden" name="do" value="${el.dataset.do}">
      <label class="field">Message to client (optional)<textarea name="msg" rows="3" maxlength="500">${c ? 'Your appointment has been confirmed. Please arrive 10 minutes before your appointment.' : 'Unfortunately, I am not available at this time. Please choose another appointment.'}</textarea></label>
      <div class="form-error" hidden></div><div class="row end gap"><button type="button" class="btn btn-ghost" data-act="close-modal">Back</button><button class="btn ${c ? 'btn-primary' : 'btn-danger'}" type="submit">${c ? 'Confirm' : 'Decline'}</button></div></form>`);
  },
  async complete(el) { if (await UI.confirm('Mark as completed?', 'The client will be notified and invited to leave a review.', 'Mark completed')) { const u = need('provider'); u && fin(Bookings.complete(el.dataset.id, u.id), 'Appointment marked as completed.'); } },
  async cancel(el) { if (await UI.confirm('Cancel this appointment?', 'The other person will be notified.', 'Yes, cancel', true)) { const u = need(); u && fin(Bookings.cancel(el.dataset.id, u.id), 'Appointment cancelled.'); } },
  review(el) {
    const b = DB.find('bookings', x => x.id === el.dataset.id), p = DB.find('users', u => u.id === b.providerId);
    UI.modal(`<h3>How was your experience?</h3><p class="muted">${esc(p.name)} · ${esc(b.serviceName)}</p><form data-form="review" novalidate><input type="hidden" name="id" value="${b.id}">${UI.starInput()}
      <label class="field">Write your review (optional)<textarea name="comment" rows="3" maxlength="500" placeholder="Excellent service. Very professional and friendly."></textarea></label>
      <div class="form-error" hidden></div><button class="btn btn-primary block-btn" type="submit">Submit Review</button></form>`);
  },
  star(el) { const w = el.closest('[data-star]'), v = +el.dataset.v; w.querySelector('input').value = v; w.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.v <= v)); },
  reply(el) {
    const r = DB.find('reviews', x => x.id === el.dataset.id);
    UI.modal(`<h3>Reply to review</h3><div class="note">${UI.stars(r.rating)} ${esc(r.comment || 'No comment')}</div><form data-form="reply" novalidate><input type="hidden" name="id" value="${r.id}"><label class="field">Your reply<textarea name="text" rows="3" maxlength="500" placeholder="Thank you very much for your feedback!">${esc(r.reply)}</textarea></label><div class="form-error" hidden></div><button class="btn btn-primary block-btn" type="submit">Post reply</button></form>`);
  },
  'notif-open'(el) { Notif.markRead(el.dataset.id); const h = el.getAttribute('href'); document.getElementById('bellpop').hidden = true; if (h) App.go(h); },
  'notif-all'() { const u = need(); if (u) { Notif.markAll(u.id); UI.toast('All notifications marked as read.', 'info'); App.render(true); } },
  lightbox(el) { const p = DB.find('providers', x => x.id === el.dataset.pid), g = p.gallery[+el.dataset.i]; UI.modal(`<img class="lb" src="${g.src}" alt="${esc(g.caption)}"><p class="center muted">${esc(g.caption)}</p>`, true); },
  'svc-add'() { openServiceForm(); },
  'svc-edit'(el) { openServiceForm(el.dataset.id); },
  async 'svc-del'(el) { if (await UI.confirm('Delete this service?', 'Existing bookings keep their details.', 'Delete', true)) { const u = need('provider'); u && fin(Providers.removeService(u.id, el.dataset.id), 'Service deleted.'); } },
  async 'gal-del'(el) { if (await UI.confirm('Delete this photo?', 'This cannot be undone.', 'Delete', true)) { const u = need('provider'); u && fin(Providers.removeImage(u.id, el.dataset.id), 'Photo deleted.'); } }
};

const Forms = {
  login(f) { UI.err(f, ''); const d = Object.fromEntries(new FormData(f)); UI.busy(f, () => { const r = Auth.login(d.email, d.password); if (!r.ok) return UI.err(f, r.error); UI.toast('Welcome back, ' + r.user.name.split(' ')[0] + '!'); const next = new URLSearchParams((location.hash.split('?')[1]) || '').get('next'); App.go(next ? '#' + next : '#/dashboard'); }); },
  register(f) { UI.err(f, ''); const d = Object.fromEntries(new FormData(f)); d.avatar = f._avatar || ''; UI.busy(f, () => { const r = Auth.register(d); if (!r.ok) return UI.err(f, r.error); if (d.role === 'provider') { UI.toast('Account created! Complete your profile and add your services.'); App.go('#/profile'); } else { UI.toast('Account created. Welcome to Bookini!'); App.go('#/dashboard'); } }); },
  booking(f) {
    const u = need('client'); if (!u) return; UI.err(f, '');
    const pid = location.hash.match(/provider\/([^/?]+)/); // provider id is stored on the modal title context
    const d = Object.fromEntries(new FormData(f)), svc = DB.find('services', s => s.id === d.serviceId);
    UI.busy(f, () => { const r = Bookings.create({ clientId: u.id, providerId: svc ? svc.providerId : '', serviceId: d.serviceId, date: d.date, time: f._time, message: d.message }); if (!r.ok) return UI.err(f, r.error); UI.close(); UI.toast('Booking request sent successfully.'); App.go('#/appointments'); });
  },
  respond(f) { const u = need('provider'); if (!u) return; const d = Object.fromEntries(new FormData(f)); const c = d.do === 'confirm'; UI.busy(f, () => { const r = c ? Bookings.confirm(d.id, u.id, d.msg) : Bookings.decline(d.id, u.id, d.msg); if (!r.ok) return UI.err(f, r.error); UI.close(); UI.toast(c ? 'Appointment confirmed.' : 'Appointment declined.', c ? 'success' : 'info'); App.render(true); }); },
  review(f) { const u = need('client'); if (!u) return; const d = Object.fromEntries(new FormData(f)); UI.busy(f, () => { const r = Reviews.create({ bookingId: d.id, clientId: u.id, rating: d.rating, comment: d.comment }); if (!r.ok) return UI.err(f, r.error); UI.close(); UI.toast('Review submitted.'); App.render(true); }); },
  reply(f) { const u = need('provider'); if (!u) return; const d = Object.fromEntries(new FormData(f)); const r = Reviews.reply(d.id, u.id, d.text); if (!r.ok) return UI.err(f, r.error); UI.close(); UI.toast('Reply posted.'); App.render(true); },
  'send-msg'(f) { const u = need(); if (!u) return; const d = Object.fromEntries(new FormData(f)); const r = Msgs.send(u.id, d.to, d.text); if (!r.ok) return UI.toast(r.error, 'error'); UI.toast('Message sent.'); App.render(true); const t = document.querySelector('.th-form textarea'); t && t.focus(); },
  profile(f) { const u = need(); if (!u) return; const d = Object.fromEntries(new FormData(f)); if (f._avatar) d.avatar = f._avatar; UI.err(f, ''); const r = Providers.updateProfile(u.id, d); if (!r.ok) return UI.err(f, r.error); UI.toast('Profile updated.'); App.render(true); },
  service(f) { const u = need('provider'); if (!u) return; const d = Object.fromEntries(new FormData(f)); const r = d.id ? Providers.updateService(u.id, d.id, d) : Providers.addService(u.id, d); if (!r.ok) return UI.err(f, r.error); UI.close(); UI.toast(d.id ? 'Service updated.' : 'Service added.'); App.render(true); },
  availability(f) { const u = need('provider'); if (!u) return; const d = Object.fromEntries(new FormData(f)); const days = []; for (let i = 0; i < 7; i++) days[i] = { open: d['open' + i] === 'on', start: d['start' + i], end: d['end' + i] }; const r = Providers.saveAvailability(u.id, days); if (!r.ok) return UI.err(f, r.error); UI.err(f, ''); UI.toast('Availability saved.'); App.render(true); },
  password(f) { const u = need(); if (!u) return; const d = Object.fromEntries(new FormData(f)); const r = Auth.changePassword(u.id, d.old, d.pw, d.confirm); if (!r.ok) return UI.err(f, r.error); UI.toast('Password updated.'); f.reset(); UI.err(f, ''); }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!e.target.closest('.bell-wrap')) { const p = document.getElementById('bellpop'); if (p) p.hidden = true; }
  if (e.target.matches('[data-overlay]')) UI.close();
  if (!el || !Actions[el.dataset.act]) return;
  e.preventDefault();
  if (!['toggle-nav', 'bell'].includes(el.dataset.act)) document.getElementById('navlinks') && document.getElementById('navlinks').classList.remove('open');
  Actions[el.dataset.act](el, e);
});
document.addEventListener('submit', e => { const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault(); if (Forms[f.dataset.form]) Forms[f.dataset.form](f); });
document.addEventListener('change', async e => {
  const t = e.target; if (t.type !== 'file' || !t.files[0]) return;
  try {
    if (t.hasAttribute('data-avatar')) { const f = t.closest('form'); f._avatar = await UI.readImage(t.files[0], 240); f.querySelector('.avatar-prev').src = f._avatar; }
    else if (t.hasAttribute('data-gallery')) { const u = Auth.current(), src = await UI.readImage(t.files[0], 800); if (u) { const r = Providers.addImage(u.id, src, t.files[0].name.replace(/\.[^.]+$/, '')); fin(r, 'Photo added.'); } }
  } catch (err) { UI.toast(err.message, 'error'); }
  t.value = '';
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') UI.close(); });
window.addEventListener('hashchange', () => App.render(false));
window.addEventListener('storage', () => { if (!document.querySelector('.overlay') && !/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName)) App.render(true); });

seedDemoData();
App.render(false);
