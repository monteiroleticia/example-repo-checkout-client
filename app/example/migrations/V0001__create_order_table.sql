CREATE SCHEMA orders;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- example table
CREATE TABLE orders.payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  receipt TEXT NOT NULL,
  status TEXT NOT NULL,
  session_id TEXT,
  session_url TEXT
);
