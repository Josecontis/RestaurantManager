import React from "react";
import ReactDOM from "react-dom";
import { useState } from "react";

import "./Tab.css";

const Summary = () => (
  <div className="tab-panel">
    <div className="tab-panel-content">Summary Placeholder</div>
  </div>
);
const Details = () => (
  <div className="tab-panel">
    <div className="tab-panel-content">Details Placeholder</div>
  </div>
);
const MasterProject = () => (
  <div className="tab-panel">
    <div className="tab-panel-content">Master project Placeholder</div>
  </div>
);
const Jobs = () => (
  <div className="tab-panel">
    <div className="tab-panel-content">Jobs Placeholder</div>
  </div>
);

export const Tab = () => {
  const tabs = [
    {
      label: "Summary",
      component: <Summary />,
    },
    {
      label: "details",
      component: <Details />,
    },
    {
      label: "Master Project",
      component: <MasterProject />,
    },
    {
      label: "Jobs",
      component: <Jobs />,
    },
  ];
  const [selectedTab, setSelectedTab] = useState(0);
  const handleClick = (index) => {
    setSelectedTab(index);
  };

  return (
    <>
      <ul className="tab-container">
        {tabs.map((item, index) => (
          <li
            className={"tab-item " + (selectedTab === index && "active")}
            onClick={() => handleClick(index)}
          >
            {item.label}
          </li>
        ))}
      </ul>
      <div style={{ padding: "10px" }}>{tabs[selectedTab].component}</div>
    </>
  );
};
