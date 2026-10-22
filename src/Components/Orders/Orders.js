import "./Orders.css";

const formatPrice = (value) =>
  value.toLocaleString("it-IT", { style: "currency", currency: "EUR" });

export const Orders = ({
  foods,
  orderType,
  lastOrder,
  onAdd,
  onRemove,
  onConfirm,
  onClose,
}) => {
  const total = foods.reduce((sum, el) => sum + el.price * el.quantity, 0);

  return (
    <>
      <div
        className={foods.length !== 0 || lastOrder ? "orders active" : "orders"}
      >
        {foods.length === 0 && lastOrder ? (
          <div className="orders-content">
            <div className="orders-title">Ordine confermato</div>
            <div className="orders-subtitle">{lastOrder.orderType}</div>
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
            <button className="orders-button" onClick={onClose}>
              Nuovo ordine
            </button>
          </div>
        ) : (
          <div className="orders-content">
            <div className="orders-title">Il tuo ordine</div>
            <div className="orders-subtitle">{orderType}</div>
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
            <div className="orders-total">
              <span>Totale</span>
              <span>{formatPrice(total)}</span>
            </div>
            <button className="orders-button" onClick={onConfirm}>
              Conferma ordine
            </button>
          </div>
        )}
      </div>
    </>
  );
};
