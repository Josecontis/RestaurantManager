import React from "react";
import { useState } from "react";

import "./Card.css";

export const Card = ({ cards }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const handleClick = (index) => {
    setSelectedTab(index);
  };

  return (
    <>
      {cards.map((el) => {
        return (
          <div className="card-container">
            <div className="card-image" />
            <div className="card-title">{el.name}</div>
            <div className="card-price">{el.price} &euro;</div>
            <div className="card-info">Maggiori info</div>
          </div>
        );
      })}
    </>
  );
};
