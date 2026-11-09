import { neon } from '@neondatabase/serverless';
import { readFile, readdir } from 'node:fs/promises';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running migrations.');
const sql = neon(process.env.DATABASE_URL);
const directory = new URL('../migrations/', import.meta.url);
for (const file of (await readdir(directory)).filter(name => name.endsWith('.sql')).sort()) {
  const migration = await readFile(new URL(file, directory), 'utf8');
  for (const statement of migration.split(';').map(s => s.trim()).filter(Boolean)) await sql.query(statement);
}
console.log('Registration schema is ready.');
