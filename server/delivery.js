import { query } from "./db.js";

const EARTH_RADIUS_KM = 6371;
const radians = (degrees) => (degrees * Math.PI) / 180;

// Box around Italy: addresses come from the suggestions, coordinates outside are fake
export const isInItaly = (lat, lon) =>
  Number.isFinite(lat) &&
  Number.isFinite(lon) &&
  lat >= 35 &&
  lat <= 47.5 &&
  lon >= 6 &&
  lon <= 19;

// Straight-line distance, not along the roads
const distanceKm = (fromLat, fromLon, toLat, toLon) => {
  const a =
    Math.sin(radians(toLat - fromLat) / 2) ** 2 +
    Math.cos(radians(fromLat)) *
      Math.cos(radians(toLat)) *
      Math.sin(radians(toLon - fromLon) / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
};

export const deliverySettings = async (db = { query }) => {
  const { rows } = await db.query(
    `SELECT pizzeria_address AS "pizzeriaAddress",
       pizzeria_lat AS "pizzeriaLat",
       pizzeria_lon AS "pizzeriaLon",
       delivery_radius_km::float8 AS "radiusKm",
       delivery_min_order::float8 AS "minOrder",
       delivery_fees AS fees
     FROM settings`
  );
  return rows[0];
};

// Deliveries start once the admin has set where the pizzeria is
export const isDeliveryAvailable = (settings) => settings.pizzeriaLat !== null;

// Distance rounded to 100 m, whether it is inside the zone and the fee of its band
export const deliveryQuote = (settings, lat, lon) => {
  const km =
    Math.round(
      distanceKm(settings.pizzeriaLat, settings.pizzeriaLon, lat, lon) * 10
    ) / 10;
  const band =
    settings.fees.find((item) => km <= item.upToKm) ||
    settings.fees[settings.fees.length - 1];
  return { km, isInZone: km <= settings.radiusKm, fee: band.fee };
};
