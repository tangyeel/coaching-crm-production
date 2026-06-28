-- Coaching CRM — Supabase schema
-- Run this in the Supabase SQL editor or via: psql $DATABASE_URL -f supabase/schema.sql

create extension if not exists "pgcrypto";

-- ── institutes ─────────────────────────────────────────────────────────────
create table if not exists institutes (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  email            text,
  phone            text,
  status           text not null default 'ACTIVE',
  plan             text not null default 'BASIC',
  monthly_fee      numeric not null default 0,
  whatsapp_token   text,
  whatsapp_phone_id text,
  join_code        text,
  created_at       timestamptz not null default now()
);

-- ── users_profile ──────────────────────────────────────────────────────────
create table if not exists users_profile (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  email                    text not null unique,
  password_hash            text not null,
  role                     text not null,
  institute_id             uuid references institutes(id) on delete set null,
  phone                    text,
  guardian_name            text,
  guardian_phone           text,
  subject                  text,
  fee_status               text not null default 'DUE',
  is_active                boolean not null default true,
  requires_password_change boolean not null default false,
  student_id               uuid,
  created_at               timestamptz not null default now()
);

create index if not exists users_profile_email_idx        on users_profile(email);
create index if not exists users_profile_institute_role   on users_profile(institute_id, role);

-- ── batches ────────────────────────────────────────────────────────────────
create table if not exists batches (
  id           uuid primary key default gen_random_uuid(),
  institute_id uuid not null references institutes(id) on delete cascade,
  name         text not null,
  subject      text not null,
  schedule     text not null,
  capacity     int not null default 30,
  teacher_id   uuid references users_profile(id) on delete set null,
  join_code    text unique,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists batches_institute_idx on batches(institute_id);

-- ── batch_students ─────────────────────────────────────────────────────────
create table if not exists batch_students (
  id          uuid primary key default gen_random_uuid(),
  batch_id    uuid not null references batches(id) on delete cascade,
  student_id  uuid not null references users_profile(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique(batch_id, student_id)
);

create index if not exists batch_students_batch_idx   on batch_students(batch_id);
create index if not exists batch_students_student_idx on batch_students(student_id);

-- ── exams ──────────────────────────────────────────────────────────────────
create table if not exists exams (
  id           uuid primary key default gen_random_uuid(),
  institute_id uuid not null references institutes(id) on delete cascade,
  batch_id     uuid not null references batches(id) on delete cascade,
  name         text not null,
  max_marks    int not null,
  date         date not null,
  created_at   timestamptz not null default now()
);

create index if not exists exams_batch_idx on exams(batch_id);

-- ── marks ──────────────────────────────────────────────────────────────────
create table if not exists marks (
  id           uuid primary key default gen_random_uuid(),
  exam_id      uuid not null references exams(id) on delete cascade,
  student_id   uuid not null references users_profile(id) on delete cascade,
  institute_id uuid not null references institutes(id) on delete cascade,
  score        int,
  unique(exam_id, student_id)
);

-- ── attendance ─────────────────────────────────────────────────────────────
create table if not exists attendance (
  id           uuid primary key default gen_random_uuid(),
  batch_id     uuid not null references batches(id) on delete cascade,
  student_id   uuid not null references users_profile(id) on delete cascade,
  institute_id uuid not null references institutes(id) on delete cascade,
  date         date not null,
  status       text not null,
  marked_by_id uuid,
  unique(batch_id, student_id, date)
);

create index if not exists attendance_batch_date on attendance(batch_id, date);

-- ── announcements ──────────────────────────────────────────────────────────
create table if not exists announcements (
  id           uuid primary key default gen_random_uuid(),
  institute_id uuid not null references institutes(id) on delete cascade,
  batch_id     uuid references batches(id) on delete set null,
  title        text not null,
  body         text not null,
  author_id    uuid references users_profile(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists announcements_institute_idx on announcements(institute_id);

-- ── fee_payments ───────────────────────────────────────────────────────────
create table if not exists fee_payments (
  id              uuid primary key default gen_random_uuid(),
  institute_id    uuid not null references institutes(id) on delete cascade,
  student_id      uuid not null references users_profile(id) on delete cascade,
  amount          numeric not null,
  method          text not null default 'CASH',
  note            text,
  recorded_by_id  uuid,
  paid_at         timestamptz not null default now()
);

create index if not exists fee_payments_institute_idx on fee_payments(institute_id);

-- ── payments (platform subscription payments) ──────────────────────────────
create table if not exists payments (
  id           uuid primary key default gen_random_uuid(),
  institute_id uuid not null references institutes(id) on delete cascade,
  amount       numeric not null,
  period_month text not null,
  paid_at      timestamptz not null default now()
);

-- ── invite_codes ───────────────────────────────────────────────────────────
create table if not exists invite_codes (
  id           uuid primary key default gen_random_uuid(),
  institute_id uuid not null references institutes(id) on delete cascade,
  code         text not null unique,
  role         text not null,
  max_uses     int not null default 100,
  used_count   int not null default 0,
  is_active    boolean not null default true,
  expires_at   timestamptz,
  created_at   timestamptz not null default now()
);

-- ── password_reset_tokens ──────────────────────────────────────────────────
create table if not exists password_reset_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users_profile(id) on delete cascade,
  token      text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ── audit_logs ─────────────────────────────────────────────────────────────
create table if not exists audit_logs (
  id           uuid primary key default gen_random_uuid(),
  institute_id uuid,
  user_id      uuid,
  action       text,
  entity       text,
  entity_id    text,
  details      text,
  created_at   timestamptz not null default now()
);

-- ── Row-Level Security (optional — service role bypasses RLS) ──────────────
-- Enable RLS on all tables if you plan to use the anon/user keys directly.
-- The backend uses the service role key so RLS is bypassed server-side.
-- alter table institutes enable row level security;
-- alter table users_profile enable row level security;
-- ... (add policies as needed for client-side access)

/*
── SEED (demo data) ────────────────────────────────────────────────────────
To seed demo data run:
  npx tsx scripts/seed-supabase.ts

Or use the Supabase SQL editor with hashed passwords generated by bcrypt.
Demo accounts (password hashes are bcrypt rounds=10):
  admin@platform.test   / admin123
  admin@brightfuture.test / admin123
  priya@brightfuture.test / teacher123
  aarav@brightfuture.test / student123
────────────────────────────────────────────────────────────────────────────
*/
