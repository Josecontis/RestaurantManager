import { readFile, readdir } from "node:fs/promises";

// Only photo formats, recognised by their first bytes: an SVG or a page
// renamed .jpg could run code in the browser
const SIGNATURES = {
  "image/jpeg": (data) => data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff,
  "image/png": (data) =>
    data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": (data) =>
    data.subarray(0, 4).toString("latin1") === "RIFF" &&
    data.subarray(8, 12).toString("latin1") === "WEBP",
};

export const IMAGE_TYPES = Object.keys(SIGNATURES);

export const isImage = (contentType, data) =>
  Buffer.isBuffer(data) && Boolean(SIGNATURES[contentType]?.(data));

// The version in the address lets browsers keep a photo until it changes
export const imageUrl = (key) => `/api/images/${key}?v=${Date.now()}`;

export const saveImage = (db, key, contentType, data) =>
  db.query(
    `INSERT INTO images (key, content_type, data) VALUES ($1, $2, $3)
     ON CONFLICT (key) DO UPDATE SET content_type = EXCLUDED.content_type,
       data = EXCLUDED.data, updated_at = now()`,
    [key, contentType, data]
  );

const PHOTOS_DIR = new URL("./db/photos/", import.meta.url);

// "Prosciutto e Funghi" -> "prosciutto-e-funghi", the name of its file in db/photos
const fileName = (dishName) =>
  dishName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Starter photos (free Pexels photos) for the dishes that have none yet
export const loadStarterPhotos = async (db) => {
  const files = new Set(await readdir(PHOTOS_DIR));
  const { rows: dishes } = await db.query(
    "SELECT id, name FROM dishes WHERE image_url IS NULL"
  );
  let count = 0;
  for (const dish of dishes) {
    const file = `${fileName(dish.name)}.jpg`;
    if (files.has(file)) {
      const key = `dish-${dish.id}`;
      await saveImage(db, key, "image/jpeg", await readFile(new URL(file, PHOTOS_DIR)));
      await db.query("UPDATE dishes SET image_url = $1 WHERE id = $2", [
        imageUrl(key),
        dish.id,
      ]);
      count += 1;
    }
  }
  return count;
};
