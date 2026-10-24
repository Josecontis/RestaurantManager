const API_URL = process.env.REACT_APP_API_URL;
const TABLET_KEY = "restaurantManager.tablet";
const ADMIN_KEY = "restaurantManager.admin";

export const orderTypeLabels = {
  sul_posto: "Mangia sul posto",
  ritiro: "Ritira",
  consegna: "Consegna",
};

export const orderTypeCode = (label) =>
  Object.keys(orderTypeLabels).find((code) => orderTypeLabels[code] === label);

// The browser storage can be missing or blocked: in that case nothing is remembered
const readStorage = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {}
};

// { id, tableNumber, code } of this device, when an admin registered it
export const getTablet = () => readStorage(TABLET_KEY);

// { token, username } of the admin logged in on this device
export const getAdmin = () => readStorage(ADMIN_KEY);

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const request = async (path, { method = "GET", body, headers = {} } = {}) => {
  let response;
  try {
    response = await fetch(API_URL + path, {
      method,
      headers: body ? { "Content-Type": "application/json", ...headers } : headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Server non raggiungibile, riprova tra poco", 0);
  }
  if (response.status === 204) {
    return null;
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      (data && data.error) || "Errore del server, riprova",
      response.status
    );
  }
  return data;
};

const adminRequest = async (path, options = {}) => {
  try {
    return await request(path, {
      ...options,
      headers: { Authorization: `Bearer ${getAdmin()?.token}` },
    });
  } catch (error) {
    if (error.status === 401) {
      writeStorage(ADMIN_KEY, null);
    }
    throw error;
  }
};

export const getMenu = () => request("/api/menu");

// { slots: [{ time, label }], maxDishes } for pickup or delivery
export const getSlots = (orderType, dishes) =>
  request(`/api/slots?type=${orderType}&dishes=${dishes}`);

// Slots are in Italian time wherever the device is
export const formatSlot = (time) =>
  new Date(time).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  });

// Same rule as the server: Italian mobile (3xx) or landline (0xx), with or without +39
export const isValidPhone = (value) =>
  /^(3[0-9]{8,9}|0[0-9]{5,10})$/.test(
    value.replace(/[\s./-]/g, "").replace(/^(\+|00)39/, "")
  );

export const sendOrder = async (order) => {
  const tablet = getTablet();
  try {
    return await request("/api/orders", {
      method: "POST",
      body: order,
      headers:
        tablet && order.orderType === "sul_posto"
          ? { "X-Tablet-Code": tablet.code }
          : {},
    });
  } catch (error) {
    // The admin removed this tablet: from now on the table number is asked
    if (error.status === 401) {
      writeStorage(TABLET_KEY, null);
    }
    throw error;
  }
};

export const adminLogin = async (username, password) => {
  const admin = await request("/api/admin/login", {
    method: "POST",
    body: { username, password },
  });
  writeStorage(ADMIN_KEY, admin);
  return admin;
};

export const adminLogout = async () => {
  try {
    await adminRequest("/api/admin/logout", { method: "POST" });
  } finally {
    writeStorage(ADMIN_KEY, null);
  }
};

export const getAdminOrders = () => adminRequest("/api/admin/orders");

// status: "nuovo", "in_preparazione", "pronto" or "completato"
export const setOrderStatus = (orderId, status) =>
  adminRequest(`/api/admin/orders/${orderId}/status`, {
    method: "PUT",
    body: { status },
  });

// driverId null takes the driver off the delivery
export const assignDriver = (orderId, driverId) =>
  adminRequest(`/api/admin/orders/${orderId}/driver`, {
    method: "PUT",
    body: { driverId },
  });

// [{ weekday, isOpen, firstSlot, lastSlot }], weekday 1 = Monday ... 7 = Sunday
export const getOpeningHours = () => adminRequest("/api/admin/opening-hours");

export const saveOpeningHours = (week) =>
  adminRequest("/api/admin/opening-hours", { method: "PUT", body: week });

export const getDrivers = () => adminRequest("/api/admin/drivers");

export const addDriver = (name) =>
  adminRequest("/api/admin/drivers", { method: "POST", body: { name } });

export const setDriverActive = (id, isActive) =>
  adminRequest(`/api/admin/drivers/${id}`, {
    method: "PATCH",
    body: { isActive },
  });

export const removeDriver = (id) =>
  adminRequest(`/api/admin/drivers/${id}`, { method: "DELETE" });

export const getTablets = () => adminRequest("/api/admin/tablets");

export const registerThisDevice = async (tableNumber) => {
  const tablet = await adminRequest("/api/admin/tablets", {
    method: "POST",
    body: { tableNumber },
  });
  writeStorage(TABLET_KEY, tablet);
  return tablet;
};

export const removeTablet = async (id) => {
  await adminRequest(`/api/admin/tablets/${id}`, { method: "DELETE" });
  if (getTablet()?.id === id) {
    writeStorage(TABLET_KEY, null);
  }
};
