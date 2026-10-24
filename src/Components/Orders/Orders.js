import { useEffect, useState } from "react";
import {
  addressWithNumber,
  getDelivery,
  getDeliveryQuote,
  getSlots,
  getTablet,
  isValidPhone,
  orderTypeCode,
} from "../../api";
import { AddressField } from "../AddressField/AddressField";
import { Button } from "../Button/Button";
import { TextField } from "../TextField/TextField";
import "./Orders.css";

const formatPrice = (value) =>
  value.toLocaleString("it-IT", { style: "currency", currency: "EUR" });

export const Orders = ({
  foods,
  orderType,
  lastOrder,
  isSending,
  error,
  onAdd,
  onRemove,
  onConfirm,
}) => {
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  // The phone error appears after leaving the field or pressing "Conferma ordine"
  const [isPhoneChecked, setIsPhoneChecked] = useState(false);
  const phoneError =
    isPhoneChecked && !isValidPhone(customerPhone)
      ? "Numero non valido: scrivi un cellulare o un fisso italiano, per esempio 333 123 4567"
      : null;
  // Delivery: the address picked among the suggestions, its distance and fee
  const [delivery, setDelivery] = useState(null);
  const [place, setPlace] = useState(null);
  const [houseNumber, setHouseNumber] = useState("");
  const [quote, setQuote] = useState(null);
  const [isAddressChecked, setIsAddressChecked] = useState(false);
  // On small screens the order opens full screen only when asked
  const [isOpen, setIsOpen] = useState(false);
  const isActive = foods.length !== 0;
  const count = foods.reduce((sum, el) => sum + el.quantity, 0);
  const total = foods.reduce((sum, el) => sum + el.price * el.quantity, 0);
  const typeCode = orderTypeCode(orderType);
  const needsSlot = typeCode === "ritiro" || typeCode === "consegna";
  const [slotsResult, setSlotsResult] = useState(null);
  const [slotsError, setSlotsError] = useState(null);
  const [scheduledAt, setScheduledAt] = useState(null);
  // A chosen time that is no longer free is dropped
  const selectedSlot =
    slotsResult && slotsResult.slots.some((slot) => slot.time === scheduledAt)
      ? scheduledAt
      : null;
  // Read at every render: a failed order can remove an unregistered tablet
  const tablet = getTablet();
  const isDelivery = typeCode === "consegna";
  const deliveryFee = isDelivery && quote?.isInZone ? quote.fee : 0;
  const missingForMinimum =
    isDelivery && delivery ? delivery.minOrder - total : 0;
  let addressError = null;
  if (quote && !quote.isInZone) {
    addressError = `Fuori dalla zona di consegna: ${quote.km} km${
      delivery ? `, massimo ${delivery.radiusKm} km` : ""
    }`;
  } else if (isAddressChecked && !place) {
    addressError = "Scegli l'indirizzo dall'elenco dei suggerimenti";
  }
  const numberError =
    isAddressChecked && place && !place.hasNumber && !houseNumber.trim()
      ? "Scrivi il numero civico"
      : null;

  useEffect(() => {
    if (!isActive) {
      setIsOpen(false);
    }
  }, [isActive]);

  // After an order is sent the next customer finds empty fields
  useEffect(() => {
    if (lastOrder) {
      setTableNumber("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setIsPhoneChecked(false);
      setScheduledAt(null);
      setPlace(null);
      setHouseNumber("");
      setQuote(null);
      setIsAddressChecked(false);
    }
  }, [lastOrder]);

  // Zone, minimum order and fees, read when the customer chooses the delivery
  useEffect(() => {
    if (!isDelivery || !isActive) {
      return;
    }
    let isCurrent = true;
    getDelivery()
      .then((result) => isCurrent && setDelivery(result))
      .catch(() => {});
    return () => {
      isCurrent = false;
    };
  }, [isDelivery, isActive]);

  // Distance and fee of the picked address
  useEffect(() => {
    setQuote(null);
    if (!place) {
      return;
    }
    let isCurrent = true;
    getDeliveryQuote(place.lat, place.lon)
      .then((result) => isCurrent && setQuote(result))
      .catch(() => {});
    return () => {
      isCurrent = false;
    };
  }, [place]);

  // Free times depend on the order size; they are read again after a refused order
  useEffect(() => {
    if (!needsSlot || count === 0) {
      return;
    }
    let isCurrent = true;
    setSlotsResult(null);
    setSlotsError(null);
    getSlots(typeCode, count)
      .then((result) => isCurrent && setSlotsResult(result))
      .catch((loadError) => isCurrent && setSlotsError(loadError.message));
    return () => {
      isCurrent = false;
    };
  }, [needsSlot, typeCode, count, error]);

  const confirm = () => {
    if (typeCode !== "sul_posto" && !isValidPhone(customerPhone)) {
      setIsPhoneChecked(true);
      return;
    }
    if (
      isDelivery &&
      (!place ||
        (!place.hasNumber && !houseNumber.trim()) ||
        (quote && !quote.isInZone) ||
        missingForMinimum > 0)
    ) {
      setIsAddressChecked(true);
      return;
    }
    if (typeCode === "sul_posto") {
      onConfirm(tablet ? {} : { tableNumber: parseInt(tableNumber, 10) });
    } else if (typeCode === "ritiro") {
      onConfirm({ customerName, customerPhone, scheduledAt: selectedSlot });
    } else {
      onConfirm({
        customerName,
        customerPhone,
        customerAddress: addressWithNumber(place, houseNumber),
        customerLat: place.lat,
        customerLon: place.lon,
        scheduledAt: selectedSlot,
      });
    }
  };

  return (
    <>
      {foods.length !== 0 && !isOpen && (
        <button className="orders-bar" onClick={() => setIsOpen(true)}>
          <span>Vedi ordine ({count})</span>
          <span>{formatPrice(total)}</span>
        </button>
      )}
      <div
        className={
          "orders" + (isActive ? " active" : "") + (isOpen ? " open" : "")
        }
      >
        {foods.length !== 0 && (
          <div className="orders-content">
            <Button
              variant="secondary"
              className="orders-back"
              onClick={() => setIsOpen(false)}
            >
              Torna al menu
            </Button>
            <div className="orders-title">Il tuo ordine</div>
            <div className="orders-subtitle">
              {orderType}
              {typeCode === "sul_posto" &&
                tablet &&
                ` - Tavolo ${tablet.tableNumber}`}
            </div>
            <ul className="orders-list">
              {foods.map((el) => (
                <li key={el.id} className="orders-item">
                  <div className="orders-item-name">{el.name}</div>
                  <div className="orders-item-row">
                    <div className="orders-quantity">
                      <button onClick={() => onRemove(el.id)}>-</button>
                      <span>{el.quantity}</span>
                      <button onClick={() => onAdd(el)}>+</button>
                    </div>
                    <div className="orders-item-price">
                      {formatPrice(el.price * el.quantity)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {needsSlot && (
              <div className="orders-slots">
                <div className="orders-slots-title">
                  {typeCode === "ritiro"
                    ? "Orario di ritiro"
                    : "Orario di consegna"}
                </div>
                {slotsError && <div className="orders-note">{slotsError}</div>}
                {!slotsResult && !slotsError && (
                  <div className="orders-note">Caricamento degli orari...</div>
                )}
                {slotsResult && slotsResult.slots.length === 0 && (
                  <div className="orders-note">
                    {count > slotsResult.maxDishes
                      ? `Ogni orario accetta al massimo ${slotsResult.maxDishes} pizze: per ordini più grandi chiama la pizzeria.`
                      : "Nessun orario disponibile per oggi."}
                  </div>
                )}
                {slotsResult && slotsResult.slots.length !== 0 && (
                  <div className="orders-slots-list">
                    {slotsResult.slots.map((slot) => (
                      <button
                        key={slot.time}
                        className={
                          "orders-slot" +
                          (slot.time === selectedSlot ? " selected" : "")
                        }
                        onClick={() => setScheduledAt(slot.time)}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="orders-fields">
              {typeCode === "sul_posto" && !tablet && (
                <TextField
                  type="number"
                  min="1"
                  placeholder="Numero del tavolo"
                  value={tableNumber}
                  onChange={(event) => setTableNumber(event.target.value)}
                />
              )}
              {typeCode !== "sul_posto" && (
                <>
                  <TextField
                    placeholder="Nome"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                  />
                  <TextField
                    type="tel"
                    placeholder="Telefono"
                    value={customerPhone}
                    error={phoneError}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    onBlur={() =>
                      customerPhone.trim() && setIsPhoneChecked(true)
                    }
                  />
                </>
              )}
              {isDelivery && delivery && !delivery.isAvailable && (
                <div className="orders-note">
                  Le consegne non sono ancora disponibili.
                </div>
              )}
              {isDelivery && (!delivery || delivery.isAvailable) && (
                <AddressField
                  placeholder="Indirizzo di consegna (via, numero, città)"
                  value={customerAddress}
                  center={delivery?.center}
                  error={addressError}
                  onChange={(text) => {
                    setCustomerAddress(text);
                    setPlace(null);
                  }}
                  onSelect={setPlace}
                />
              )}
              {isDelivery && place && !place.hasNumber && (
                <TextField
                  placeholder="Numero civico"
                  value={houseNumber}
                  error={numberError}
                  maxLength={10}
                  onChange={(event) => setHouseNumber(event.target.value)}
                />
              )}
            </div>
            {error && <div className="orders-error">{error}</div>}
            {isDelivery && missingForMinimum > 0 && (
              <div
                className={isAddressChecked ? "orders-error" : "orders-note orders-minimum"}
              >
                Ordine minimo per la consegna: {formatPrice(delivery.minOrder)}{" "}
                (mancano {formatPrice(missingForMinimum)})
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="orders-fee">
                <span>
                  Consegna ({quote.km.toLocaleString("it-IT")} km)
                </span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>
            )}
            <div className="orders-total">
              <span>Totale</span>
              <span>{formatPrice(total + deliveryFee)}</span>
            </div>
            <Button
              className="orders-button"
              onClick={confirm}
              disabled={isSending}
            >
              {isSending ? "Invio in corso..." : "Conferma ordine"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
