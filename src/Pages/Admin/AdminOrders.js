import { useCallback, useEffect, useState } from "react";
import {
  assignDriver,
  formatSlot,
  getAdminOrders,
  getDrivers,
  orderTypeLabels,
  setOrderStatus,
} from "../../api";
import { Button } from "../../Components/Button/Button";
import { DropdownField } from "../../Components/DropdownField/DropdownField";
import { useAdminError } from "./useAdminError";

const REFRESH_SECONDS = 30;

const formatPrice = (value) =>
  value.toLocaleString("it-IT", { style: "currency", currency: "EUR" });

const formatTime = (value) => {
  const date = new Date(value);
  const time = date.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return date.toDateString() === new Date().toDateString()
    ? `Oggi, ${time}`
    : `${date.toLocaleDateString("it-IT")}, ${time}`;
};

const STATUSES = ["nuovo", "in_preparazione", "pronto", "completato"];

const statusLabels = {
  nuovo: "Nuovo",
  in_preparazione: "In preparazione",
  pronto: "Pronto",
};

// The last status is named after the order type
const completedLabels = {
  sul_posto: "Servito",
  ritiro: "Ritirato",
  consegna: "Consegnato",
};

export const statusLabel = (status, orderType) =>
  status === "completato" ? completedLabels[orderType] : statusLabels[status];

// undefined for a completed order
const nextStatus = (status) => STATUSES[STATUSES.indexOf(status) + 1];

// Two short tones made by the browser, no sound file needed.
// Browsers play it only after a click on the page, for example the admin login.
const playNewOrderSound = () => {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1320].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * 0.25;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.2);
    });
    setTimeout(() => context.close(), 1000);
  } catch {}
};

// Highest order number already seen, null before the first load. Kept outside the
// component so orders that arrive while the admin is on another page still ring.
let lastOrderId = null;

// Browsers that can tell whether the page has been touched since it was loaded
const isSoundBlockedNow = () => navigator.userActivation?.hasBeenActive === false;

// The first choice takes the driver off the delivery
const DriverDropdown = ({ order, drivers, isBusy, onChange }) => {
  const choices = [
    { id: null, label: "Nessun driver assegnato", isDisabled: false },
    ...drivers.map((driver) => ({
      id: driver.id,
      label: isBusy(driver, order)
        ? `${driver.name} (occupato a quest'ora)`
        : `${driver.name}${driver.isActive ? "" : " (non in servizio)"}`,
      isDisabled: isBusy(driver, order),
    })),
  ];

  return (
    <DropdownField
      options={choices.map((choice) => choice.label)}
      selectedIndex={Math.max(
        0,
        choices.findIndex((choice) => choice.id === order.driverId)
      )}
      disabledIndexes={choices
        .map((choice, index) => (choice.isDisabled ? index : null))
        .filter((index) => index !== null)}
      onChange={(label, index) => onChange(order, choices[index].id)}
    />
  );
};

