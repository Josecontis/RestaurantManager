import { useCallback, useEffect, useState } from "react";
import {
  formatSlot,
  getAdminDelivery,
  getAdminOrders,
  getDrivers,
  saveAdminDelivery,
} from "../../api";
import { AddressField } from "../../Components/AddressField/AddressField";
import { Button } from "../../Components/Button/Button";
import { ListRow } from "../../Components/ListRow/ListRow";
import { TextField } from "../../Components/TextField/TextField";
import { isToday, statusLabel } from "./AdminOrders";
import { DeliveryMap, STATUS_COLORS } from "./DeliveryMap";
import { useAdminError } from "./useAdminError";

const REFRESH_SECONDS = 30;
const MAX_BANDS = 6;

const formatPrice = (value) =>
  value.toLocaleString("it-IT", { style: "currency", currency: "EUR" });

// Settings as the form keeps them: numbers as written in the fields
const toForm = (settings) => ({
  ...settings,
  radiusKm: String(settings.radiusKm),
  minOrder: String(settings.minOrder),
  fees: settings.fees.map((band) => ({
    upToKm: String(band.upToKm),
    fee: String(band.fee),
  })),
});

export const AdminDeliveries = ({ onUnauthorized }) => {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError, handleError] = useAdminError(onUnauthorized);

  const loadOrders = useCallback(async () => {
    try {
      const [newOrders, newDrivers] = await Promise.all([
        getAdminOrders(),
        getDrivers(),
      ]);
      setOrders(newOrders);
      setDrivers(newDrivers);
    } catch (loadError) {
      handleError(loadError);
    }
  }, [handleError]);

  useEffect(() => {
    getAdminDelivery()
      .then((result) => {
        setSettings(result);
        setForm(toForm(result));
      })
      .catch(handleError);
  }, [handleError]);

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, REFRESH_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [loadOrders]);

  const todayDeliveries = orders.filter(
    (order) => order.orderType === "consegna" && isToday(order)
  );
  const mapDeliveries = todayDeliveries
    .filter((order) => order.customerLat !== null)
    .map((order) => {
      const driver = drivers.find((item) => item.id === order.driverId);
      return {
        id: order.id,
        lat: order.customerLat,
        lon: order.customerLon,
        status: order.status,
        title: `#${order.id} ${order.customerName}`,
        lines: [
          `Ore ${formatSlot(order.scheduledAt)} - ${statusLabel(
            order.status,
            order.orderType
          )}`,
          order.customerAddress,
          `Tel. ${order.customerPhone}`,
          driver ? `Driver: ${driver.name}` : "Nessun driver assegnato",
          `Totale ${formatPrice(order.total)}`,
        ],
      };
    });
  const withoutPosition = todayDeliveries.length - mapDeliveries.length;

  const change = (field, value) => {
    setIsSaved(false);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const changeBand = (index, field, value) => {
    setIsSaved(false);
    setForm((current) => ({
      ...current,
      fees: current.fees.map((band, bandIndex) =>
        bandIndex === index ? { ...band, [field]: value } : band
      ),
    }));
  };

  const save = async (event) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const saved = await saveAdminDelivery({
        pizzeriaAddress: form.pizzeriaAddress,
        pizzeriaLat: form.pizzeriaLat,
        pizzeriaLon: form.pizzeriaLon,
        radiusKm: parseFloat(form.radiusKm),
        minOrder: parseFloat(form.minOrder),
        fees: form.fees.map((band) => ({
          upToKm: parseFloat(band.upToKm),
          fee: parseFloat(band.fee),
        })),
      });
      setSettings(saved);
      setForm(toForm(saved));
      setIsSaved(true);
    } catch (saveError) {
      handleError(saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const center =
    settings && settings.pizzeriaLat !== null
      ? { lat: settings.pizzeriaLat, lon: settings.pizzeriaLon }
      : null;

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <div className="admin-note">
          Consegne di oggi sulla mappa: {mapDeliveries.length}
          {withoutPosition > 0 &&
            `, senza posizione: ${withoutPosition} (arrivate prima della mappa)`}
          . Si aggiorna da sola ogni {REFRESH_SECONDS} secondi; tocca un punto
          per vedere l'ordine.
        </div>
        <Button variant="secondary" onClick={loadOrders}>
          Aggiorna
        </Button>
      </div>
      {error && <div className="admin-error">{error}</div>}
      {settings && !center && (
        <div className="admin-error">
          Le consegne sono ferme finché non salvi l'indirizzo della pizzeria qui
          sotto.
        </div>
      )}
      <DeliveryMap
        center={center}
        radiusKm={settings ? settings.radiusKm : 0}
        deliveries={mapDeliveries}
      />
      <ul className="delivery-legend">
        <li>
          <span className="delivery-dot delivery-dot--pizzeria" />
          Pizzeria
        </li>
        {Object.keys(STATUS_COLORS).map((status) => (
          <li key={status}>
            <span
              className="delivery-dot"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            {statusLabel(status, "consegna")}
          </li>
        ))}
      </ul>
      {form && (
        <form className="admin-delivery-settings" onSubmit={save}>
          <div className="admin-list-title">Zona e costi</div>
          <ul className="admin-list">
            <li className="admin-delivery-address">
              <div className="list-row-title">Indirizzo della pizzeria</div>
              <div className="list-row-note">
                Centro della zona: scegli l'indirizzo tra i suggerimenti.
              </div>
              <AddressField
                placeholder="Via, numero e città della pizzeria"
                value={form.pizzeriaAddress || ""}
                center={center}
                onChange={(text) => {
                  change("pizzeriaAddress", text);
                  setForm((current) => ({
                    ...current,
                    pizzeriaLat: null,
                    pizzeriaLon: null,
                  }));
                }}
                onSelect={(place) =>
                  setForm((current) => ({
                    ...current,
                    pizzeriaLat: place.lat,
                    pizzeriaLon: place.lon,
                  }))
                }
              />
            </li>
            <ListRow
              title="Raggio della zona"
              note="In linea d'aria dalla pizzeria: più lontano la consegna non si accetta."
            >
              <TextField
                className="admin-kitchen-number"
                type="number"
                min="0.5"
                max="50"
                step="0.1"
                required
                aria-label="Raggio della zona in km"
                value={form.radiusKm}
                onChange={(event) => change("radiusKm", event.target.value)}
              />
              <span className="admin-note">km</span>
            </ListRow>
            <ListRow
              title="Ordine minimo"
              note="Pizze senza il costo di consegna."
            >
              <TextField
                className="admin-kitchen-number"
                type="number"
                min="0"
                max="500"
                step="0.5"
                required
                aria-label="Ordine minimo in euro"
                value={form.minOrder}
                onChange={(event) => change("minOrder", event.target.value)}
              />
              <span className="admin-note">euro</span>
            </ListRow>
          </ul>
          <div className="admin-list-title">Costo di consegna</div>
          <div className="admin-note">
            Dalla fascia più vicina alla più lontana; oltre l'ultima, fino al
            raggio, vale il costo dell'ultima.
          </div>
          <ul className="admin-list">
            {form.fees.map((band, index) => (
              <ListRow key={index} title={`Fascia ${index + 1}`}>
                <span className="admin-note">fino a</span>
                <TextField
                  className="admin-kitchen-number"
                  type="number"
                  min="0.5"
                  max="50"
                  step="0.1"
                  required
                  aria-label={`Distanza massima della fascia ${index + 1} in km`}
                  value={band.upToKm}
                  onChange={(event) =>
                    changeBand(index, "upToKm", event.target.value)
                  }
                />
                <span className="admin-note">km</span>
                <TextField
                  className="admin-kitchen-number"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  required
                  aria-label={`Costo della fascia ${index + 1} in euro`}
                  value={band.fee}
                  onChange={(event) =>
                    changeBand(index, "fee", event.target.value)
                  }
                />
                <span className="admin-note">euro</span>
                <Button
                  variant="secondary"
                  disabled={form.fees.length === 1}
                  onClick={() =>
                    change(
                      "fees",
                      form.fees.filter((item, bandIndex) => bandIndex !== index)
                    )
                  }
                >
                  Togli
                </Button>
              </ListRow>
            ))}
          </ul>
          <div className="admin-toolbar">
            <Button
              variant="secondary"
              disabled={form.fees.length >= MAX_BANDS}
              onClick={() =>
                change("fees", [...form.fees, { upToKm: "", fee: "" }])
              }
            >
              Aggiungi fascia
            </Button>
          </div>
          <div className="admin-toolbar">
            <div className="admin-note">
              {isSaved && "Impostazioni della consegna salvate."}
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvataggio..." : "Salva zona e costi"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
