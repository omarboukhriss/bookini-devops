/* Bookini — client pages: dashboard, appointments, favorites. */

Pages._clientDash = ({ user }) => {
  const bks = Bookings.forUser(user), today = U.today();
  const upcoming = bks.filter(b => b.status === 'confirmed' && b.date >= today).sort(Bookings.sortAsc);
  const pending = bks.filter(b => b.status === 'pending').sort(Bookings.sortAsc);
  const nextB = upcoming[0];
  const convs = Msgs.conversations(user.id).slice(0, 3);
  const favs = Favs.ids(user.id).map(id => Providers.full(id)).filter(Boolean).slice(0, 3);
  const revs = Reviews.byClient(user.id).slice(0, 3);
  const toReview = bks.filter(b => b.status === 'completed' && !DB.find('reviews', r => r.bookingId === b.id));
  const nextHtml = nextB ? (() => { const p = DB.find('users', u => u.id === nextB.providerId); return `<div class="card pad next"><div class="muted small">Upcoming appointment</div><div class="row gap">${UI.avatar(p, 'md')}<div><h3>${esc(p.name)}</h3><div>${esc(nextB.serviceName)}</div></div></div><div class="next-meta"><span>📅 ${U.fmtShort(nextB.date)}</span><span>🕒 ${nextB.time}</span>${UI.badge(nextB.status)}</div><a class="btn btn-primary" href="#/appointments">View Appointment</a></div>`; })()
    : `<div class="card pad">${UI.empty('📅', "You don't have any upcoming appointments.", '<a class="btn btn-primary" href="#/search">Find a service</a>')}</div>`;
  const content = `
    ${toReview.length ? `<div class="note good banner">⭐ You have ${toReview.length} completed appointment${toReview.length > 1 ? 's' : ''} waiting for your review. <a class="lnk" href="#/appointments">Review now</a></div>` : ''}
    <div class="stats"><div class="stat"><span>Upcoming</span><b>${upcoming.length}</b></div><div class="stat"><span>Pending</span><b>${pending.length}</b></div><div class="stat"><span>Favorites</span><b>${Favs.ids(user.id).length}</b></div><div class="stat"><span>Unread messages</span><b>${Msgs.unread(user.id)}</b></div></div>
    <div class="grid two">${nextHtml}
      ${UI.section('Pending bookings', pending.length ? pending.slice(0, 3).map(b => `<div class="mini"><b>${esc(b.serviceName)}</b><span class="muted small">${U.fmtShort(b.date)} · ${b.time}</span>${UI.badge(b.status)}</div>`).join('') : '<p class="muted">No pending bookings.</p>', '<a class="lnk" href="#/appointments">See all</a>')}</div>
    <div class="grid two">
      ${UI.section('Recent messages', convs.length ? convs.map(c => { const o = DB.find('users', u => u.id === c.otherId); return `<a class="mini link" href="#/messages/${o.id}">${UI.avatar(o, 'sm')}<div class="grow"><b>${esc(o.name)}</b><div class="muted small clamp1">${esc(c.last.text)}</div></div>${c.unread ? `<i class="dot">${c.unread}</i>` : ''}</a>`; }).join('') : '<p class="muted">No conversations yet.</p>', '<a class="lnk" href="#/messages">Open</a>')}
      ${UI.section('Recent reviews', revs.length ? revs.map(r => { const p = DB.find('users', u => u.id === r.providerId); return `<div class="mini"><div class="grow"><b>${esc(p.name)}</b><div>${UI.stars(r.rating)}</div><div class="muted small clamp1">${esc(r.comment || 'No comment')}</div></div></div>`; }).join('') : '<p class="muted">You haven\'t written any reviews yet.</p>')}</div>
    ${UI.section('Favorite providers', favs.length ? `<div class="grid cards">${favs.map(p => UI.providerCard(p, user, Favs.ids(user.id))).join('')}</div>` : `<p class="muted">You haven't added any providers to your favorites.</p>`, '<a class="lnk" href="#/favorites">See all</a>')}`;
  return UI.dash(user, 'dashboard', `Welcome back, ${esc(user.name.split(' ')[0])}!`, content, '<a class="btn btn-primary" href="#/search">Find a service</a>');
};

Pages._clientAppts = ({ user }) => {
  const bks = Bookings.forUser(user), today = U.today();
  const sec = (title, list, empty, desc) => UI.section(`${title} <span class="count-pill">${list.length}</span>`, list.length ? `<div class="stack">${list.map(b => UI.apptCard(b, 'client')).join('')}</div>` : `<p class="muted">${empty}</p>`);
  const up = bks.filter(b => b.status === 'confirmed').sort(Bookings.sortAsc);
  const pe = bks.filter(b => b.status === 'pending').sort(Bookings.sortAsc);
  const co = bks.filter(b => b.status === 'completed').sort((a, b) => Bookings.sortAsc(b, a));
  const de = bks.filter(b => ['declined', 'cancelled'].includes(b.status)).sort((a, b) => Bookings.sortAsc(b, a));
  const content = bks.length ? sec('Upcoming', up, 'No confirmed appointments.') + sec('Pending', pe, 'No bookings waiting for confirmation.') + sec('Completed', co, 'No completed appointments yet.') + sec('Declined &amp; cancelled', de, 'Nothing here.')
    : `<div class="card pad">${UI.empty('📅', "You don't have any appointments yet.", '<a class="btn btn-primary" href="#/search">Find a service</a>')}</div>`;
  return UI.dash(user, 'appointments', 'My Appointments', content);
};

Pages.favorites = ({ user }) => {
  const l = Favs.ids(user.id).map(id => Providers.full(id)).filter(Boolean), ids = l.map(p => p.id);
  return UI.dash(user, 'favorites', 'My Favorites', l.length ? `<div class="grid cards">${l.map(p => UI.providerCard(p, user, ids)).join('')}</div>` : `<div class="card pad">${UI.empty('♡', "You haven't added any providers to your favorites.", '<a class="btn btn-primary" href="#/search">Discover providers</a>')}</div>`);
};
