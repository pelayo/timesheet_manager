import 'dotenv/config';
import { Client } from 'pg';

async function bootstrap() {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const user = process.env.DB_USERNAME || 'postgres';
  const pass = process.env.DB_PASSWORD || 'postgres';
  const db = process.env.DB_NAME || 'timesheet';
  
  const client = new Client({
    connectionString: `postgres://${user}:${pass}@${host}:${port}/${db}`,
  });
  
  try {
    await client.connect();

    const domain = process.env.TEAMWORK_DOMAIN;
    const apiKey = process.env.TEAMWORK_API_KEY;

    console.log(`🚀 Queueing Teamwork Migration Job...`);
    
    // We insert directly into pgboss.job table to avoid dependency issues in script context.
    // pgboss worker (backend) will pick it up.
    const query = `
      INSERT INTO pgboss.job (name, data) 
      VALUES ($1, $2) 
      RETURNING id
    `;
    const values = ['teamwork-import', { domain, apiKey }];
    
    const res = await client.query(query, values);
    const jobId = res.rows[0].id;

    console.log(`✅ Job enqueued with ID: ${jobId}`);
  } catch (err) {
      console.error('Failed to enqueue job:', err);
  } finally {
      await client.end();
      process.exit(0);
  }
}

bootstrap();