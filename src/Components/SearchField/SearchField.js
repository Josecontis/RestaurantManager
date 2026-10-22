import { SearchIcon } from "../Assets/SearchIcon";
import "./SearchField.css";

export const SearchField = ({ value, onChange }) => {
  return (
    <div className="search-field">
      <input
        placeholder="Ricerca piatti, caffé, pizze, etc..."
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="search-icon">
        <SearchIcon size={24} />
      </div>
    </div>
  );
};
