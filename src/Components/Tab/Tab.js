import React from "react";
import { useState } from "react";
import { orderTypeLabels } from "../../api";
import { Card } from "../Card/Card";
import { DropdownField } from "../DropdownField/DropdownField";

import "./Tab.css";

export const orderTypes = Object.values(orderTypeLabels);

// Lowercase and without accents, so "caffe" also finds "caffè"
const normalize = (text) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export const Tab = ({ categories, search, order, onOrderTypeChange }) => {
  const query = normalize(search.trim());
  // Categories left without dishes by the search are hidden
  const tabs = categories
    .map((category) => ({
      label: category.name,
      foods: category.dishes
        .filter((dish) =>
          normalize(
            [
              category.name,
              dish.name,
              dish.description,
              dish.ingredients || "",
            ].join(" ")
          ).includes(query)
        )
        .map((dish) => ({ ...dish, info: dish.allergens })),
    }))
    .filter((item) => item.foods.length !== 0);
  const [selectedTab, setSelectedTab] = useState(0);
  // The search can hide the selected category
  const currentTab = Math.min(selectedTab, tabs.length - 1);
  const handleClick = (index) => {
    setSelectedTab(index);
  };

  return (
    <>
      <ul className="tab-container">
        {tabs.map((item, index) => (
          <li
            key={index}
            className={"tab-item " + (currentTab === index && "active")}
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
            {tabs.length !== 0 ? (
              <div className="tab-list">
                <Card cards={tabs[currentTab].foods} onSelect={order} />
              </div>
            ) : (
              <div className="tab-empty">
                Nessun piatto trovato per "{search.trim()}"
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
