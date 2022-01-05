import { useState } from "react";
import "./Sidebar.css";
import { HomeIcon } from "../Assets/HomeIcon";
import { ToLeftIcon } from "../Assets/ToLeftIcon";
import { ToRightIcon } from "../Assets/ToRightIcon";
import { ClocheIcon } from "../Assets/ClocheIcon";
import { SettingsIcon } from "../Assets/SettingsIcon";

export const Sidebar = () => {
  const [isActive, setIsActive] = useState("Home");
  const [isExpanded, setIsExpanded] = useState(true);
  const menuList = ["Home", "Settings"];
  return (
    <>
      <div className={!isExpanded ? "navigation active" : "navigation"}>
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
                      <SettingsIcon
                        size={24}
                        color={isActive === element ? "#ffffff" : "#eb7c68"}
                      />
                    </div>
                    <span className="title">{element}</span>
                  </div>
                </li>
              );
            })}
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className={!isExpanded ? "toggle active" : "toggle"}
          >
            {isExpanded ? (
              <ToRightIcon size={24} color="#eb7c68" />
            ) : (
              <ToLeftIcon size={24} color="#eb7c68" />
            )}
          </div>
        </ul>
      </div>
    </>
  );
};
