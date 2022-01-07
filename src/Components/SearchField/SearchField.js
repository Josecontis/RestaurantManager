import { SearchIcon } from "../Assets/SearchIcon";
import "./SearchField.css";

export const SearchField = () => {
  return (
    <div className="search-field">
      <input placeholder="Ricerca piatti, caffé, pizze, etc..." type="text" />
      <div className="search-icon">
        <SearchIcon size={24} />
      </div>
    </div>
  );
};
