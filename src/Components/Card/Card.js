import React from "react";
import { useState } from "react";
import { Modal } from "../Modal/Modal";

import "./Card.css";

export const Card = ({ cards }) => {
  const [moreInfo, setMoreInfo] = useState("");

  return cards.map((el, index) => {
    return (
      <div key={index}>
        <div className="card-container">
          <div className="card-image" />
          <div className="card-title">{el.name}</div>
          <div className="card-price">{el.price} &euro;</div>
          <div className="card-info" onClick={() => setMoreInfo(el.name)}>
            Maggiori info
          </div>
        </div>
        {moreInfo && (
          <Modal
            open={moreInfo === el.name}
            onClose={() => setMoreInfo(!moreInfo)}
            title={el.name}
            description={el.description}
            info={el.info}
          />
        )}
      </div>
    );
  });
};
