import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Same colors as the status badges of the orders
export const STATUS_COLORS = {
  nuovo: "#ec7d6a",
  in_preparazione: "#f5b942",
  pronto: "#4cc38a",
  completato: "#b0b5c1",
};

// Popup text built as plain text: names and addresses are written by customers
const popupContent = (delivery) => {
  const box = document.createElement("div");
  box.className = "delivery-popup";
  const title = document.createElement("strong");
  title.textContent = delivery.title;
  box.append(title);
  delivery.lines.forEach((line) => {
    const row = document.createElement("div");
    row.textContent = line;
    box.append(row);
  });
  return box;
};

// OpenStreetMap with the pizzeria, its delivery zone and one dot per delivery.
// center: { lat, lon } or null; deliveries: [{ id, lat, lon, status, title, lines }]
export const DeliveryMap = ({ center, radiusKm, deliveries }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const zoneLayer = useRef(null);
  const deliveryLayer = useRef(null);
  const lat = center?.lat;
  const lon = center?.lon;

  // The map is created once and removed when the section closes
  useEffect(() => {
    const map = L.map(containerRef.current, { scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    zoneLayer.current = L.layerGroup().addTo(map);
    deliveryLayer.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => map.remove();
  }, []);

  // Pizzeria and zone; the view moves only when they change, not at every refresh
  useEffect(() => {
    const map = mapRef.current;
    zoneLayer.current.clearLayers();
    if (lat === undefined) {
      map.setView([41.9, 12.5], 5);
      return;
    }
    L.circle([lat, lon], {
      radius: radiusKm * 1000,
      color: "#ec7d6a",
      weight: 2,
      fillOpacity: 0.06,
    }).addTo(zoneLayer.current);
    L.circleMarker([lat, lon], {
      radius: 10,
      color: "#ffffff",
      weight: 3,
      fillColor: "#1f1d2c",
      fillOpacity: 1,
    })
      .bindTooltip("Pizzeria")
      .addTo(zoneLayer.current);
    map.fitBounds(L.latLng(lat, lon).toBounds(radiusKm * 2000), {
      padding: [10, 10],
    });
  }, [lat, lon, radiusKm]);

  useEffect(() => {
    deliveryLayer.current.clearLayers();
    deliveries.forEach((delivery) => {
      L.circleMarker([delivery.lat, delivery.lon], {
        radius: 9,
        color: "#1f1d2c",
        weight: 2,
        fillColor: STATUS_COLORS[delivery.status],
        fillOpacity: 1,
      })
        .bindPopup(popupContent(delivery))
        .addTo(deliveryLayer.current);
    });
  }, [deliveries]);

  return <div ref={containerRef} className="delivery-map" />;
};
