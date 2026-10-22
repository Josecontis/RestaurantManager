import { useCallback, useState } from "react";
import { adminLogout, getAdmin } from "../../api";
import { AdminLogin } from "./AdminLogin";
import { AdminOrders } from "./AdminOrders";
import { AdminTablets } from "./AdminTablets";
import "./Admin.css";

const sections = [
  { label: "Ordini", component: AdminOrders },
  { label: "Tablet", component: AdminTablets },
];

export const Admin = () => {
  const [admin, setAdmin] = useState(getAdmin());
  const [selectedSection, setSelectedSection] = useState(0);
  const Section = sections[selectedSection].component;
  const handleUnauthorized = useCallback(() => setAdmin(null), []);

  const logout = async () => {
    try {
      await adminLogout();
    } catch {}
    setAdmin(null);
  };

  if (!admin) {
    return (
      <div className="admin-page">
        <AdminLogin onLogin={setAdmin} />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <div className="admin-title">Area admin</div>
          <div className="admin-subtitle">Accesso come {admin.username}</div>
        </div>
        <button className="admin-button admin-button--secondary" onClick={logout}>
          Esci
        </button>
      </div>
      <ul className="tab-container">
        {sections.map((item, index) => (
          <li
            key={index}
            className={"tab-item " + (selectedSection === index && "active")}
            onClick={() => setSelectedSection(index)}
          >
            {item.label}
          </li>
        ))}
      </ul>
      <Section onUnauthorized={handleUnauthorized} />
    </div>
  );
};
