import React from "react";
import { useState } from "react";

import "./Modal.css";

// image, when set, is shown big above the title
export const Modal = ({ title, onClose, description, info, open, image }) => {
  const [isOpen] = useState(open);
  return (
    isOpen && (
      <div className="modal-background" onClick={onClose}>
        <div className={"modal-container" + (image ? " modal-container--image" : "")}>
          {image && <img className="modal-image" src={image} alt={title} />}
          <div className="modal-title">{title}</div>
          <div className="modal-description">{description}</div>
          <div className="modal-info">Intolleranze: {info}</div>
        </div>
      </div>
    )
  );
};
