import { useState } from "react";
import { Orders } from "../../Components/Orders/Orders";
import { SearchField } from "../../Components/SearchField/SearchField";
import { Tab } from "../../Components/Tab/Tab";
import "./Home.css";

export const Home = () => {
  const [orders, setOrders] = useState([]);
  var today = new Date();

  var date =
    today.toLocaleString("default", { weekday: "long" }) +
    ", " +
    today.getDate() +
    " " +
    today.toLocaleString("default", { month: "long" }) +
    " " +
    today.getFullYear();

  return (
    <div className={orders.length !== 0 ? "home-page__collapsed" : "home-page"}>
      <div className="home-title-container">
        <div className="home-title">Wellness Pizza</div>
        <div className="home-subtitle"> {date} </div>
      </div>
      <div className="home-search-container">
        <SearchField />
      </div>
      <Tab order={setOrders} />
      <Orders foods={orders} />
    </div>
  );
};
