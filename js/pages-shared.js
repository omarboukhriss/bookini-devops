/* Bookini — shared pages: dashboard/appointments dispatch, messages, notifications, profile, settings. */

Pages.dashboard = ctx => ctx.user.role === 'client' ? Pages._clientDash(ctx) : Pages._providerDash(ctx);
Pages.appointments = ctx => ctx.user.role === 'client' ? Pages._clientAppts(ctx) : Pages._providerAppts(ctx);

Pages.messages = ({ user, params }) => {
  const convs = Msgs.conversations(user.id), oid = params.id;
  const other = oid ? DB.find('users', u => u.id === oid && u.role !== user.role) : null;
  if (oid && !other) return UI.dash(user, 'messages', 'Messages', `<div class="card pad">${UI.empty('🤷', 'Conversation not found.', '<a class="btn btn-primary" href="#/messages">Back to messages</a>')}</div>`);
  if (other) Msgs.markRead(user.id, other.id);
  const list = convs.map(c => ({ ...c })), ids = list.map(c => c.otherId);
  if (other && !ids.includes(other.id)) list.unshift({ otherId: other.id, last: { text: 'New conversation', createdAt: new Date().toISOString() }, unread: 0 });
  const thread = other ? Msgs.thread(user.id, other.id) : [];
  const left = list.length ? list.map(c => { const o = DB.find('users', u => u.id === c.otherId); return `<a class="conv ${other && o.id === other.id ? 'on' : ''}" href="#/messages/${o.id}">${UI.avatar(o, 'sm')}<div class="grow"><b>${esc(o.name)}</b><div class="muted small clamp1">${esc(c.last.text)}</div></div>${c.unread ? `<i class="dot">${c.unread}</i>` : ''}</a>`; }).join('') : `<div class="pad">${UI.empty('💬', 'No conversations yet.', user.role === 'client' ? '<a class="btn btn-primary btn-sm" href="#/search">Find a provider</a>' : '')}</div>`;
  const right = other ? `<div class="th-head"><a class="back" href="#/messages">‹</a>${UI.avatar(other, 'sm')}<div><b>${esc(other.name)}</b><div class="muted small">${other.role === 'provider' ? 'Service Provider' : 'Client'}</div></div></div>
    <div class="th-body" id="thbody">${thread.length ? thread.map(m => `<div class="bub ${m.senderId === user.id ? 'me' : ''}"><div class="bub-w">${m.senderId === user.id ? (user.role === 'client' ? 'Client' : 'Provider') : (other.role === 'client' ? 'Client' : 'Provider')}</div>${esc(m.text)}<small>${U.clock(m.createdAt)} · ${U.ago(m.createdAt)}${m.senderId === user.id ? (m.read ? ' · ✓✓ Read' : ' · ✓ Sent') : ''}</small></div>`).join('') : `<p class="muted center">Say hello to ${esc(other.name.split(' ')[0])} 👋</p>`}</div>
    <form class="th-form" data-form="send-msg"><input type="hidden" name="to" value="${other.id}"><textarea name="text" rows="1" maxlength="1000" placeholder="Type a message..." aria-label="Message"></textarea><button class="btn btn-primary" type="submit">Send</button></form>`
    : `<div class="th-empty">${UI.empty('💬', 'Select a conversation to start chatting.')}</div>`;
  const html = UI.dash(user, 'messages', 'Messages', `<div class="card msgs ${other ? 'has-thread' : ''}"><div class="conv-list">${left}</div><div class="thread">${right}</div></div>`);
  return { html, init() {
    const b = document.getElementById('thbody'); if (b) b.scrollTop = b.scrollHeight;
    const t = document.querySelector('.th-form textarea');
    if (t) t.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); t.form.requestSubmit(); } });
  } };
};

Pages.notifications = ({ user }) => {
  const l = Notif.list(user.id);
  return UI.dash(user, 'notifications', 'Notifications', l.length ? `<div class="card">${l.map(n => `<a class="notif ${n.read ? '' : 'un'}" href="${n.link || '#/notifications'}" data-act="notif-open" data-id="${n.id}"><span class="ni">${Notif.icon(n.type)}</span><div class="grow">${esc(n.text)}<small class="muted">${U.ago(n.createdAt)}</small></div>${n.read ? '' : '<i class="dot sm"></i>'}</a>`).join('')}</div>` : `<div class="card pad">${UI.empty('🔔', "You're all caught up. No notifications yet.")}</div>`,
    l.some(n => !n.read) ? '<button class="btn btn-ghost" data-act="notif-all">Mark all as read</button>' : '');
};

