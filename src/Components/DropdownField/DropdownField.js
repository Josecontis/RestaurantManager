import { useState } from "react";
import { ArrowDownIcon } from "../Assets/ArrowDownIcon";
import { ArrowUpIcon } from "../Assets/ArrowUpIcon";
import "./DropdownField.css";

export const DropdownField = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="dropdown">
      <select
        id="orderby"
        name="orderbylist"
        form="orderbyform"
        onClick={() => setIsOpen(!isOpen)}
      >
        <option value="A-Z">A-Z</option>
        <option value="Z-A">Z-A</option>
        <option value="Prezzo Crescente">Prezzo Crescente</option>
        <option value="Prezzo Decrescente">Prezzo Decrescente</option>
      </select>
      {!isOpen ? <ArrowUpIcon size={24} /> : <ArrowDownIcon size={24} />}
    </div>
  );
};
