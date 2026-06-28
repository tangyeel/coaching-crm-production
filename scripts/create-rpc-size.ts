import { Client } from 'pg';

const connectionString = 'postgresql://postgres:8RZ0HURDW2u9AsNW@db.getwvnznpwtbbjdrudug.supabase.co:5432/postgres';

async function createRpc() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to PostgreSQL database.');

  try {
    await client.query(`
      CREATE OR REPLACE FUNCTION get_db_size() RETURNS bigint AS $$
        SELECT pg_database_size(current_database());
      $$ LANGUAGE sql SECURITY DEFINER;
    `);
    console.log('✅ Created RPC function get_db_size()');
  } catch (err: any) {
    console.error('❌ Failed to create RPC function:', err.message);
  }

  await client.end();
  console.log('Database connection closed.');
}

createRpc().catch(console.error);
