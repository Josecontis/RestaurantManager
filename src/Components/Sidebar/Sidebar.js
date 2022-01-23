import { useState } from "react";
import "./Sidebar.css";
import { HomeIcon } from "../Assets/HomeIcon";
import { ClocheIcon } from "../Assets/ClocheIcon";
import { SettingsIcon } from "../Assets/SettingsIcon";
import { useNavigate } from "react-router-dom";

export const Sidebar = () => {
  const [isActive, setIsActive] = useState("Orders");
  const navigate = useNavigate();
  const IconList = [
    <ClocheIcon size={24} color={isActive ? "#ffffff" : "#eb7c68"} />,
    <SettingsIcon size={24} color={isActive ? "#ffffff" : "#eb7c68"} />,
  ];
  const menuList = ["Orders", "Settings"];
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
                    setIsActive(element);
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
