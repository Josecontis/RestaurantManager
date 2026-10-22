import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { query } from "./db.js";

const scrypt = promisify(scryptCallback);
const SESSION_HOURS = 12;

// Tokens and tablet codes are long random values, so a plain SHA-256 is enough
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

export const newSecret = () => randomBytes(32).toString("base64url");

export const hashSecret = sha256;

export const hashPassword = async (password) => {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
};

export const verifyPassword = async (password, stored) => {
  const [salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "hex");
  const actual = await scrypt(password, salt, expected.length);
  return timingSafeEqual(expected, actual);
};

export const createSession = async (adminId) => {
  const token = newSecret();
  await query("DELETE FROM admin_sessions WHERE expires_at < now()");
  await query(
    `INSERT INTO admin_sessions (token_hash, admin_id, expires_at)
     VALUES ($1, $2, now() + make_interval(hours => $3))`,
    [sha256(token), adminId, SESSION_HOURS]
  );
  return token;
};

export const deleteSession = (token) =>
  query("DELETE FROM admin_sessions WHERE token_hash = $1", [sha256(token)]);

const bearerToken = (req) => {
  const header = req.get("Authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

export const requireAdmin = async (req, res, next) => {
  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Accesso admin richiesto" });
  }
  const { rows } = await query(
    `SELECT admins.id, admins.username
     FROM admin_sessions JOIN admins ON admins.id = admin_sessions.admin_id
     WHERE admin_sessions.token_hash = $1 AND admin_sessions.expires_at > now()`,
    [sha256(token)]
  );
  if (rows.length === 0) {
    return res.status(401).json({ error: "Sessione scaduta, accedi di nuovo" });
  }
  req.admin = rows[0];
  req.adminToken = token;
  next();
};

export const findTablet = async (code) => {
  const { rows } = await query(
    "SELECT id, table_number FROM tablets WHERE code_hash = $1",
    [sha256(code)]
  );
  return rows[0] || null;
};
