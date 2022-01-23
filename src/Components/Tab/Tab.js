import React from "react";
import { useState } from "react";
import { Card } from "../Card/Card";
import { DropdownField } from "../DropdownField/DropdownField";

import "./Tab.css";

export const Tab = ({ order }) => {
  const foods = [
    {
      name: "Spaghetti con salsa ai funghi",
      description:
        "Pasta con crema di funghi e senza panna un primo piatto con latte e un pizzico di amido di mais che permette al sugo di essere cremoso e denso.",
      price: "2.68",
      info: "Lattosio",
      onClick: () => {
        order((prevElems) => [
          ...prevElems,
          { name: "Spaghetti con salsa ai funghi", price: "2.68" },
        ]);
      },
    },
    {
      name: "Gnocchi con zuppa di mango e salsa di cipolla",
      description:
        "Pasta con crema di funghi e senza panna un primo piatto con latte e un pizzico di amido di mais che permette al sugo di essere cremoso e denso.",
      price: "2.99",
      info: "Glutine, Lattosio",
      onClick: () => {
        order((prevElems) => [
          ...prevElems,
          {
            name: "Gnocchi con zuppa di mango e salsa di cipolla",
            price: "2.99",
          },
        ]);
      },
    },
    {
      name: "Gnocchi con zuppa di mango e salsa di cipolla",
      description:
        "Pasta con crema di funghi e senza panna un primo piatto con latte e un pizzico di amido di mais che permette al sugo di essere cremoso e denso.",
      price: "2.99",
      info: "Glutine, Lattosio",
      onClick: () => {
        order((prevElems) => [
          ...prevElems,
          {
            name: "Gnocchi con zuppa di mango e salsa di cipolla",
            price: "2.99",
          },
        ]);
      },
    },
    {
      name: "Gnocchi con zuppa di mango e salsa di cipolla",
      description:
        "Pasta con crema di funghi e senza panna un primo piatto con latte e un pizzico di amido di mais che permette al sugo di essere cremoso e denso.",
      price: "2.99",
      info: "Glutine, Lattosio",
      onClick: () => {
        order((prevElems) => [
          ...prevElems,
          {
            name: "Gnocchi con zuppa di mango e salsa di cipolla",
            price: "2.99",
          },
        ]);
      },
    },
    {
      name: "Gnocchi con zuppa di mango e salsa di cipolla",
      description:
        "Pasta con crema di funghi e senza panna un primo piatto con latte e un pizzico di amido di mais che permette al sugo di essere cremoso e denso.",
      price: "2.99",
      info: "Glutine, Lattosio",
      onClick: () => {
        order((prevElems) => [
          ...prevElems,
          {
            name: "Gnocchi con zuppa di mango e salsa di cipolla",
            price: "2.99",
          },
        ]);
      },
    },
    {
      name: "Spaghetti con salsa ai funghi",
      description:
        "Pasta con crema di funghi e senza panna un primo piatto con latte e un pizzico di amido di mais che permette al sugo di essere cremoso e denso.",
      price: "2.68",
      info: "Lattosio",
      onClick: () => {
        order((prevElems) => [
          ...prevElems,
          {
            name: "Spaghetti con salsa ai funghi",
            price: "2.68",
          },
        ]);
      },
    },
  ];

  const HotDishes = () => <Card cards={foods} />;
  const ColdDishes = () => <div></div>;
  const Soup = () => <div></div>;
  const Grill = () => <div></div>;
  const Pizzas = () => <div></div>;

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

  const options = ["Mangia sul posto", "Ritira", "Consegna"];

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
          <div style={{ padding: "10px" }}>
            <div className="tab-list">{tabs[selectedTab].component}</div>
          </div>
        </div>
      </div>
    </>
  );
};
