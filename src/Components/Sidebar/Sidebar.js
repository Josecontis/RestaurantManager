import { useState } from "react";
import "./Sidebar.css";
import { HomeIcon } from "../Assets/HomeIcon";

export const Sidebar = () => {
  const [isActive, setIsActive] = useState("");
  const menuList = ["Home", "Settings"];
  return (
    <>
      <div className="navigation">
        <ul>
          {menuList &&
            menuList.map((element, index) => {
              return (
                <li
                  key={index}
                  onClick={() => setIsActive(element)}
                  className={isActive === element ? "list active" : "list"}
                >
                  <b></b>
                  <b></b>
                  <div className="button">
                    <div className="icon-list">
                      <HomeIcon
                        size={24}
                        color={isActive === element ? "#ffffff" : "#eb7c68"}
                      />
                    </div>
                    <span className="title">{element}</span>
                  </div>
                </li>
              );
            })}
        </ul>
      </div>
      <div className="toggle">cccc</div>
    </>
  );
};
