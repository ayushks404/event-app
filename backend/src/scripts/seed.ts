import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { inDays, inHours } from './seedHelpers';

dotenv.config();

const TIER_MULTIPLIERS = { General: 1, VIP: 2 } as const;
const FEE_BPS = 500;
const TAX_BPS = 1800;

function toPaise(n: number | string) {
  return Math.round(Number(n) * 100);
}
function fromPaise(p: number) {
  return p / 100;
}

function computeTotals(basePaise: number, tier: keyof typeof TIER_MULTIPLIERS, qty: number) {
  const unit = Math.round(basePaise * TIER_MULTIPLIERS[tier]);
  const subtotal = unit * qty;
  const fee = Math.round((subtotal * FEE_BPS) / 10_000);
  const tax = Math.round(((subtotal + fee) * TAX_BPS) / 10_000);
  return { unit, subtotal, fee, tax, total: subtotal + fee + tax };
}

let codeSeq = 100;
function genCode() {
  codeSeq++;
  return `EVT-SEED${codeSeq}`;
}

export async function runSeed(connectionString?: string) {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_CONFIRM !== 'yes') {
    throw new Error('Refusing to seed in production without SEED_CONFIRM=yes');
  }

  const dbUrl = connectionString || process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;
  const pool = new Pool({ connectionString: dbUrl, ssl });
  const client = await pool.connect();

  try {
    // eslint-disable-next-line no-console
    console.log('Seeding database...');
    await client.query('TRUNCATE notifications, favorites, bookings, events, users RESTART IDENTITY CASCADE');

    const hashedPassword = await bcrypt.hash('Demo@1234', 10);

    // 1. Insert 5 Users
    const userRows = await client.query(`
      INSERT INTO users (name, email, mobile, password, role) VALUES
      ('Aarav Mehta',   'organizer@demo.com',  '9876543210', $1, 'organizer'),
      ('Priya Nair',    'organizer2@demo.com', '9876543211', $1, 'organizer'),
      ('Rohan Verma',   'user@demo.com',       '9876543212', $1, 'user'),
      ('Ananya Sharma', 'user2@demo.com',      '9876543213', $1, 'user'),
      ('Vikram Singh',  'user3@demo.com',      '9876543214', $1, 'user')
      RETURNING id, email, role;
    `, [hashedPassword]);

    const usersMap: Record<string, string> = {};
    for (const r of userRows.rows) {
      usersMap[r.email] = r.id;
    }

    const org1 = usersMap['organizer@demo.com'];
    const org2 = usersMap['organizer2@demo.com'];
    const demoUser = usersMap['user@demo.com'];
    const user2 = usersMap['user2@demo.com'];
    const user3 = usersMap['user3@demo.com'];

    // 2. Define Events (~26 total)
    const categories = ['Music', 'Sports', 'Technology', 'Business', 'Education', 'Workshops', 'Entertainment'] as const;

    const eventsToInsert: Array<{
      key: string;
      orgId: string;
      name: string;
      description: string;
      category: typeof categories[number];
      date: string;
      startTime: string;
      endTime: string;
      venue: string;
      address: string;
      ticketPrice: number;
      totalSeats: number;
      availableSeats?: number;
      status?: 'active' | 'cancelled';
    }> = [
      // 3 Past Events
      { key: 'past1', orgId: org1, name: 'Mumbai Tech Summit 2026', description: 'Annual technology conference in Mumbai featuring keynote speakers.', category: 'Technology', date: inDays(-25), startTime: '09:00', endTime: '17:00', venue: 'Jio World Centre', address: 'BKC, Mumbai', ticketPrice: 1500, totalSeats: 200 },
      { key: 'past2', orgId: org2, name: 'Indie Music Fest', description: 'Live indie bands performance with open food stalls.', category: 'Music', date: inDays(-10), startTime: '17:00', endTime: '22:00', venue: 'Palace Grounds', address: 'Sadashivanagar, Bengaluru', ticketPrice: 800, totalSeats: 150 },
      { key: 'past3', orgId: org1, name: 'Business Leadership Forum', description: 'Interactive panel discussions with industry leaders.', category: 'Business', date: inDays(-3), startTime: '10:00', endTime: '16:00', venue: 'Taj Palace', address: 'Chanakyapuri, New Delhi', ticketPrice: 2500, totalSeats: 100 },

      // 1 Reminder Window Event (within 6 hours from now)
      {
        key: 'reminderEvt', orgId: org1, name: 'AI & Data Science Workshop', description: 'Hands-on session on modern LLMs and data pipelines.', category: 'Workshops',
        date: inHours(6).date, startTime: inHours(6).time,
        endTime: (() => {
          const [h, m] = inHours(6).time.split(':').map(Number);
          const endH = Math.min(23, h + 1);
          return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}` === inHours(6).time ? '23:59' : `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        })(),
        venue: 'Cyber Hub Auditorium', address: 'DLF Phase 2, Gurugram', ticketPrice: 499, totalSeats: 50
      },

      // 1 Sold-Out Event (5 total seats, filled by 5 confirmed booked seats below)
      { key: 'soldOutEvt', orgId: org2, name: 'Exclusive VIP Concert', description: 'Intimate acoustic music show for select fans.', category: 'Music', date: inDays(5), startTime: '19:00', endTime: '22:00', venue: 'NCPA Theater', address: 'Nariman Point, Mumbai', ticketPrice: 5000, totalSeats: 5 },

      // 1 Free Event
      { key: 'freeEvt', orgId: org1, name: 'Open Community Coding Meetup', description: 'Free meetup for open source contributors and developers.', category: 'Education', date: inDays(8), startTime: '14:00', endTime: '17:00', venue: 'IIT Delhi Campus', address: 'Hauz Khas, New Delhi', ticketPrice: 0, totalSeats: 80 },

      // 1 Cancelled Event
      { key: 'cancelledEvt', orgId: org2, name: 'Startup Pitch Fest', description: 'Pitch competition for early stage startups.', category: 'Business', date: inDays(12), startTime: '11:00', endTime: '15:00', venue: 'T-Hub', address: 'Raidurg, Hyderabad', ticketPrice: 300, totalSeats: 60, status: 'cancelled' },

      // 1 "Last Seats" Event
      { key: 'lastSeatsEvt', orgId: org1, name: 'Design Systems Masterclass', description: 'Deep dive into Figma component architecture and design tokens.', category: 'Workshops', date: inDays(15), startTime: '10:00', endTime: '13:00', venue: 'WeWork Forum', address: 'DLF Cyber City, Gurugram', ticketPrice: 1200, totalSeats: 3, availableSeats: 3 },

      // 18 General Future Events (offsets 1 to 60 days)
      { key: 'fut1', orgId: org1, name: 'React Native & Mobile Dev Day', description: 'Full day event dedicated to cross-platform mobile app development.', category: 'Technology', date: inDays(1), startTime: '09:30', endTime: '17:30', venue: 'Manekshaw Centre', address: 'Delhi Cantt, New Delhi', ticketPrice: 999, totalSeats: 120 },
      { key: 'fut2', orgId: org2, name: 'Standup Comedy Special', description: 'Hilarious standup comedy lineup featuring top comics.', category: 'Entertainment', date: inDays(2), startTime: '20:00', endTime: '22:00', venue: 'The Habitat', address: 'Khar West, Mumbai', ticketPrice: 600, totalSeats: 90 },
      { key: 'fut3', orgId: org1, name: 'Marathon & Fitness Expo', description: 'Exhibition of sports gear, nutrition, and wellness routines.', category: 'Sports', date: inDays(4), startTime: '06:00', endTime: '12:00', venue: 'Jawaharlal Nehru Stadium', address: 'Lodhi Road, New Delhi', ticketPrice: 200, totalSeats: 300 },
      { key: 'fut4', orgId: org2, name: 'Vocal Classical Music Night', description: 'Sublime Indian classical vocal performances.', category: 'Music', date: inDays(6), startTime: '18:30', endTime: '21:30', venue: 'Chowdiah Memorial Hall', address: 'Malleshwaram, Bengaluru', ticketPrice: 750, totalSeats: 110 },
      { key: 'fut5', orgId: org1, name: 'Cloud Architecture Summit', description: 'Keynotes on Kubernetes, serverless, and cloud security.', category: 'Technology', date: inDays(9), startTime: '09:00', endTime: '18:00', venue: 'Leela Ambience', address: 'Ambience Island, Gurugram', ticketPrice: 2000, totalSeats: 250 },
      { key: 'fut6', orgId: org2, name: 'Digital Marketing Masterclass', description: 'Growth marketing, SEO, and paid media strategies for startups.', category: 'Education', date: inDays(11), startTime: '10:00', endTime: '16:00', venue: 'MCCia Trade Tower', address: 'Senapati Bapat Road, Pune', ticketPrice: 1500, totalSeats: 70 },
      { key: 'fut7', orgId: org1, name: 'Inter-City Badminton League', description: 'Thrilling amateur badminton tournament finals.', category: 'Sports', date: inDays(14), startTime: '08:00', endTime: '18:00', venue: 'Pullela Gopichand Academy', address: 'Gachibowli, Hyderabad', ticketPrice: 350, totalSeats: 150 },
      { key: 'fut8', orgId: org2, name: 'Film Making & Storytelling', description: 'Workshop on scriptwriting, direction, and cinematography.', category: 'Entertainment', date: inDays(18), startTime: '11:00', endTime: '17:00', venue: 'Whistling Woods Institute', address: 'Goregaon East, Mumbai', ticketPrice: 1800, totalSeats: 40 },
      { key: 'fut9', orgId: org1, name: 'Fintech & Blockchain Expo', description: 'Innovations in digital payments, banking tech, and DeFi.', category: 'Business', date: inDays(20), startTime: '09:00', endTime: '17:00', venue: 'BICC Bengaluru', address: 'Whitefield, Bengaluru', ticketPrice: 2200, totalSeats: 180 },
      { key: 'fut10', orgId: org2, name: 'Pottery & Clay Art Workshop', description: 'Hands-on pottery workshop with professional sculptors.', category: 'Workshops', date: inDays(22), startTime: '15:00', endTime: '18:00', venue: 'Sanskriti Kendra', address: 'Mehrauli-Gurgaon Rd, New Delhi', ticketPrice: 900, totalSeats: 35 },
      { key: 'fut11', orgId: org1, name: 'Rock & Metal Live Gig', description: 'High-energy rock band performances under the stars.', category: 'Music', date: inDays(26), startTime: '19:00', endTime: '23:00', venue: 'Hard Rock Cafe', address: 'St Marks Road, Bengaluru', ticketPrice: 1200, totalSeats: 100 },
      { key: 'fut12', orgId: org2, name: 'E-Commerce Sellers Meet', description: 'Networking event for Amazon & Flipkart online seller community.', category: 'Business', date: inDays(30), startTime: '10:00', endTime: '15:00', venue: 'Radisson Blu', address: 'Noida Sector 18, Noida', ticketPrice: 850, totalSeats: 90 },
      { key: 'fut13', orgId: org1, name: 'Cybersecurity & Ethical Hacking', description: 'Learn practical threat hunting and penetration testing.', category: 'Education', date: inDays(35), startTime: '10:00', endTime: '16:00', venue: 'IISc Campus Auditorium', address: 'Mathikere, Bengaluru', ticketPrice: 1100, totalSeats: 120 },
      { key: 'fut14', orgId: org2, name: 'Table Tennis Championship', description: 'State-level table tennis knockout tournament.', category: 'Sports', date: inDays(40), startTime: '09:00', endTime: '17:00', venue: 'YMCA Sports Complex', address: 'Connaught Place, New Delhi', ticketPrice: 150, totalSeats: 200 },
      { key: 'fut15', orgId: org1, name: 'Product Management Conclave', description: 'Insights on product roadmap design and user research.', category: 'Technology', date: inDays(45), startTime: '10:00', endTime: '17:00', venue: 'Sheraton Grand', address: 'Rajajinagar, Bengaluru', ticketPrice: 2400, totalSeats: 140 },
      { key: 'fut16', orgId: org2, name: 'Photography Masterclass & Walk', description: 'Outdoor street photography walkthrough in Old Delhi.', category: 'Workshops', date: inDays(50), startTime: '07:00', endTime: '11:00', venue: 'Chandni Chowk', address: 'Old Delhi, New Delhi', ticketPrice: 650, totalSeats: 25 },
      { key: 'fut17', orgId: org1, name: 'Theatre Play: The Golden Age', description: 'Acclaimed theatrical drama depicting historical events.', category: 'Entertainment', date: inDays(55), startTime: '18:30', endTime: '21:00', venue: 'Kamani Auditorium', address: 'Mandi House, New Delhi', ticketPrice: 500, totalSeats: 160 },
      { key: 'fut18', orgId: org2, name: 'Symphony Orchestra Concert', description: 'Grand western classical orchestral ensemble.', category: 'Music', date: inDays(60), startTime: '19:00', endTime: '21:30', venue: 'Sir Mutha Venkatasubba Concert Hall', address: 'Chetpet, Chennai', ticketPrice: 1600, totalSeats: 220 },
    ];

    const eventsMap: Record<string, { id: string; price: number }> = {};

    for (const item of eventsToInsert) {
      const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const image = `https://picsum.photos/seed/${slug}/800/450`;
      const avail = item.availableSeats !== undefined ? item.availableSeats : item.totalSeats;
      const status = item.status || 'active';

      const res = await client.query(`
        INSERT INTO events (
          organizer_id, name, description, category, image, date, start_time, end_time,
          venue, address, ticket_price, total_seats, available_seats, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        RETURNING id, ticket_price;
      `, [
        item.orgId, item.name, item.description, item.category, image, item.date, item.startTime, item.endTime,
        item.venue, item.address, item.ticketPrice, item.totalSeats, avail, status
      ]);

      eventsMap[item.key] = { id: res.rows[0].id, price: Number(res.rows[0].ticket_price) };
    }

    // Helper for inserting bookings directly
    async function seedBooking(o: {
      userId: string; eventId: string; basePrice: number;
      tier: 'General' | 'VIP'; qty: number; status: 'confirmed' | 'cancelled';
    }): Promise<string> {
      const t = computeTotals(toPaise(o.basePrice), o.tier, o.qty);
      const code = genCode();
      const res = await client.query(
        `INSERT INTO bookings (booking_code, user_id, event_id, ticket_type, quantity,
                               unit_price, service_fee, tax_amount, total_amount, status, cancelled_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::booking_status, CASE WHEN $10::text = 'cancelled' THEN now() END)
         RETURNING id`,
        [code, o.userId, o.eventId, o.tier, o.qty,
         fromPaise(t.unit), fromPaise(t.fee), fromPaise(t.tax), fromPaise(t.total), o.status]
      );
      if (o.status === 'confirmed') {
        await client.query(`UPDATE events SET available_seats = available_seats - $2 WHERE id = $1`, [o.eventId, o.qty]);
      }
      return res.rows[0].id;
    }

    // 3. Demo User Bookings (Must have all 5 types specified in §6.4)
    // (1) Upcoming confirmed booking (General x 2) on a general future event (fut1)
    const demoB1 = await seedBooking({
      userId: demoUser, eventId: eventsMap['fut1'].id, basePrice: eventsMap['fut1'].price,
      tier: 'General', qty: 2, status: 'confirmed'
    });

    // (2) Completed booking (VIP x 1) on a past event (past1)
    await seedBooking({
      userId: demoUser, eventId: eventsMap['past1'].id, basePrice: eventsMap['past1'].price,
      tier: 'VIP', qty: 1, status: 'confirmed'
    });

    // (3) Booking cancelled by user (cancelled status) on another future event (fut2)
    const demoB3 = await seedBooking({
      userId: demoUser, eventId: eventsMap['fut2'].id, basePrice: eventsMap['fut2'].price,
      tier: 'General', qty: 1, status: 'cancelled'
    });

    // (4) Confirmed booking (General x 1) on the reminder-window event
    await seedBooking({
      userId: demoUser, eventId: eventsMap['reminderEvt'].id, basePrice: eventsMap['reminderEvt'].price,
      tier: 'General', qty: 1, status: 'confirmed'
    });

    // (5) Booking on cancelled event with status cancelled (cancelled by organizer)
    const demoB5 = await seedBooking({
      userId: demoUser, eventId: eventsMap['cancelledEvt'].id, basePrice: eventsMap['cancelledEvt'].price,
      tier: 'General', qty: 1, status: 'cancelled'
    });

    // 4. Other Users' Bookings (filling soldOutEvt 5 seats and adding extra bookings)
    // Sold-out event: 5 seats booked by user2 (General x 3) and user3 (VIP x 1 -> 2 seats? qty 2)
    await seedBooking({
      userId: user2, eventId: eventsMap['soldOutEvt'].id, basePrice: eventsMap['soldOutEvt'].price,
      tier: 'General', qty: 3, status: 'confirmed'
    });
    await seedBooking({
      userId: user3, eventId: eventsMap['soldOutEvt'].id, basePrice: eventsMap['soldOutEvt'].price,
      tier: 'VIP', qty: 2, status: 'confirmed'
    });

    // Additional bookings across org1 events for non-trivial stats (user2 and user3)
    await seedBooking({ userId: user2, eventId: eventsMap['fut3'].id, basePrice: eventsMap['fut3'].price, tier: 'General', qty: 2, status: 'confirmed' });
    await seedBooking({ userId: user3, eventId: eventsMap['fut3'].id, basePrice: eventsMap['fut3'].price, tier: 'General', qty: 1, status: 'confirmed' });
    await seedBooking({ userId: user2, eventId: eventsMap['fut5'].id, basePrice: eventsMap['fut5'].price, tier: 'VIP', qty: 1, status: 'confirmed' });
    await seedBooking({ userId: user3, eventId: eventsMap['fut5'].id, basePrice: eventsMap['fut5'].price, tier: 'General', qty: 4, status: 'confirmed' });
    await seedBooking({ userId: user2, eventId: eventsMap['freeEvt'].id, basePrice: eventsMap['freeEvt'].price, tier: 'General', qty: 2, status: 'confirmed' });
    await seedBooking({ userId: user3, eventId: eventsMap['fut7'].id, basePrice: eventsMap['fut7'].price, tier: 'General', qty: 1, status: 'confirmed' });
    await seedBooking({ userId: user2, eventId: eventsMap['fut9'].id, basePrice: eventsMap['fut9'].price, tier: 'General', qty: 2, status: 'confirmed' });
    await seedBooking({ userId: user3, eventId: eventsMap['past3'].id, basePrice: eventsMap['past3'].price, tier: 'General', qty: 1, status: 'confirmed' });

    // Total bookings inserted: 5 (demoUser) + 10 (other users) = 15 total bookings!

    // 5. Seed 3 Favorites for Demo User
    await client.query(`
      INSERT INTO favorites (user_id, event_id) VALUES
      ($1, $2), ($1, $3), ($1, $4)
    `, [demoUser, eventsMap['fut1'].id, eventsMap['fut3'].id, eventsMap['freeEvt'].id]);

    // 6. Seed Notifications for Demo User (4 total)
    // BOOKING_CONFIRMED (unread) for booking 1
    // BOOKING_CANCELLED (read) for booking 3
    // EVENT_UPDATED (unread) for booking 1
    // EVENT_CANCELLED (unread) for booking 5
    await client.query(`
      INSERT INTO notifications (user_id, type, title, message, event_id, booking_id, is_read, dedupe_key) VALUES
      ($1, 'BOOKING_CONFIRMED', 'Booking confirmed', '2 × General ticket(s) for React Native & Mobile Dev Day', $2, $3, FALSE, 'seeded:b1'),
      ($1, 'BOOKING_CANCELLED', 'Booking cancelled', 'Your booking EVT-SEED103 for Standup Comedy Special was cancelled', $4, $5, TRUE, 'seeded:b3'),
      ($1, 'EVENT_UPDATED',   'Event updated',   'React Native & Mobile Dev Day has updated details. Please review.', $2, $3, FALSE, 'seeded:up1'),
      ($1, 'EVENT_CANCELLED', 'Event cancelled', 'Startup Pitch Fest has been cancelled by the organizer.', $6, $7, FALSE, 'seeded:c5')
    `, [
      demoUser,
      eventsMap['fut1'].id, demoB1,
      eventsMap['fut2'].id, demoB3,
      eventsMap['cancelledEvt'].id, demoB5
    ]);

    // Summary output
    const usersCount = (await client.query('SELECT COUNT(*) FROM users')).rows[0].count;
    const eventsCount = (await client.query('SELECT COUNT(*) FROM events')).rows[0].count;
    const favoritesCount = (await client.query('SELECT COUNT(*) FROM favorites')).rows[0].count;
    const bookingsCount = (await client.query('SELECT COUNT(*) FROM bookings')).rows[0].count;
    const notificationsCount = (await client.query('SELECT COUNT(*) FROM notifications')).rows[0].count;

    // eslint-disable-next-line no-console
    console.log('Seeding completed successfully!');
    // eslint-disable-next-line no-console
    console.log(`Counts: Users=${usersCount}, Events=${eventsCount}, Favorites=${favoritesCount}, Bookings=${bookingsCount}, Notifications=${notificationsCount}`);
    // eslint-disable-next-line no-console
    console.log('Demo Credentials:');
    // eslint-disable-next-line no-console
    console.log('  User: user@demo.com / Demo@1234');
    // eslint-disable-next-line no-console
    console.log('  Organizer: organizer@demo.com / Demo@1234');
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
