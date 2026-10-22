import { useState } from "react";
import { Orders } from "../../Components/Orders/Orders";
import { SearchField } from "../../Components/SearchField/SearchField";
import { Tab, orderTypes } from "../../Components/Tab/Tab";
import "./Home.css";

export const Home = () => {
  const [orders, setOrders] = useState([]);
  const [orderType, setOrderType] = useState(orderTypes[0]);
  const [lastOrder, setLastOrder] = useState(null);
  var today = new Date();

  var date =
    today.toLocaleString("default", { weekday: "long" }) +
    ", " +
    today.getDate() +
    " " +
    today.toLocaleString("default", { month: "long" }) +
    " " +
    today.getFullYear();

  const addToOrder = (food) => {
    setLastOrder(null);
    setOrders((prevElems) =>
      prevElems.some((el) => el.id === food.id)
        ? prevElems.map((el) =>
            el.id === food.id ? { ...el, quantity: el.quantity + 1 } : el
          )
        : [
            ...prevElems,
            { id: food.id, name: food.name, price: food.price, quantity: 1 },
          ]
    );
  };

  const removeFromOrder = (id) => {
    setOrders((prevElems) =>
      prevElems
        .map((el) => (el.id === id ? { ...el, quantity: el.quantity - 1 } : el))
        .filter((el) => el.quantity > 0)
    );
  };

  // Until the server exists the order is only shown as confirmed
  const confirmOrder = () => {
    setLastOrder({
      foods: orders,
      orderType: orderType,
      total: orders.reduce((sum, el) => sum + el.price * el.quantity, 0),
    });
    setOrders([]);
  };

  return (
    <div
      className={
        orders.length !== 0 || lastOrder ? "home-page__collapsed" : "home-page"
      }
    >
      <div className="home-title-container">
        <div className="home-title">Wellness Pizza</div>
        <div className="home-subtitle"> {date} </div>
      </div>
      <div className="home-search-container">
        <SearchField />
      </div>
      <Tab order={addToOrder} onOrderTypeChange={setOrderType} />
      <Orders
        foods={orders}
        orderType={orderType}
        lastOrder={lastOrder}
        onAdd={addToOrder}
        onRemove={removeFromOrder}
        onConfirm={confirmOrder}
        onClose={() => setLastOrder(null)}
      />
    </div>
  );
};
