import { useCallback, useEffect, useState } from "react";
import { addDriver, getDrivers, removeDriver, setDriverActive } from "../../api";

export const AdminDrivers = ({ onUnauthorized }) => {
  const [drivers, setDrivers] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const activeCount = drivers
    ? drivers.filter((driver) => driver.isActive).length
    : 0;

  const handleError = useCallback(
    (actionError) => {
      if (actionError.status === 401) {
        onUnauthorized();
      } else {
        setError(actionError.message);
      }
    },
    [onUnauthorized]
  );

  const load = useCallback(async () => {
    try {
      setDrivers(await getDrivers());
    } catch (loadError) {
      handleError(loadError);
    }
  }, [handleError]);

  useEffect(() => {
    load();
  }, [load]);

  // Every action reloads the list, so the screen always shows the saved state
  const run = async (action) => {
    setError(null);
    try {
      await action();
      load();
    } catch (actionError) {
      handleError(actionError);
    }
  };

  const add = (event) => {
    event.preventDefault();
    run(async () => {
      await addDriver(name);
      setName("");
    });
  };

  return (
    <div className="admin-section">
      <div className="admin-card admin-device">
        <div className="admin-card-main">Driver in servizio: {activeCount}</div>
        <div className="admin-note">
          Ogni fascia di consegna accetta tante consegne quanti sono i driver in
          servizio. Con nessun driver in servizio le consegne non sono
          prenotabili.
        </div>
        <form onSubmit={add}>
          <div className="admin-row">
            <input
              className="admin-input"
              type="text"
              placeholder="Nome del driver"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <button className="admin-button" type="submit">
              Aggiungi driver
            </button>
          </div>
        </form>
      </div>
      {error && <div className="admin-error">{error}</div>}
      <div className="admin-list-title">Driver</div>
      {drivers && drivers.length === 0 && (
        <div className="admin-note">Nessun driver inserito.</div>
      )}
      <ul className="admin-list">
        {drivers &&
          drivers.map((driver) => (
            <li key={driver.id} className="admin-list-item">
              <div>
                <div className="admin-list-name">{driver.name}</div>
                <div className="admin-note">
                  {driver.isActive ? "In servizio" : "Non in servizio"}
                </div>
              </div>
              <div className="admin-actions">
                <button
                  className={
                    "admin-button" +
                    (driver.isActive ? " admin-button--secondary" : "")
                  }
                  onClick={() =>
                    run(() => setDriverActive(driver.id, !driver.isActive))
                  }
                >
                  {driver.isActive ? "Togli dal servizio" : "Metti in servizio"}
                </button>
                <button
                  className="admin-button admin-button--secondary"
                  onClick={() => run(() => removeDriver(driver.id))}
                >
                  Rimuovi
                </button>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
};
