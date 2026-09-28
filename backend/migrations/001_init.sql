CREATE TYPE user_role      AS ENUM ('user', 'organizer');
CREATE TYPE event_status   AS ENUM ('active', 'cancelled');
CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled');

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  email       TEXT        NOT NULL,
  mobile      TEXT        NOT NULL CHECK (mobile ~ '^[0-9]{10}$'),
  password    TEXT        NOT NULL,                       -- bcrypt hash
  role        user_role   NOT NULL DEFAULT 'user',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_uq ON users (lower(email));

CREATE TABLE events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id     UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name             TEXT          NOT NULL,
  description      TEXT          NOT NULL,
  category         TEXT          NOT NULL CHECK (category IN
                    ('Music','Sports','Technology','Business','Education','Workshops','Entertainment')),
  image            TEXT,
  date             DATE          NOT NULL,
  start_time       TIME          NOT NULL,
  end_time         TIME          NOT NULL,
  venue            TEXT          NOT NULL,
  address          TEXT          NOT NULL,
  ticket_price     NUMERIC(10,2) NOT NULL CHECK (ticket_price >= 0),
  total_seats      INT           NOT NULL CHECK (total_seats > 0),
  available_seats  INT           NOT NULL,
  status           event_status  NOT NULL DEFAULT 'active',
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT seats_in_range CHECK (available_seats BETWEEN 0 AND total_seats),
  CONSTRAINT time_order     CHECK (end_time > start_time)
);
CREATE INDEX events_date_idx      ON events (date) WHERE status = 'active';
CREATE INDEX events_category_idx  ON events (category);
CREATE INDEX events_organizer_idx ON events (organizer_id);

CREATE TABLE bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code  TEXT           NOT NULL UNIQUE,            -- e.g. EVT-7K2QX9
  user_id       UUID           NOT NULL REFERENCES users(id)  ON DELETE RESTRICT,
  event_id      UUID           NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
  ticket_type   TEXT           NOT NULL CHECK (ticket_type IN ('General','VIP')),
  quantity      INT            NOT NULL CHECK (quantity BETWEEN 1 AND 10),
  unit_price    NUMERIC(10,2)  NOT NULL,                   -- tier-adjusted unit price at booking time
  service_fee   NUMERIC(10,2)  NOT NULL,
  tax_amount    NUMERIC(10,2)  NOT NULL,
  total_amount  NUMERIC(10,2)  NOT NULL,
  status        booking_status NOT NULL DEFAULT 'confirmed',
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
  cancelled_at  TIMESTAMPTZ
);
CREATE INDEX bookings_user_idx  ON bookings (user_id, created_at DESC);
CREATE INDEX bookings_event_idx ON bookings (event_id, status);

CREATE TABLE favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN
              ('BOOKING_CONFIRMED','BOOKING_CANCELLED','EVENT_REMINDER','EVENT_UPDATED','EVENT_CANCELLED')),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  event_id    UUID REFERENCES events(id)   ON DELETE SET NULL,
  booking_id  UUID REFERENCES bookings(id) ON DELETE SET NULL,
  dedupe_key  TEXT UNIQUE,                       -- NULL allowed (multiple NULLs are fine)
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications (user_id, is_read, created_at DESC);
