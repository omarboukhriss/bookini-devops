/* Bookini — provider pages: dashboard (+calendar), appointments, requests, services, availability, reviews. */

Pages._providerDash = ({ user }) => {
  const bks = Bookings.forUser(user), today = U.today();
  const pending = bks.filter(b => b.status === 'pending').sort(Bookings.sortAsc);
  const todayL = bks.filter(b => b.status === 'confirmed' && b.date === today).sort(Bookings.sortAsc);
  const upcoming = bks.filter(b => b.status === 'confirmed' && b.date > today).sort(Bookings.sortAsc);
  const clients = new Set(bks.filter(b => ['confirmed', 'completed'].includes(b.status)).map(b => b.clientId)).size;
  const st = calculateRating(user.id), convs = Msgs.conversations(user.id).slice(0, 3), revs = Reviews.forProvider(user.id).slice(0, 3);
  const list = (l, role, empty) => l.length ? `<div class="stack">${l.map(b => UI.apptCard(b, role)).join('')}</div>` : `<p class="muted">${empty}</p>`;
  const html = UI.dash(user, 'dashboard', `Welcome back, ${esc(user.name.split(' ')[0])}!`, `
    <div class="stats"><div class="stat"><span>Today's Appointments</span><b>${todayL.length}</b></div><div class="stat"><span>Pending Requests</span><b>${pending.length}</b></div><div class="stat"><span>Total Clients</span><b>${clients}</b></div><div class="stat"><span>Average Rating</span><b>${st.count ? st.avg.toFixed(1) + ' ★' : '—'}</b></div></div>
    ${UI.section('Booking Requests', list(pending.slice(0, 3), 'provider', "You don't have any pending booking requests."), pending.length > 3 ? '<a class="lnk" href="#/requests">See all</a>' : '')}
    ${UI.section("Today's Appointments", list(todayL, 'provider', 'No appointments today.'))}
    ${UI.section('Upcoming Appointments', list(upcoming.slice(0, 4), 'provider', 'No upcoming appointments.'), '<a class="lnk" href="#/appointments">See all</a>')}
    ${UI.section('Calendar', '<div class="card pad" id="cal"></div>')}
    <div class="grid two">${UI.section('Messages', convs.length ? convs.map(c => { const o = DB.find('users', u => u.id === c.otherId); return `<a class="mini link" href="#/messages/${o.id}">${UI.avatar(o, 'sm')}<div class="grow"><b>${esc(o.name)}</b><div class="muted small clamp1">${esc(c.last.text)}</div></div>${c.unread ? `<i class="dot">${c.unread}</i>` : ''}</a>`; }).join('') : '<p class="muted">No conversations yet.</p>', '<a class="lnk" href="#/messages">Open</a>')}
    ${UI.section('Latest Reviews', revs.length ? revs.map(r => { const c = DB.find('users', u => u.id === r.clientId) || { name: 'Client' }; return `<div class="mini"><div class="grow"><b>${esc(c.name)}</b> ${UI.stars(r.rating)}<div class="muted small clamp1">${esc(r.comment || 'No comment')}</div></div></div>`; }).join('') : '<p class="muted">This provider doesn\'t have any reviews yet.</p>', '<a class="lnk" href="#/reviews">Open</a>')}</div>`,
    `<a class="btn btn-ghost" href="#/provider/${user.id}">View public profile</a>`);
  return { html, init() { Pages._calendar(user.id); } };
};

