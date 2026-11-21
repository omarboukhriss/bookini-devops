/* Bookini — reviews, ratings and favorites. */

function calculateRating(providerId) {
  const r = DB.filter('reviews', x => x.providerId === providerId);
  const avg = r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0;
  return { avg: Math.round(avg * 10) / 10, count: r.length };
}

const Reviews = {
  create({ bookingId, clientId, rating, comment }) {
    const client = DB.find('users', u => u.id === clientId);
    if (!client || client.role !== 'client') return fail('Only clients can leave reviews.');
    const b = DB.find('bookings', x => x.id === bookingId);
    if (!b || b.clientId !== clientId) return fail('Unauthorized access.');
    if (b.status !== 'completed') return fail('You can only review a completed appointment.');
    if (DB.find('reviews', r => r.bookingId === bookingId)) return fail('You have already reviewed this appointment.');
    rating = Number(rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail('Please select a rating between 1 and 5 stars.');
    comment = (comment || '').trim();
    if (comment.length > 500) return fail('Comment is too long (max 500 characters).');
    const r = DB.insert('reviews', { id: DB.uid('review'), bookingId, providerId: b.providerId, clientId, rating, comment, reply: '', createdAt: new Date().toISOString() });
    Notif.push(b.providerId, 'review', `${client.name} left you a ${rating}-star review.`, '#/reviews');
    return done({ review: r, rating: calculateRating(b.providerId) });
  },
  reply(reviewId, providerId, text) {
    const r = DB.find('reviews', x => x.id === reviewId);
    if (!r || r.providerId !== providerId) return fail('Unauthorized access.');
    text = (text || '').trim();
    if (!text) return fail('Please write a reply.');
    if (text.length > 500) return fail('Reply is too long (max 500 characters).');
    DB.update('reviews', reviewId, { reply: text }); return done();
  },
  forProvider(pid) { return DB.filter('reviews', r => r.providerId === pid).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  byClient(cid) { return DB.filter('reviews', r => r.clientId === cid).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
};
const createReview = d => Reviews.create(d);

const Favs = {
  ids(uid) { return DB.filter('favorites', f => f.userId === uid).map(f => f.providerId); },
  has(uid, pid) { return !!DB.find('favorites', f => f.userId === uid && f.providerId === pid); },
  add(uid, pid) {
    const u = DB.find('users', x => x.id === uid);
    if (!u || u.role !== 'client') return fail('Only clients can save favorites.');
    if (!Favs.has(uid, pid)) DB.insert('favorites', { userId: uid, providerId: pid });
    return done();
  },
  remove(uid, pid) { DB.set('favorites', DB.get('favorites').filter(f => !(f.userId === uid && f.providerId === pid))); return done(); }
};
const addFavorite = (u, p) => Favs.add(u, p);
const removeFavorite = (u, p) => Favs.remove(u, p);
