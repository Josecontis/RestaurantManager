import "./Sidebar.css";
import { ClocheIcon } from "../Assets/ClocheIcon";
import { SettingsIcon } from "../Assets/SettingsIcon";
import { useLocation, useNavigate } from "react-router-dom";

export const Sidebar = () => {
  // The active item follows the address, also with the browser back button
  const location = useLocation();
  const isActive = location.pathname.split("/")[1] || "Orders";
  const navigate = useNavigate();
  const IconList = [
    <ClocheIcon size={24} color={isActive ? "#ffffff" : "var(--accent)"} />,
    <SettingsIcon size={24} color={isActive ? "#ffffff" : "var(--accent)"} />,
  ];
  const menuList = ["Orders", "Admin"];
  return (
    <>
      <div className="navigation">
        <ul>
          {menuList &&
            menuList.map((element, index) => {
              return (
                <li
                  key={index}
                  onClick={() => {
                    navigate(`/${element}`);
                  }}
                  className={isActive === element ? "list active" : "list"}
                >
                  <b></b>
                  <b></b>
                  <div className="button">
                    <div className="icon-list">{IconList[index]}</div>
                    <span className="title">{element}</span>
                  </div>
                </li>
              );
            })}
        </ul>
      </div>
    </>
  );
};
