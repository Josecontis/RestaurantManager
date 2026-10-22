import { useCallback, useEffect, useState } from "react";
import { formatSlot, getAdminOrders, orderTypeLabels } from "../../api";

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

export const AdminOrders = ({ onUnauthorized }) => {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setOrders(await getAdminOrders());
      setError(null);
    } catch (loadError) {
      if (loadError.status === 401) {
        onUnauthorized();
      } else {
        setError(loadError.message);
      }
    }
  }, [onUnauthorized]);

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
        <button className="admin-button admin-button--secondary" onClick={load}>
          Aggiorna
        </button>
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
