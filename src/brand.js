import { createContext, useContext, useEffect, useState } from "react";
import { getBrand, getSavedBrand, imageSrc, rememberBrand } from "./api";

const DEFAULT_BRAND = {
  name: "Wellness Pizza",
  accentColor: "#ec7d6a",
  logoUrl: null,
};

const isBrand = (brand) =>
  Boolean(brand && brand.name && /^#[0-9a-f]{6}$/.test(brand.accentColor));

// Main color, browser tab title and icon follow the restaurant settings
const applyBrand = (brand) => {
  const root = document.documentElement.style;
  root.setProperty("--accent", brand.accentColor);
  root.setProperty("--accent-soft", `${brand.accentColor}26`);
  root.setProperty("--accent-faint", `${brand.accentColor}33`);
  root.setProperty("--accent-glow", `${brand.accentColor}71`);
  document.title = brand.name;
  const icon = document.querySelector('link[rel="icon"]');
  if (icon) {
    // Without a logo the default icon of public/index.html stays
    icon.dataset.default = icon.dataset.default || icon.href;
    icon.href = imageSrc(brand.logoUrl) || icon.dataset.default;
  }
};

const BrandContext = createContext({ brand: DEFAULT_BRAND, setBrand: () => {} });

// Name, color and logo for the whole app; setBrand after the admin saves them
export const BrandProvider = ({ children }) => {
  const [brand, setBrand] = useState(() => {
    const saved = getSavedBrand();
    return isBrand(saved) ? saved : DEFAULT_BRAND;
  });

  useEffect(() => {
    getBrand()
      .then((result) => isBrand(result) && setBrand(result))
      .catch(() => {});
  }, []);

  useEffect(() => {
    applyBrand(brand);
    rememberBrand(brand);
  }, [brand]);

  return (
    <BrandContext.Provider value={{ brand, setBrand }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => useContext(BrandContext);
