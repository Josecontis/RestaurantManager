// Loads the starter photos of db/photos for the dishes that have none.
// A new database gets them by itself: this is for databases created before.
// Usage: npm run load-photos
import { pool, setupDatabase } from "../db.js";
import { loadStarterPhotos } from "../images.js";

await setupDatabase();
console.log(`Photos loaded: ${await loadStarterPhotos(pool)}`);
await pool.end();
