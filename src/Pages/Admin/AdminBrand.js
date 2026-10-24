import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMenu,
  imageSrc,
  removeImage,
  saveBrand,
  uploadImage,
} from "../../api";
import { useBrand } from "../../brand";
import { Button } from "../../Components/Button/Button";
import { ListRow } from "../../Components/ListRow/ListRow";
import { TextField } from "../../Components/TextField/TextField";
import { resizeImage } from "./resizeImage";
import { useAdminError } from "./useAdminError";

// Colors dark enough for white text on buttons and badges
const COLORS = [
  { value: "#ec7d6a", label: "Corallo" },
  { value: "#d64535", label: "Rosso pomodoro" },
  { value: "#d9692b", label: "Arancio forno" },
  { value: "#3f9a5a", label: "Verde basilico" },
  { value: "#1f9e8f", label: "Verde acqua" },
  { value: "#2e7dd1", label: "Blu" },
  { value: "#8e5bd6", label: "Viola" },
  { value: "#d6487e", label: "Rosa" },
];

// Logo with its transparency; dish photos as JPEG, enough for a full screen phone
const LOGO_SIZE = 256;
const PHOTO_SIZE = 800;

// Hidden file picker opened by a normal button
const PickImageButton = ({ label, variant, disabled, onPick }) => {
  const inputRef = useRef(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files[0];
          event.target.value = "";
          if (file) {
            onPick(file);
          }
        }}
      />
      <Button
        variant={variant}
        disabled={disabled}
        onClick={() => inputRef.current.click()}
      >
        {label}
      </Button>
    </>
  );
};

// Name, main color, logo and dish photos: the same site for any restaurant
export const AdminBrand = ({ onUnauthorized }) => {
  const { brand, setBrand } = useBrand();
  const [name, setName] = useState(brand.name);
  const [accentColor, setAccentColor] = useState(brand.accentColor);
  const [dishes, setDishes] = useState(null);
  // Image being sent or removed: "logo" or "dish-<id>"
  const [busyKey, setBusyKey] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError, handleError] = useAdminError(onUnauthorized);
  const colors = COLORS.some((color) => color.value === accentColor)
    ? COLORS
    : [...COLORS, { value: accentColor, label: "Colore attuale" }];

  // The saved values can arrive from the server after the section opens
  useEffect(() => {
    setName(brand.name);
    setAccentColor(brand.accentColor);
  }, [brand.name, brand.accentColor]);

  const loadDishes = useCallback(async () => {
    try {
      const categories = await getMenu();
      setDishes(categories.flatMap((category) => category.dishes));
    } catch (loadError) {
      handleError(loadError);
    }
  }, [handleError]);

  useEffect(() => {
    loadDishes();
  }, [loadDishes]);

  const save = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      setBrand(await saveBrand({ name, accentColor }));
      setIsSaved(true);
    } catch (saveError) {
      handleError(saveError);
    }
  };

  const changeImage = async (key, file) => {
    setError(null);
    setBusyKey(key);
    try {
      const image =
        key === "logo"
          ? await resizeImage(file, LOGO_SIZE, "image/png")
          : await resizeImage(file, PHOTO_SIZE, "image/jpeg");
      const { url } = await uploadImage(key, image);
      if (key === "logo") {
        setBrand({ ...brand, logoUrl: url });
      } else {
        await loadDishes();
      }
    } catch (imageError) {
      handleError(imageError);
    } finally {
      setBusyKey(null);
    }
  };

  const deleteImage = async (key) => {
    setError(null);
    setBusyKey(key);
    try {
      await removeImage(key);
      if (key === "logo") {
        setBrand({ ...brand, logoUrl: null });
      } else {
        await loadDishes();
      }
    } catch (imageError) {
      handleError(imageError);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="admin-section admin-brand">
      <div className="admin-note">
        Nome, colore e logo valgono per tutto il sito, anche nella scheda del
        browser: così lo stesso sito si può usare per un altro locale.
      </div>
      {error && <div className="admin-error">{error}</div>}
      <form onSubmit={save}>
        <ul className="admin-list">
          <ListRow title="Nome del locale">
            <TextField
              className="admin-brand-name"
              required
              minLength={2}
              maxLength={60}
              aria-label="Nome del locale"
              value={name}
              onChange={(event) => {
                setIsSaved(false);
                setName(event.target.value);
              }}
            />
          </ListRow>
          <ListRow
            title="Colore principale"
            note={colors.find((color) => color.value === accentColor).label}
          >
            <div className="admin-colors">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.label}
                  aria-label={color.label}
                  aria-pressed={color.value === accentColor}
                  className={
                    "admin-color" +
                    (color.value === accentColor ? " selected" : "")
                  }
                  style={{ backgroundColor: color.value }}
                  onClick={() => {
                    setIsSaved(false);
                    setAccentColor(color.value);
                  }}
                />
              ))}
            </div>
          </ListRow>
        </ul>
        <div className="admin-toolbar">
          <div className="admin-note">{isSaved && "Nome e colore salvati."}</div>
          <Button type="submit">Salva nome e colore</Button>
        </div>
      </form>

      <div className="admin-list-title">Logo</div>
      <ul className="admin-list">
        <ListRow
          title={
            brand.logoUrl ? (
              <img
                className="admin-brand-logo"
                src={imageSrc(brand.logoUrl)}
                alt="Logo attuale"
              />
            ) : (
              "Nessun logo"
            )
          }
          note="Accanto al nome nel menu e come icona della scheda del browser. Meglio quadrato, con lo sfondo trasparente."
        >
          <PickImageButton
            label={brand.logoUrl ? "Cambia logo" : "Carica logo"}
            disabled={busyKey === "logo"}
            onPick={(file) => changeImage("logo", file)}
          />
          {brand.logoUrl && (
            <Button
              variant="secondary"
              disabled={busyKey === "logo"}
              onClick={() => deleteImage("logo")}
            >
              Togli
            </Button>
          )}
        </ListRow>
      </ul>

      <div className="admin-list-title">Foto delle pizze</div>
      <div className="admin-note">
        Senza foto il menu mostra la pizza disegnata. Le foto vengono
        rimpicciolite prima dell'invio.
      </div>
      {dishes === null && !error && (
        <div className="admin-note">Caricamento del menu...</div>
      )}
      <ul className="admin-list">
        {dishes &&
          dishes.map((dish) => {
            const key = `dish-${dish.id}`;
            return (
              <ListRow
                key={dish.id}
                title={
                  <span className="admin-photo-title">
                    {dish.imageUrl ? (
                      <img
                        className="admin-photo"
                        src={imageSrc(dish.imageUrl)}
                        alt=""
                      />
                    ) : (
                      <span className="admin-photo admin-photo--empty" />
                    )}
                    {dish.name}
                  </span>
                }
              >
                <PickImageButton
                  label={
                    busyKey === key
                      ? "Invio..."
                      : dish.imageUrl
                      ? "Cambia foto"
                      : "Carica foto"
                  }
                  variant={dish.imageUrl ? "secondary" : "primary"}
                  disabled={busyKey === key}
                  onPick={(file) => changeImage(key, file)}
                />
                {dish.imageUrl && (
                  <Button
                    variant="secondary"
                    disabled={busyKey === key}
                    onClick={() => deleteImage(key)}
                  >
                    Togli
                  </Button>
                )}
              </ListRow>
            );
          })}
      </ul>
    </div>
  );
};
