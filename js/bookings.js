/* Bookini — booking logic (slots, create, confirm, decline, cancel, complete). */

const Bookings = {
  isSlotTaken(pid, date, startMin, dur, ignoreId) {
    return DB.filter('bookings', b => b.providerId === pid && b.date === date && ['pending', 'confirmed'].includes(b.status) && b.id !== ignoreId)
      .some(b => { const s = U.toMin(b.time), e = s + b.duration; return startMin < e && startMin + dur > s; });
  },
  // Free start times for a provider on a date, based on weekly availability + existing bookings.
  slots(pid, date, duration) {
    const day = Providers.availability(pid)[U.dow(date)];
    if (!day || !day.open) return [];
    const s = U.toMin(day.start), e = U.toMin(day.end), out = [], isToday = date === U.today();
    for (let t = s; t + duration <= e; t += 30) {
      if (isToday && t <= U.nowMin()) continue;
      if (!Bookings.isSlotTaken(pid, date, t, duration)) out.push(U.fromMin(t));
    }
    return out;
  },
  create({ clientId, providerId, serviceId, date, time, message }) {
    const client = DB.find('users', u => u.id === clientId);
    if (!client || client.role !== 'client') return fail('Only clients can book appointments.');
    const svc = DB.find('services', s => s.id === serviceId && s.providerId === providerId);
    if (!svc) return fail('Please select a service.');
    if (!date) return fail('Please choose a date.');
    if (date < U.today()) return fail('You cannot book a date in the past.');
    if (!time) return fail('Please choose a time.');
    if (!Bookings.slots(providerId, date, svc.duration).includes(time)) return fail('This time slot is no longer available.');
    const b = DB.insert('bookings', { id: DB.uid('booking'), clientId, providerId, serviceId, serviceName: svc.name, price: svc.price, duration: svc.duration,
      date, time, status: 'pending', clientMessage: (message || '').trim().slice(0, 500), providerMessage: '', createdAt: new Date().toISOString() });
    const prov = DB.find('users', u => u.id === providerId);
    Notif.push(providerId, 'booking', `New booking request from ${client.name} for ${svc.name} on ${U.fmtShort(date)} at ${time}.`, '#/requests');
    Notif.push(clientId, 'booking', `Your booking request to ${prov.name} was sent. Waiting for confirmation.`, '#/appointments');
    return done({ booking: b });
  },
  _own(id, actorId, who) {
    const b = DB.find('bookings', x => x.id === id);
    if (!b) return { err: fail('Booking not found.') };
    const ok = who === 'provider' ? b.providerId === actorId : who === 'client' ? b.clientId === actorId : (b.providerId === actorId || b.clientId === actorId);
    if (!ok) return { err: fail('Unauthorized access.') };
    return { b };
  },
  _respond(id, actorId, status, msg) {
    const { b, err } = Bookings._own(id, actorId, 'provider'); if (err) return err;
    if (b.status !== 'pending') return fail('This request has already been handled.');
    DB.update('bookings', id, { status, providerMessage: (msg || '').trim().slice(0, 500) });
    const p = DB.find('users', u => u.id === b.providerId);
    Notif.push(b.clientId, status, `${p.name} ${status === 'confirmed' ? 'confirmed' : 'declined'} your appointment on ${U.fmtShort(b.date)} at ${b.time}.`, '#/appointments');
    return done();
  },
  confirm(id, actorId, msg) { return Bookings._respond(id, actorId, 'confirmed', msg); },
  decline(id, actorId, msg) { return Bookings._respond(id, actorId, 'declined', msg); },
  cancel(id, actorId) {
    const { b, err } = Bookings._own(id, actorId, 'any'); if (err) return err;
    if (!['pending', 'confirmed'].includes(b.status)) return fail('This booking can no longer be cancelled.');
    DB.update('bookings', id, { status: 'cancelled' });
    const byClient = actorId === b.clientId, actor = DB.find('users', u => u.id === actorId);
    Notif.push(byClient ? b.providerId : b.clientId, 'cancelled', `${actor.name} cancelled the appointment on ${U.fmtShort(b.date)} at ${b.time}.`, '#/appointments');
    return done();
  },
  complete(id, actorId) {
    const { b, err } = Bookings._own(id, actorId, 'provider'); if (err) return err;
    if (b.status !== 'confirmed') return fail('Only confirmed appointments can be completed.');
    DB.update('bookings', id, { status: 'completed' });
    const p = DB.find('users', u => u.id === b.providerId);
    Notif.push(b.clientId, 'review', `Your appointment with ${p.name} is completed. How was your experience? Leave a review!`, '#/appointments');
    return done();
  },
  forUser(user) { return DB.filter('bookings', b => (user.role === 'client' ? b.clientId : b.providerId) === user.id); },
  sortAsc(a, b) { return (a.date + a.time).localeCompare(b.date + b.time); }
};

const createBooking = d => Bookings.create(d);
const confirmBooking = (id, a, m) => Bookings.confirm(id, a, m);
const declineBooking = (id, a, m) => Bookings.decline(id, a, m);
