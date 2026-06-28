import { Client } from 'pg';

const connectionString = 'postgresql://postgres:8RZ0HURDW2u9AsNW@db.getwvnznpwtbbjdrudug.supabase.co:5432/postgres';

const tables = [
  'institutes',
  'users_profile',
  'batches',
  'batch_students',
  'exams',
  'marks',
  'attendance',
  'announcements',
  'fee_payments',
  'payments',
  'invite_codes',
  'password_reset_tokens',
  'audit_logs',
  'rate_limits',
  'invoices',
  'notification_queue',
  'whatsapp_logs'
];

async function enableRLS() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to PostgreSQL database.');

  for (const table of tables) {
    try {
      await client.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`✅ Enabled RLS on table: ${table}`);
    } catch (err: any) {
      console.error(`❌ Failed to enable RLS on table ${table}:`, err.message);
    }
  }

  await client.end();
  console.log('Database connection closed.');
}

enableRLS().catch(console.error);
