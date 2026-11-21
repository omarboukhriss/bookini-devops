/* Bookini — providers: profile, services, availability, gallery. */

const Providers = {
  defaultDays() {
    const d = [{ open: false, start: '09:00', end: '17:00' }];
    for (let i = 1; i <= 5; i++) d.push({ open: true, start: '09:00', end: '18:00' });
    d.push({ open: true, start: '10:00', end: '15:00' });
    return d;
  },
  stats(id) { return calculateRating(id); },
  availability(id) { const a = DB.find('availability', x => x.providerId === id); return a ? a.days : Providers.defaultDays(); },
  full(id) {
    const u = DB.find('users', x => x.id === id && x.role === 'provider'), p = DB.find('providers', x => x.id === id);
    if (!u || !p) return null;
    const services = DB.filter('services', s => s.providerId === id), st = Providers.stats(id);
    return { ...p, id, user: u, name: u.name, email: u.email, phone: u.phone, avatar: u.avatar || U.avatarFor(u.name),
      services, rating: st.avg, reviewCount: st.count, minPrice: services.length ? Math.min(...services.map(s => s.price)) : null,
      availability: Providers.availability(id) };
  },
  all() { return DB.get('providers').map(p => Providers.full(p.id)).filter(Boolean); },
  saveAvailability(id, days) {
    for (let i = 0; i < 7; i++) if (days[i].open && U.toMin(days[i].start) >= U.toMin(days[i].end)) return fail(`${DAYS[i]}: closing time must be after opening time.`);
    const a = DB.get('availability'), i = a.findIndex(x => x.providerId === id);
    if (i < 0) a.push({ providerId: id, days }); else a[i].days = days;
    DB.set('availability', a); return done();
  },
  updateProfile(id, d) {
    const u = DB.find('users', x => x.id === id);
    if (!u) return fail('Unauthorized access.');
    const name = (d.name || '').trim(), email = (d.email || '').trim().toLowerCase(), phone = (d.phone || '').trim();
    if (!name) return fail('Please enter your full name.');
    if (!email) return fail('Please enter your email.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Please enter a valid email address.');
    if (DB.find('users', x => x.email === email && x.id !== id)) return fail('This email is already used by another account.');
    if (!/^[+\d][\d\s-]{6,}$/.test(phone)) return fail('Please enter a valid phone number.');
    const patch = { name, email, phone, city: (d.city || '').trim(), bio: (d.bio || '').trim() };
    if (d.avatar) patch.avatar = d.avatar;
    if (u.role === 'provider') {
      const title = (d.title || '').trim(), exp = Number(d.experience || 0);
      if (!title) return fail('Please enter your professional title.');
      if (!d.category) return fail('Please select a category.');
      if (!patch.city) return fail('Please enter your city.');
      if (!(exp >= 0 && exp <= 60)) return fail('Experience must be between 0 and 60 years.');
      DB.update('providers', id, { title, category: d.category, city: patch.city, about: (d.about || '').trim(), experience: Math.round(exp) });
    }
    DB.update('users', id, patch);
    return done();
  },
  _svc(d) {
    const name = (d.name || '').trim(), price = Number(d.price), duration = Number(d.duration);
    if (!name) return fail('Please enter a service name.');
    if (d.price === '' || !(price >= 0)) return fail('Please enter a valid price.');
    if (!(duration >= 5 && duration <= 480)) return fail('Duration must be between 5 and 480 minutes.');
    return done({ v: { name, description: (d.description || '').trim(), price, duration: Math.round(duration) } });
  },
  addService(pid, d) { const r = Providers._svc(d); if (!r.ok) return r; return done({ service: DB.insert('services', { id: DB.uid('service'), providerId: pid, ...r.v }) }); },
  updateService(pid, sid, d) {
    const s = DB.find('services', x => x.id === sid);
    if (!s || s.providerId !== pid) return fail('Unauthorized access.');
    const r = Providers._svc(d); if (!r.ok) return r;
    DB.update('services', sid, r.v); return done();
  },
  removeService(pid, sid) {
    const s = DB.find('services', x => x.id === sid);
    if (!s || s.providerId !== pid) return fail('Unauthorized access.');
    DB.remove('services', sid); return done();
  },
  addImage(pid, src, caption) {
    const p = DB.find('providers', x => x.id === pid); if (!p) return fail('Unauthorized access.');
    if (p.gallery.length >= 12) return fail('Gallery is limited to 12 photos in this demo.');
    DB.update('providers', pid, { gallery: [...p.gallery, { id: DB.uid('img'), src, caption: caption || '' }] }); return done();
  },
  removeImage(pid, imgId) {
    const p = DB.find('providers', x => x.id === pid); if (!p) return fail('Unauthorized access.');
    DB.update('providers', pid, { gallery: p.gallery.filter(g => g.id !== imgId) }); return done();
  }
};
