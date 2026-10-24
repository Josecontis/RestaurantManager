import { useEffect, useRef, useState } from "react";
import { searchAddresses } from "../../api";
import { TextField } from "../TextField/TextField";
import "./AddressField.css";

// Suggestions start after a few letters and a short pause, to keep the free service light
const MIN_CHARS = 4;
const WAIT_MS = 400;

// Text field with address suggestions: an address counts only when picked from the list.
// onChange(text) while typing, onSelect(place) when a suggestion is picked.
// center: { lat, lon } to show the nearest addresses first.
export const AddressField = ({
  value,
  onChange,
  onSelect,
  center,
  placeholder,
  error,
}) => {
  const [suggestions, setSuggestions] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // The text written by a pick must not start a new search
  const pickedText = useRef(null);
  const lat = center?.lat;
  const lon = center?.lon;

  useEffect(() => {
    if (value === pickedText.current || value.trim().length < MIN_CHARS) {
      setSuggestions(null);
      return;
    }
    let isCurrent = true;
    const timer = setTimeout(() => {
      searchAddresses(value.trim(), lat, lon)
        .then((places) => {
          if (isCurrent) {
            setSuggestions(places);
            setSearchError(null);
            setActiveIndex(-1);
          }
        })
        .catch((loadError) => isCurrent && setSearchError(loadError.message));
    }, WAIT_MS);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [value, lat, lon]);

  const pick = (place) => {
    pickedText.current = place.label;
    onChange(place.label);
    onSelect(place);
    setIsOpen(false);
  };

  const handleKey = (event) => {
    if (!isOpen || !suggestions || suggestions.length === 0) {
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(
        (index) => (index + step + suggestions.length) % suggestions.length
      );
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="address-field">
      <TextField
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen && Boolean(suggestions)}
        error={error || searchError}
        onChange={(event) => {
          pickedText.current = null;
          setIsOpen(true);
          onChange(event.target.value);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKey}
      />
      {isOpen && suggestions && (
        <ul className="address-field-list" role="listbox">
          {suggestions.length === 0 && (
            <li className="address-field-empty">
              Nessun indirizzo trovato: prova con via, numero e città
            </li>
          )}
          {suggestions.map((place, index) => (
            <li
              key={place.label}
              role="option"
              aria-selected={index === activeIndex}
              className={
                "address-field-option" + (index === activeIndex ? " active" : "")
              }
              // mousedown comes before the field loses focus and closes the list
              onMouseDown={(event) => {
                event.preventDefault();
                pick(place);
              }}
            >
              {place.label}
            </li>
          ))}
          <li className="address-field-credits">Indirizzi © OpenStreetMap</li>
        </ul>
      )}
    </div>
  );
};
