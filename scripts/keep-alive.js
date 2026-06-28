const email = 'admin@brightfuture.test';
const password = 'admin123';
const appUrl = process.env.APP_URL || 'http://localhost:3000';

async function run() {
  const loginUrl = `${appUrl.replace(/\/$/, '')}/api/auth/login`;
  console.log(`[Keep Alive] Pinging login at: ${loginUrl}`);

  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const text = await res.text();
  if (res.ok) {
    console.log('✅ Success: Logged in successfully. Supabase pinged.');
    console.log('Response:', text);
  } else {
    console.error(`❌ Failed: HTTP error ${res.status}`);
    console.error('Response:', text);
    process.exit(1);
  }
}

run().catch(err => {
  console.error('❌ Error running ping:', err);
  process.exit(1);
});
