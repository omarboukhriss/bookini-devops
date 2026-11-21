/* Bookini — messaging (localStorage key "messages"). */

const Msgs = {
  cid(a, b) { return [a, b].sort().join('|'); },
  send(from, to, text) {
    text = (text || '').trim();
    const a = DB.find('users', u => u.id === from), b = DB.find('users', u => u.id === to);
    if (!a || !b) return fail('Unauthorized access.');
    if (a.role === b.role) return fail('Messages can only be exchanged between clients and providers.');
    if (!text) return fail('Please type a message.');
    if (text.length > 1000) return fail('Message is too long (max 1000 characters).');
    const m = DB.insert('messages', { id: DB.uid('msg'), conversationId: Msgs.cid(from, to), senderId: from, receiverId: to, text, createdAt: new Date().toISOString(), read: false });
    // one unread-notification per conversation burst
    Notif.push(to, 'message', `New message from ${a.name}.`, '#/messages/' + from);
    return done({ message: m });
  },
  thread(a, b) { const c = Msgs.cid(a, b); return DB.filter('messages', m => m.conversationId === c).sort((x, y) => x.createdAt.localeCompare(y.createdAt)); },
  markRead(me, other) {
    const all = DB.get('messages'); let ch = false;
    all.forEach(m => { if (m.receiverId === me && m.senderId === other && !m.read) { m.read = true; ch = true; } });
    if (ch) DB.set('messages', all);
  },
  conversations(uid) {
    const map = {};
    DB.get('messages').filter(m => m.senderId === uid || m.receiverId === uid).forEach(m => {
      const o = m.senderId === uid ? m.receiverId : m.senderId;
      const c = map[o] || (map[o] = { otherId: o, last: m, unread: 0 });
      if (m.createdAt > c.last.createdAt) c.last = m;
      if (m.receiverId === uid && !m.read) c.unread++;
    });
    return Object.values(map).sort((a, b) => b.last.createdAt.localeCompare(a.last.createdAt));
  },
  unread(uid) { return DB.filter('messages', m => m.receiverId === uid && !m.read).length; }
};
const sendMessage = (f, t, x) => Msgs.send(f, t, x);
