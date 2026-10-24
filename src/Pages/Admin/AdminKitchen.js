import { useEffect, useState } from "react";
import { getKitchen, saveKitchen } from "../../api";
import { Button } from "../../Components/Button/Button";
import { ListRow } from "../../Components/ListRow/ListRow";
import { TextField } from "../../Components/TextField/TextField";
import { useAdminError } from "./useAdminError";

// Kitchen capacity and limits per customer, shown under the opening hours
export const AdminKitchen = ({ onUnauthorized }) => {
  const [kitchen, setKitchen] = useState(null);
  const [error, setError, handleError] = useAdminError(onUnauthorized);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getKitchen().then(setKitchen).catch(handleError);
  }, [handleError]);

  const change = (field, value) => {
    setIsSaved(false);
    setKitchen((current) => ({ ...current, [field]: value }));
  };

  const save = async (event) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      setKitchen(
        await saveKitchen({
          pizzasPerHour: parseInt(kitchen.pizzasPerHour, 10),
          maxDishesPerOrder: parseInt(kitchen.maxDishesPerOrder, 10),
          maxOrdersPerPhone: parseInt(kitchen.maxOrdersPerPhone, 10),
        })
      );
      setIsSaved(true);
    } catch (saveError) {
      handleError(saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const perSlot = Math.floor((parseInt(kitchen?.pizzasPerHour, 10) || 0) / 4);

  return (
    <div className="admin-kitchen">
      <div className="admin-list-title">Cucina e limiti</div>
      {error && <div className="admin-error">{error}</div>}
      {kitchen === null && !error && (
        <div className="admin-note">Caricamento...</div>
      )}
      {kitchen && (
        <form onSubmit={save}>
          <ul className="admin-list">
            <ListRow
              title="Pizze all'ora"
              note={`Al massimo ${perSlot} ogni 15 minuti per ritiro e consegna. Nell'ora contano anche le pizze ordinate al tavolo, che però si possono sempre ordinare.`}
            >
              <TextField
                className="admin-kitchen-number"
                type="number"
                min="4"
                max="400"
                required
                aria-label="Pizze all'ora"
                value={kitchen.pizzasPerHour}
                onChange={(event) =>
                  change("pizzasPerHour", event.target.value)
                }
              />
            </ListRow>
            <ListRow
              title="Pizze massime per ordine"
              note="Solo ritiro e consegna: per ordini più grandi il cliente chiama la pizzeria."
            >
              <TextField
                className="admin-kitchen-number"
                type="number"
                min="1"
                max="100"
                required
                aria-label="Pizze massime per ordine"
                value={kitchen.maxDishesPerOrder}
                onChange={(event) =>
                  change("maxDishesPerOrder", event.target.value)
                }
              />
            </ListRow>
            <ListRow
              title="Ordini al giorno per telefono"
              note="Ritiro e consegna con lo stesso numero di telefono nella stessa giornata."
            >
              <TextField
                className="admin-kitchen-number"
                type="number"
                min="1"
                max="50"
                required
                aria-label="Ordini al giorno per telefono"
                value={kitchen.maxOrdersPerPhone}
                onChange={(event) =>
                  change("maxOrdersPerPhone", event.target.value)
                }
              />
            </ListRow>
          </ul>
          <div className="admin-toolbar">
            <div className="admin-note">{isSaved && "Impostazioni salvate."}</div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvataggio..." : "Salva cucina e limiti"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
