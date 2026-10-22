-- Initial menu, loaded by the server only when the categories table is empty.
-- Prices are indicative sample values.

INSERT INTO categories (name, position) VALUES
  ('Piatti Caldi', 1),
  ('Piatti Freddi', 2),
  ('Zuppe', 3),
  ('Grigliate', 4),
  ('Pizze', 5);

INSERT INTO dishes (category_id, name, description, price, allergens)
SELECT categories.id, pizza.name, pizza.description, pizza.price, pizza.allergens
FROM categories, (VALUES
  (1, 'Margherita', 'Pomodoro San Marzano, mozzarella fior di latte, basilico fresco e olio extravergine d''oliva.', 6.00, 'Glutine, Lattosio'),
  (2, 'Marinara', 'Pomodoro, aglio, origano e olio extravergine d''oliva.', 5.00, 'Glutine'),
  (3, 'Diavola', 'Pomodoro, mozzarella fior di latte e salame piccante.', 7.50, 'Glutine, Lattosio'),
  (4, 'Capricciosa', 'Pomodoro, mozzarella, prosciutto cotto, funghi, carciofini e olive nere.', 8.50, 'Glutine, Lattosio'),
  (5, 'Quattro Formaggi', 'Mozzarella, gorgonzola, fontina e parmigiano reggiano.', 8.00, 'Glutine, Lattosio'),
  (6, 'Prosciutto e Funghi', 'Pomodoro, mozzarella, prosciutto cotto e funghi champignon.', 7.50, 'Glutine, Lattosio'),
  (7, 'Bufalina', 'Pomodoro, mozzarella di bufala campana, basilico e olio a crudo.', 8.50, 'Glutine, Lattosio'),
  (8, 'Ortolana', 'Pomodoro, mozzarella, zucchine, melanzane e peperoni grigliati.', 7.50, 'Glutine, Lattosio')
) AS pizza (position, name, description, price, allergens)
WHERE categories.name = 'Pizze'
ORDER BY pizza.position;