Pages.profile = ({ user }) => {
  const pr = user.role === 'provider', p = pr ? Providers.full(user.id) : null;
  const gallery = pr ? `${UI.section('Gallery', `<div class="card pad"><div class="gallery edit">${p.gallery.map(g => `<div class="g-item"><img src="${g.src}" alt="${esc(g.caption)}"><button class="g-del" data-act="gal-del" data-id="${g.id}" aria-label="Delete photo">✕</button></div>`).join('')}</div>${p.gallery.length ? '' : UI.empty('🖼️', 'No photos yet. Show your best work!')}<label class="btn btn-ghost">+ Add photo<input type="file" accept="image/*" data-gallery hidden></label><span class="muted small"> ${p.gallery.length}/12 photos · images are resized and stored locally</span></div>`)}` : '';
  const form = `<form class="card pad" data-form="profile" novalidate>
    <div class="avatar-pick"><img class="avatar xl avatar-prev" src="${user.avatar || U.avatarFor(user.name)}" alt=""><label class="btn btn-ghost btn-sm">Change picture<input type="file" accept="image/*" data-avatar hidden></label></div>
    <div class="grid two g12"><label class="field">Full name<input name="name" value="${esc(user.name)}"></label><label class="field">Email<input type="email" name="email" value="${esc(user.email)}"></label>
    <label class="field">Phone<input name="phone" value="${esc(user.phone)}"></label><label class="field">${pr ? 'City / location' : 'Location'}<input name="city" value="${esc(user.city || '')}" placeholder="Tunis"></label>
    ${pr ? `<label class="field">Professional title<input name="title" value="${esc(p.title)}" placeholder="Professional Barber"></label><label class="field">Category<select name="category">${CATS.map(c => `<option value="${c.id}" ${c.id === p.category ? 'selected' : ''}>${c.name}</option>`).join('')}</select></label><label class="field">Years of experience<input type="number" name="experience" min="0" max="60" value="${p.experience}"></label>` : ''}</div>
    ${pr ? `<label class="field">About — experience, skills, services and why clients should choose you<textarea name="about" rows="6" maxlength="1500">${esc(p.about)}</textarea></label>` : `<label class="field">Bio<textarea name="bio" rows="3" maxlength="400">${esc(user.bio || '')}</textarea></label>`}
    <div class="form-error" hidden></div><button class="btn btn-primary" type="submit">Save changes</button></form>`;
  return UI.dash(user, 'profile', 'My Profile', form + gallery + (pr ? `<p class="muted small">Manage your <a class="lnk" href="#/services">services</a> and <a class="lnk" href="#/availability">availability</a> in their own pages.</p>` : ''), pr ? `<a class="btn btn-ghost" href="#/provider/${user.id}">Preview public profile</a>` : '');
};

Pages.settings = ({ user }) => {
  const keys = ['users', 'providers', 'services', 'bookings', 'messages', 'reviews', 'notifications', 'favorites', 'availability', 'currentUser'];
  const size = k => { const v = localStorage.getItem('bookini_' + k); return v ? (v.length / 1024).toFixed(1) + ' KB' : '—'; };
  return UI.dash(user, 'settings', 'Settings', `
    <form class="card pad" data-form="password" novalidate><h2>Change password</h2><p class="muted small">⚠️ Demo only — passwords are stored unencrypted in this browser.</p>
      <div class="grid two g12"><label class="field">Current password<input type="password" name="old" autocomplete="current-password"></label><span></span><label class="field">New password<input type="password" name="pw" autocomplete="new-password"></label><label class="field">Confirm new password<input type="password" name="confirm" autocomplete="new-password"></label></div>
      <div class="form-error" hidden></div><button class="btn btn-primary" type="submit">Update password</button></form>
    <div class="card pad"><h2>Local data</h2><p class="muted small">Everything is stored in your browser's localStorage (keys prefixed <code>bookini_</code>).</p>
      <table class="avail">${keys.map(k => `<tr><td><code>bookini_${k}</code></td><td>${size(k)}</td></tr>`).join('')}</table>
      <button class="btn btn-danger-o" data-act="reset-demo">Reset demo data</button></div>`);
};
