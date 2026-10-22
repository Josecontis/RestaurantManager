import React from "react";
import { useState } from "react";
import { orderTypeLabels } from "../../api";
import { Card } from "../Card/Card";
import { DropdownField } from "../DropdownField/DropdownField";

import "./Tab.css";

export const orderTypes = Object.values(orderTypeLabels);

export const Tab = ({ categories, order, onOrderTypeChange }) => {
  // The server sends only categories with at least one dish
  const tabs = categories.map((category) => ({
    label: category.name,
    foods: category.dishes.map((dish) => ({ ...dish, info: dish.allergens })),
  }));
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
