import { query } from "./db.js";

// Pickup and delivery times: today only, in Italian time
const TIME_ZONE = "Europe/Rome";
const FIRST_SLOT = "19:00";
const LAST_SLOT = "23:00";
const SLOT_MINUTES = 15;
// Time needed to prepare an order
const MIN_NOTICE_MINUTES = 30;
// Oven capacity: dishes for pickup and delivery in the same slot
export const MAX_DISHES_PER_SLOT = 6;
// One rider: one delivery per slot
const MAX_DELIVERIES_PER_SLOT = 1;

// Slots that can still take an order of this type with this many dishes.
// db is the transaction client when the result is used to accept an order.
export const availableSlots = async (orderType, dishes, db = { query }) => {
  const { rows } = await db.query(
    `SELECT slot AS time, to_char(slot AT TIME ZONE $1, 'HH24:MI') AS label
     FROM generate_series(
       (date_trunc('day', now() AT TIME ZONE $1) + $2::time) AT TIME ZONE $1,
       (date_trunc('day', now() AT TIME ZONE $1) + $3::time) AT TIME ZONE $1,
       make_interval(mins => $4)
     ) AS slot
     WHERE slot >= now() + make_interval(mins => $5)
       AND (
         SELECT COALESCE(SUM(order_items.quantity), 0)
         FROM orders JOIN order_items ON order_items.order_id = orders.id
         WHERE orders.scheduled_at = slot
       ) + $6 <= $7
       AND (
         $8 <> 'consegna' OR (
           SELECT COUNT(*) FROM orders
           WHERE orders.scheduled_at = slot AND orders.order_type = 'consegna'
         ) < $9
       )
     ORDER BY slot`,
    [
      TIME_ZONE,
      FIRST_SLOT,
      LAST_SLOT,
      SLOT_MINUTES,
      MIN_NOTICE_MINUTES,
      dishes,
      MAX_DISHES_PER_SLOT,
      orderType,
      MAX_DELIVERIES_PER_SLOT,
    ]
  );
  return rows;
};
