CREATE TABLE IF NOT EXISTS registrations (
  email text PRIMARY KEY,
  products text[] NOT NULL,
  platform text NOT NULL,
  consent_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'registered'
);
CREATE TABLE IF NOT EXISTS registration_rate_limits (
  bucket text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 1,
  expires_at timestamptz NOT NULL
);
