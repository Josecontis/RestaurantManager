import cors from "cors";
import express from "express";
import {
  createSession,
  deleteSession,
  findTablet,
  hashSecret,
  newSecret,
  requireAdmin,
  verifyPassword,
} from "./auth.js";
import { query, setupDatabase, transaction } from "./db.js";

const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

const ORDER_TYPES = ["sul_posto", "ritiro", "consegna"];
const MAX_ITEMS = 50;
const MAX_QUANTITY = 50;
const MAX_TABLE = 999;

// Errors whose message is shown to the user
class RequestError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const text = (value, min, max) =>
  typeof value === "string" &&
  value.trim().length >= min &&
  value.trim().length <= max
    ? value.trim()
    : null;

const integer = (value, min, max) =>
  Number.isInteger(value) && value >= min && value <= max ? value : null;

const phone = (value) =>
  typeof value === "string" && /^\+?[0-9 ]{6,20}$/.test(value.trim())
    ? value.trim()
    : null;

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: "20kb" }));

// Also wakes up the database, used by the app while the server starts
app.get("/api/health", async (req, res) => {
  await query("SELECT 1");
  res.json({ status: "ok" });
});

// Categories with at least one dish, each with its dishes
app.get("/api/menu", async (req, res) => {
  const { rows } = await query(
    `SELECT categories.id, categories.name,
       json_agg(json_build_object(
         'id', dishes.id,
         'name', dishes.name,
         'description', dishes.description,
         'price', dishes.price,
         'allergens', dishes.allergens,
         'ingredients', dishes.ingredients,
         'imageUrl', dishes.image_url
       ) ORDER BY dishes.id) AS dishes
     FROM categories JOIN dishes ON dishes.category_id = categories.id
     GROUP BY categories.id
     ORDER BY categories.position`
  );
  res.json(rows);
});

const readOrder = async (req) => {
  const body = req.body || {};
  const order = {
    orderType: ORDER_TYPES.includes(body.orderType) ? body.orderType : null,
    tabletId: null,
    tableNumber: null,
    customerName: null,
    customerPhone: null,
    customerAddress: null,
  };
  if (!order.orderType) {
    throw new RequestError("Tipo di ordine non valido");
  }
  if (
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    body.items.length > MAX_ITEMS
  ) {
    throw new RequestError("L'ordine è vuoto");
  }
  order.items = body.items.map((item) => ({
    dishId: integer(item?.dishId, 1, 2147483647),
    quantity: integer(item?.quantity, 1, MAX_QUANTITY),
  }));
  if (order.items.some((item) => !item.dishId || !item.quantity)) {
    throw new RequestError("Piatti dell'ordine non validi");
  }

  if (order.orderType === "sul_posto") {
    // A registered tablet always sends its own table
    const code = req.get("X-Tablet-Code");
    if (code) {
      const tablet = await findTablet(code);
      if (!tablet) {
        throw new RequestError(
          "Questo tablet non è più registrato: inserisci il numero del tavolo",
          401
        );
      }
      order.tabletId = tablet.id;
      order.tableNumber = tablet.table_number;
    } else {
      order.tableNumber = integer(body.tableNumber, 1, MAX_TABLE);
      if (!order.tableNumber) {
        throw new RequestError("Inserisci il numero del tavolo");
      }
    }
    return order;
  }

  order.customerName = text(body.customerName, 2, 100);
  if (!order.customerName) {
    throw new RequestError("Inserisci il nome");
  }
  order.customerPhone = phone(body.customerPhone);
  if (!order.customerPhone) {
    throw new RequestError("Inserisci un numero di telefono valido");
  }
  if (order.orderType === "consegna") {
    order.customerAddress = text(body.customerAddress, 5, 200);
    if (!order.customerAddress) {
      throw new RequestError("Inserisci l'indirizzo di consegna");
    }
  }
  return order;
};

