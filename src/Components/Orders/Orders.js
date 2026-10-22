import { useEffect, useState } from "react";
import { getTablet, orderTypeCode } from "../../api";
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
  onClose,
}) => {
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  // On small screens the order opens full screen only when asked
  const [isOpen, setIsOpen] = useState(false);
  const isActive = foods.length !== 0 || lastOrder;
  const count = foods.reduce((sum, el) => sum + el.quantity, 0);
  const total = foods.reduce((sum, el) => sum + el.price * el.quantity, 0);
  const typeCode = orderTypeCode(orderType);
  // Read at every render: a failed order can remove an unregistered tablet
  const tablet = getTablet();

  useEffect(() => {
    if (!isActive) {
      setIsOpen(false);
    }
  }, [isActive]);

  const confirm = () => {
    if (typeCode === "sul_posto") {
      onConfirm(tablet ? {} : { tableNumber: parseInt(tableNumber, 10) });
    } else if (typeCode === "ritiro") {
      onConfirm({ customerName, customerPhone });
    } else {
      onConfirm({ customerName, customerPhone, customerAddress });
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
        {foods.length === 0 && lastOrder ? (
          <div className="orders-content">
            <div className="orders-title">Ordine n. {lastOrder.id} inviato</div>
            <div className="orders-subtitle">
              {lastOrder.orderType}
              {lastOrder.tableNumber
                ? ` - Tavolo ${lastOrder.tableNumber}`
                : ` - ${lastOrder.customerName}`}
            </div>
            <ul className="orders-list">
              {lastOrder.foods.map((el) => (
                <li key={el.id} className="orders-item">
                  <div className="orders-item-row">
                    <div className="orders-item-name">
                      {el.quantity} x {el.name}
                    </div>
                    <div className="orders-item-price">
                      {formatPrice(el.price * el.quantity)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="orders-total">
              <span>Totale</span>
              <span>{formatPrice(lastOrder.total)}</span>
            </div>
            <button
              className="orders-button"
              onClick={() => {
                setIsOpen(false);
                onClose();
              }}
            >
              Nuovo ordine
            </button>
          </div>
        ) : (
          <div className="orders-content">
            <button className="orders-back" onClick={() => setIsOpen(false)}>
              Torna al menu
            </button>
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
            <div className="orders-fields">
              {typeCode === "sul_posto" && !tablet && (
                <input
                  type="number"
                  min="1"
                  placeholder="Numero del tavolo"
                  value={tableNumber}
                  onChange={(event) => setTableNumber(event.target.value)}
                />
              )}
              {typeCode !== "sul_posto" && (
                <>
                  <input
                    type="text"
                    placeholder="Nome"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                  />
                  <input
                    type="tel"
                    placeholder="Telefono"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                  />
                </>
              )}
              {typeCode === "consegna" && (
                <input
                  type="text"
                  placeholder="Indirizzo di consegna"
                  value={customerAddress}
                  onChange={(event) => setCustomerAddress(event.target.value)}
                />
              )}
            </div>
            {error && <div className="orders-error">{error}</div>}
            <div className="orders-total">
              <span>Totale</span>
              <span>{formatPrice(total)}</span>
            </div>
            <button
              className="orders-button"
              onClick={confirm}
              disabled={isSending}
            >
              {isSending ? "Invio in corso..." : "Conferma ordine"}
            </button>
          </div>
        )}
      </div>
    </>
  );
};
