import { useEffect, useState } from "react";
import { getOpeningHours, saveOpeningHours } from "../../api";
import { Button } from "../../Components/Button/Button";
import { ListRow } from "../../Components/ListRow/ListRow";
import { TextField } from "../../Components/TextField/TextField";
import { AdminKitchen } from "./AdminKitchen";
import { useAdminError } from "./useAdminError";

const WEEKDAYS = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
];

export const AdminHours = ({ onUnauthorized }) => {
  const [week, setWeek] = useState(null);
  const [error, setError, handleError] = useAdminError(onUnauthorized);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getOpeningHours().then(setWeek).catch(handleError);
  }, [handleError]);

  const change = (weekday, field, value) => {
    setIsSaved(false);
    setWeek((days) =>
      days.map((day) =>
        day.weekday === weekday ? { ...day, [field]: value } : day
      )
    );
  };

  const save = async (event) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      setWeek(await saveOpeningHours(week));
      setIsSaved(true);
    } catch (saveError) {
      handleError(saveError);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-note">
        Gli orari indicano la prima e l'ultima fascia prenotabile per ritiro e
        consegna, ogni 15 minuti. Gli ordini da mangiare sul posto non
        dipendono da questi orari.
      </div>
      {error && <div className="admin-error">{error}</div>}
      {week === null && !error && (
        <div className="admin-note">Caricamento degli orari...</div>
      )}
      {week && (
        <form className="admin-hours" onSubmit={save}>
          <ul className="admin-list">
            {week.map((day) => (
              <ListRow
                key={day.weekday}
                title={
                  <label className="admin-check">
                    <input
                      type="checkbox"
                      checked={day.isOpen}
                      onChange={(event) =>
                        change(day.weekday, "isOpen", event.target.checked)
                      }
                    />
                    {WEEKDAYS[day.weekday - 1]}
                  </label>
                }
              >
                {day.isOpen ? (
                  <>
                    <TextField
                      className="admin-hours-time"
                      type="time"
                      step="900"
                      required
                      aria-label={`Prima fascia di ${WEEKDAYS[day.weekday - 1]}`}
                      value={day.firstSlot}
                      onChange={(event) =>
                        change(day.weekday, "firstSlot", event.target.value)
                      }
                    />
                    <span className="admin-note">-</span>
                    <TextField
                      className="admin-hours-time"
                      type="time"
                      step="900"
                      required
                      aria-label={`Ultima fascia di ${WEEKDAYS[day.weekday - 1]}`}
                      value={day.lastSlot}
                      onChange={(event) =>
                        change(day.weekday, "lastSlot", event.target.value)
                      }
                    />
                  </>
                ) : (
                  <span className="admin-note">Chiuso</span>
                )}
              </ListRow>
            ))}
          </ul>
          <div className="admin-toolbar">
            <div className="admin-note">{isSaved && "Orari salvati."}</div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvataggio..." : "Salva orari"}
            </Button>
          </div>
        </form>
      )}
      <AdminKitchen onUnauthorized={onUnauthorized} />
    </div>
  );
};