// The total is always computed from the database prices
app.post("/api/orders", async (req, res) => {
  const order = await readOrder(req);
  const { rows: dishes } = await query(
    "SELECT id, price FROM dishes WHERE id = ANY($1::int[])",
    [order.items.map((item) => item.dishId)]
  );
  const prices = new Map(
    dishes.map((dish) => [dish.id, Math.round(Number(dish.price) * 100)])
  );
  if (order.items.some((item) => !prices.has(item.dishId))) {
    throw new RequestError("Alcuni piatti non sono più disponibili");
  }
  const totalCents = order.items.reduce(
    (sum, item) => sum + prices.get(item.dishId) * item.quantity,
    0
  );

  const id = await transaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO orders (order_type, tablet_id, table_number, customer_name,
         customer_phone, customer_address, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        order.orderType,
        order.tabletId,
        order.tableNumber,
        order.customerName,
        order.customerPhone,
        order.customerAddress,
        totalCents / 100,
      ]
    );
    for (const item of order.items) {
      await client.query(
        `INSERT INTO order_items (order_id, dish_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [rows[0].id, item.dishId, item.quantity, prices.get(item.dishId) / 100]
      );
    }
    return rows[0].id;
  });

  res.status(201).json({
    id,
    orderType: order.orderType,
    tableNumber: order.tableNumber,
    total: totalCents / 100,
  });
});

app.post("/api/admin/login", async (req, res) => {
  const username = text(req.body?.username, 1, 100);
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";
  const { rows } = username
    ? await query(
        "SELECT id, username, password_hash FROM admins WHERE username = $1",
        [username]
      )
    : { rows: [] };
  if (
    rows.length === 0 ||
    !(await verifyPassword(password, rows[0].password_hash))
  ) {
    throw new RequestError("Nome utente o password errati", 401);
  }
  const token = await createSession(rows[0].id);
  res.json({ token, username: rows[0].username });
});

app.post("/api/admin/logout", requireAdmin, async (req, res) => {
  await deleteSession(req.adminToken);
  res.status(204).end();
});

app.get("/api/admin/orders", requireAdmin, async (req, res) => {
  const { rows } = await query(
    `SELECT orders.id,
       orders.order_type AS "orderType",
       orders.table_number AS "tableNumber",
       orders.customer_name AS "customerName",
       orders.customer_phone AS "customerPhone",
       orders.customer_address AS "customerAddress",
       orders.total::float8 AS total,
       orders.created_at AS "createdAt",
       json_agg(json_build_object(
         'name', dishes.name,
         'quantity', order_items.quantity,
         'unitPrice', order_items.unit_price
       ) ORDER BY order_items.id) AS items
     FROM orders
     JOIN order_items ON order_items.order_id = orders.id
     JOIN dishes ON dishes.id = order_items.dish_id
     GROUP BY orders.id
     ORDER BY orders.created_at DESC
     LIMIT 100`
  );
  res.json(rows);
});

app.get("/api/admin/tablets", requireAdmin, async (req, res) => {
  const { rows } = await query(
    `SELECT id, table_number AS "tableNumber", created_at AS "createdAt"
     FROM tablets
     ORDER BY table_number, id`
  );
  res.json(rows);
});

// The code is returned only once: the database keeps just its hash
app.post("/api/admin/tablets", requireAdmin, async (req, res) => {
  const tableNumber = integer(req.body?.tableNumber, 1, MAX_TABLE);
  if (!tableNumber) {
    throw new RequestError("Numero del tavolo non valido");
  }
  const code = newSecret();
  const { rows } = await query(
    "INSERT INTO tablets (table_number, code_hash) VALUES ($1, $2) RETURNING id",
    [tableNumber, hashSecret(code)]
  );
  res.status(201).json({ id: rows[0].id, tableNumber, code });
});

app.delete("/api/admin/tablets/:id", requireAdmin, async (req, res) => {
  const id = integer(Number(req.params.id), 1, 2147483647);
  if (!id) {
    throw new RequestError("Tablet non valido");
  }
  await query("DELETE FROM tablets WHERE id = $1", [id]);
  res.status(204).end();
});

app.use((error, req, res, next) => {
  if (error instanceof RequestError) {
    return res.status(error.status).json({ error: error.message });
  }
  // Malformed or too large request bodies
  if (error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: "Richiesta non valida" });
  }
  console.error(error);
  res.status(500).json({ error: "Errore del server, riprova" });
});

await setupDatabase();
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
