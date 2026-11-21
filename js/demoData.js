/* Bookini — demo data. Seeds localStorage on first launch (and on "Reset demo data"). */

function seedDemoData(force) {
  if (DB.get('seeded', false) && !force) return;
  if (force) DB.reset();
  const T = U.today();
  const day = n => { let k = n; while (U.dow(U.addDays(k)) === 0) k++; return U.addDays(k); }; // next non-Sunday
  const iso = (m = 0) => new Date(Date.now() - m * 60000).toISOString();
  const mk = (id, name, email, role, phone, city, extra = {}) => ({ id, name, email, password: '123456', role, phone, city, bio: '', avatar: '', createdAt: iso(), ...extra });
  const wk = (s, e, ss, se, sun) => {
    const d = [];
    d[0] = sun ? { open: true, start: sun[0], end: sun[1] } : { open: false, start: '09:00', end: '17:00' };
    for (let i = 1; i <= 5; i++) d[i] = { open: true, start: s, end: e };
    d[6] = ss ? { open: true, start: ss, end: se } : { open: false, start: '09:00', end: '13:00' };
    return d;
  };

  const clients = [
    mk('user_c1', 'Omar Gharbi', 'client@demo.com', 'client', '+216 20 111 222', 'Tunis', { bio: 'Always looking for reliable professionals.' }),
    mk('user_c2', 'Nour Selmi', 'nour@demo.com', 'client', '+216 21 222 333', 'Tunis'),
    mk('user_c3', 'Ines Kacem', 'ines@demo.com', 'client', '+216 22 333 444', 'Sousse'),
    mk('user_c4', 'Walid Ayari', 'walid@demo.com', 'client', '+216 23 444 555', 'Tunis')
  ];

  const ahmedDays = wk('09:00', '18:00', '10:00', '15:00'); ahmedDays[5].end = '17:00';
  const P = [
    { id: 'user_p1', name: 'Ahmed Ben Ali', email: 'provider@demo.com', phone: '+216 22 333 444', city: 'Tunis', cat: 'barber', title: 'Professional Barber', exp: 8,
      about: 'Barber with 8 years of experience in classic cuts, modern fades and beard design. I run a clean, relaxed studio in central Tunis where every client gets my full attention. Walk out looking sharp — every time.',
      days: ahmedDays,
      svc: [["Men's Haircut", 'Classic or modern cut with wash and styling.', 20, 30], ['Beard Trim', 'Shape-up and trim with hot towel finish.', 10, 20], ['Haircut + Beard', 'The full package: cut, beard design and finish.', 25, 45], ['Kids Haircut', 'Gentle, patient cuts for children under 12.', 15, 30]],
      gal: [['Skin Fade', '💈'], ['Beard Design', '🧔'], ['Classic Cut', '✂️'], ['Studio', '🪞']],
      rev: [[5, 'Excellent service. Very professional and friendly.', 'Thank you very much for your feedback!'], [5, 'Best fade in Tunis, always on time.'], [4, 'Great cut, a little wait but worth it.'], [5, 'Clean shop and great attention to detail.']] },
    { id: 'user_p2', name: 'Sara Trabelsi', email: 'sara@demo.com', phone: '+216 24 555 666', city: 'Sousse', cat: 'hairdresser', title: 'Senior Hairstylist', exp: 11,
      about: 'Passionate hairstylist specialised in colour, balayage and keratin treatments. I use only premium, gentle products and take time to understand the look you want.',
      days: wk('09:00', '19:00', '09:00', '17:00'),
      svc: [['Cut & Blow-dry', 'Consultation, wash, cut and styled blow-dry.', 35, 60], ['Full Colouring', 'Single-process colour with premium products.', 80, 120], ['Keratin Treatment', 'Smoothing treatment for frizz-free, shiny hair.', 150, 150]],
      gal: [['Balayage', '🎨'], ['Blow-dry', '💇'], ['Colour', '✨'], ['Salon', '🪞']],
      rev: [[5, 'Sara is a magician with colour. Love my balayage!'], [5, 'Super professional and lovely salon.'], [4, 'Great result, booking again next month.']] },
    { id: 'user_p3', name: 'Mohamed Mansour', email: 'mohamed@demo.com', phone: '+216 25 666 777', city: 'Sfax', cat: 'mechanic', title: 'Auto Mechanic & Diagnostics', exp: 15,
      about: 'Independent garage with 15 years of experience on European and Japanese cars. Honest diagnostics, fair prices and clear explanations before any work starts.',
      days: wk('08:00', '17:00', '08:00', '13:00'),
      svc: [['Oil Change', 'Engine oil and filter change with check-up.', 60, 45], ['Full Diagnostic', 'Computer diagnostic and written report.', 50, 60], ['Brake Service', 'Pads, discs inspection and replacement.', 120, 90]],
      gal: [['Workshop', '🔧'], ['Diagnostics', '🖥️'], ['Brakes', '🛞']],
      rev: [[5, 'Honest and fast. Explained everything clearly.'], [4, 'Fair price and quality work.'], [5, 'Fixed what two other garages could not.']] },
    { id: 'user_p4', name: 'Lina Haddad', email: 'lina@demo.com', phone: '+216 26 777 888', city: 'Tunis', cat: 'fitness', title: 'Certified Personal Trainer', exp: 6,
      about: 'Certified personal trainer and nutrition coach. Whether you want to lose weight, build strength or simply feel better, I build a realistic plan around your life.',
      days: wk('07:00', '20:00', '08:00', '14:00', ['09:00', '12:00']),
      svc: [['Personal Training Session', 'One-to-one session tailored to your goals.', 40, 60], ['Nutrition Plan', 'Personalised eating plan with follow-up.', 60, 45], ['Online Coaching Call', 'Video check-in and plan adjustment.', 30, 30]],
      gal: [['Training', '🏋️'], ['Outdoor', '🏃'], ['Nutrition', '🥗'], ['Studio', '🧘']],
      rev: [[5, 'Lost 6 kg in two months. Lina keeps you motivated!'], [5, 'Professional, kind and very knowledgeable.'], [5, 'Best investment in my health.'], [4, 'Great sessions, flexible schedule.']] },
    { id: 'user_p5', name: 'Youssef Amri', email: 'youssef@demo.com', phone: '+216 27 888 999', city: 'Monastir', cat: 'photographer', title: 'Portrait & Event Photographer', exp: 9,
      about: 'Photographer capturing natural portraits, weddings and corporate events. Relaxed approach, creative direction and fast delivery of edited photos.',
      days: wk('10:00', '19:00', '10:00', '16:00'),
      svc: [['Portrait Session', '90-minute outdoor or studio portrait session.', 120, 90], ['Product Shoot', 'Clean product photos for your shop.', 200, 120], ['Event Coverage (4h)', 'Full coverage with 100+ edited photos.', 400, 240]],
      gal: [['Portraits', '📷'], ['Wedding', '💍'], ['Product', '🛍️'], ['Events', '🎉']],
      rev: [[5, 'Stunning photos, Youssef made us feel at ease.'], [5, 'Delivered on time and the quality is superb.'], [4, 'Very creative, great experience.']] },
    { id: 'user_p6', name: 'Dr. Rania Gharbi', email: 'rania@demo.com', phone: '+216 28 999 000', city: 'Tunis', cat: 'dentist', title: 'Dental Surgeon', exp: 12,
      about: 'Modern, painless dentistry in a calm clinic. Check-ups, cleaning, whitening and aesthetic treatments for the whole family.',
      days: wk('09:00', '17:00', '09:00', '13:00'),
      svc: [['Check-up', 'Full examination and advice.', 40, 30], ['Scale & Polish', 'Professional cleaning.', 70, 45], ['Teeth Whitening', 'In-clinic whitening session.', 200, 60]],
      gal: [['Clinic', '🦷'], ['Whitening', '😁'], ['Reception', '🛋️']],
      rev: [[5, 'Painless and very gentle. Highly recommend.'], [5, 'Spotless clinic and kind team.']] },
    { id: 'user_p7', name: 'Karim Jlassi', email: 'karim@demo.com', phone: '+216 29 000 111', city: 'Ariana', cat: 'tutor', title: 'Math & Physics Tutor', exp: 7,
      about: 'Engineer turned tutor. I help high-school and university students understand — not memorise — maths and physics, and prepare efficiently for exams.',
      days: wk('14:00', '21:00', '09:00', '18:00', ['10:00', '16:00']),
      svc: [['Math Lesson', 'One-to-one lesson at your level.', 25, 60], ['Exam Preparation', 'Intensive revision with past papers.', 35, 90]],
      gal: [['Lessons', '📚'], ['Exercises', '✏️']],
      rev: [[5, 'My son went from 9 to 15 in maths!'], [4, 'Clear explanations and very patient.']] }
  ];

  const users = [...clients], providers = [], services = [], availability = [], bookings = [], reviews = [];
  P.forEach((p, pi) => {
    users.push(mk(p.id, p.name, p.email, 'provider', p.phone, p.city));
    providers.push({ id: p.id, userId: p.id, title: p.title, category: p.cat, city: p.city, about: p.about, experience: p.exp,
      gallery: p.gal.map((g, i) => ({ id: 'img_' + p.id + '_' + i, src: U.galleryImg(g[0], i + pi, g[1]), caption: g[0] })) });
    const sv = p.svc.map((s, i) => ({ id: 'service_' + p.id.slice(5) + '_' + (i + 1), providerId: p.id, name: s[0], description: s[1], price: s[2], duration: s[3] }));
    services.push(...sv);
    availability.push({ providerId: p.id, days: p.days });
    p.rev.forEach((r, i) => {
      const c = clients[1 + (i + pi) % 3], bid = 'booking_seed_' + p.id.slice(5) + '_' + i, s = sv[i % sv.length];
      const date = U.addDays(-(8 + i * 5 + pi));
      bookings.push({ id: bid, clientId: c.id, providerId: p.id, serviceId: s.id, serviceName: s.name, price: s.price, duration: s.duration, date, time: U.fromMin(600 + 30 * i), status: 'completed', clientMessage: '', providerMessage: 'Your appointment has been confirmed.', createdAt: date + 'T09:00:00' });
      reviews.push({ id: 'review_seed_' + p.id.slice(5) + '_' + i, bookingId: bid, providerId: p.id, clientId: c.id, rating: r[0], comment: r[1], reply: r[2] || '', createdAt: date + 'T18:00:00' });
    });
  });

  const svc = (pid, i) => services.find(s => s.id === 'service_' + pid.slice(5) + '_' + i);
  const bk = (id, cid, pid, i, date, time, status, cm, pm, mins) => { const s = svc(pid, i); bookings.push({ id, clientId: cid, providerId: pid, serviceId: s.id, serviceName: s.name, price: s.price, duration: s.duration, date, time, status, clientMessage: cm || '', providerMessage: pm || '', createdAt: iso(mins || 120) }); };
  bk('booking_demo_today', 'user_c4', 'user_p1', 1, T, '10:00', 'confirmed', '', 'Your appointment has been confirmed. See you soon!', 600);
  bk('booking_demo_pending', 'user_c2', 'user_p1', 3, day(2), '15:00', 'pending', 'I would like a haircut and beard trim.', '', 40);
  bk('booking_demo_upcoming', 'user_c1', 'user_p1', 1, day(1), '14:00', 'confirmed', 'Short on the sides please.', 'Your appointment has been confirmed. Please arrive 10 minutes before your appointment.', 300);
  bk('booking_demo_done', 'user_c1', 'user_p1', 2, day(-5), '11:00', 'completed', '', 'Your appointment has been confirmed.', 9000);
  bk('booking_demo_sara', 'user_c1', 'user_p2', 1, day(3), '11:00', 'pending', 'First time with you, looking for a fresh cut.', '', 30);
  bk('booking_demo_declined', 'user_c1', 'user_p3', 1, day(4), '09:00', 'declined', 'Is an early oil change possible?', 'Unfortunately, I am not available at this time. Please choose another appointment.', 800);

  const messages = [
    { id: 'msg_1', conversationId: 'user_c1|user_p1', senderId: 'user_c1', receiverId: 'user_p1', text: 'Hello, do you have availability tomorrow afternoon?', createdAt: iso(200), read: true },
    { id: 'msg_2', conversationId: 'user_c1|user_p1', senderId: 'user_p1', receiverId: 'user_c1', text: 'Yes, I have availability at 14:00.', createdAt: iso(180), read: false },
    { id: 'msg_3', conversationId: 'user_c2|user_p1', senderId: 'user_c2', receiverId: 'user_p1', text: 'Hi Ahmed, can I add a beard trim to my booking?', createdAt: iso(35), read: false }
  ];
  const n = (userId, type, text, link, m, read) => ({ id: DB.uid('notif'), userId, type, text, link, key: '', read: !!read, createdAt: iso(m) });
  const notifications = [
    n('user_p1', 'booking', 'New booking request from Nour Selmi for Haircut + Beard.', '#/requests', 40),
    n('user_p1', 'message', 'New message from Nour Selmi.', '#/messages/user_c2', 35),
    n('user_c1', 'confirmed', 'Ahmed Ben Ali confirmed your appointment.', '#/appointments', 300),
    n('user_c1', 'review', 'Your appointment with Ahmed Ben Ali is completed. Leave a review!', '#/appointments', 600),
    n('user_c1', 'declined', 'Mohamed Mansour declined your booking request.', '#/appointments', 800, true)
  ];

  DB.set('users', users); DB.set('providers', providers); DB.set('services', services);
  DB.set('availability', availability); DB.set('bookings', bookings); DB.set('reviews', reviews);
  DB.set('messages', messages); DB.set('notifications', notifications);
  DB.set('favorites', [{ userId: 'user_c1', providerId: 'user_p4' }, { userId: 'user_c1', providerId: 'user_p5' }]);
  DB.set('currentUser', null); DB.set('seeded', true);
}