export const AdminOrders = ({ onUnauthorized }) => {
  const [orders, setOrders] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [error, setError, handleError] = useAdminError(onUnauthorized);
  const [isSoundBlocked, setIsSoundBlocked] = useState(isSoundBlockedNow);

  const load = useCallback(async () => {
    try {
      const [newOrders, newDrivers] = await Promise.all([
        getAdminOrders(),
        getDrivers(),
      ]);
      const newestId = Math.max(0, ...newOrders.map((order) => order.id));
      if (lastOrderId !== null && newestId > lastOrderId) {
        playNewOrderSound();
      }
      lastOrderId = newestId;
      setOrders(newOrders);
      setDrivers(newDrivers);
      setError(null);
    } catch (loadError) {
      handleError(loadError);
    }
  }, [handleError, setError]);

  const changeDriver = async (order, driverId) => {
    try {
      await assignDriver(order.id, driverId);
      load();
    } catch (assignError) {
      handleError(assignError);
    }
  };

  const changeStatus = async (order, status) => {
    try {
      await setOrderStatus(order.id, status);
      load();
    } catch (statusError) {
      handleError(statusError);
    }
  };

  // A driver already out with another delivery at the same time
  const isBusy = (driver, order) =>
    orders.some(
      (other) =>
        other.id !== order.id &&
        other.driverId === driver.id &&
        other.scheduledAt === order.scheduledAt
    );

  // New orders appear without reloading the page
  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [load]);

  // After a reload the browser keeps the sound off until the page is touched
  useEffect(() => {
    if (!isSoundBlocked) {
      return;
    }
    const unblock = () => setIsSoundBlocked(isSoundBlockedNow());
    document.addEventListener("click", unblock);
    document.addEventListener("keydown", unblock);
    return () => {
      document.removeEventListener("click", unblock);
      document.removeEventListener("keydown", unblock);
    };
  }, [isSoundBlocked]);

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <div className="admin-note">
          Gli ordini si aggiornano da soli ogni {REFRESH_SECONDS} secondi; un
          suono avvisa quando ne arriva uno nuovo.
        </div>
        <Button variant="secondary" onClick={load}>
          Aggiorna
        </Button>
      </div>
      {isSoundBlocked && (
        <div className="admin-error">
          Il browser tiene il suono spento finché non tocchi la pagina: tocca
          un punto qualsiasi per sentire l'avviso dei nuovi ordini.
        </div>
      )}
      {error && <div className="admin-error">{error}</div>}
      {orders === null && !error && (
        <div className="admin-note">Caricamento degli ordini...</div>
      )}
      {orders && orders.length === 0 && (
        <div className="admin-note">Nessun ordine ricevuto.</div>
      )}
      <div className="admin-grid">
        {orders &&
          orders.map((order) => (
            <div key={order.id} className="admin-card">
              <div className="admin-card-header">
                <span className="admin-card-number">#{order.id}</span>
                <span className="admin-card-time">
                  {formatTime(order.createdAt)}
                </span>
              </div>
              <div className="admin-card-main">
                {order.tableNumber
                  ? `Tavolo ${order.tableNumber}`
                  : order.customerName}
              </div>
              <div className="admin-badge">
                {orderTypeLabels[order.orderType]}
                {order.scheduledAt && ` alle ${formatSlot(order.scheduledAt)}`}
              </div>
              <div className={`admin-badge admin-status-${order.status}`}>
                {statusLabel(order.status, order.orderType)}
              </div>
              {order.customerPhone && (
                <div className="admin-card-detail">
                  Tel. {order.customerPhone}
                </div>
              )}
              {order.customerAddress && (
                <div className="admin-card-detail">{order.customerAddress}</div>
              )}
              {order.orderType === "consegna" && (
                <div className="admin-card-driver">
                  <DriverDropdown
                    order={order}
                    drivers={drivers}
                    isBusy={isBusy}
                    onChange={changeDriver}
                  />
                </div>
              )}
              <ul className="admin-card-items">
                {order.items.map((item, index) => (
                  <li key={index}>
                    <span>
                      {item.quantity} x {item.name}
                    </span>
                    <span>{formatPrice(item.quantity * item.unitPrice)}</span>
                  </li>
                ))}
                {order.deliveryFee > 0 && (
                  <li>
                    <span>
                      Consegna
                      {order.deliveryKm !== null &&
                        ` (${order.deliveryKm.toLocaleString("it-IT")} km)`}
                    </span>
                    <span>{formatPrice(order.deliveryFee)}</span>
                  </li>
                )}
              </ul>
              <div className="admin-card-total">
                <span>Totale</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              {nextStatus(order.status) && (
                <Button
                  className="admin-card-next"
                  onClick={() => changeStatus(order, nextStatus(order.status))}
                >
                  Segna come{" "}
                  {statusLabel(
                    nextStatus(order.status),
                    order.orderType
                  ).toLowerCase()}
                </Button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};
