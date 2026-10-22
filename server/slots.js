import { query } from "./db.js";

// Pickup and delivery times: today only, in Italian time, within today's opening hours
const TIME_ZONE = "Europe/Rome";
const SLOT_MINUTES = 15;
// Time needed to prepare an order
const MIN_NOTICE_MINUTES = 30;
// Oven capacity: dishes for pickup and delivery in the same slot
export const MAX_DISHES_PER_SLOT = 6;

// Slots that can still take an order of this type with this many dishes.
// A delivery slot is free while it has fewer deliveries than drivers on duty.
// db is the transaction client when the result is used to accept an order.
export const availableSlots = async (orderType, dishes, db = { query }) => {
  const { rows } = await db.query(
    `SELECT slot AS time, to_char(slot AT TIME ZONE $1, 'HH24:MI') AS label
     FROM opening_hours,
       generate_series(
         (date_trunc('day', now() AT TIME ZONE $1) + opening_hours.first_slot) AT TIME ZONE $1,
         (date_trunc('day', now() AT TIME ZONE $1) + opening_hours.last_slot) AT TIME ZONE $1,
         make_interval(mins => $2)
       ) AS slot
     WHERE opening_hours.weekday = EXTRACT(ISODOW FROM now() AT TIME ZONE $1)
       AND opening_hours.is_open
       AND slot >= now() + make_interval(mins => $3)
       AND (
         SELECT COALESCE(SUM(order_items.quantity), 0)
         FROM orders JOIN order_items ON order_items.order_id = orders.id
         WHERE orders.scheduled_at = slot
       ) + $4 <= $5
       AND (
         $6 <> 'consegna' OR (
           SELECT COUNT(*) FROM orders
           WHERE orders.scheduled_at = slot AND orders.order_type = 'consegna'
         ) < (SELECT COUNT(*) FROM drivers WHERE drivers.is_active)
       )
     ORDER BY slot`,
    [
      TIME_ZONE,
      SLOT_MINUTES,
      MIN_NOTICE_MINUTES,
      dishes,
      MAX_DISHES_PER_SLOT,
      orderType,
    ]
  );
  return rows;
};
