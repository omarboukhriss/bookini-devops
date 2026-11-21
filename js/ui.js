/* Bookini — shared UI helpers: toast, modal, confirm, stars, cards, navbar, dashboard layout. */

const UI = {
  toast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = 'toast t-' + type; t.setAttribute('role', 'status');
    t.innerHTML = `<span>${type === 'error' ? '⚠️' : type === 'info' ? 'ℹ️' : '✅'}</span><span>${esc(msg)}</span>`;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3200);
  },
  modal(html, wide) {
    document.getElementById('modal-root').innerHTML = `<div class="overlay" data-overlay><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><button class="x" data-act="close-modal" aria-label="Close">✕</button>${html}</div></div>`;
    document.body.classList.add('noscroll');
    const f = document.querySelector('#modal-root input:not([type=hidden]),#modal-root textarea,#modal-root select'); if (f) setTimeout(() => f.focus(), 30);
  },
  close() { document.getElementById('modal-root').innerHTML = ''; document.body.classList.remove('noscroll'); if (UI._res) { UI._res(false); UI._res = null; } },
  confirm(title, msg, okLabel = 'Confirm', danger = false) {
    return new Promise(res => {
      UI.modal(`<h3>${esc(title)}</h3><p class="muted">${esc(msg)}</p><div class="row end gap"><button class="btn btn-ghost" data-act="confirm-no">Cancel</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="confirm-yes">${esc(okLabel)}</button></div>`);
      UI._res = res;
    });
  },
  busy(f, fn) {
    const b = f.querySelector('button[type=submit]');
    if (b) { b.disabled = true; b.dataset.t = b.innerHTML; b.innerHTML = '<span class="spin"></span> Please wait…'; }
    setTimeout(() => { if (b && document.contains(b)) { b.disabled = false; b.innerHTML = b.dataset.t; } fn(); }, 350);
  },
  err(f, msg) { const el = f.querySelector('.form-error'); if (!el) return; el.textContent = msg || ''; el.hidden = !msg; },
  stars(r, big) { return `<span class="stars ${big ? 'big' : ''}" style="--p:${Math.max(0, Math.min(100, r / 5 * 100))}%" aria-label="${r} out of 5">★★★★★</span>`; },
  starInput(name = 'rating') { return `<div class="star-input" data-star><input type="hidden" name="${name}" value="0">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-act="star" data-v="${n}" aria-label="${n} star${n > 1 ? 's' : ''}">★</button>`).join('')}</div>`; },
  badge(s) { return `<span class="badge b-${s}">${STATUS_LABEL[s] || s}</span>`; },
  avatar(u, cls = '') { return `<img class="avatar ${cls}" src="${u && u.avatar ? u.avatar : U.avatarFor(u ? u.name : '?')}" alt="${esc(u ? u.name : '')}">`; },
  empty(icon, text, cta = '') { return `<div class="empty"><div class="empty-i">${icon}</div><p>${esc(text)}</p>${cta}</div>`; },
  skeleton(n = 6) { return Array.from({ length: n }, () => '<div class="card skel"><div class="sk sk-c"></div><div class="sk"></div><div class="sk w60"></div><div class="sk w80"></div></div>').join(''); },
  readImage(file, max = 800) {
    return new Promise((res, rej) => {
      if (!file || !file.type.startsWith('image/')) return rej(new Error('Please choose an image file.'));
      const fr = new FileReader();
      fr.onload = () => { const img = new Image(); img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.8));
      }; img.onerror = () => rej(new Error('Could not read this image.')); img.src = fr.result; };
      fr.onerror = () => rej(new Error('Could not read this file.')); fr.readAsDataURL(file);
    });
  },

  providerCard(p, user, favIds = []) {
    const isClient = !user || user.role === 'client', fav = favIds.includes(p.id);
    const first = p.services[0];
    return `<article class="card pcard">
      <div class="pcard-top"><a href="#/provider/${p.id}"><img class="avatar lg" src="${p.avatar}" alt="${esc(p.name)}"></a>
        <div class="pcard-id"><h3><a href="#/provider/${p.id}">${esc(p.name)}</a></h3><div class="muted">${esc(p.title)}</div></div>
        ${isClient ? `<button class="heart ${fav ? 'on' : ''}" data-act="fav" data-id="${p.id}" aria-label="${fav ? 'Remove from' : 'Add to'} favorites" title="${fav ? 'Remove from' : 'Add to'} favorites">${fav ? '♥' : '♡'}</button>` : ''}</div>
      <div class="chips"><span class="chip">${catIcon(p.category)} ${esc(catName(p.category))}</span><span class="chip">📍 ${esc(p.city)}, Tunisia</span></div>
      <p class="clamp muted">${esc(p.about || 'This provider has not written a description yet.')}</p>
      <div class="rate">${UI.stars(p.rating)} <b>${p.reviewCount ? p.rating.toFixed(1) : 'New'}</b> <span class="muted">(${p.reviewCount} review${p.reviewCount === 1 ? '' : 's'})</span></div>
      <div class="from">${first ? `<span class="muted">${esc(first.name)}</span><b>From ${p.minPrice} DT</b>` : '<span class="muted">No services listed yet</span>'}</div>
      <div class="row gap"><a class="btn btn-ghost grow" href="#/provider/${p.id}">View Profile</a>${isClient ? `<button class="btn btn-primary grow" data-act="book" data-id="${p.id}">Book Now</button>` : ''}</div></article>`;
  },

  apptCard(b, role) {
    const other = DB.find('users', u => u.id === (role === 'client' ? b.providerId : b.clientId)) || { name: 'Deleted user' };
    const rev = DB.find('reviews', r => r.bookingId === b.id), late = role === 'provider' && b.status === 'confirmed' && b.date < U.today();
    let a = '';
    if (role === 'client') {
      if (['pending', 'confirmed'].includes(b.status)) a += `<button class="btn btn-ghost btn-sm" data-act="cancel" data-id="${b.id}">Cancel</button>`;
      if (b.status === 'completed') a += rev ? `<span class="muted small">You rated ${UI.stars(rev.rating)}</span>` : `<button class="btn btn-primary btn-sm" data-act="review" data-id="${b.id}">⭐ Leave a review</button>`;
      a += `<a class="btn btn-ghost btn-sm" href="#/messages/${b.providerId}">Message</a><a class="btn btn-ghost btn-sm" href="#/provider/${b.providerId}">View provider</a>`;
    } else {
      if (b.status === 'pending') a += `<button class="btn btn-primary btn-sm" data-act="respond" data-do="confirm" data-id="${b.id}">Confirm</button><button class="btn btn-danger-o btn-sm" data-act="respond" data-do="decline" data-id="${b.id}">Decline</button>`;
      if (b.status === 'confirmed') a += `<button class="btn btn-primary btn-sm" data-act="complete" data-id="${b.id}">Mark completed</button><button class="btn btn-ghost btn-sm" data-act="cancel" data-id="${b.id}">Cancel</button>`;
      a += `<a class="btn btn-ghost btn-sm" href="#/messages/${b.clientId}">Message</a>`;
    }
    return `<div class="card appt"><div class="appt-who">${UI.avatar(other)}<div><b>${esc(other.name)}</b><div class="muted small">${role === 'client' ? 'Service provider' : 'Client'}</div></div>${UI.badge(b.status)}</div>
      <div class="appt-grid"><div><span>Service</span><b>${esc(b.serviceName)}</b></div><div><span>Date</span><b>${U.fmtShort(b.date)}</b></div><div><span>Time</span><b>${b.time}</b> <small class="muted">(${b.duration} min)</small></div><div><span>Price</span><b>${b.price} DT</b></div></div>
      ${late ? '<div class="note warn">⏰ This appointment date has passed — mark it as completed once done.</div>' : ''}
      ${b.clientMessage ? `<div class="note"><b>${role === 'client' ? 'Your message' : 'Client message'}:</b> ${esc(b.clientMessage)}</div>` : ''}
      ${b.providerMessage ? `<div class="note ${b.status === 'declined' ? 'bad' : 'good'}"><b>Provider message:</b> ${esc(b.providerMessage)}</div>` : ''}
      <div class="row gap wrap actions">${a}</div></div>`;
  },

  navbar(user, path) {
    const on = p => (path === p || path.startsWith(p + '/')) ? 'on' : '';
    const nu = user ? Notif.unread(user.id) : 0;
    const links = `<a class="${path === '/' ? 'on' : ''}" href="#/">Home</a><a class="${on('/search')}" href="#/search">Find Services</a><a class="${on('/how')}" href="#/how">How It Works</a>`;
    const auth = user
      ? `<a href="#/dashboard">Dashboard</a><a href="#/profile">Profile</a><button class="linkbtn" data-act="logout">Logout</button>`
      : `<a href="#/login">Login</a><a class="btn btn-light btn-sm" href="#/register">Register</a>`;
    const bell = user ? `<div class="bell-wrap"><button class="bell" data-act="bell" aria-label="Notifications">🔔${nu ? `<i>${nu}</i>` : ''}</button><div class="bell-pop" id="bellpop" hidden></div></div>` : '';
    return `<header class="nav"><div class="container nav-in"><a class="logo" href="#/"><span class="logo-m">B</span>Bookini</a>
      <nav class="nav-links" id="navlinks">${links}<div class="nav-auth">${auth}</div></nav>${bell}
      <button class="burger" data-act="toggle-nav" aria-label="Menu">☰</button></div></header>`;
  },
  bellList(user) {
    const l = Notif.list(user.id).slice(0, 5);
    return `<div class="bp-h"><b>Notifications</b><a href="#/notifications">View all</a></div>` + (l.length ? l.map(n => `<a class="bp-i ${n.read ? '' : 'un'}" href="${n.link || '#/notifications'}" data-act="notif-open" data-id="${n.id}"><span>${Notif.icon(n.type)}</span><div>${esc(n.text)}<small>${U.ago(n.createdAt)}</small></div></a>`).join('') : '<div class="bp-e">No notifications yet.</div>');
  },
  footer() {
    return `<footer class="footer"><div class="container foot-in"><div><a class="logo" href="#/"><span class="logo-m">B</span>Bookini</a><p class="muted">Find, book and review trusted professionals.</p></div>
      <div><b>Explore</b><a href="#/search">Find Services</a><a href="#/how">How It Works</a><a href="#/register?role=provider">Become a Provider</a></div>
      <div><b>Account</b><a href="#/login">Login</a><a href="#/register">Register</a></div></div>
      <div class="container foot-b">Bookini is a frontend demo. All data is stored in your browser (localStorage) — nothing is sent to a server.</div></footer>`;
  },

  dash(user, active, title, content, actions = '') {
    const L = user.role === 'client'
      ? [['dashboard', 'Dashboard', '🏠'], ['search', 'Find Services', '🔎'], ['appointments', 'My Appointments', '📅'], ['messages', 'Messages', '💬'], ['favorites', 'Favorites', '♥'], ['notifications', 'Notifications', '🔔'], ['profile', 'My Profile', '👤'], ['settings', 'Settings', '⚙️']]
      : [['dashboard', 'Dashboard', '🏠'], ['profile', 'My Profile', '👤'], ['services', 'My Services', '🧰'], ['availability', 'Availability', '🕒'], ['appointments', 'Appointments', '📅'], ['requests', 'Booking Requests', '📥'], ['messages', 'Messages', '💬'], ['reviews', 'Reviews', '⭐'], ['notifications', 'Notifications', '🔔'], ['settings', 'Settings', '⚙️']];
    const cnt = { messages: Msgs.unread(user.id), notifications: Notif.unread(user.id), requests: user.role === 'provider' ? DB.filter('bookings', b => b.providerId === user.id && b.status === 'pending').length : 0 };
    return `<div class="container dash"><aside class="side card"><div class="side-me">${UI.avatar(user, 'md')}<div><b>${esc(user.name)}</b><div class="muted small">${user.role === 'client' ? 'Client' : 'Service Provider'}</div></div></div>
      <nav>${L.map(l => `<a class="${l[0] === active ? 'on' : ''}" href="#/${l[0]}"><span>${l[2]}</span>${l[1]}${cnt[l[0]] ? `<i>${cnt[l[0]]}</i>` : ''}</a>`).join('')}<a href="#/" data-act="logout"><span>🚪</span>Logout</a></nav></aside>
      <section class="dash-main"><div class="dash-head"><h1>${title}</h1><div>${actions}</div></div>${content}</section></div>`;
  },
  section(title, inner, link = '') { return `<section class="block"><div class="block-h"><h2>${title}</h2>${link}</div>${inner}</section>`; }
};
