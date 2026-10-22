// Creates an admin, or changes the password of an existing one.
// Usage: npm run create-admin -- <username> <password>
import { hashPassword } from "../auth.js";
import { pool, setupDatabase } from "../db.js";

const [username, password] = process.argv.slice(2);
if (!username || !password || password.length < 8) {
  console.error(
    "Usage: npm run create-admin -- <username> <password> (at least 8 characters)"
  );
  process.exit(1);
}

await setupDatabase();
await pool.query(
  `INSERT INTO admins (username, password_hash) VALUES ($1, $2)
   ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
  [username, await hashPassword(password)]
);
console.log(`Admin "${username}" saved`);
await pool.end();
