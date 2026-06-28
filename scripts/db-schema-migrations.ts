import { Client } from 'pg'

const connectionString = 'postgresql://postgres:8RZ0HURDW2u9AsNW@db.getwvnznpwtbbjdrudug.supabase.co:5432/postgres'

const migrationSQL = `
-- 1. Unique constraint on institutes.email
ALTER TABLE institutes DROP CONSTRAINT IF EXISTS institutes_email_unique;
ALTER TABLE institutes ADD CONSTRAINT institutes_email_unique UNIQUE (email);

-- 2. users_profile.student_id self-referencing foreign key
ALTER TABLE users_profile DROP CONSTRAINT IF EXISTS fk_users_profile_student;
ALTER TABLE users_profile ADD CONSTRAINT fk_users_profile_student 
  FOREIGN KEY (student_id) REFERENCES users_profile(id) ON DELETE SET NULL;

-- 3. CHECK constraint on fee_status
-- Clean up invalid values if any exist
UPDATE users_profile SET fee_status = 'DUE' WHERE fee_status NOT IN ('PAID', 'DUE');
ALTER TABLE users_profile DROP CONSTRAINT IF EXISTS chk_users_profile_fee_status;
ALTER TABLE users_profile ADD CONSTRAINT chk_users_profile_fee_status 
  CHECK (fee_status IN ('PAID', 'DUE'));

-- 4. Soft delete columns on all core tables
ALTER TABLE institutes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE batch_students ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE invite_codes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 5. Partial unique index on batches.join_code (ignoring soft-deleted batches)
DROP INDEX IF EXISTS idx_batches_join_code;
CREATE UNIQUE INDEX IF NOT EXISTS idx_batches_join_code ON batches(join_code) WHERE deleted_at IS NULL;

-- 6. Partitioning the attendance table
-- We rename the old attendance table, create the partitioned table, copy records, and drop the old table.
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance') 
     AND NOT EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'attendance' AND c.relkind = 'p') THEN
    
    -- Rename old table
    ALTER TABLE attendance RENAME TO attendance_old;
    
    -- Create partitioned table
    CREATE TABLE attendance (
      id           uuid not null default gen_random_uuid(),
      batch_id     uuid not null references batches(id) on delete cascade,
      student_id   uuid not null references users_profile(id) on delete cascade,
      institute_id uuid not null references institutes(id) on delete cascade,
      date         date not null,
      status       text not null,
      marked_by_id uuid,
      deleted_at   timestamptz,
      primary key (id, date),
      unique (batch_id, student_id, date)
    ) PARTITION BY RANGE (date);
    
    -- Create partitions
    CREATE TABLE IF NOT EXISTS attendance_y2025 PARTITION OF attendance
      FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
      
    CREATE TABLE IF NOT EXISTS attendance_y2026 PARTITION OF attendance
      FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
      
    CREATE TABLE IF NOT EXISTS attendance_y2027 PARTITION OF attendance
      FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
      
    CREATE TABLE IF NOT EXISTS attendance_default PARTITION OF attendance DEFAULT;
    
    -- Copy data
    INSERT INTO attendance (id, batch_id, student_id, institute_id, date, status, marked_by_id, deleted_at)
    SELECT id, batch_id, student_id, institute_id, date, status, marked_by_id, NULL FROM attendance_old;
    
    -- Drop old table
    DROP TABLE attendance_old;
    
  END IF;
END $$;
`

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  await client.connect()
  console.log('Connected to PostgreSQL database.')

  try {
    await client.query(migrationSQL)
    console.log('✅ Executed schema migrations successfully.')
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message)
  }

  await client.end()
  console.log('Database connection closed.')
}

run().catch(console.error)
