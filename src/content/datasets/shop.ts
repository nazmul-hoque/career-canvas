/**
 * The dataset every SQL challenge runs against, in both SQL Foundations and SQL
 * for Analysis: a small outdoor-gear shop, loaded fresh into an in-memory SQLite
 * database on each run.
 *
 * It is small enough to check an answer by eye and built to contain the things
 * that make real analysis go wrong: a customer with no orders, a product that
 * never sold, a customer with no city on file, refunded and pending orders that
 * must not count as revenue, a discounted sale (unit_price below list price), and
 * a per-order shipping fee that a careless join counts once per item.
 *
 * Lessons quote its numbers, so changing a row means re-checking every SQL
 * lesson's text, questions and tests.
 */
export const SHOP_SCHEMA = `customers   (id, name, city, country, signup_date)
products    (id, name, category, price)
orders      (id, customer_id, order_date, status, shipping)
order_items (order_id, product_id, quantity, unit_price)`;

export const SHOP_SQL = `
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  country TEXT NOT NULL,
  signup_date TEXT NOT NULL
);
INSERT INTO customers VALUES
  (1, 'Maja Berg', 'Oslo', 'Norway', '2025-11-03'),
  (2, 'Liam Walsh', 'Dublin', 'Ireland', '2025-11-20'),
  (3, 'Sofia Rossi', 'Milan', 'Italy', '2025-12-01'),
  (4, 'Noah Keller', 'Zurich', 'Switzerland', '2025-12-14'),
  (5, 'Aisha Khan', 'London', 'UK', '2026-01-05'),
  (6, 'Lucas Silva', 'Lisbon', 'Portugal', '2026-01-18'),
  (7, 'Emma Novak', NULL, 'Czechia', '2026-02-02'),
  (8, 'Omar Haddad', 'London', 'UK', '2026-02-20');

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL
);
INSERT INTO products VALUES
  (1, 'Trail Runner Shoes', 'Footwear', 120.0),
  (2, 'Merino Base Layer', 'Apparel', 65.0),
  (3, 'Rain Shell Jacket', 'Apparel', 180.0),
  (4, 'Headlamp', 'Gear', 35.0),
  (5, 'Water Bottle', 'Gear', 20.0),
  (6, 'Wool Socks (3-pack)', 'Apparel', 24.0),
  (7, 'Trekking Poles', 'Gear', 90.0),
  (8, 'Camp Stove', 'Gear', 75.0);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  order_date TEXT NOT NULL,
  status TEXT NOT NULL,
  shipping REAL NOT NULL
);
INSERT INTO orders VALUES
  (101, 1, '2026-01-04', 'paid', 5.0),
  (102, 2, '2026-01-09', 'paid', 0.0),
  (103, 1, '2026-01-15', 'refunded', 5.0),
  (104, 3, '2026-01-22', 'paid', 0.0),
  (105, 4, '2026-02-02', 'paid', 5.0),
  (106, 5, '2026-02-06', 'paid', 0.0),
  (107, 2, '2026-02-11', 'pending', 5.0),
  (108, 1, '2026-02-19', 'paid', 5.0),
  (109, 6, '2026-02-25', 'paid', 0.0),
  (110, 3, '2026-03-03', 'paid', 5.0),
  (111, 5, '2026-03-08', 'refunded', 5.0),
  (112, 7, '2026-03-12', 'paid', 0.0),
  (113, 4, '2026-03-18', 'paid', 5.0),
  (114, 1, '2026-03-24', 'paid', 0.0),
  (115, 6, '2026-03-29', 'pending', 5.0);

CREATE TABLE order_items (
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL
);
INSERT INTO order_items VALUES
  (101, 1, 1, 120.0), (101, 6, 2, 24.0),
  (102, 3, 1, 180.0),
  (103, 2, 1, 65.0),
  (104, 1, 1, 120.0), (104, 4, 1, 35.0), (104, 5, 2, 20.0),
  (105, 7, 1, 90.0),
  (106, 2, 2, 65.0), (106, 6, 1, 24.0),
  (107, 3, 1, 180.0),
  (108, 4, 1, 35.0), (108, 5, 1, 20.0),
  (109, 1, 1, 108.0), (109, 2, 1, 65.0),
  (110, 6, 3, 24.0),
  (111, 7, 1, 90.0),
  (112, 3, 1, 162.0), (112, 4, 1, 35.0),
  (113, 5, 1, 20.0),
  (114, 1, 1, 120.0), (114, 3, 1, 180.0), (114, 6, 1, 24.0),
  (115, 2, 1, 65.0);
`;
