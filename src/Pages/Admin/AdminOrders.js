import { useCallback, useEffect, useState } from "react";
import {
  assignDriver,
  formatSlot,
  getAdminOrders,
  getDrivers,
  orderTypeLabels,
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

  const load = useCallback(async () => {
    try {
      const [newOrders, newDrivers] = await Promise.all([
        getAdminOrders(),
        getDrivers(),
      ]);
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

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <div className="admin-note">
          Gli ordini si aggiornano da soli ogni {REFRESH_SECONDS} secondi.
        </div>
        <Button variant="secondary" onClick={load}>
          Aggiorna
        </Button>
      </div>
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
              </ul>
              <div className="admin-card-total">
                <span>Totale</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
