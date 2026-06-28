import { Client } from 'pg'

const connectionString = 'postgresql://postgres:8RZ0HURDW2u9AsNW@db.getwvnznpwtbbjdrudug.supabase.co:5432/postgres'

const migrationSQL = `
-- Create whatsapp_logs table
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id uuid REFERENCES institutes(id) ON DELETE CASCADE,
  recipient text NOT NULL,
  status text NOT NULL,
  message_type text,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on whatsapp_logs
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Add webhook_url column to institutes
ALTER TABLE institutes ADD COLUMN IF NOT EXISTS webhook_url text;
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
    console.log('✅ Executed CRM database updates successfully.')
  } catch (err: any) {
    console.error('❌ Failed to execute migration:', err.message)
  }

  await client.end()
  console.log('Database connection closed.')
}

run().catch(console.error)