Pages._calendar = pid => {
  const el = document.getElementById('cal'); if (!el) return;
  let cur = new Date(); cur.setDate(1); let sel = U.today();
  function draw() {
    const y = cur.getFullYear(), m = cur.getMonth(), pre = y + '-' + U.z(m + 1);
    const bks = DB.filter('bookings', b => b.providerId === pid && ['pending', 'confirmed', 'completed'].includes(b.status) && b.date.startsWith(pre));
    const lead = (new Date(y, m, 1).getDay() + 6) % 7, dim = new Date(y, m + 1, 0).getDate();
    let cells = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="cal-h">${d}</div>`).join('') + '<div></div>'.repeat(lead);
    for (let d = 1; d <= dim; d++) {
      const iso = pre + '-' + U.z(d), n = bks.filter(b => b.date === iso);
      cells += `<button class="cal-d ${iso === U.today() ? 'today' : ''} ${iso === sel ? 'sel' : ''}" data-d="${iso}">${d}${n.length ? `<i class="${n.some(b => b.status === 'pending') ? 'p' : ''}">${n.length}</i>` : ''}</button>`;
    }
    const day = DB.filter('bookings', b => b.providerId === pid && b.date === sel && ['pending', 'confirmed', 'completed'].includes(b.status)).sort(Bookings.sortAsc);
    el.innerHTML = `<div class="cal-top"><button class="btn btn-ghost btn-sm" data-n="-1">‹</button><b>${cur.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</b><button class="btn btn-ghost btn-sm" data-n="1">›</button></div><div class="cal-grid">${cells}</div>
      <h4>${U.fmtShort(sel)}</h4>${day.length ? day.map(b => { const c = DB.find('users', u => u.id === b.clientId) || { name: 'Client' }; return `<div class="mini"><b>${b.time}</b><div class="grow">${esc(c.name)} · ${esc(b.serviceName)}</div>${UI.badge(b.status)}</div>`; }).join('') : '<p class="muted small">No appointments on this day.</p>'}`;
  }
  el.onclick = e => {
    const n = e.target.closest('[data-n]'), d = e.target.closest('[data-d]');
    if (n) { cur.setMonth(cur.getMonth() + +n.dataset.n); draw(); } else if (d) { sel = d.dataset.d; draw(); }
  };
  draw();
};

Pages._providerAppts = ({ user }) => {
  const bks = Bookings.forUser(user), today = U.today();
  const sec = (t, l, e) => UI.section(`${t} <span class="count-pill">${l.length}</span>`, l.length ? `<div class="stack">${l.map(b => UI.apptCard(b, 'provider')).join('')}</div>` : `<p class="muted">${e}</p>`);
  const content = bks.length
    ? sec("Today's appointments", bks.filter(b => b.status === 'confirmed' && b.date === today).sort(Bookings.sortAsc), 'No appointments today.')
    + sec('Upcoming appointments', bks.filter(b => b.status === 'confirmed' && b.date !== today).sort(Bookings.sortAsc), 'No upcoming appointments.')
    + sec('Pending requests', bks.filter(b => b.status === 'pending').sort(Bookings.sortAsc), "You don't have any pending booking requests.")
    + sec('Completed appointments', bks.filter(b => b.status === 'completed').sort((a, b) => Bookings.sortAsc(b, a)), 'No completed appointments yet.')
    : `<div class="card pad">${UI.empty('📅', "You don't have any appointments yet.", `<a class="btn btn-primary" href="#/profile">Complete your profile</a>`)}</div>`;
  return UI.dash(user, 'appointments', 'Appointments', content);
};

Pages.requests = ({ user }) => {
  const bks = Bookings.forUser(user), pe = bks.filter(b => b.status === 'pending').sort(Bookings.sortAsc);
  const rec = bks.filter(b => ['confirmed', 'declined', 'cancelled'].includes(b.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  return UI.dash(user, 'requests', 'Booking Requests',
    (pe.length ? `<div class="stack">${pe.map(b => UI.apptCard(b, 'provider')).join('')}</div>` : `<div class="card pad">${UI.empty('📥', "You don't have any pending booking requests.")}</div>`)
    + (rec.length ? UI.section('Recently handled', `<div class="stack">${rec.map(b => UI.apptCard(b, 'provider')).join('')}</div>`) : ''));
};

Pages.services = ({ user }) => {
  const l = DB.filter('services', s => s.providerId === user.id);
  return UI.dash(user, 'services', 'My Services', l.length ? `<div class="stack">${l.map(s => `<div class="card pad svc"><div><b>${esc(s.name)}</b><div class="muted small">${esc(s.description)}</div><div class="muted small">⏱ ${s.duration} minutes</div></div><div class="svc-r"><b>${s.price} DT</b><div class="row gap"><button class="btn btn-ghost btn-sm" data-act="svc-edit" data-id="${s.id}">Edit</button><button class="btn btn-danger-o btn-sm" data-act="svc-del" data-id="${s.id}">Delete</button></div></div></div>`).join('')}</div>` : `<div class="card pad">${UI.empty('🧰', "You haven't added any services yet. Clients can't book you until you add one.")}</div>`,
    '<button class="btn btn-primary" data-act="svc-add">+ Add service</button>');
};

function openServiceForm(id) {
  const s = id ? DB.find('services', x => x.id === id) : null;
  UI.modal(`<h3>${s ? 'Edit' : 'Add'} service</h3><form data-form="service" novalidate><input type="hidden" name="id" value="${s ? s.id : ''}">
    <label class="field">Name<input name="name" value="${esc(s ? s.name : '')}" placeholder="Men's Haircut"></label>
    <label class="field">Description<textarea name="description" rows="2" maxlength="200">${esc(s ? s.description : '')}</textarea></label>
    <div class="grid two g12"><label class="field">Price (DT)<input type="number" name="price" min="0" step="1" value="${s ? s.price : ''}"></label><label class="field">Duration (minutes)<input type="number" name="duration" min="5" max="480" step="5" value="${s ? s.duration : 30}"></label></div>
    <div class="form-error" hidden></div><div class="row end gap"><button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button><button class="btn btn-primary" type="submit">Save service</button></div></form>`);
}

Pages.availability = ({ user }) => {
  const days = Providers.availability(user.id), opts = sel => { let o = ''; for (let t = 300; t <= 1410; t += 30) o += `<option ${U.fromMin(t) === sel ? 'selected' : ''}>${U.fromMin(t)}</option>`; return o; };
  return UI.dash(user, 'availability', 'Availability', `<form class="card pad" data-form="availability"><p class="muted">Clients can only book inside these hours. Time slots are offered every 30 minutes.</p>
    ${DAY_ORDER.map(i => { const d = days[i]; return `<div class="av-row"><label class="sw"><input type="checkbox" name="open${i}" ${d.open ? 'checked' : ''}><span></span></label><b>${DAYS[i]}</b><select name="start${i}">${opts(d.start)}</select><span>to</span><select name="end${i}">${opts(d.end)}</select><em class="muted small">${d.open ? '' : 'Closed'}</em></div>`; }).join('')}
    <div class="form-error" hidden></div><button class="btn btn-primary" type="submit">Save availability</button></form>`);
};

Pages.reviews = ({ user }) => {
  const l = Reviews.forProvider(user.id), st = calculateRating(user.id);
  return UI.dash(user, 'reviews', 'Reviews', `<div class="card pad rev-top"><div class="rev-big"><b>${st.count ? st.avg.toFixed(1) : '—'}</b><span>/ 5</span>${UI.stars(st.avg, true)}<small class="muted">Based on ${st.count} review${st.count === 1 ? '' : 's'}</small></div></div>`
    + (l.length ? `<div class="stack">${l.map(r => { const c = DB.find('users', u => u.id === r.clientId) || { name: 'Client' }; return `<div class="card pad rev"><div class="row gap">${UI.avatar(c, 'sm')}<div class="grow"><b>${esc(c.name)}</b><div>${UI.stars(r.rating)} <span class="muted small">${U.fmtDate(r.createdAt.slice(0, 10))}</span></div></div></div>${r.comment ? `<p>“${esc(r.comment)}”</p>` : '<p class="muted">No comment.</p>'}${r.reply ? `<div class="reply"><b>Your reply</b><p>${esc(r.reply)}</p></div>` : ''}<button class="btn btn-ghost btn-sm" data-act="reply" data-id="${r.id}">${r.reply ? 'Edit reply' : 'Reply'}</button></div>`; }).join('')}</div>` : `<div class="card pad">${UI.empty('⭐', "This provider doesn't have any reviews yet.")}</div>`));
};
