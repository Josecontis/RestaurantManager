import { SearchField } from "../../Components/SearchField/SearchField";
import { Tab } from "../../Components/Tab/Tab";
import "./Home.css";

export const Home = () => {
  var today = new Date();

  var date =
    today.toLocaleString("default", { weekday: "long" }) +
    ", " +
    today.getDate() +
    " " +
    today.toLocaleString("default", { month: "long" }) +
    " " +
    today.getFullYear();

  return (
    <div className="home-page">
      <div className="home-title-container">
        <div className="home-title">Wellness Pizza</div>
        <div className="home-subtitle"> {date} </div>
      </div>
      <div className="home-search-container">
        <SearchField />
      </div>
      <Tab />
    </div>
  );
};
