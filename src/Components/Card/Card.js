import React from "react";
import { useState } from "react";
import { Modal } from "../Modal/Modal";

import "./Card.css";

export const Card = ({ cards, onSelect }) => {
  const [moreInfo, setMoreInfo] = useState("");

  return cards.map((el, index) => {
    return (
      <div key={index}>
        <div className="card-container" onClick={() => onSelect(el)}>
          <div className="card-image" />
          <div className="card-title">{el.name}</div>
          <div className="card-description">{el.description}</div>
          <div className="card-price">
            {el.price.toLocaleString("it-IT", {
              style: "currency",
              currency: "EUR",
            })}
          </div>
          <div className="card-add">Aggiungi</div>
          <div
            className="card-info"
            onClick={(event) => {
              // Opening the info must not add the dish to the order
              event.stopPropagation();
              setMoreInfo(el.name);
            }}
          >
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
