/* Bookini — authentication (DEMO ONLY: passwords are stored in plain text in the browser.
   This is NOT secure. Replace this module with a real backend/auth provider for production). */

const Auth = {
  current() { const id = DB.get('currentUser', null); return id ? (DB.find('users', u => u.id === id) || null) : null; },
  register(d) {
    const name = (d.name || '').trim(), email = (d.email || '').trim().toLowerCase(), phone = (d.phone || '').trim();
    if (!name) return fail('Please enter your full name.');
    if (!email) return fail('Please enter your email.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Please enter a valid email address.');
    if (DB.find('users', u => u.email === email)) return fail('An account with this email already exists.');
    if (!/^[+\d][\d\s-]{6,}$/.test(phone)) return fail('Please enter a valid phone number.');
    if ((d.password || '').length < 6) return fail('Password must contain at least 6 characters.');
    if (d.password !== d.confirm) return fail('Passwords do not match.');
    if (!['client', 'provider'].includes(d.role)) return fail('Invalid account type.');
    const city = (d.city || '').trim();
    if (d.role === 'provider') {
      if (!d.category) return fail('Please select a service category.');
      if (!city) return fail('Please enter your city.');
    }
    const user = { id: DB.uid('user'), name, email, phone, password: d.password, role: d.role, city, bio: '', avatar: d.avatar || '', createdAt: new Date().toISOString() };
    DB.insert('users', user);
    if (d.role === 'provider') {
      DB.insert('providers', { id: user.id, userId: user.id, title: catName(d.category), category: d.category, city, about: '', experience: 0, gallery: [] });
      DB.insert('availability', { providerId: user.id, days: Providers.defaultDays() });
    }
    DB.set('currentUser', user.id);
    return done({ user });
  },
  login(email, password) {
    email = (email || '').trim().toLowerCase();
    if (!email) return fail('Please enter your email.');
    if (!password) return fail('Please enter your password.');
    const u = DB.find('users', x => x.email === email && x.password === password);
    if (!u) return fail('Invalid email or password.');
    DB.set('currentUser', u.id);
    return done({ user: u });
  },
  logout() { DB.set('currentUser', null); },
  changePassword(id, oldPw, newPw, confirm) {
    const u = DB.find('users', x => x.id === id);
    if (!u) return fail('Unauthorized access.');
    if (u.password !== oldPw) return fail('Current password is incorrect.');
    if ((newPw || '').length < 6) return fail('Password must contain at least 6 characters.');
    if (newPw !== confirm) return fail('Passwords do not match.');
    DB.update('users', id, { password: newPw });
    return done();
  }
};

// Reusable function names requested in the spec
const loginUser = (e, p) => Auth.login(e, p);
const registerUser = d => Auth.register(d);
const logoutUser = () => Auth.logout();
const getCurrentUser = () => Auth.current();
