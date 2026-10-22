import { useCallback, useEffect, useState } from "react";
import {
  getTablet,
  getTablets,
  registerThisDevice,
  removeTablet,
} from "../../api";

export const AdminTablets = ({ onUnauthorized }) => {
  const [tablets, setTablets] = useState(null);
  const [thisDevice, setThisDevice] = useState(getTablet());
  const [tableNumber, setTableNumber] = useState("");
  const [error, setError] = useState(null);

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
      setTablets(await getTablets());
    } catch (loadError) {
      handleError(loadError);
    }
  }, [handleError]);

  useEffect(() => {
    load();
  }, [load]);

  const register = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      setThisDevice(await registerThisDevice(parseInt(tableNumber, 10)));
      setTableNumber("");
      load();
    } catch (registerError) {
      handleError(registerError);
    }
  };

  const remove = async (id) => {
    setError(null);
    try {
      await removeTablet(id);
      setThisDevice(getTablet());
      load();
    } catch (removeError) {
      handleError(removeError);
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-card admin-device">
        <div className="admin-card-main">Questo dispositivo</div>
        {thisDevice ? (
          <>
            <div className="admin-note">
              È registrato come <b>tavolo {thisDevice.tableNumber}</b>: gli
              ordini "Mangia sul posto" partono da qui con il tavolo già
              inserito.
            </div>
            <button
              className="admin-button admin-button--secondary"
              onClick={() => remove(thisDevice.id)}
            >
              Annulla registrazione
            </button>
          </>
        ) : (
          <form onSubmit={register}>
            <div className="admin-note">
              Non è registrato: chi ordina "Mangia sul posto" deve scrivere il
              numero del tavolo. Apri questa pagina dal tablet che vuoi
              assegnare a un tavolo e registralo qui.
            </div>
            <div className="admin-row">
              <input
                className="admin-input"
                type="number"
                min="1"
                placeholder="Numero del tavolo"
                value={tableNumber}
                onChange={(event) => setTableNumber(event.target.value)}
              />
              <button className="admin-button" type="submit">
                Registra questo dispositivo
              </button>
            </div>
          </form>
        )}
      </div>
      {error && <div className="admin-error">{error}</div>}
      <div className="admin-list-title">Tablet registrati</div>
      {tablets && tablets.length === 0 && (
        <div className="admin-note">Nessun tablet registrato.</div>
      )}
      <ul className="admin-list">
        {tablets &&
          tablets.map((tablet) => (
            <li key={tablet.id} className="admin-list-item">
              <div>
                <div className="admin-list-name">
                  Tavolo {tablet.tableNumber}
                  {thisDevice && thisDevice.id === tablet.id && (
                    <span className="admin-badge">questo dispositivo</span>
                  )}
                </div>
                <div className="admin-note">
                  Registrato il{" "}
                  {new Date(tablet.createdAt).toLocaleDateString("it-IT")}
                </div>
              </div>
              <button
                className="admin-button admin-button--secondary"
                onClick={() => remove(tablet.id)}
              >
                Rimuovi
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
};
