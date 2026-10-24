import cors from "cors";
import express from "express";
import {
  clearLoginFailures,
  createSession,
  deleteSession,
  findTablet,
  hashSecret,
  loginLockMinutes,
  newSecret,
  recordLoginFailure,
  requireAdmin,
  verifyPassword,
} from "./auth.js";
import { query, setupDatabase, transaction } from "./db.js";
import {
  deliveryQuote,
  deliverySettings,
  isDeliveryAvailable,
  isInItaly,
} from "./delivery.js";
import { TIME_ZONE, availableSlots, slotCapacity } from "./slots.js";

const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

const ORDER_TYPES = ["sul_posto", "ritiro", "consegna"];
const ORDER_STATUSES = ["nuovo", "in_preparazione", "pronto", "completato"];
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

// Also with decimals, like kilometres and euro
const decimal = (value, min, max) =>
  Number.isFinite(value) && value >= min && value <= max ? value : null;

// Italian mobile (3xx) or landline (0xx) number, with or without +39.
// Saved as digits only, so the same number always looks the same.
const phone = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const digits = value.replace(/[\s./-]/g, "").replace(/^(\+|00)39/, "");
  return /^(3[0-9]{8,9}|0[0-9]{5,10})$/.test(digits) ? digits : null;
};

// "HH:MM" in 24-hour format
const timeOfDay = (value) =>
  typeof value === "string" && /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value)
    ? value
    : null;

const app = express();
// Proxies between the internet and the server (Render has some): with the right number
// req.ip is the visitor's address, used to lock the admin login. 0 on the PC.
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS) || 0);
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

const dishCount = (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0);

// Free pickup or delivery times for an order with this many dishes
app.get("/api/slots", async (req, res) => {
  const orderType = ["ritiro", "consegna"].includes(req.query.type)
    ? req.query.type
    : null;
  const dishes = integer(Number(req.query.dishes), 1, MAX_ITEMS * MAX_QUANTITY);
  if (!orderType || !dishes) {
    throw new RequestError("Richiesta non valida");
  }
  res.json({
    slots: await availableSlots(orderType, dishes),
    maxDishes: await slotCapacity(),
  });
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
    customerLat: null,
    customerLon: null,
    scheduledAt: null,
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
    // Coordinates of the address chosen among the suggestions
    if (!isInItaly(body.customerLat, body.customerLon)) {
      throw new RequestError("Scegli l'indirizzo dall'elenco dei suggerimenti");
    }
    order.customerLat = body.customerLat;
    order.customerLon = body.customerLon;
  }
  // Checked against the free slots when the order is saved
  order.scheduledAt =
    typeof body.scheduledAt === "string" ? new Date(body.scheduledAt) : null;
  if (!order.scheduledAt || isNaN(order.scheduledAt)) {
    throw new RequestError("Scegli l'orario");
  }
  return order;
};

