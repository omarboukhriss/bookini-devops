/* Bookini — notifications (stored in localStorage key "notifications"). */

const Notif = {
  push(userId, type, text, link = '', key = '') {
    if (key && DB.find('notifications', n => n.key === key)) return;
    DB.insert('notifications', { id: DB.uid('notif'), userId, type, text, link, key, read: false, createdAt: new Date().toISOString() });
  },
  list(uid) { return DB.filter('notifications', n => n.userId === uid).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  unread(uid) { return DB.filter('notifications', n => n.userId === uid && !n.read).length; },
  markRead(id) { DB.update('notifications', id, { read: true }); },
  markAll(uid) { DB.set('notifications', DB.get('notifications').map(n => n.userId === uid ? { ...n, read: true } : n)); },
  icon(t) { return { booking: '📥', confirmed: '✅', declined: '❌', message: '💬', reminder: '⏰', completed: '🎉', review: '⭐', cancelled: '🚫' }[t] || '🔔'; },
  // "Appointment is approaching": notify when a confirmed booking starts within 24h (once per user/booking)
  checkReminders(user) {
    const now = Date.now();
    DB.filter('bookings', b => b.status === 'confirmed' && (b.clientId === user.id || b.providerId === user.id)).forEach(b => {
      const t = new Date(b.date + 'T' + b.time).getTime();
      if (t > now && t - now < 24 * 3600e3) {
        const other = DB.find('users', u => u.id === (user.id === b.clientId ? b.providerId : b.clientId));
        Notif.push(user.id, 'reminder', `Reminder: ${b.serviceName} with ${other ? other.name : 'your contact'} on ${U.fmtShort(b.date)} at ${b.time}.`, '#/appointments', 'remind_' + b.id + '_' + user.id);
      }
    });
  }
};
