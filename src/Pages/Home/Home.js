import { useEffect, useState } from "react";
import { getMenu, orderTypeCode, sendOrder } from "../../api";
import { Button } from "../../Components/Button/Button";
import { Orders } from "../../Components/Orders/Orders";
import { SearchField } from "../../Components/SearchField/SearchField";
import { Tab, orderTypes } from "../../Components/Tab/Tab";
import "./Home.css";

export const Home = () => {
  const [menu, setMenu] = useState(null);
  const [menuError, setMenuError] = useState(null);
  const [menuAttempt, setMenuAttempt] = useState(0);
  const [isMenuSlow, setIsMenuSlow] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderType, setOrderType] = useState(orderTypes[0]);
  const [lastOrder, setLastOrder] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [search, setSearch] = useState("");
  var today = new Date();

  var date =
    today.toLocaleString("default", { weekday: "long" }) +
    ", " +
    today.getDate() +
    " " +
    today.toLocaleString("default", { month: "long" }) +
    " " +
    today.getFullYear();

  useEffect(() => {
    let isActive = true;
    setMenuError(null);
    setIsMenuSlow(false);
    // The free server sleeps after 15 minutes and needs about a minute to wake up
    const slowTimer = setTimeout(() => setIsMenuSlow(true), 4000);
    getMenu()
      .then((categories) => isActive && setMenu(categories))
      .catch((error) => isActive && setMenuError(error.message))
      .finally(() => clearTimeout(slowTimer));
    return () => {
      isActive = false;
      clearTimeout(slowTimer);
    };
  }, [menuAttempt]);

  const addToOrder = (food) => {
    setLastOrder(null);
    setOrderError(null);
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
    setOrderError(null);
    setOrders((prevElems) =>
      prevElems
        .map((el) => (el.id === id ? { ...el, quantity: el.quantity - 1 } : el))
        .filter((el) => el.quantity > 0)
    );
  };

  const confirmOrder = async (details) => {
    setIsSending(true);
    setOrderError(null);
    try {
      const result = await sendOrder({
        orderType: orderTypeCode(orderType),
        items: orders.map((el) => ({ dishId: el.id, quantity: el.quantity })),
        ...details,
      });
      setLastOrder({ ...details, ...result, foods: orders, orderType });
      setOrders([]);
    } catch (error) {
      setOrderError(error.message);
    } finally {
      setIsSending(false);
    }
  };

  let content;
  if (menu && menu.length !== 0) {
    content = (
      <Tab
        categories={menu}
        search={search}
        order={addToOrder}
        onOrderTypeChange={(type) => {
          setOrderType(type);
          setOrderError(null);
        }}
      />
    );
  } else if (menu) {
    content = <div className="home-message">Il menu è ancora vuoto.</div>;
  } else if (menuError) {
    content = (
      <div className="home-message">
        <div>{menuError}</div>
        <Button
          className="home-message-button"
          onClick={() => setMenuAttempt((attempt) => attempt + 1)}
        >
          Riprova
        </Button>
      </div>
    );
  } else {
    content = (
      <div className="home-message">
        <div>Caricamento del menu...</div>
        {isMenuSlow && (
          <div className="home-message-note">
            Il server si sta avviando, può volerci fino a un minuto.
          </div>
        )}
      </div>
    );
  }

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
        <SearchField value={search} onChange={setSearch} />
      </div>
      {content}
      <Orders
        foods={orders}
        orderType={orderType}
        lastOrder={lastOrder}
        isSending={isSending}
        error={orderError}
        onAdd={addToOrder}
        onRemove={removeFromOrder}
        onConfirm={confirmOrder}
        onClose={() => setLastOrder(null)}
      />
    </div>
  );
};
