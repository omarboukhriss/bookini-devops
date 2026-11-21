/* Bookini — storage layer + utilities.
   ALL data lives in localStorage under the "bookini_" prefix. No backend, no database.
   To move to a real backend later, replace DB.* calls with API calls (see README). */

const DB = {
  P: 'bookini_',
  get(k, d = []) { try { const v = localStorage.getItem(this.P + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) {
    try { localStorage.setItem(this.P + k, JSON.stringify(v)); return true; }
    catch (e) { if (typeof UI !== 'undefined') UI.toast('Browser storage is full. Try smaller images.', 'error'); return false; }
  },
  uid(p) { return p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
  find(k, fn) { return this.get(k).find(fn); },
  filter(k, fn) { return this.get(k).filter(fn); },
  insert(k, o) { const a = this.get(k); a.push(o); this.set(k, a); return o; },
  update(k, id, patch) { const a = this.get(k); const i = a.findIndex(x => x.id === id); if (i < 0) return null; a[i] = { ...a[i], ...patch }; this.set(k, a); return a[i]; },
  remove(k, id) { this.set(k, this.get(k).filter(x => x.id !== id)); },
  reset() { Object.keys(localStorage).filter(k => k.startsWith(this.P)).forEach(k => localStorage.removeItem(k)); }
};

const fail = error => ({ ok: false, error });
const done = (o = {}) => ({ ok: true, ...o });

const CATS = [
  { id: 'hairdresser', name: 'Hairdresser', icon: '💇' }, { id: 'barber', name: 'Barber', icon: '💈' },
  { id: 'dentist', name: 'Dentist', icon: '🦷' }, { id: 'mechanic', name: 'Mechanic', icon: '🔧' },
  { id: 'photographer', name: 'Photographer', icon: '📷' }, { id: 'fitness', name: 'Fitness Coach', icon: '🏋️' },
  { id: 'tutor', name: 'Tutor', icon: '📚' }, { id: 'electrician', name: 'Electrician', icon: '💡' },
  { id: 'plumber', name: 'Plumber', icon: '🚰' }, { id: 'cleaner', name: 'Cleaner', icon: '🧹' },
  { id: 'beauty', name: 'Beauty Specialist', icon: '💅' }, { id: 'consultant', name: 'Consultant', icon: '💼' },
  { id: 'computer', name: 'Computer Technician', icon: '💻' }
];
const catName = id => (CATS.find(c => c.id === id) || { name: id || '' }).name;
const catIcon = id => (CATS.find(c => c.id === id) || { icon: '🛠️' }).icon;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const STATUS_LABEL = { pending: 'Pending', confirmed: 'Confirmed', declined: 'Declined', cancelled: 'Cancelled', completed: 'Completed' };

const U = {
  esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
  z(n) { return String(n).padStart(2, '0'); },
  iso(d) { return d.getFullYear() + '-' + U.z(d.getMonth() + 1) + '-' + U.z(d.getDate()); },
  today() { return U.iso(new Date()); },
  addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return U.iso(d); },
  parse(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); },
  fmtDate(s) { return U.parse(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); },
  fmtShort(s) { return U.parse(s).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); },
  dow(s) { return U.parse(s).getDay(); },
  toMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; },
  fromMin(n) { return U.z(Math.floor(n / 60)) + ':' + U.z(n % 60); },
  nowMin() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); },
  ago(iso) {
    const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now'; if (m < 60) return m + ' min ago';
    if (m < 1440) return Math.round(m / 60) + ' h ago';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  },
  clock(iso) { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); },
  avatarFor(name) {
    const c = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];
    let h = 0; for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % c.length;
    const i = String(name).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='${c[h]}'/><text x='100' y='124' font-size='76' font-family='Arial' font-weight='700' fill='white' text-anchor='middle'>${i}</text></svg>`);
  },
  galleryImg(label, i, icon) {
    const g = [['#4f46e5', '#06b6d4'], ['#f97316', '#ec4899'], ['#10b981', '#3b82f6'], ['#8b5cf6', '#f43f5e'], ['#0ea5e9', '#22c55e']][i % 5];
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='600' height='450'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${g[0]}'/><stop offset='1' stop-color='${g[1]}'/></linearGradient></defs><rect width='600' height='450' fill='url(#g)'/><text x='300' y='235' font-size='120' text-anchor='middle'>${icon}</text><text x='300' y='345' font-size='34' font-family='Arial' fill='white' text-anchor='middle' font-weight='700'>${label}</text></svg>`);
  }
};
const esc = U.esc;
