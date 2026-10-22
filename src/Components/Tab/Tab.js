import React from "react";
import { useState } from "react";
import { Card } from "../Card/Card";
import { DropdownField } from "../DropdownField/DropdownField";

import "./Tab.css";

export const orderTypes = ["Mangia sul posto", "Ritira", "Consegna"];

const pizzas = [
  {
    id: 1,
    name: "Margherita",
    description:
      "Pomodoro San Marzano, mozzarella fior di latte, basilico fresco e olio extravergine d'oliva.",
    price: 6,
    info: "Glutine, Lattosio",
  },
  {
    id: 2,
    name: "Marinara",
    description: "Pomodoro, aglio, origano e olio extravergine d'oliva.",
    price: 5,
    info: "Glutine",
  },
  {
    id: 3,
    name: "Diavola",
    description: "Pomodoro, mozzarella fior di latte e salame piccante.",
    price: 7.5,
    info: "Glutine, Lattosio",
  },
  {
    id: 4,
    name: "Capricciosa",
    description:
      "Pomodoro, mozzarella, prosciutto cotto, funghi, carciofini e olive nere.",
    price: 8.5,
    info: "Glutine, Lattosio",
  },
  {
    id: 5,
    name: "Quattro Formaggi",
    description: "Mozzarella, gorgonzola, fontina e parmigiano reggiano.",
    price: 8,
    info: "Glutine, Lattosio",
  },
  {
    id: 6,
    name: "Prosciutto e Funghi",
    description: "Pomodoro, mozzarella, prosciutto cotto e funghi champignon.",
    price: 7.5,
    info: "Glutine, Lattosio",
  },
  {
    id: 7,
    name: "Bufalina",
    description:
      "Pomodoro, mozzarella di bufala campana, basilico e olio a crudo.",
    price: 8.5,
    info: "Glutine, Lattosio",
  },
  {
    id: 8,
    name: "Ortolana",
    description: "Pomodoro, mozzarella, zucchine, melanzane e peperoni grigliati.",
    price: 7.5,
    info: "Glutine, Lattosio",
  },
];

export const Tab = ({ order, onOrderTypeChange }) => {
  // Only categories with at least one dish are shown
  const tabs = [
    { label: "Piatti Caldi", foods: [] },
    { label: "Piatti Freddi", foods: [] },
    { label: "Zuppe", foods: [] },
    { label: "Grigliate", foods: [] },
    { label: "Pizze", foods: pizzas },
  ].filter((item) => item.foods.length !== 0);
  const [selectedTab, setSelectedTab] = useState(0);
  const handleClick = (index) => {
    setSelectedTab(index);
  };

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
            <DropdownField options={orderTypes} onChange={onOrderTypeChange} />
          </div>
          <div style={{ padding: "10px" }}>
            <div className="tab-list">
              <Card cards={tabs[selectedTab].foods} onSelect={order} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
