import { useCallback, useEffect, useRef, useState } from "react";
import {
  assignDriver,
  formatSlot,
  getAdminOrders,
  getDrivers,
  getOrdersView,
  orderTypeLabels,
  rememberOrdersView,
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

// Pickup or delivery time, arrival time for the orders at the table, in Italian time
export const isToday = (order) =>
  new Date(order.scheduledAt || order.createdAt).toLocaleDateString("it-IT", {
    timeZone: "Europe/Rome",
  }) === new Date().toLocaleDateString("it-IT", { timeZone: "Europe/Rome" });

// Who works on which orders: the cook prepares all of them and serves the tables,
// the cash desk hands over the pickups, the riders take the deliveries.
// Cash desk and riders see only orders the cook has marked as ready.
const VIEWS = [
  {
    key: "cucina",
    label: "Cucina",
    note: "Tutti gli ordini da preparare; quelli al tavolo, quando sono pronti, si segnano anche come serviti. Ritiri e consegne pronti passano a Cassa e Rider.",
    sound: "un suono avvisa quando arriva un ordine nuovo",
    empty: "Nessun ordine da preparare.",
    isActive: (order) =>
      order.status === "nuovo" ||
      order.status === "in_preparazione" ||
      (order.orderType === "sul_posto" && order.status === "pronto"),
    isDone: (order) =>
      order.orderType === "sul_posto" && order.status === "completato",
  },
  {
    key: "cassa",
    label: "Cassa",
    note: "Ordini da ritirare già pronti in cucina: segnali come ritirati quando il cliente li prende.",
    sound: "un suono avvisa quando un ritiro diventa pronto",
    empty: "Nessun ritiro pronto.",
    isActive: (order) =>
      order.orderType === "ritiro" && order.status === "pronto",
    isDone: (order) =>
      order.orderType === "ritiro" && order.status === "completato",
  },
  {
    key: "rider",
    label: "Rider",
    note: "Consegne già pronte in cucina: scegli il driver e segnale come consegnate al ritorno.",
    sound: "un suono avvisa quando una consegna diventa pronta",
    empty: "Nessuna consegna pronta.",
    isActive: (order) =>
      order.orderType === "consegna" && order.status === "pronto",
    isDone: (order) =>
      order.orderType === "consegna" && order.status === "completato",
  },
];

// What makes each section ring: a new order for the kitchen, a new ready order for
// cash desk and riders. Kept outside the component, so what happened while the admin
// was on another page still rings; null before the first load.
const soundTriggers = {
  cucina: (orders) => [Math.max(0, ...orders.map((order) => order.id))],
  cassa: (orders) => orders.filter(VIEWS[1].isActive).map((order) => order.id),
  rider: (orders) => orders.filter(VIEWS[2].isActive).map((order) => order.id),
};
const lastTriggers = { cucina: null, cassa: null, rider: null };

// True when the section has something it did not have at the last load
const hasNews = (view, orders) => {
  const ids = soundTriggers[view](orders);
  const before = lastTriggers[view];
  lastTriggers[view] = ids;
  if (before === null) {
    return false;
  }
  return view === "cucina"
    ? ids[0] > before[0]
    : ids.some((id) => !before.includes(id));
};

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

// One order; the driver can be chosen only where the riders work
const OrderCard = ({ order, drivers, canChooseDriver, isBusy, onDriver, onStatus }) => {
  const driver = drivers.find((item) => item.id === order.driverId);
  return (
    <div
      className={
        "admin-card admin-order-card" +
        (order.status === "completato" ? " admin-card--done" : "")
      }
    >
      <div className="admin-order-body">
      <div className="admin-card-header">
        <span className="admin-card-number">#{order.id}</span>
        <span className="admin-card-time">{formatTime(order.createdAt)}</span>
      </div>
      <div className="admin-card-main">
        {order.tableNumber ? `Tavolo ${order.tableNumber}` : order.customerName}
      </div>
      <div className="admin-badge">
        {orderTypeLabels[order.orderType]}
        {order.scheduledAt && ` alle ${formatSlot(order.scheduledAt)}`}
      </div>
      <div className={`admin-badge admin-status-${order.status}`}>
        {statusLabel(order.status, order.orderType)}
      </div>
      {order.customerPhone && (
        <div className="admin-card-detail">Tel. {order.customerPhone}</div>
      )}
      {order.customerAddress && (
        <div className="admin-card-detail">{order.customerAddress}</div>
      )}
      {order.orderType === "consegna" && canChooseDriver && (
        <div className="admin-card-driver">
          <DriverDropdown
            order={order}
            drivers={drivers}
            isBusy={isBusy}
            onChange={onDriver}
          />
        </div>
      )}
      {order.orderType === "consegna" && !canChooseDriver && (
        <div className="admin-card-detail">
          {driver ? `Driver: ${driver.name}` : "Nessun driver assegnato"}
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
      </div>
      {nextStatus(order.status) && (
        <Button
          className="admin-card-next"
          onClick={() => onStatus(order, nextStatus(order.status))}
        >
          Segna come{" "}
          {statusLabel(nextStatus(order.status), order.orderType).toLowerCase()}
        </Button>
      )}
    </div>
  );
};

export const AdminOrders = ({ onUnauthorized }) => {
  const [orders, setOrders] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [error, setError, handleError] = useAdminError(onUnauthorized);
  const [isSoundBlocked, setIsSoundBlocked] = useState(isSoundBlockedNow);
  const [viewKey, setViewKey] = useState(() =>
    VIEWS.some((item) => item.key === getOrdersView())
      ? getOrdersView()
      : VIEWS[0].key
  );
  const view = VIEWS.find((item) => item.key === viewKey);
  // Read by the automatic refresh without restarting it
  const viewRef = useRef(viewKey);
  viewRef.current = viewKey;

  const load = useCallback(async () => {
    try {
      const [newOrders, newDrivers] = await Promise.all([
        getAdminOrders(),
        getDrivers(),
      ]);
      // Every section is checked, only the open one rings
      const news = VIEWS.filter((item) => hasNews(item.key, newOrders));
      if (news.some((item) => item.key === viewRef.current)) {
        playNewOrderSound();
      }
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

  const chooseView = (key) => {
    setViewKey(key);
    rememberOrdersView(key);
  };

  const activeOrders = orders ? orders.filter(view.isActive) : [];
  const doneOrders = orders
    ? orders.filter((order) => view.isDone(order) && isToday(order))
    : [];

  return (
    <div className="admin-section">
      <ul className="tab-container admin-subtabs">
        {VIEWS.map((item) => (
          <li
            key={item.key}
            className={"tab-item " + (item.key === viewKey && "active")}
            onClick={() => chooseView(item.key)}
          >
            {item.label}
            {orders && ` (${orders.filter(item.isActive).length})`}
          </li>
        ))}
      </ul>
      <div className="admin-toolbar">
        <div className="admin-note">
          {view.note} Si aggiorna da sola ogni {REFRESH_SECONDS} secondi;{" "}
          {view.sound}.
        </div>
        <Button variant="secondary" onClick={load}>
          Aggiorna
        </Button>
      </div>
      {isSoundBlocked && (
        <div className="admin-error">
          Il browser tiene il suono spento finché non tocchi la pagina: tocca
          un punto qualsiasi per sentire gli avvisi.
        </div>
      )}
      {error && <div className="admin-error">{error}</div>}
      {orders === null && !error && (
        <div className="admin-note">Caricamento degli ordini...</div>
      )}
      {orders && activeOrders.length === 0 && (
        <div className="admin-note">{view.empty}</div>
      )}
      <div className="admin-grid">
        {activeOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            drivers={drivers}
            canChooseDriver={view.key === "rider"}
            isBusy={isBusy}
            onDriver={changeDriver}
            onStatus={changeStatus}
          />
        ))}
      </div>
      {doneOrders.length !== 0 && (
        <>
          <div className="admin-list-title admin-done-title">
            Completati oggi
          </div>
          <div className="admin-grid">
            {doneOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                drivers={drivers}
                canChooseDriver={false}
                isBusy={isBusy}
                onDriver={changeDriver}
                onStatus={changeStatus}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
