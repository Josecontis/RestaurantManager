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

// The server is replaced by fixed answers
beforeEach(() => {
  global.fetch = (url) =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(url.endsWith("/api/menu") ? menu : {}),
    });
});

test("shows the restaurant name and the menu loaded from the server", async () => {
  render(<App />);
  expect(screen.getByText("Wellness Pizza")).toBeInTheDocument();
  expect(await screen.findByText("Margherita")).toBeInTheDocument();
});