// The total is always computed from the database prices
app.post("/api/orders", async (req, res) => {
  const order = await readOrder(req);
  const { rows: limits } = await query(
    `SELECT max_dishes_per_order AS "maxDishes",
       max_orders_per_phone AS "maxOrdersPerPhone"
     FROM settings`
  );
  // A big table can always order: the limit is for pickup and delivery
  if (
    order.orderType !== "sul_posto" &&
    dishCount(order.items) > limits[0].maxDishes
  ) {
    throw new RequestError(
      `Puoi ordinare al massimo ${limits[0].maxDishes} pizze: per ordini più grandi chiama la pizzeria`
    );
  }
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

  // Delivery: inside the zone, above the minimum order, plus the fee of its distance
  let delivery = { km: null, fee: 0 };
  if (order.orderType === "consegna") {
    const settings = await deliverySettings();
    if (!isDeliveryAvailable(settings)) {
      throw new RequestError("Le consegne non sono ancora disponibili");
    }
    delivery = deliveryQuote(settings, order.customerLat, order.customerLon);
    if (!delivery.isInZone) {
      throw new RequestError(
        `L'indirizzo è fuori dalla zona di consegna (${delivery.km} km, massimo ${settings.radiusKm} km)`
      );
    }
    if (totalCents < Math.round(settings.minOrder * 100)) {
      throw new RequestError(
        `Per la consegna l'ordine minimo è ${settings.minOrder.toFixed(2).replace(".", ",")} euro`
      );
    }
  }
  const deliveryCents = Math.round(delivery.fee * 100);

  const id = await transaction(async (client) => {
    if (order.scheduledAt) {
      // One order at a time, so two customers cannot take the last place in a slot
      await client.query("SELECT pg_advisory_xact_lock(1)");
      const slots = await availableSlots(
        order.orderType,
        dishCount(order.items),
        client
      );
      if (
        !slots.some(
          (slot) => slot.time.getTime() === order.scheduledAt.getTime()
        )
      ) {
        throw new RequestError(
          "L'orario scelto non è più disponibile, scegline un altro",
          409
        );
      }
    }
    if (order.customerPhone) {
      // Orders of today, in Italian time, with the same number
      const { rows: sameDay } = await client.query(
        `SELECT COUNT(*)::int AS count FROM orders
         WHERE customer_phone = $1
           AND created_at >= date_trunc('day', now() AT TIME ZONE $2) AT TIME ZONE $2`,
        [order.customerPhone, TIME_ZONE]
      );
      if (sameDay[0].count >= limits[0].maxOrdersPerPhone) {
        throw new RequestError(
          "Con questo numero sono già stati fatti troppi ordini oggi: per altri ordini chiama la pizzeria",
          429
        );
      }
    }
    const { rows } = await client.query(
      `INSERT INTO orders (order_type, tablet_id, table_number, customer_name,
         customer_phone, customer_address, scheduled_at, total, customer_lat,
         customer_lon, delivery_km, delivery_fee)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        order.orderType,
        order.tabletId,
        order.tableNumber,
        order.customerName,
        order.customerPhone,
        order.customerAddress,
        order.scheduledAt,
        (totalCents + deliveryCents) / 100,
        order.customerLat,
        order.customerLon,
        delivery.km,
        deliveryCents / 100,
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
    scheduledAt: order.scheduledAt,
    deliveryFee: deliveryCents / 100,
    total: (totalCents + deliveryCents) / 100,
  });
});

// What the customer needs to know before choosing the delivery address
app.get("/api/delivery", async (req, res) => {
  const settings = await deliverySettings();
  res.json({
    isAvailable: isDeliveryAvailable(settings),
    center: isDeliveryAvailable(settings)
      ? { lat: settings.pizzeriaLat, lon: settings.pizzeriaLon }
      : null,
    radiusKm: settings.radiusKm,
    minOrder: settings.minOrder,
    fees: settings.fees,
  });
});

// Distance and fee for the address chosen by the customer
app.get("/api/delivery/quote", async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!isInItaly(lat, lon)) {
    throw new RequestError("Indirizzo non valido");
  }
  const settings = await deliverySettings();
  if (!isDeliveryAvailable(settings)) {
    throw new RequestError("Le consegne non sono ancora disponibili");
  }
  res.json(deliveryQuote(settings, lat, lon));
});

app.post("/api/admin/login", async (req, res) => {
  const lockMinutes = loginLockMinutes(req.ip);
  if (lockMinutes > 0) {
    throw new RequestError(
      `Troppe password sbagliate: riprova tra ${lockMinutes} minuti`,
      429
    );
  }
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
    recordLoginFailure(req.ip);
    throw new RequestError("Nome utente o password errati", 401);
  }
  clearLoginFailures(req.ip);
  const token = await createSession(rows[0].id);
  res.json({ token, username: rows[0].username });
});

app.post("/api/admin/logout", requireAdmin, async (req, res) => {
  await deleteSession(req.adminToken);
  res.status(204).end();
});

// Orders still to complete first, the most urgent on top (pickup or delivery time,
// arrival time for orders at the table); completed orders below, the latest first
app.get("/api/admin/orders", requireAdmin, async (req, res) => {
  const { rows } = await query(
    `SELECT orders.id,
       orders.order_type AS "orderType",
       orders.status,
       orders.table_number AS "tableNumber",
       orders.customer_name AS "customerName",
       orders.customer_phone AS "customerPhone",
       orders.customer_address AS "customerAddress",
       orders.scheduled_at AS "scheduledAt",
       orders.driver_id AS "driverId",
       orders.customer_lat AS "customerLat",
       orders.customer_lon AS "customerLon",
       orders.delivery_km::float8 AS "deliveryKm",
       orders.delivery_fee::float8 AS "deliveryFee",
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
     ORDER BY orders.status = 'completato',
       CASE WHEN orders.status <> 'completato'
         THEN COALESCE(orders.scheduled_at, orders.created_at) END,
       COALESCE(orders.scheduled_at, orders.created_at) DESC,
       orders.id
     LIMIT 100`
  );
  res.json(rows);
});

app.put("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
  const id = integer(Number(req.params.id), 1, 2147483647);
  if (!id || !ORDER_STATUSES.includes(req.body?.status)) {
    throw new RequestError("Richiesta non valida");
  }
  const { rowCount } = await query(
    "UPDATE orders SET status = $1 WHERE id = $2",
    [req.body.status, id]
  );
  if (rowCount === 0) {
    throw new RequestError("Ordine non trovato", 404);
  }
  res.status(204).end();
});

// A driver takes one delivery per slot
app.put("/api/admin/orders/:id/driver", requireAdmin, async (req, res) => {
  const id = integer(Number(req.params.id), 1, 2147483647);
  // null takes the driver off the delivery
  const driverId = req.body?.driverId;
  if (!id || (driverId !== null && !integer(driverId, 1, 2147483647))) {
    throw new RequestError("Richiesta non valida");
  }
  const { rows: orders } = await query(
    "SELECT scheduled_at FROM orders WHERE id = $1 AND order_type = 'consegna'",
    [id]
  );
  if (orders.length === 0) {
    throw new RequestError("Consegna non trovata", 404);
  }
  if (driverId) {
    const { rows: drivers } = await query(
      "SELECT 1 FROM drivers WHERE id = $1",
      [driverId]
    );
    if (drivers.length === 0) {
      throw new RequestError("Driver non trovato", 404);
    }
    const { rows: busy } = await query(
      `SELECT 1 FROM orders
       WHERE driver_id = $1 AND id <> $2 AND scheduled_at = $3`,
      [driverId, id, orders[0].scheduled_at]
    );
    if (busy.length !== 0) {
      throw new RequestError(
        "Questo driver ha già una consegna allo stesso orario",
        409
      );
    }
  }
  await query("UPDATE orders SET driver_id = $1 WHERE id = $2", [driverId, id]);
  res.status(204).end();
});

const openingHours = async () => {
  const { rows } = await query(
    `SELECT weekday, is_open AS "isOpen",
       to_char(first_slot, 'HH24:MI') AS "firstSlot",
       to_char(last_slot, 'HH24:MI') AS "lastSlot"
     FROM opening_hours
     ORDER BY weekday`
  );
  return rows;
};

app.get("/api/admin/opening-hours", requireAdmin, async (req, res) => {
  res.json(await openingHours());
});

// The whole week is saved at once
app.put("/api/admin/opening-hours", requireAdmin, async (req, res) => {
  const days = Array.isArray(req.body) ? req.body : [];
  const week = days.map((day) => ({
    weekday: integer(day?.weekday, 1, 7),
    isOpen: typeof day?.isOpen === "boolean" ? day.isOpen : null,
    firstSlot: timeOfDay(day?.firstSlot),
    lastSlot: timeOfDay(day?.lastSlot),
  }));
  if (
    week.length !== 7 ||
    new Set(week.map((day) => day.weekday)).size !== 7 ||
    week.some(
      (day) =>
        !day.weekday || day.isOpen === null || !day.firstSlot || !day.lastSlot
    )
  ) {
    throw new RequestError("Orari non validi");
  }
  if (week.some((day) => day.firstSlot > day.lastSlot)) {
    throw new RequestError(
      "L'ultima fascia non può essere prima della prima fascia"
    );
  }
  await transaction(async (client) => {
    for (const day of week) {
      await client.query(
        `UPDATE opening_hours
         SET is_open = $2, first_slot = $3, last_slot = $4
         WHERE weekday = $1`,
        [day.weekday, day.isOpen, day.firstSlot, day.lastSlot]
      );
    }
  });
  res.json(await openingHours());
});

app.get("/api/admin/delivery", requireAdmin, async (req, res) => {
  res.json(await deliverySettings());
});

// The pizzeria address comes from the suggestions, like the customers' ones
app.put("/api/admin/delivery", requireAdmin, async (req, res) => {
  const body = req.body || {};
  const pizzeriaAddress = text(body.pizzeriaAddress, 5, 200);
  const radiusKm = decimal(body.radiusKm, 0.5, 50);
  const minOrder = decimal(body.minOrder, 0, 500);
  const fees = Array.isArray(body.fees)
    ? body.fees.map((band) => ({
        upToKm: decimal(band?.upToKm, 0.5, 50),
        fee: decimal(band?.fee, 0, 50),
      }))
    : [];
  if (!pizzeriaAddress || !isInItaly(body.pizzeriaLat, body.pizzeriaLon)) {
    throw new RequestError("Scegli l'indirizzo della pizzeria dai suggerimenti");
  }
  if (radiusKm === null) {
    throw new RequestError("Il raggio va da 0,5 a 50 km");
  }
  if (minOrder === null) {
    throw new RequestError("L'ordine minimo va da 0 a 500 euro");
  }
  if (
    fees.length === 0 ||
    fees.length > 6 ||
    fees.some((band) => band.upToKm === null || band.fee === null)
  ) {
    throw new RequestError(
      "Fasce di costo non valide: da 1 a 6 fasce, km da 0,5 a 50, costo da 0 a 50 euro"
    );
  }
  if (fees.some((band, index) => index > 0 && band.upToKm <= fees[index - 1].upToKm)) {
    throw new RequestError("Le fasce di costo vanno messe dalla più vicina alla più lontana");
  }
  await query(
    `UPDATE settings SET pizzeria_address = $1, pizzeria_lat = $2,
       pizzeria_lon = $3, delivery_radius_km = $4, delivery_min_order = $5,
       delivery_fees = $6`,
    [
      pizzeriaAddress,
      body.pizzeriaLat,
      body.pizzeriaLon,
      radiusKm,
      minOrder,
      JSON.stringify(fees),
    ]
  );
  res.json(await deliverySettings());
});

const kitchenSettings = async () => {
  const { rows } = await query(
    `SELECT pizzas_per_hour AS "pizzasPerHour",
       max_dishes_per_order AS "maxDishesPerOrder",
       max_orders_per_phone AS "maxOrdersPerPhone"
     FROM settings`
  );
  return rows[0];
};

app.get("/api/admin/kitchen", requireAdmin, async (req, res) => {
  res.json(await kitchenSettings());
});

app.put("/api/admin/kitchen", requireAdmin, async (req, res) => {
  const pizzasPerHour = integer(req.body?.pizzasPerHour, 4, 400);
  const maxDishesPerOrder = integer(req.body?.maxDishesPerOrder, 1, 100);
  const maxOrdersPerPhone = integer(req.body?.maxOrdersPerPhone, 1, 50);
  if (!pizzasPerHour) {
    throw new RequestError("Le pizze all'ora vanno da 4 a 400");
  }
  if (!maxDishesPerOrder) {
    throw new RequestError("Le pizze per ordine vanno da 1 a 100");
  }
  if (!maxOrdersPerPhone) {
    throw new RequestError("Gli ordini al giorno per telefono vanno da 1 a 50");
  }
  await query(
    `UPDATE settings SET pizzas_per_hour = $1, max_dishes_per_order = $2,
       max_orders_per_phone = $3`,
    [pizzasPerHour, maxDishesPerOrder, maxOrdersPerPhone]
  );
  res.json(await kitchenSettings());
});

app.get("/api/admin/drivers", requireAdmin, async (req, res) => {
  const { rows } = await query(
    `SELECT id, name, is_active AS "isActive"
     FROM drivers
     ORDER BY name, id`
  );
  res.json(rows);
});

app.post("/api/admin/drivers", requireAdmin, async (req, res) => {
  const name = text(req.body?.name, 2, 60);
  if (!name) {
    throw new RequestError("Inserisci il nome del driver");
  }
  const { rows } = await query(
    `INSERT INTO drivers (name) VALUES ($1)
     RETURNING id, name, is_active AS "isActive"`,
    [name]
  );
  res.status(201).json(rows[0]);
});

// Drivers on duty decide how many deliveries each slot accepts
app.patch("/api/admin/drivers/:id", requireAdmin, async (req, res) => {
  const id = integer(Number(req.params.id), 1, 2147483647);
  if (!id || typeof req.body?.isActive !== "boolean") {
    throw new RequestError("Richiesta non valida");
  }
  await query("UPDATE drivers SET is_active = $1 WHERE id = $2", [
    req.body.isActive,
    id,
  ]);
  res.status(204).end();
});

app.delete("/api/admin/drivers/:id", requireAdmin, async (req, res) => {
  const id = integer(Number(req.params.id), 1, 2147483647);
  if (!id) {
    throw new RequestError("Driver non valido");
  }
  await query("DELETE FROM drivers WHERE id = $1", [id]);
  res.status(204).end();
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
