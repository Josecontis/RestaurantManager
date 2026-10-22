import { useCallback, useEffect, useState } from "react";
import { addDriver, getDrivers, removeDriver, setDriverActive } from "../../api";
import { Button } from "../../Components/Button/Button";
import { ListRow } from "../../Components/ListRow/ListRow";
import { TextField } from "../../Components/TextField/TextField";
import { useAdminError } from "./useAdminError";

export const AdminDrivers = ({ onUnauthorized }) => {
  const [drivers, setDrivers] = useState(null);
  const [name, setName] = useState("");
  const [error, setError, handleError] = useAdminError(onUnauthorized);
  const activeCount = drivers
    ? drivers.filter((driver) => driver.isActive).length
    : 0;

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
            <TextField
              placeholder="Nome del driver"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Button type="submit">Aggiungi driver</Button>
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
            <ListRow
              key={driver.id}
              title={driver.name}
              note={driver.isActive ? "In servizio" : "Non in servizio"}
            >
              <Button
                variant={driver.isActive ? "secondary" : "primary"}
                onClick={() =>
                  run(() => setDriverActive(driver.id, !driver.isActive))
                }
              >
                {driver.isActive ? "Togli dal servizio" : "Metti in servizio"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => run(() => removeDriver(driver.id))}
              >
                Rimuovi
              </Button>
            </ListRow>
          ))}
      </ul>
    </div>
  );
};
