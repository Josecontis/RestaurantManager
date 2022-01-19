import React from "react";
import { useState } from "react";

import "./Modal.css";

export const Modal = ({ title, onClose, description, info, open }) => {
  const [isOpen, setIsOpen] = useState(open);
  return (
    isOpen && (
      <div className="modal-background" onClick={onClose}>
        <div className="modal-container">
          <div className="modal-title">{title}</div>
          <div className="modal-description">{description}</div>
          <div className="modal-info">Intolleranze: {info}</div>
        </div>
      </div>
    )
  );
};
