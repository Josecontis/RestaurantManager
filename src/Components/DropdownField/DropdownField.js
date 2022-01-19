import React, { useRef, useState, useEffect } from "react";
import { ArrowDownIcon } from "../Assets/ArrowDownIcon";
import { ArrowUpIcon } from "../Assets/ArrowUpIcon";
import "./DropdownField.css";

export const DropdownField = ({ options }) => {
  const wrapperRef = useRef(null);
  useEffect(() => {
    /**
     * Alert if clicked on outside of element
     */
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);

  return (
    <div
      ref={wrapperRef}
      className="select-box"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="select-box__current" tabIndex="1">
        <div className="select-box__value">
          <input
            className="select-box__input"
            type="radio"
            id={index}
            value={index + 1}
            name="OrderBy"
            checked="checked"
            onChange={() => {}}
          />
          <p className="select-box__input-text">{options[index]}</p>
        </div>
      </div>
      {isOpen ? (
        <ul className="select-box__list">
          {options.map((el, idx) => {
            return (
              <li>
                <label
                  className="select-box__option"
                  onClick={() => setIndex(idx)}
                >
                  {el}
                </label>
              </li>
            );
          })}
        </ul>
      ) : null}
      {isOpen ? (
        <ArrowUpIcon size={24} color="#fff" />
      ) : (
        <ArrowDownIcon size={24} color="#fff" />
      )}
    </div>
  );
};
