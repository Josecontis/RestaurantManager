import { render, screen } from "@testing-library/react";
import App from "./App";

const menu = [
  {
    id: 1,
    name: "Pizze",
    dishes: [
      {
        id: 1,
        name: "Margherita",
        description: "Pomodoro, mozzarella e basilico",
        price: 6,
        allergens: "Glutine, Lattosio",
        ingredients: null,
        imageUrl: null,
      },
    ],
  },
];

const brand = { name: "Pizzeria di Prova", accentColor: "#3f9a5a", logoUrl: null };

// The server is replaced by fixed answers
beforeEach(() => {
  global.fetch = (url) =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve(
          url.endsWith("/api/menu")
            ? menu
            : url.endsWith("/api/settings")
            ? brand
            : {}
        ),
    });
});

test("shows the restaurant name and the menu loaded from the server", async () => {
  render(<App />);
  expect(await screen.findByText("Pizzeria di Prova")).toBeInTheDocument();
  expect(await screen.findByText("Margherita")).toBeInTheDocument();
  // Main color chosen in the admin area
  expect(
    document.documentElement.style.getPropertyValue("--accent")
  ).toBe("#3f9a5a");
});
