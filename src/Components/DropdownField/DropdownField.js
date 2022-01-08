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
    <div ref={wrapperRef} class="select-box" onClick={() => setIsOpen(!isOpen)}>
      <div class="select-box__current" tabindex="1">
        <div class="select-box__value">
          <input
            class="select-box__input"
            type="radio"
            id={index}
            value={index + 1}
            name="OrderBy"
            checked="checked"
          />
          <p class="select-box__input-text">{options[index]}</p>
        </div>
      </div>
      {isOpen ? (
        <ul class="select-box__list">
          {options.map((el, idx) => {
            return (
              <li>
                <label class="select-box__option" onClick={() => setIndex(idx)}>
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
