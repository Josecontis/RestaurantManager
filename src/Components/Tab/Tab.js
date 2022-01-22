import React from "react";
import { useState } from "react";
import { Card } from "../Card/Card";
import { DropdownField } from "../DropdownField/DropdownField";

import "./Tab.css";

const foods = [
  {
    name: "Spaghetti con salsa ai funghi",
    description:
      "Pasta con crema di funghi e senza panna un primo piatto con latte e un pizzico di amido di mais che permette al sugo di essere cremoso e denso.",
    price: "2.68",
    info: "Lattosio",
  },
  {
    name: "Gnocchi con zuppa di mango e salsa di cipolla",
    description:
      "Pasta con crema di funghi e senza panna un primo piatto con latte e un pizzico di amido di mais che permette al sugo di essere cremoso e denso.",
    price: "2.99",
    info: "Glutine, Lattosio",
  },
  {
    name: "Gnocchi con zuppa di mango e salsa di cipolla",
    description:
      "Pasta con crema di funghi e senza panna un primo piatto con latte e un pizzico di amido di mais che permette al sugo di essere cremoso e denso.",
    price: "2.99",
    info: "Glutine, Lattosio",
  },
  {
    name: "Gnocchi con zuppa di mango e salsa di cipolla",
    description:
      "Pasta con crema di funghi e senza panna un primo piatto con latte e un pizzico di amido di mais che permette al sugo di essere cremoso e denso.",
    price: "2.99",
    info: "Glutine, Lattosio",
  },
  {
    name: "Gnocchi con zuppa di mango e salsa di cipolla",
    description:
      "Pasta con crema di funghi e senza panna un primo piatto con latte e un pizzico di amido di mais che permette al sugo di essere cremoso e denso.",
    price: "2.99",
    info: "Glutine, Lattosio",
  },
  {
    name: "Spaghetti con salsa ai funghi",
    description:
      "Pasta con crema di funghi e senza panna un primo piatto con latte e un pizzico di amido di mais che permette al sugo di essere cremoso e denso.",
    price: "2.68",
    info: "Lattosio",
  },
];

const HotDishes = () => (
  <div className="tab-list">
    <Card cards={foods} />
  </div>
);
const ColdDishes = () => <div className="tab-list"></div>;
const Soup = () => <div className="tab-list"></div>;
const Grill = () => <div className="tab-list"></div>;
const Pizzas = () => <div className="tab-list"></div>;

export const Tab = () => {
  const tabs = [
    {
      label: "Piatti Caldi",
      component: <HotDishes />,
    },
    {
      label: "Piatti Freddi",
      component: <ColdDishes />,
    },
    {
      label: "Zuppe",
      component: <Soup />,
    },
    {
      label: "Grigliate",
      component: <Grill />,
    },
    {
      label: "Pizze",
      component: <Pizzas />,
    },
  ];
  const [selectedTab, setSelectedTab] = useState(0);
  const handleClick = (index) => {
    setSelectedTab(index);
  };

  const options = ["A-Z", "Z-A", "Prezzo Crescente", "Prezzo Decrescente"];

  return (
    <>
      <ul className="tab-container">
        {tabs.map((item, index) => (
          <li
            key={index}
            className={"tab-item " + (selectedTab === index && "active")}
            onClick={() => handleClick(index)}
          >
            {item.label}
          </li>
        ))}
      </ul>
      <div className="tab-panel">
        <div className="tab-panel-content">
          <div className="tab-panel-title">Scegli Piatti</div>
          <div className="tab-panel-filter">
            <DropdownField options={options} />
          </div>
          <div style={{ padding: "10px" }}>{tabs[selectedTab].component}</div>
        </div>
      </div>
    </>
  );
};
