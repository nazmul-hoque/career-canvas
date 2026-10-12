import { SHOP_SCHEMA } from "./datasets/shop";
import { SQL_DATASETS } from "./datasets/sql";
import { STORES_SCHEMA } from "./datasets/stores";
import type { LessonBody } from "./lessons";

/**
 * SQL Foundations (course `sql`) and SQL for Analysis (course `sql-analysis`).
 * Challenges run against the shop in `datasets/shop.ts`, except the Over time
 * module's, which use the stores in `datasets/stores.ts`, and the data-quality
 * lesson's, which adds the payments export in `datasets/payments.ts`. The prose quotes both
 * datasets' numbers, so a dataset edit means re-checking every lesson here.
 */
export const sqlLessonBodies: Record<string, LessonBody> = {
  "sql-core.select": {
    summary: "Pick columns, filter rows and sort them, without being caught out by OR or NULL.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "Every query in this course runs against the same small database: an outdoor-gear shop with 8 customers, 8 products, 15 orders and the 24 item lines on those orders. It's small enough to check an answer by eye, and it has the awkward cases real data always has.",
      },
      { kind: "code", language: "text", caption: "The four tables", code: SHOP_SCHEMA },
      {
        kind: "text",
        body: "A query reads almost like a sentence: `SELECT` these columns, `FROM` this table, `WHERE` rows meet a condition, `ORDER BY` how to sort them. Only `SELECT` and `FROM` are required, and the clauses always come in that order.",
      },
      {
        kind: "code",
        language: "sql",
        caption: "Paid orders from March, in date order",
        code: `SELECT id, order_date, shipping
FROM orders
WHERE status = 'paid'
  AND order_date >= '2026-03-01'
ORDER BY order_date;

-- id   order_date  shipping
-- 110  2026-03-03  5.0
-- 112  2026-03-12  0.0
-- 113  2026-03-18  5.0
-- 114  2026-03-24  0.0`,
      },
      {
        kind: "text",
        body: "Dates in this database are text in `YYYY-MM-DD` form, which compares correctly as text: `'2026-02-19' < '2026-03-01'`. For all of February, write `order_date >= '2026-02-01' AND order_date < '2026-03-01'`. That form stays correct whatever the month's length. `status IN ('paid', 'pending')` is shorthand for several ORs.",
      },
      {
        kind: "text",
        body: "**AND is evaluated before OR**, the way × comes before +. `WHERE a OR b AND c` means `a OR (b AND c)`. Whenever you mix them, add the brackets yourself.",
      },
      {
        kind: "text",
        body: "**NULL means unknown**, and a comparison with an unknown is never true, not even `city = NULL`. Emma Novak has no city on file, so `WHERE city = NULL` returns nobody, and `WHERE city <> 'London'` leaves her out as well. Test for a missing value with `IS NULL` or `IS NOT NULL`.",
      },
      {
        kind: "code",
        language: "sql",
        caption: "Scenario",
        code: `SELECT id, status, order_date
FROM orders
WHERE status = 'paid' OR status = 'pending'
  AND order_date >= '2026-03-01';`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which orders does this return?",
        options: [
          "Paid and pending orders from March only",
          "Every paid order from any month, plus pending orders from March",
          "Only pending orders from March",
          "An error, because AND and OR can't be mixed",
        ],
        answer: 1,
        explanation:
          "AND binds first, so it reads `status = 'paid' OR (status = 'pending' AND order_date >= '2026-03-01')`. That returns all 11 paid orders plus order 115. For March only, write `status IN ('paid', 'pending') AND order_date >= '2026-03-01'`.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "`SELECT name FROM customers WHERE city <> 'London';` How many of the 8 customers come back? (Two live in London, and one has no city on file.)",
        options: ["8", "6", "5", "7"],
        answer: 2,
        explanation:
          "The two Londoners are excluded, and so is Emma: `NULL <> 'London'` is unknown, not true. To keep her, add `OR city IS NULL`.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Find the customers with no city on file.",
        before: "SELECT name FROM customers WHERE city ",
        after: " NULL;",
        answer: "IS",
        explanation:
          "`= NULL` is never true. `IS NULL` is the only test that matches a missing value.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "February's paid orders",
        prompt:
          "Return the `id` and `order_date` of every **paid** order placed in **February 2026**, oldest first.",
        language: "sql",
        starter: `-- Paid orders from February 2026, oldest first
SELECT id, order_date
FROM orders;`,
        hint: "Combine two conditions with AND: one on `status` and one on the date range (`>= '2026-02-01'` and `< '2026-03-01'`). Then `ORDER BY order_date`.",
        solution: `SELECT id, order_date
FROM orders
WHERE status = 'paid'
  AND order_date >= '2026-02-01'
  AND order_date < '2026-03-01'
ORDER BY order_date;`,
        tests: [
          {
            name: "Returns the columns id and order_date",
            expression: 'columns == ["id", "order_date"]',
          },
          { name: "Leaves out pending order 107", expression: "107 not in [r[0] for r in rows]" },
          {
            name: "Only February dates",
            expression: "len(rows) > 0 and all('2026-02-01' <= r[1] < '2026-03-01' for r in rows)",
          },
          { name: "Finds all four", expression: "len(rows) == 4" },
          {
            name: "Oldest first",
            expression: "[r[1] for r in rows] == sorted(r[1] for r in rows)",
          },
        ],
      },
    ],
  },
  "sql-core.shaping": {
    summary:
      "Remove duplicates, take the top few, match patterns, fill gaps and label rows with CASE.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "`WHERE` decides which rows come back. This lesson is about shaping them: dropping duplicates, keeping only the top few, matching text by pattern, filling in missing values and adding labels. None of these change the data. They change what the answer looks like.",
      },
      {
        kind: "text",
        body: "**`DISTINCT` removes duplicate rows.** `SELECT DISTINCT country FROM customers` gives 7 countries, not 8, because two customers live in the UK. It applies to the **whole row**, not just the first column: `SELECT DISTINCT customer_id, status` keeps one row for each different *pair*, so a customer with paid and refunded orders appears twice.",
      },
      {
        kind: "code",
        language: "sql",
        caption: "The three most expensive products",
        code: `SELECT name, price
FROM products
ORDER BY price DESC
LIMIT 3;

-- name                price
-- Rain Shell Jacket   180.0
-- Trail Runner Shoes  120.0
-- Trekking Poles      90.0`,
      },
      {
        kind: "text",
        body: "**`LIMIT` without `ORDER BY` takes whichever rows the database finds first**, and that order can change between runs. Always sort first. `LIMIT 3 OFFSET 3` skips three rows and returns the next three, which is how pages of results work.",
      },
      {
        kind: "text",
        body: "**`LIKE` matches text against a pattern.** `%` stands for any run of characters (including none) and `_` for exactly one. `WHERE name LIKE 'T%'` finds names starting with T: Trail Runner Shoes and Trekking Poles. `'%Socks%'` finds names containing *Socks* anywhere. SQLite ignores case for plain letters in `LIKE`, but PostgreSQL does not, so don't rely on it.",
      },
      {
        kind: "text",
        body: "**`COALESCE` returns the first of its arguments that isn't NULL.** `COALESCE(city, 'Unknown')` shows Emma's missing city as *Unknown* and leaves everyone else's alone. It's a display fix, not a data fix: the city is still missing in the table.",
      },
      {
        kind: "code",
        language: "sql",
        caption: "Label each product with a price tier",
        code: `SELECT name, price,
       CASE
         WHEN price >= 100 THEN 'premium'
         WHEN price >= 50  THEN 'mid'
         ELSE 'budget'
       END AS tier
FROM products;`,
      },
      {
        kind: "text",
        body: "**`CASE` checks its `WHEN` conditions from top to bottom and stops at the first one that is true.** So order matters: put the narrowest condition first. A row that matches no `WHEN` gets the `ELSE` value, and if there is no `ELSE`, it gets NULL.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "7 different customers have placed orders, and 4 of them have orders in two different statuses. `SELECT DISTINCT customer_id, status FROM orders;` How many rows come back?",
        options: ["11", "7", "15", "4"],
        answer: 0,
        explanation:
          "`DISTINCT` compares whole rows, so each customer appears once per status they have: 7 customers, plus 4 who have a second status, is 11. `SELECT DISTINCT customer_id` alone would give 7.",
      },
      {
        kind: "code",
        language: "sql",
        caption: "Scenario",
        code: `SELECT name, price,
       CASE
         WHEN price >= 50  THEN 'mid'
         WHEN price >= 100 THEN 'premium'
         ELSE 'budget'
       END AS tier
FROM products;`,
      },
      {
        kind: "mcq",
        id: "q2",
        question: "What tier does the Rain Shell Jacket (180.0) get?",
        options: ["premium", "budget", "NULL", "mid"],
        answer: 3,
        explanation:
          "180 is at least 50, so the first `WHEN` matches and `CASE` stops there. No product can ever reach 'premium'. Nothing errors; the labels are just wrong. Put `price >= 100` first.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Show 'Unknown' for customers with no city on file.",
        before: "SELECT name, ",
        after: "(city, 'Unknown') AS city FROM customers;",
        answer: "COALESCE",
        explanation:
          "`COALESCE` returns its first non-NULL argument, so a real city comes back unchanged and a missing one becomes 'Unknown'.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Price tiers for the catalogue",
        prompt:
          "The catalogue page groups products by price. Return every product's `name`, `price` and `tier`, most expensive first. `tier` is **'premium'** for a price of 100 or more, **'mid'** for 50 up to 100, and **'budget'** for anything under 50.",
        language: "sql",
        starter: `-- Every product with its price tier, most expensive first
SELECT name, price
FROM products;`,
        hint: "Add a `CASE` expression with `AS tier`, checking `price >= 100` before `price >= 50`, with `ELSE 'budget'`. Then `ORDER BY price DESC`.",
        solution: `SELECT name, price,
       CASE
         WHEN price >= 100 THEN 'premium'
         WHEN price >= 50 THEN 'mid'
         ELSE 'budget'
       END AS tier
FROM products
ORDER BY price DESC;`,
        tests: [
          {
            name: "Returns name, price and tier",
            expression: 'columns == ["name", "price", "tier"]',
          },
          { name: "All 8 products", expression: "len(rows) == 8" },
          {
            name: "The two products at 100 or more are premium",
            expression:
              'sorted(r[0] for r in rows if r[2] == "premium") == ["Rain Shell Jacket", "Trail Runner Shoes"]',
          },
          {
            name: "Trekking Poles (90.0) is mid",
            expression: 'any(r[0] == "Trekking Poles" and r[2] == "mid" for r in rows)',
          },
          {
            name: "Three products under 50 are budget",
            expression: 'sum(1 for r in rows if r[2] == "budget") == 3',
          },
          {
            name: "Most expensive first",
            expression: "[r[1] for r in rows] == sorted((r[1] for r in rows), reverse=True)",
          },
        ],
      },
    ],
  },
  "sql-core.joins": {
    summary: "Combine tables on their keys, find what's missing, and know what one row means.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: "The shop's data is split across tables so each fact is stored once: a customer's city lives in `customers`, not on every order they place. To answer a question that spans tables, you **join** them on a key. Here `orders.customer_id` points at `customers.id`.",
      },
      {
        kind: "code",
        language: "sql",
        caption: "Who placed the pending orders?",
        code: `SELECT o.id, o.order_date, c.name
FROM orders AS o
JOIN customers AS c ON c.id = o.customer_id
WHERE o.status = 'pending';

-- id   order_date  name
-- 107  2026-02-11  Liam Walsh
-- 115  2026-03-29  Lucas Silva`,
      },
      {
        kind: "text",
        body: "`JOIN` (an *inner* join) keeps only rows that match on both sides. `LEFT JOIN` keeps **every** row from the left table and fills the right side with NULL where nothing matches. That's how you find what's missing, like customers who never ordered or products that never sold.",
      },
      {
        kind: "code",
        language: "sql",
        caption: "Products nobody has bought",
        code: `SELECT p.name
FROM products AS p
LEFT JOIN order_items AS i ON i.product_id = p.id
WHERE i.order_id IS NULL;

-- Camp Stove`,
      },
      {
        kind: "text",
        body: "**Watch what one row stands for.** Joining `orders` to `order_items` gives one row per *item line*, not per order. Order 104 has three lines, so it appears three times, and anything you then add up from `orders`, like shipping, gets counted three times. SQL for Analysis returns to this in its CTE lesson, because it's the most common way a total goes wrong.",
      },
      {
        kind: "text",
        body: "When you filter on the right-hand table of a LEFT JOIN, put the condition in the `ON` clause. In `WHERE`, it runs after the join and throws away the very NULL rows the LEFT JOIN was there to keep.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "`orders` has 15 rows and `order_items` has 24, and every item belongs to exactly one order. How many rows does `orders JOIN order_items ON order_items.order_id = orders.id` return?",
        options: ["15", "39", "24", "360"],
        answer: 2,
        explanation:
          "One row per item line: each of the 24 lines matches exactly one order. So there are 15 orders but 24 rows, and that difference is what makes careless totals wrong.",
      },
      {
        kind: "code",
        language: "sql",
        caption:
          "Scenario: the goal is every customer, with their refunded orders if they have any",
        code: `SELECT c.name, o.id
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE o.status = 'refunded';`,
      },
      {
        kind: "mcq",
        id: "q2",
        question: "The shop has 8 customers, but only two come back. Why?",
        options: [
          "WHERE runs after the join and drops every customer whose `o.status` isn't 'refunded', NULLs included. The condition belongs in ON",
          "LEFT JOIN only works on primary keys",
          "Only two customers have a refund, so leaving the other six out is right",
          "Refunds are stored in a different table",
        ],
        answer: 0,
        explanation:
          "Write `LEFT JOIN orders AS o ON o.customer_id = c.id AND o.status = 'refunded'` and all 8 customers come back, with the refund where there is one and NULL where there isn't.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Keep every customer, including those with no orders.",
        before: "FROM customers AS c ",
        after: " JOIN orders AS o ON o.customer_id = c.id",
        answer: "LEFT",
        explanation:
          "A LEFT JOIN keeps every row of the table named first. Customers with no orders get NULL in every `o.` column.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Signed up, never ordered",
        prompt:
          "Marketing wants to nudge people who signed up but never bought anything. Return the `name` and `signup_date` of every customer with **no orders at all**.",
        language: "sql",
        starter: `SELECT c.name, c.signup_date
FROM customers AS c;`,
        hint: "LEFT JOIN `orders` on the customer id, then keep only the rows where the order side is missing: `WHERE o.id IS NULL`.",
        solution: `SELECT c.name, c.signup_date
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE o.id IS NULL;`,
        tests: [
          {
            name: "Returns name and signup_date",
            expression: 'columns == ["name", "signup_date"]',
          },
          { name: "Exactly one customer has never ordered", expression: "len(rows) == 1" },
          {
            name: "Finds the right customer",
            expression: 'len(rows) > 0 and rows[0][0] == "Omar Haddad"',
          },
        ],
      },
    ],
  },
  "sql-core.subqueries": {
    summary:
      "Filter one table by what's in another with IN and EXISTS, and know when a join is the wrong tool.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: "A **subquery** is a query in brackets inside another query. The inner query produces a value or a list, and the outer query uses it. That lets you ask about one table using facts that live in another, without joining the two.",
      },
      {
        kind: "code",
        language: "sql",
        caption: "Customers who have had an order refunded",
        code: `SELECT name
FROM customers
WHERE id IN (
  SELECT customer_id FROM orders WHERE status = 'refunded'
);

-- Maja Berg
-- Aisha Khan`,
      },
      {
        kind: "text",
        body: "A subquery that returns a single value can go anywhere a number can. The average list price is 76.125, so this returns the three products priced above it: Trail Runner Shoes, Rain Shell Jacket and Trekking Poles. When prices change, the query still works, because nothing is hard-coded.",
      },
      {
        kind: "code",
        language: "sql",
        code: `SELECT name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products);`,
      },
      {
        kind: "text",
        body: "**`EXISTS` asks whether a matching row exists at all.** Its subquery can refer to the row the outer query is looking at, here `c.id`, so it runs once per customer. `NOT EXISTS` finds customers with no orders: the same Omar Haddad the LEFT JOIN found last lesson.",
      },
      {
        kind: "code",
        language: "sql",
        code: `SELECT c.name
FROM customers AS c
WHERE NOT EXISTS (
  SELECT 1 FROM orders AS o WHERE o.customer_id = c.id
);

-- Omar Haddad`,
      },
      {
        kind: "text",
        body: "**Be careful with `NOT IN`.** `x NOT IN (1, 2, NULL)` means `x <> 1 AND x <> 2 AND x <> NULL`, and a comparison with NULL is never true. So if the subquery's list contains a single NULL, `NOT IN` matches nothing, with no error. `NOT EXISTS` doesn't have this problem, which is why it's the safer habit.",
      },
      {
        kind: "text",
        body: "**Subquery or join?** Use a join when you need columns from the other table. Use `IN` or `EXISTS` when you only need to know whether a match exists. A join returns a row for every match, so a customer who bought the same product on two orders comes back twice. `IN` and `EXISTS` never repeat an outer row.",
      },
      {
        kind: "code",
        language: "sql",
        caption: "Scenario: two ways to list who bought Wool Socks (product 6)",
        code: `-- A: returns 4 rows
SELECT c.name
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
JOIN order_items AS i ON i.order_id = o.id
WHERE i.product_id = 6;

-- B: returns 3 rows
SELECT name
FROM customers
WHERE id IN (
  SELECT o.customer_id
  FROM orders AS o
  JOIN order_items AS i ON i.order_id = o.id
  WHERE i.product_id = 6
);`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Why does A return one more row than B?",
        options: [
          "A also counts a refunded order that B leaves out",
          "Maja bought socks on two orders, so the join returns her once per match; IN only asks whether she has a match",
          "IN removes customers who share a city",
          "A counts each pack in the quantity column as a row",
        ],
        answer: 1,
        explanation:
          "A join produces one row per matching pair, and Maja has two matching orders (101 and 114). B asks a yes-or-no question per customer, so each name appears once. Adding DISTINCT to A would hide the duplicate, but B says what you meant.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "What does `SELECT 5 NOT IN (1, 2, NULL);` return?",
        options: ["1 (true)", "0 (false)", "NULL", "An error"],
        answer: 2,
        explanation:
          "5 isn't 1 or 2, but `5 <> NULL` is unknown, so the whole test is unknown: NULL. In a `WHERE`, that means the row is dropped. Use `NOT EXISTS`, or make sure the list can't contain NULL.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Find the customers who have never placed an order.",
        before: "SELECT c.name FROM customers AS c WHERE NOT ",
        after: " (SELECT 1 FROM orders AS o WHERE o.customer_id = c.id);",
        answer: "EXISTS",
        explanation:
          "`NOT EXISTS` is true when the subquery finds no row for this customer. What it selects doesn't matter, which is why `SELECT 1` is the convention.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Happy customers",
        prompt:
          "Support wants to thank customers who have bought from the shop and never had a refund. Return the `name` of every customer with **at least one paid order** and **no refunded orders**, sorted by `name`, each name once. The starter looks right but gets it wrong: find out why and fix it.",
        language: "sql",
        starter: `SELECT c.name
FROM customers AS c
JOIN orders AS o ON o.customer_id = c.id
WHERE o.status = 'paid'
  AND o.status <> 'refunded'
ORDER BY c.name;`,
        hint: "`WHERE` looks at one order row at a time, so it can't see a customer's other orders. Select from `customers` alone and use `EXISTS (... status = 'paid')` and `NOT EXISTS (... status = 'refunded')`, each matching `o.customer_id = c.id`.",
        solution: `SELECT c.name
FROM customers AS c
WHERE EXISTS (
    SELECT 1 FROM orders AS o
    WHERE o.customer_id = c.id AND o.status = 'paid'
  )
  AND NOT EXISTS (
    SELECT 1 FROM orders AS o
    WHERE o.customer_id = c.id AND o.status = 'refunded'
  )
ORDER BY c.name;`,
        tests: [
          { name: "Returns the column name", expression: 'columns == ["name"]' },
          {
            name: "Each customer appears once",
            expression: "len(rows) == len(set(r[0] for r in rows))",
          },
          {
            name: "Leaves out Maja and Aisha, who each had a refund",
            expression: 'not any(r[0] in ("Maja Berg", "Aisha Khan") for r in rows)',
          },
          {
            name: "Leaves out Omar, who has never ordered",
            expression: 'not any(r[0] == "Omar Haddad" for r in rows)',
          },
          { name: "Finds all five", expression: "len(rows) == 5" },
          {
            name: "Sorted by name",
            expression: "[r[0] for r in rows] == sorted(r[0] for r in rows)",
          },
        ],
      },
    ],
  },
  "sql-core.checkpoint": {
    summary: "Build a packing list from four tables, with flags a warehouse can act on.",
    xp: 180,
    blocks: [
      {
        kind: "callout",
        body: "This checkpoint starts from an empty editor. Before you write anything, decide what one row of the answer is, which tables it needs, and which rows must be left out. Open the hint only after your first run.",
      },
      {
        kind: "text",
        body: "Everything here comes from the lessons in this module: filtering with `WHERE`, labelling with `CASE`, filling gaps with `COALESCE`, joining, and asking about other rows with `EXISTS`. The new part is deciding for yourself which piece goes where. A good order of work: get the rows right first, joins and filters, and check the count. Add the columns second.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "To flag a customer's first order, you write `NOT EXISTS (SELECT 1 FROM orders AS e WHERE e.customer_id = o.customer_id)`. Why is every order flagged 'no'?",
        options: [
          "`NOT EXISTS` can't be used inside a `CASE`",
          "The subquery needs `SELECT *`, not `SELECT 1`",
          "`e` and `o` are the same table, so SQLite can't tell them apart",
          "The subquery finds the order itself. It also needs `e.order_date < o.order_date`",
        ],
        answer: 3,
        explanation:
          "Every order belongs to its own customer, so without the date condition there's always a matching row: the order you're looking at. Asking for an *earlier* order is what makes the first one stand out.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Show 'unknown' when a customer has no city on file.",
        before: "",
        after: "(c.city, 'unknown') AS city",
        answer: "COALESCE",
        explanation: "`COALESCE` returns the first of its arguments that isn't NULL.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "March packing list",
        prompt:
          "The warehouse needs a packing list for every **paid** order placed in March 2026, with one row per item line. Return `order_id`, `customer` (their name), `city` ('unknown' when it's missing), `product` (its name), `quantity`, `line_total` (quantity times the price paid), `discounted` ('yes' when the price paid is below the product's list price, otherwise 'no') and `first_order` ('yes' when the customer has no earlier order of any status, otherwise 'no'). Sort by `order_id`, then `product`.",
        language: "sql",
        starter: `-- Write the query from the brief. Get the rows right before the columns.
`,
        hint: "Join `orders`, `customers`, `order_items` and `products`, and filter to paid orders with `order_date >= '2026-03-01' AND order_date < '2026-04-01'`: that should give 7 rows. Then `discounted` is `CASE WHEN i.unit_price < p.price ...`, and `first_order` is `CASE WHEN NOT EXISTS (SELECT 1 FROM orders AS e WHERE e.customer_id = o.customer_id AND e.order_date < o.order_date) ...`.",
        solution: `SELECT o.id AS order_id,
       c.name AS customer,
       COALESCE(c.city, 'unknown') AS city,
       p.name AS product,
       i.quantity,
       i.quantity * i.unit_price AS line_total,
       CASE WHEN i.unit_price < p.price THEN 'yes' ELSE 'no' END AS discounted,
       CASE WHEN NOT EXISTS (
         SELECT 1 FROM orders AS e
         WHERE e.customer_id = o.customer_id AND e.order_date < o.order_date
       ) THEN 'yes' ELSE 'no' END AS first_order
FROM orders AS o
JOIN customers AS c ON c.id = o.customer_id
JOIN order_items AS i ON i.order_id = o.id
JOIN products AS p ON p.id = i.product_id
WHERE o.status = 'paid'
  AND o.order_date >= '2026-03-01' AND o.order_date < '2026-04-01'
ORDER BY o.id, p.name;`,
        tests: [
          {
            name: "Returns the eight columns in the brief's order",
            expression:
              'columns == ["order_id", "customer", "city", "product", "quantity", "line_total", "discounted", "first_order"]',
          },
          { name: "One row for each of March's 7 paid item lines", expression: "len(rows) == 7" },
          {
            name: "Leaves out refunded order 111 and pending order 115",
            expression: "not any(r[0] in (111, 115) for r in rows)",
          },
          {
            name: "Emma Novak's city shows as 'unknown'",
            expression:
              'any(r[1] == "Emma Novak" for r in rows) and all(r[2] == "unknown" for r in rows if r[1] == "Emma Novak")',
          },
          {
            name: "Only Emma's jacket was discounted",
            expression:
              '[(r[0], r[3]) for r in rows if r[6] == "yes"] == [(112, "Rain Shell Jacket")]',
          },
          {
            name: "Only Emma is ordering for the first time",
            expression: '{r[1] for r in rows if r[7] == "yes"} == {"Emma Novak"}',
          },
          {
            name: "Line totals add up to March's paid items: 613",
            expression: "abs(sum(r[5] for r in rows) - 613) < 0.01",
          },
          {
            name: "Sorted by order_id, then product",
            expression: "[(r[0], r[3]) for r in rows] == sorted((r[0], r[3]) for r in rows)",
          },
        ],
      },
    ],
  },
  "sql-summary.groupby": {
    summary: "Count, sum and average per group, and filter before or after grouping.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: "Aggregate functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) collapse many rows into one number. `GROUP BY` says what the number is *per*: per status, per customer, per month.",
      },
      {
        kind: "code",
        language: "sql",
        code: `SELECT status, COUNT(*) AS orders
FROM orders
GROUP BY status
ORDER BY orders DESC, status;

-- status    orders
-- paid      11
-- pending   2
-- refunded  2`,
      },
      {
        kind: "text",
        body: "Every column in `SELECT` must either appear in `GROUP BY` or be inside an aggregate. SQLite lets you break this rule and quietly takes a value from some row in the group. Most databases refuse the query, and you shouldn't rely on either behaviour.",
      },
      {
        kind: "text",
        body: "**Three different counts.** `COUNT(*)` counts rows. `COUNT(city)` counts rows where `city` isn't NULL. `COUNT(DISTINCT customer_id)` counts different values. The shop has 11 paid orders, but only 7 different customers placed them.",
      },
      {
        kind: "text",
        body: "**WHERE filters rows before grouping; HAVING filters groups after.** *Paid orders only* is a condition on rows, so it goes in `WHERE`. *Customers with at least two paid orders* is a condition on a group's count, so it goes in `HAVING`.",
      },
      {
        kind: "code",
        language: "sql",
        code: `SELECT customer_id, COUNT(*) AS paid_orders
FROM orders
WHERE status = 'paid'
GROUP BY customer_id
HAVING COUNT(*) >= 2;

-- customer_id  paid_orders
-- 1            3
-- 3            2
-- 4            2`,
      },
      {
        kind: "text",
        body: "Revenue is the money from items on paid orders: `SUM(quantity * unit_price)` over `order_items`, joined to `orders` so refunded and pending ones can be dropped. Use `unit_price`, the price actually paid, not the product's list `price`. Order 109 sold shoes at a discount.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "The shop has 8 customers, and one of them has no city on file. `SELECT COUNT(*), COUNT(city) FROM customers;` What comes back?",
        options: ["8 and 7", "8 and 8", "7 and 8", "8 and NULL"],
        answer: 0,
        explanation:
          "`COUNT(*)` counts all 8 rows. `COUNT(city)` skips the NULL, which is Emma's missing city. A count that ignores NULLs is easy to misread as a count of customers.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "You want only the categories whose paid revenue is over 400. Where does `SUM(i.quantity * i.unit_price) > 400` go?",
        options: [
          "In WHERE",
          "In HAVING, after GROUP BY",
          "In ORDER BY",
          "In the ON clause of the join",
        ],
        answer: 1,
        explanation:
          "The sum only exists once rows are grouped, and WHERE runs before grouping. HAVING filters the groups themselves.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Count the different customers who have placed a paid order, not the orders.",
        before: "SELECT COUNT(",
        after: " customer_id) FROM orders WHERE status = 'paid';",
        answer: "DISTINCT",
        explanation:
          "`COUNT(DISTINCT customer_id)` gives 7. Plain `COUNT(customer_id)` would count orders instead: 11.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Revenue by category",
        prompt:
          "Return each product `category` and its `revenue` from **paid** orders (quantity × the price actually paid), highest revenue first.",
        language: "sql",
        starter: `SELECT p.category, SUM(i.quantity * i.unit_price) AS revenue
FROM order_items AS i
JOIN products AS p ON p.id = i.product_id
GROUP BY p.category;`,
        hint: "This counts every order, refunds included. Join `orders` as well (`o.id = i.order_id`) so you can keep only `o.status = 'paid'`, then `ORDER BY revenue DESC`.",
        solution: `SELECT p.category, SUM(i.quantity * i.unit_price) AS revenue
FROM order_items AS i
JOIN orders AS o ON o.id = i.order_id
JOIN products AS p ON p.id = i.product_id
WHERE o.status = 'paid'
GROUP BY p.category
ORDER BY revenue DESC;`,
        tests: [
          {
            name: "Returns category and revenue",
            expression: 'columns == ["category", "revenue"]',
          },
          { name: "One row per category", expression: "len(rows) == 3" },
          {
            name: "Refunded and pending orders don't count",
            expression: "abs(sum(r[1] for r in rows) - 1628) < 0.01",
          },
          {
            name: "Highest revenue first",
            expression: "[r[1] for r in rows] == sorted((r[1] for r in rows), reverse=True)",
          },
        ],
      },
    ],
  },
  "sql-analysis.ctes": {
    summary: "Build a query in named steps, and stop joins from quietly double-counting.",
    xp: 170,
    blocks: [
      {
        kind: "text",
        body: "This course picks up where SQL Foundations stopped, on the same outdoor-gear shop: 8 customers, 8 products, 15 orders and 24 item lines. It assumes you can already filter, join and group.",
      },
      { kind: "code", language: "text", caption: "The four tables", code: SHOP_SCHEMA },
      {
        kind: "table",
        caption: "The 11 paid orders",
        collapsed: true,
        columns: ["order_id", "customer", "shipping", "item_lines"],
        rows: [
          [101, "Maja Berg", 5, 2],
          [102, "Liam Walsh", 0, 1],
          [104, "Sofia Rossi", 0, 3],
          [105, "Noah Keller", 5, 1],
          [106, "Aisha Khan", 0, 2],
          [108, "Maja Berg", 5, 2],
          [109, "Lucas Silva", 0, 2],
          [110, "Sofia Rossi", 5, 1],
          [112, "Emma Novak", 0, 2],
          [113, "Noah Keller", 5, 1],
          [114, "Maja Berg", 0, 3],
        ],
        source: {
          query: `SELECT o.id AS order_id, c.name AS customer, o.shipping, COUNT(*) AS item_lines
FROM orders AS o
JOIN customers AS c ON c.id = o.customer_id
JOIN order_items AS i ON i.order_id = o.id
WHERE o.status = 'paid'
GROUP BY o.id, c.name, o.shipping
ORDER BY o.id;`,
        },
      },
      { kind: "heading", text: "Name each step with `WITH`" },
      {
        kind: "text",
        body: "Real questions take several steps. A **CTE** (common table expression) gives each step a name with `WITH`, so the query reads top to bottom like a recipe, and you can run each step on its own to check it.",
      },
      {
        kind: "code",
        language: "sql",
        code: `WITH paid AS (
  SELECT id, customer_id, order_date
  FROM orders
  WHERE status = 'paid'
)
SELECT customer_id, COUNT(*) AS paid_orders
FROM paid
GROUP BY customer_id;`,
      },
      { kind: "heading", text: "Grain: what one row means" },
      {
        kind: "text",
        body: "The **grain** of a table, or of a query's result, is what one row stands for. In `orders` it's one order. In `order_items` it's one line of an order: one product, in some quantity. Join the two and the result takes the finer grain: one row per item line, with the order's columns copied onto each of its lines.",
      },
      {
        kind: "text",
        body: "That's the trap SQL Foundations warned about in its joins lesson. Shipping is charged once per order, but after the join it sits on every line of that order. Orders 101 and 108 have two lines each:",
      },
      {
        kind: "table",
        caption: "Orders 101 and 108, joined to their lines",
        columns: ["order_id", "product", "quantity", "shipping"],
        rows: [
          [101, "Trail Runner Shoes", 1, 5],
          [101, "Wool Socks (3-pack)", 2, 5],
          [108, "Headlamp", 1, 5],
          [108, "Water Bottle", 1, 5],
        ],
        source: {
          query: `SELECT o.id AS order_id, p.name AS product, i.quantity, o.shipping
FROM orders AS o
JOIN order_items AS i ON i.order_id = o.id
JOIN products AS p ON p.id = i.product_id
WHERE o.id IN (101, 108)
ORDER BY o.id, p.name;`,
        },
      },
      {
        kind: "text",
        body: "Each order paid 5.0 once, but each fee now appears twice. Sum that column and you've charged those two orders 20.0 instead of 10.0.",
      },
      {
        kind: "code",
        language: "sql",
        caption: "Looks reasonable. It's wrong.",
        code: `SELECT SUM(o.shipping) AS shipping_collected
FROM orders AS o
JOIN order_items AS i ON i.order_id = o.id
WHERE o.status = 'paid';

-- shipping_collected
-- 35.0`,
      },
      {
        kind: "text",
        body: "The paid orders actually charged 25.0 in shipping. The extra 10.0 is the second copy of the fees on orders 101 and 108. Nothing errors and nothing looks odd; the number is simply wrong. This is the most common way analysis goes quietly wrong.",
      },
      { kind: "heading", text: "Fix the grain before you join" },
      {
        kind: "text",
        body: "The fix is to **bring both sides to the same grain before joining**. Total the items per order in a CTE, so there's exactly one row per order, and join that instead.",
      },
      {
        kind: "code",
        language: "sql",
        code: `WITH order_totals AS (
  SELECT order_id, SUM(quantity * unit_price) AS items_total
  FROM order_items
  GROUP BY order_id
)
SELECT SUM(t.items_total) AS items, SUM(o.shipping) AS shipping
FROM orders AS o
JOIN order_totals AS t ON t.order_id = o.id
WHERE o.status = 'paid';

-- items   shipping
-- 1628.0  25.0`,
      },
      {
        kind: "callout",
        body: "Three habits catch this before anyone else does. Know what one row of each step means (*one row per order*). Count the rows before and after every join. And check at least one total against a figure you already trust.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which change fixes the 35.0 shipping total?",
        options: [
          {
            text: "`SUM(DISTINCT o.shipping)`",
            whyNot:
              "`DISTINCT` works on values, not orders. The paid orders' fees are only ever 0 or 5.0, so it adds each of those once and returns 5.0: wrong the other way.",
          },
          "Total the items per order in a CTE first, then join one row per order",
          {
            text: "Use LEFT JOIN instead of JOIN",
            whyNot:
              "A LEFT JOIN only adds orders that have no item lines, and every order here has some. Orders 101 and 108 still match two lines each, so the total stays 35.0.",
          },
          {
            text: "Divide the result by `COUNT(*)`",
            whyNot:
              "That turns the total into an average per joined row (1.75 here), not the shipping collected. The repeated fees are still inside it.",
          },
        ],
        answer: 1,
        explanation:
          "`SUM(DISTINCT ...)` collapses every 5.0 into a single 5.0, which is wrong in a different way. LEFT JOIN changes nothing here because every order has items. Only fixing the grain gives 25.0.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          'A dashboard counts "orders per customer" with `COUNT(*)` after joining `orders` to `order_items`. Maja has 3 paid orders with 7 item lines between them. What does the dashboard show for her?',
        options: [
          {
            text: "3",
            whyNot:
              "3 is how many orders she has, but `COUNT(*)` runs after the join, and by then each of her orders has become one row per item line.",
          },
          {
            text: "10",
            whyNot:
              "Nothing here adds orders and lines together. `COUNT(*)` counts one thing: the rows left after the join.",
          },
          {
            text: "1",
            whyNot:
              "`GROUP BY` puts all her rows in one group, but `COUNT(*)` counts every row in that group, not the group itself.",
          },
          "7",
        ],
        answer: 3,
        explanation:
          "`COUNT(*)` counts rows, and after that join each row is an item line. Count before the join, or use `COUNT(DISTINCT o.id)`.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "What each customer really spent",
        prompt:
          "For each customer with paid orders, return `name`, `orders` (how many paid orders) and `total_spent` (items **plus** shipping, with each order's shipping counted once), highest `total_spent` first. The starter query runs, but its numbers are wrong: find out why and fix it. Each test below checks one thing, so you can see which problems are left as you fix them.",
        language: "sql",
        starter: `SELECT c.name,
       COUNT(*) AS orders,
       SUM(i.quantity * i.unit_price) + SUM(o.shipping) AS total_spent
FROM orders AS o
JOIN order_items AS i ON i.order_id = o.id
JOIN customers AS c ON c.id = o.customer_id
WHERE o.status = 'paid'
GROUP BY c.id
ORDER BY total_spent DESC;`,
        hint: "Start with `WITH order_totals AS (...)`, giving one row per order with its items total. Join that to `orders` in place of `order_items`, and both `COUNT(*)` and `SUM(o.shipping)` come out right.",
        solution: `WITH order_totals AS (
  SELECT order_id, SUM(quantity * unit_price) AS items_total
  FROM order_items
  GROUP BY order_id
)
SELECT c.name,
       COUNT(*) AS orders,
       SUM(t.items_total + o.shipping) AS total_spent
FROM orders AS o
JOIN order_totals AS t ON t.order_id = o.id
JOIN customers AS c ON c.id = o.customer_id
WHERE o.status = 'paid'
GROUP BY c.id
ORDER BY total_spent DESC;`,
        tests: [
          {
            name: "Returns name, orders and total_spent",
            expression: 'columns == ["name", "orders", "total_spent"]',
            show: "columns",
          },
          {
            name: "Seven customers have paid orders",
            expression: "len(rows) == 7",
            show: "len(rows)",
          },
          {
            name: "orders counts orders, not item lines",
            expression: 'dict((r[0], r[1]) for r in rows).get("Maja Berg") == 3',
            show: 'dict((r[0], r[1]) for r in rows).get("Maja Berg", "no row for Maja Berg")',
          },
          {
            name: "Each order's shipping is counted once",
            expression: 'abs(dict((r[0], r[2]) for r in rows).get("Maja Berg", 0) - 557) < 0.01',
            show: 'dict((r[0], r[2]) for r in rows).get("Maja Berg", "no row for Maja Berg")',
          },
          {
            name: "Totals reconcile with items (1,628) plus shipping (25)",
            expression: "abs(sum(r[2] for r in rows) - 1653) < 0.01",
            show: "sum(r[2] for r in rows)",
          },
          {
            name: "Highest spender first",
            expression: "[r[2] for r in rows] == sorted((r[2] for r in rows), reverse=True)",
            show: "[r[2] for r in rows]",
          },
        ],
      },
    ],
  },
  "sql-analysis.conditional": {
    summary: "Put several counts and totals side by side in one row, without a query for each.",
    xp: 170,
    blocks: [
      {
        kind: "text",
        body: "`GROUP BY month, status` answers the question, but as a long list: one row per month per status. People read reports the other way round, with one row per month and a column for each status. Turning rows into columns like that is called a **pivot**, and in SQL you build it with a `CASE` inside an aggregate. The `CASE` decides which rows each column counts.",
      },
      {
        kind: "table",
        caption: "The 15 orders",
        collapsed: true,
        columns: ["id", "order_date", "status"],
        rows: [
          [101, "2026-01-04", "paid"],
          [102, "2026-01-09", "paid"],
          [103, "2026-01-15", "refunded"],
          [104, "2026-01-22", "paid"],
          [105, "2026-02-02", "paid"],
          [106, "2026-02-06", "paid"],
          [107, "2026-02-11", "pending"],
          [108, "2026-02-19", "paid"],
          [109, "2026-02-25", "paid"],
          [110, "2026-03-03", "paid"],
          [111, "2026-03-08", "refunded"],
          [112, "2026-03-12", "paid"],
          [113, "2026-03-18", "paid"],
          [114, "2026-03-24", "paid"],
          [115, "2026-03-29", "pending"],
        ],
        source: { query: "SELECT id, order_date, status FROM orders ORDER BY id;" },
      },
      {
        kind: "code",
        language: "sql",
        caption: "Paid revenue per category, a column per month",
        code: `SELECT p.category,
       SUM(CASE WHEN o.order_date < '2026-02-01'
                THEN i.quantity * i.unit_price ELSE 0 END) AS jan,
       SUM(CASE WHEN o.order_date >= '2026-02-01' AND o.order_date < '2026-03-01'
                THEN i.quantity * i.unit_price ELSE 0 END) AS feb,
       SUM(CASE WHEN o.order_date >= '2026-03-01'
                THEN i.quantity * i.unit_price ELSE 0 END) AS mar,
       SUM(i.quantity * i.unit_price) AS total
FROM orders AS o
JOIN order_items AS i ON i.order_id = o.id
JOIN products AS p ON p.id = i.product_id
WHERE o.status = 'paid'
GROUP BY p.category
ORDER BY total DESC;

-- category  jan    feb    mar    total
-- Apparel   228.0  219.0  438.0  885.0
-- Footwear  240.0  108.0  120.0  468.0
-- Gear      75.0   145.0  55.0   275.0`,
      },
      {
        kind: "text",
        body: "Each row of the join goes through every `CASE`. A January line adds its value to `jan` and 0 to the other two, so the three month columns always add up to `total`. That's a check worth running: 885 + 468 + 275 is 1,628, the paid items total you met in the CTE lesson.",
      },
      {
        kind: "text",
        body: "What the `CASE` gives when it doesn't match matters, and it's different for each aggregate. For `SUM`, `ELSE 0` is harmless. For `COUNT`, it's a bug: `COUNT` counts every value that isn't NULL, and 0 isn't NULL, so `COUNT(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)` counts every order. Leave the `ELSE` out and the `CASE` gives NULL for the rows you don't want.",
      },
      {
        kind: "code",
        language: "sql",
        code: `SELECT COUNT(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS wrong,
       COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid
FROM orders;

-- wrong  paid
-- 15     11`,
      },
      {
        kind: "text",
        body: "`AVG` has the same trap. The 11 paid orders average 148.0 in items. Add `ELSE 0` and the 4 other orders join the average as zeros, which drags it down to 108.53.",
      },
      {
        kind: "text",
        body: "Rates come from two aggregates over the same group: `100.0 * COUNT(CASE WHEN status = 'refunded' THEN 1 END) / COUNT(*)` is the share of orders refunded. You'll also see two shorter spellings. `SUM(status = 'paid')` works in SQLite and MySQL, where a comparison is 1 or 0. `COUNT(*) FILTER (WHERE status = 'paid')` is standard SQL and works in SQLite and PostgreSQL. The `CASE` form works everywhere, which is why this lesson uses it.",
      },
      {
        kind: "callout",
        body: "A column that counts something that never happened should say 0, not NULL. `COUNT(CASE ...)` gives 0 on its own. `SUM(CASE WHEN ... THEN 1 END)` gives NULL for a group where nothing matched, so either add `ELSE 0` to the `SUM` or use `COUNT`.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "The shop has 15 orders, 11 of them paid. What does `COUNT(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)` return?",
        options: [
          "15",
          {
            text: "11",
            whyNot:
              "That's what you'd get without the `ELSE 0`. With it, every other order gets a 0 instead of NULL, and `COUNT` counts any value that isn't NULL.",
          },
          {
            text: "4",
            whyNot:
              "4 is the orders that aren't paid. `COUNT` doesn't look at what a value is, only at whether it's NULL.",
          },
          {
            text: "1",
            whyNot:
              "`COUNT` counts values; it doesn't add them up or count the distinct ones. Even `COUNT(DISTINCT ...)` would give 2 here: the 1 and the 0.",
          },
        ],
        answer: 0,
        explanation:
          "The `ELSE 0` gives every other order a 0, and `COUNT` counts anything that isn't NULL. Drop the `ELSE` and it returns 11.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "`AVG(CASE WHEN status = 'paid' THEN items END)` gives 148.0. Why does adding `ELSE 0` change it to 108.53?",
        options: [
          {
            text: "`AVG` rounds differently when it sees a 0",
            whyNot:
              "`AVG` has no special rule for zeros: it adds up the values it's given and divides by how many there are. Look at how many values each version gives it.",
          },
          "The 4 orders that aren't paid now count as zeros in the average",
          {
            text: "`ELSE 0` turns the whole column into integers",
            whyNot:
              "In SQLite, `AVG` always returns a decimal, and the paid amounts haven't changed. The difference is in which rows reach the average, not in their type.",
          },
          {
            text: "It doesn't; the two queries return the same number",
            whyNot:
              "Run both and you get 148.0 and 108.53. Without an `ELSE`, the `CASE` gives NULL for the other orders; with `ELSE 0` it gives 0, and `AVG` doesn't treat those alike.",
          },
        ],
        answer: 1,
        explanation:
          "`AVG` skips NULLs but not zeros. Without `ELSE`, it averages the 11 paid orders; with it, it divides the same total by 15.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Count only the paid orders.",
        before: "COUNT(CASE WHEN status = 'paid' THEN 1 ",
        after: ")",
        answer: "END",
        explanation: "No `ELSE`, so the other rows are NULL and `COUNT` skips them.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "A status report with a column per status",
        prompt:
          "Return one row per month: `month` (like `2026-01`), `orders`, `paid`, `refunded`, `pending` and `paid_pct` (the percentage of that month's orders that are paid, rounded to 1 decimal place), in month order. A status with no orders that month should show 0. The starter query has the right numbers in the wrong shape.",
        language: "sql",
        starter: `SELECT substr(order_date, 1, 7) AS month,
       status,
       COUNT(*) AS orders
FROM orders
GROUP BY month, status
ORDER BY month, status;`,
        hint: "Group by month only. Each status becomes a column like `COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid`, and `paid_pct` is `ROUND(100.0 * <that count> / COUNT(*), 1)`.",
        solution: `SELECT substr(order_date, 1, 7) AS month,
       COUNT(*) AS orders,
       COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid,
       COUNT(CASE WHEN status = 'refunded' THEN 1 END) AS refunded,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
       ROUND(100.0 * COUNT(CASE WHEN status = 'paid' THEN 1 END) / COUNT(*), 1) AS paid_pct
FROM orders
GROUP BY month
ORDER BY month;`,
        tests: [
          {
            name: "Returns month, orders, paid, refunded, pending and paid_pct",
            expression: 'columns == ["month", "orders", "paid", "refunded", "pending", "paid_pct"]',
            show: "columns",
          },
          { name: "One row per month", expression: "len(rows) == 3", show: "len(rows)" },
          {
            name: "The status columns add up to orders",
            expression: "all(r[1] == r[2] + r[3] + r[4] for r in rows)",
            show: "[r[1:5] for r in rows]",
          },
          {
            name: "January had no pending orders: 0, not NULL",
            expression: 'rows[0][0] == "2026-01" and rows[0][4] == 0',
            show: 'rows[0] if rows else "no rows"',
          },
          {
            name: "March: 4 of 6 paid, 66.7%",
            expression:
              'any(r[0] == "2026-03" and r[2] == 4 and abs(r[5] - 66.7) < 0.05 for r in rows)',
            show: '[r for r in rows if r[0] == "2026-03"]',
          },
          {
            name: "In month order",
            expression: "[r[0] for r in rows] == sorted(r[0] for r in rows)",
            show: "[r[0] for r in rows]",
          },
        ],
      },
    ],
  },
  "sql-analysis.windows": {
    summary: "Rank, number and run totals across rows without collapsing them.",
    xp: 180,
    blocks: [
      {
        kind: "text",
        body: "`GROUP BY` gives one row per group. Sometimes you need every row **and** a figure about its group beside it: each order numbered within its customer's orders, each month with the running total so far, each customer's latest order. That's a **window function**: an aggregate followed by `OVER (...)`, which doesn't collapse the rows.",
      },
      {
        kind: "table",
        caption: "Every order, by customer",
        collapsed: true,
        columns: ["customer", "order_id", "order_date", "status"],
        rows: [
          ["Aisha Khan", 106, "2026-02-06", "paid"],
          ["Aisha Khan", 111, "2026-03-08", "refunded"],
          ["Emma Novak", 112, "2026-03-12", "paid"],
          ["Liam Walsh", 102, "2026-01-09", "paid"],
          ["Liam Walsh", 107, "2026-02-11", "pending"],
          ["Lucas Silva", 109, "2026-02-25", "paid"],
          ["Lucas Silva", 115, "2026-03-29", "pending"],
          ["Maja Berg", 101, "2026-01-04", "paid"],
          ["Maja Berg", 103, "2026-01-15", "refunded"],
          ["Maja Berg", 108, "2026-02-19", "paid"],
          ["Maja Berg", 114, "2026-03-24", "paid"],
          ["Noah Keller", 105, "2026-02-02", "paid"],
          ["Noah Keller", 113, "2026-03-18", "paid"],
          ["Sofia Rossi", 104, "2026-01-22", "paid"],
          ["Sofia Rossi", 110, "2026-03-03", "paid"],
        ],
        source: {
          query: `SELECT c.name AS customer, o.id AS order_id, o.order_date, o.status
FROM orders AS o
JOIN customers AS c ON c.id = o.customer_id
ORDER BY c.name, o.order_date;`,
        },
      },
      { kind: "heading", text: "Numbering within groups" },
      {
        kind: "code",
        language: "sql",
        code: `SELECT id, customer_id, order_date,
       ROW_NUMBER() OVER (
         PARTITION BY customer_id
         ORDER BY order_date
       ) AS nth_order
FROM orders
WHERE status = 'paid';`,
      },
      {
        kind: "text",
        body: "`PARTITION BY` splits the rows into groups (here, one per customer), and the numbering starts again in each group. The `ORDER BY` inside `OVER` sets the order within a group. Leave out `PARTITION BY` and the whole result is one window.",
      },
      { kind: "heading", text: "Running totals" },
      {
        kind: "text",
        body: "A running total is `SUM(...) OVER (ORDER BY ...)`: for each row, the sum of everything up to and including it.",
      },
      {
        kind: "code",
        language: "sql",
        code: `WITH monthly AS (
  SELECT substr(o.order_date, 1, 7) AS month,
         SUM(i.quantity * i.unit_price) AS revenue
  FROM orders AS o
  JOIN order_items AS i ON i.order_id = o.id
  WHERE o.status = 'paid'
  GROUP BY month
)
SELECT month, revenue,
       SUM(revenue) OVER (ORDER BY month) AS running_total
FROM monthly;

-- month    revenue  running_total
-- 2026-01  543.0    543.0
-- 2026-02  472.0    1015.0
-- 2026-03  613.0    1628.0`,
      },
      { kind: "heading", text: "Ties: three ways to number them" },
      {
        kind: "text",
        body: "When values tie, the three numbering functions part ways. `ROW_NUMBER` gives every row its own number, so it has to break the tie somehow: here by name, because without a second sort key the database picks any order. `RANK` gives tied rows the same number, then skips as many places as rows shared it. `DENSE_RANK` gives the same number and doesn't skip. Units sold of each product, in paid orders:",
      },
      {
        kind: "table",
        caption: "Units sold, numbered three ways",
        columns: ["product", "units", "row_number", "rank", "dense_rank"],
        rows: [
          ["Wool Socks (3-pack)", 7, 1, 1, 1],
          ["Trail Runner Shoes", 4, 2, 2, 2],
          ["Water Bottle", 4, 3, 2, 2],
          ["Headlamp", 3, 4, 4, 3],
          ["Merino Base Layer", 3, 5, 4, 3],
          ["Rain Shell Jacket", 3, 6, 4, 3],
          ["Trekking Poles", 1, 7, 7, 4],
        ],
        source: {
          query: `WITH units AS (
  SELECT p.name AS product, SUM(i.quantity) AS units
  FROM order_items AS i
  JOIN orders AS o ON o.id = i.order_id
  JOIN products AS p ON p.id = i.product_id
  WHERE o.status = 'paid'
  GROUP BY p.id
)
SELECT product, units,
       ROW_NUMBER() OVER (ORDER BY units DESC, product) AS row_number,
       RANK() OVER (ORDER BY units DESC) AS rank,
       DENSE_RANK() OVER (ORDER BY units DESC) AS dense_rank
FROM units
ORDER BY units DESC, product;`,
        },
      },
      {
        kind: "text",
        body: "Use `RANK` for a league table, where a tie for second means nobody is third. Use `DENSE_RANK` when you want the top three *values*, however many rows share them. Use `ROW_NUMBER` when you need exactly one row per position, such as each customer's latest order.",
      },
      { kind: "heading", text: "Filtering on a window" },
      {
        kind: "text",
        body: "Window functions are calculated after `WHERE`, so you can't filter on one there. Compute it in a CTE and filter in the outer query. That's the standard way to get *the latest X per Y*.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "Paid orders per customer: Maja 3, Sofia 2, Noah 2, and four customers with 1. With `RANK() OVER (ORDER BY paid_orders DESC)`, what rank do the customers with 1 order get?",
        options: [
          {
            text: "2",
            whyNot:
              "2 is the rank Sofia and Noah share. The customers with 1 order come after them.",
          },
          {
            text: "3",
            whyNot:
              "3 is what `DENSE_RANK` gives, because it never leaves gaps. `RANK` leaves a gap after a tie.",
          },
          "4",
          {
            text: "5",
            whyNot:
              "5 would mean four customers rank above them. Count the customers with more than one paid order.",
          },
        ],
        answer: 2,
        explanation:
          "Maja is 1, Sofia and Noah tie at 2, and RANK then skips to 4. DENSE_RANK would say 3, and ROW_NUMBER would give each of the four a different number, 4 to 7.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Why does `SELECT ... FROM orders WHERE ROW_NUMBER() OVER (...) = 1` fail?",
        options: [
          "Window functions are calculated after WHERE. Compute it in a CTE and filter in the outer query",
          {
            text: "ROW_NUMBER needs a PARTITION BY",
            whyNot:
              "`PARTITION BY` is optional: without it, the whole result is one window. Adding one wouldn't stop this query failing.",
          },
          {
            text: "SQLite doesn't support window functions",
            whyNot:
              "SQLite has had window functions since version 3.25, and this course runs them. The problem is where in the query this one sits.",
          },
          {
            text: "It should be HAVING instead of WHERE",
            whyNot:
              "`HAVING` filters groups after `GROUP BY`, and window functions are calculated after that as well, so SQLite rejects one in `HAVING` too.",
          },
        ],
        answer: 0,
        explanation:
          "WHERE decides which rows exist before any window is calculated. Wrap the query: `WITH ranked AS (...) SELECT ... FROM ranked WHERE rn = 1`.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Number each customer's orders separately, newest first.",
        before: "ROW_NUMBER() OVER (",
        after: " BY customer_id ORDER BY order_date DESC)",
        answer: "PARTITION",
        explanation: "`PARTITION BY` starts the numbering again for each customer.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Everyone's latest paid order",
        prompt:
          "For each customer, return their most recent **paid** order: `name`, `order_id` and `order_date`, sorted by `name`. Customers with no paid order shouldn't appear.",
        language: "sql",
        starter: `WITH ranked AS (
  SELECT c.name,
         o.id AS order_id,
         o.order_date
         -- number each customer's paid orders here
  FROM orders AS o
  JOIN customers AS c ON c.id = o.customer_id
)
SELECT name, order_id, order_date
FROM ranked
ORDER BY name;`,
        hint: "Inside the CTE, add `ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY o.order_date DESC) AS rn` and keep only paid orders. Outside, keep `WHERE rn = 1`.",
        solution: `WITH ranked AS (
  SELECT c.name,
         o.id AS order_id,
         o.order_date,
         ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY o.order_date DESC) AS rn
  FROM orders AS o
  JOIN customers AS c ON c.id = o.customer_id
  WHERE o.status = 'paid'
)
SELECT name, order_id, order_date
FROM ranked
WHERE rn = 1
ORDER BY name;`,
        tests: [
          {
            name: "Returns name, order_id and order_date",
            expression: 'columns == ["name", "order_id", "order_date"]',
            show: "columns",
          },
          {
            name: "One row for each of the 7 customers with a paid order",
            expression: "len(rows) == 7 and len(set(r[0] for r in rows)) == 7",
            show: "len(rows)",
          },
          {
            name: "Liam's later pending order doesn't count",
            expression: '("Liam Walsh", 102, "2026-01-09") in rows',
            show: '[r for r in rows if r[0] == "Liam Walsh"]',
          },
          {
            name: "Maja's latest is her March order",
            expression: 'any(r[0] == "Maja Berg" and r[1] == 114 for r in rows)',
            show: '[r for r in rows if r[0] == "Maja Berg"]',
          },
          {
            name: "Sorted by name",
            expression: "[r[0] for r in rows] == sorted(r[0] for r in rows)",
            show: "[r[0] for r in rows]",
          },
        ],
      },
    ],
  },
  "sql-time.dates": {
    summary: "Bucket days into weeks and months, and know which average you're reporting.",
    xp: 170,
    blocks: [
      {
        kind: "text",
        body: "The shop's 15 orders are too few to see anything happen over time, so this module uses a second database: two years of daily sales from a small chain of outdoor-gear stores, 2024 and 2025. It has a website, a store in Leeds, and a store in Harrogate that opened on 12 April 2025. There's one row per store per day it traded.",
      },
      { kind: "code", language: "text", caption: "The two tables", code: STORES_SCHEMA },
      {
        kind: "table",
        caption: "The three stores",
        collapsed: true,
        columns: ["id", "name", "channel", "city", "opened_on"],
        rows: [
          [1, "Website", "web", null, "2022-03-01"],
          [2, "Leeds", "store", "Leeds", "2019-09-14"],
          [3, "Harrogate", "store", "Harrogate", "2025-04-12"],
        ],
        source: { query: "SELECT * FROM stores;", dataset: "stores" },
      },
      {
        kind: "table",
        caption: "Leeds, 2–14 June 2025 (Sunday the 8th has no row)",
        collapsed: true,
        columns: ["day", "orders", "revenue"],
        rows: [
          ["2025-06-02", 14, 1120],
          ["2025-06-03", 18, 1350],
          ["2025-06-04", 13, 949],
          ["2025-06-05", 13, 962],
          ["2025-06-06", 17, 1326],
          ["2025-06-07", 21, 1365],
          ["2025-06-09", 18, 1206],
          ["2025-06-10", 14, 1176],
          ["2025-06-11", 15, 1230],
          ["2025-06-12", 13, 1079],
          ["2025-06-13", 17, 1139],
          ["2025-06-14", 27, 1998],
        ],
        source: {
          query: `SELECT day, orders, revenue
FROM daily_sales
WHERE store_id = 2
  AND day >= '2025-06-02' AND day < '2025-06-15'
ORDER BY day;`,
          dataset: "stores",
        },
      },
      { kind: "heading", text: "Dates are text" },
      {
        kind: "text",
        body: "SQLite has no date type. Dates are text in the form `YYYY-MM-DD`, and that form was chosen on purpose: because the year comes first and every part is zero-padded, sorting and comparing the text gives the same answer as comparing the dates. `'2025-06-09' < '2025-06-10'` is true. Stored as `'9/6/2025'`, neither sorting nor `<` would work.",
      },
      { kind: "heading", text: "Buckets with `strftime`" },
      {
        kind: "text",
        body: "`strftime` pulls parts out of a date, which is how you bucket days. `strftime('%Y-%m', day)` gives the month, `'%Y'` the year, and `'%w'` the weekday as a number from 0 (Sunday) to 6 (Saturday).",
      },
      {
        kind: "code",
        language: "sql",
        caption: "The website's revenue per month",
        code: `SELECT strftime('%Y-%m', day) AS month,
       SUM(revenue) AS revenue
FROM daily_sales
WHERE store_id = 1
  AND day >= '2025-01-01' AND day < '2025-04-01'
GROUP BY month;

-- month    revenue
-- 2025-01  22709.0
-- 2025-02  22447.0
-- 2025-03  28682.0`,
      },
      { kind: "heading", text: "Half-open ranges" },
      {
        kind: "text",
        body: "Notice the range: `>=` the first day and `<` the day after the last. That's called a half-open range, and it's worth the habit. `BETWEEN '2025-06-01' AND '2025-06-30'` works on plain dates, but if the column holds timestamps, `'2025-06-30 14:05'` sorts after `'2025-06-30'` and everything after midnight on the last day silently drops out.",
      },
      { kind: "heading", text: "Date arithmetic and weeks" },
      {
        kind: "text",
        body: "`date()` does arithmetic with modifiers. `date(day, '+1 day')` is tomorrow and `date(day, 'start of month')` the 1st. Weeks need two steps: `date(day, '-6 days', 'weekday 1')` goes back six days, then forward to the next Monday (staying put if it's already one), which lands on the Monday that starts the day's week.",
      },
      {
        kind: "text",
        body: "For the number of days between two dates, subtract their `julianday()` values. `julianday('2025-07-01') - julianday('2025-06-01')` is 30.0: the length of June.",
      },
      {
        kind: "code",
        language: "sql",
        caption: "Leeds, week by week",
        code: `SELECT date(day, '-6 days', 'weekday 1') AS week_start,
       COUNT(*) AS days,
       SUM(revenue) AS revenue
FROM daily_sales
WHERE store_id = 2
  AND day >= '2025-06-02' AND day < '2025-06-16'
GROUP BY week_start;

-- week_start  days  revenue
-- 2025-06-02  6     7072.0
-- 2025-06-09  6     7828.0`,
      },
      { kind: "heading", text: "Two averages, both true" },
      {
        kind: "text",
        body: "Each week has 7 days but only 6 rows, because Leeds is closed on Sundays and a closed day has **no row at all**. So `AVG(revenue)` divides by the days Leeds traded, not the days that passed. In 2025 that's 310 days: 365, less 52 Sundays and the three holidays it always closes for, 1 January and 25–26 December. The difference it makes:",
      },
      {
        kind: "table",
        caption: "Leeds in 2025, averaged two ways",
        columns: ["average", "days", "per_day"],
        rows: [
          ["per trading day", 310, 1009.68],
          ["per calendar day", 365, 857.54],
        ],
        source: {
          query: `SELECT 'per trading day' AS average, COUNT(*) AS days,
       ROUND(AVG(revenue), 2) AS per_day
FROM daily_sales
WHERE store_id = 2 AND day >= '2025-01-01' AND day < '2026-01-01'
UNION ALL
SELECT 'per calendar day', 365, ROUND(SUM(revenue) / 365, 2)
FROM daily_sales
WHERE store_id = 2 AND day >= '2025-01-01' AND day < '2026-01-01';`,
          dataset: "stores",
        },
      },
      {
        kind: "text",
        body: "Per trading day says how good a typical open day is. Per calendar day says what the store earns over time, closed days included. Neither is wrong; the mistake is reporting one when the reader thinks it's the other, so put which one it is in the column's name.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "Leeds took 7,072 in the week starting Monday 2 June 2025, and was closed on the Sunday. What does `AVG(revenue)` over that week's rows return?",
        options: [
          {
            text: "1,010.29: 7,072 over the 7 days of the week",
            whyNot:
              "That's the average per calendar day. `AVG` never sees Sunday: it divides by the rows it's given, and a closed day has no row.",
          },
          {
            text: "NULL, because Sunday has no row",
            whyNot:
              "`AVG` returns NULL only when it has no values at all. A missing row isn't a NULL value; it simply isn't there, and `AVG` works with the rows that are.",
          },
          {
            text: "An error, until Sunday is filled in",
            whyNot:
              "SQL has no idea Leeds should have a Sunday row. As far as the query knows, nothing is missing, so it runs.",
          },
          "1,178.67: 7,072 over the 6 rows that exist",
        ],
        answer: 3,
        explanation:
          "`AVG` divides by the rows it sees, and Sunday isn't one of them. For an average per calendar day, divide the total by 7, or join a calendar and count the closed day as 0, as the next lesson does.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "`created_at` holds timestamps like `'2025-06-30 14:05:00'`. Which filter keeps every row from June 2025?",
        options: [
          {
            text: "`created_at BETWEEN '2025-06-01' AND '2025-06-30'`",
            whyNot:
              "`'2025-06-30 14:05:00'` sorts after `'2025-06-30'`, so everything after midnight on the 30th falls outside the range, and nothing tells you it did.",
          },
          {
            text: "`strftime('%m', created_at) = '06'`",
            whyNot:
              "That keeps June of every year in the table, not only 2025. It also has to run `strftime` on every row, so an index on `created_at` can't help.",
          },
          "`created_at >= '2025-06-01' AND created_at < '2025-07-01'`",
          {
            text: "`created_at LIKE '2025-6%'`",
            whyNot:
              "Months are zero-padded, so June is written `06`. `'2025-6%'` matches nothing at all.",
          },
        ],
        answer: 2,
        explanation:
          "A half-open range, `>=` the first day and `<` the day after the last, catches every time on every day of the month, whether the column holds dates or timestamps.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Bucket each day into its month, like `2025-06`.",
        before: "SELECT ",
        after: "('%Y-%m', day) AS month",
        answer: "strftime",
        explanation:
          "`strftime` formats parts of a date. `'%Y-%m'` is the year and the zero-padded month, so the months also sort in order as text.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Two averages for every month",
        prompt:
          "For Leeds (`store_id = 2`) in 2025, return one row per month: `month` (like `2025-06`), `trading_days`, `revenue`, `per_trading_day` (the average per day Leeds traded) and `per_calendar_day` (the revenue over every day of the month, closed days included), both rounded to 2 decimal places, in month order. The starter runs, but its months have no year and its two averages are the same number.",
        language: "sql",
        dataset: "stores",
        starter: `SELECT strftime('%m', day) AS month,
       COUNT(*) AS trading_days,
       SUM(revenue) AS revenue,
       ROUND(AVG(revenue), 2) AS per_trading_day,
       ROUND(AVG(revenue), 2) AS per_calendar_day
FROM daily_sales
WHERE store_id = 2
  AND day >= '2025-01-01' AND day < '2026-01-01'
GROUP BY month
ORDER BY month;`,
        hint: "Use `'%Y-%m'` for the month. A month's length is the gap between its first day and the next month's: `julianday(date(MIN(day), 'start of month', '+1 month')) - julianday(date(MIN(day), 'start of month'))`. Divide the revenue by that.",
        solution: `SELECT strftime('%Y-%m', day) AS month,
       COUNT(*) AS trading_days,
       SUM(revenue) AS revenue,
       ROUND(AVG(revenue), 2) AS per_trading_day,
       ROUND(SUM(revenue) / (julianday(date(MIN(day), 'start of month', '+1 month'))
                             - julianday(date(MIN(day), 'start of month'))), 2) AS per_calendar_day
FROM daily_sales
WHERE store_id = 2
  AND day >= '2025-01-01' AND day < '2026-01-01'
GROUP BY month
ORDER BY month;`,
        tests: [
          {
            name: "Returns month, trading_days, revenue, per_trading_day and per_calendar_day",
            expression:
              'columns == ["month", "trading_days", "revenue", "per_trading_day", "per_calendar_day"]',
            show: "columns",
          },
          {
            name: "The 12 months of 2025, labelled like 2025-06, in order",
            expression: '[r[0] for r in rows] == [f"2025-{m:02d}" for m in range(1, 13)]',
            show: "[r[0] for r in rows]",
          },
          {
            name: "June: 25 trading days at 1,227.08 each",
            expression: "any(r[1] == 25 and abs(r[3] - 1227.08) < 0.01 for r in rows)",
            show: '[r[:4] for r in rows if str(r[0]).endswith("06")]',
          },
          {
            name: "June's per_calendar_day divides by its 30 days: 1,022.57",
            expression:
              "any(abs(r[3] - 1227.08) < 0.01 and abs(r[4] - 1022.57) < 0.01 for r in rows)",
            show: '[r[3:5] for r in rows if str(r[0]).endswith("06")]',
          },
          {
            name: "February's divides by 28: 649.21",
            expression:
              "any(abs(r[3] - 757.42) < 0.01 and abs(r[4] - 649.21) < 0.01 for r in rows)",
            show: '[r[3:5] for r in rows if str(r[0]).endswith("02")]',
          },
          {
            name: "Every month earns less per calendar day than per trading day",
            expression: "all(r[4] < r[3] for r in rows)",
            show: "[r[3:5] for r in rows][:3]",
          },
        ],
      },
    ],
  },
  "sql-time.calendars": {
    summary: "Report every day, including the ones that have no row.",
    xp: 160,
    blocks: [
      {
        kind: "text",
        body: "The last lesson ended on a fact that matters more than it looks: a day with no sales often has **no row at all**. This lesson is about reporting those days anyway. It uses the same stores database.",
      },
      { kind: "heading", text: "A missing row isn't a zero" },
      {
        kind: "text",
        body: "The website was down from 10 to 12 June 2025. Those days have no rows, so June has 27 website rows, not 30:",
      },
      {
        kind: "table",
        caption: "The website, 8–14 June 2025",
        columns: ["day", "orders", "revenue"],
        rows: [
          ["2025-06-08", 22, 1386],
          ["2025-06-09", 23, 1265],
          ["2025-06-13", 23, 1242],
          ["2025-06-14", 28, 1736],
        ],
        source: {
          query: `SELECT day, orders, revenue
FROM daily_sales
WHERE store_id = 1
  AND day >= '2025-06-08' AND day < '2025-06-15'
ORDER BY day;`,
          dataset: "stores",
        },
      },
      {
        kind: "text",
        body: "A row that says 0 is something else. On 8 January 2025, Leeds opened through the snow and sold nothing, so that day has a row with 0 orders. Sunday the 5th, when it was closed, has no row:",
      },
      {
        kind: "table",
        caption: "Leeds, 4–11 January 2025",
        columns: ["day", "orders", "revenue"],
        rows: [
          ["2025-01-04", 13, 1040],
          ["2025-01-06", 10, 750],
          ["2025-01-07", 10, 660],
          ["2025-01-08", 0, 0],
          ["2025-01-09", 6, 468],
          ["2025-01-10", 7, 553],
          ["2025-01-11", 12, 984],
        ],
        source: {
          query: `SELECT day, orders, revenue
FROM daily_sales
WHERE store_id = 2
  AND day >= '2025-01-04' AND day < '2025-01-12'
ORDER BY day;`,
          dataset: "stores",
        },
      },
      {
        kind: "text",
        body: "`COUNT(*)` counts the snow day, because it's a row, and skips the Sunday, because it isn't. An average over these rows treats the snow day as a bad day and the Sunday as if it never happened.",
      },
      { kind: "heading", text: "Make the days yourself" },
      {
        kind: "text",
        body: "To report every day, including those with no row, make the days yourself. A recursive CTE produces a calendar, one row per day, and a `LEFT JOIN` hangs the sales on it. Days that found no sales get NULL, which `COALESCE` turns into 0.",
      },
      {
        kind: "code",
        language: "sql",
        code: `WITH RECURSIVE calendar(day) AS (
  SELECT '2025-06-08'
  UNION ALL
  SELECT date(day, '+1 day') FROM calendar WHERE day < '2025-06-14'
)
SELECT c.day, COALESCE(s.revenue, 0) AS revenue
FROM calendar AS c
LEFT JOIN daily_sales AS s
  ON s.day = c.day AND s.store_id = 1
ORDER BY c.day;

-- day         revenue
-- 2025-06-08  1386.0
-- 2025-06-09  1265.0
-- 2025-06-10  0
-- 2025-06-11  0
-- 2025-06-12  0
-- 2025-06-13  1242.0
-- 2025-06-14  1736.0`,
      },
      { kind: "heading", text: "Filter in `ON`, not `WHERE`" },
      {
        kind: "callout",
        body: "Put the store filter in the `ON`, not in `WHERE`. On a day with no sales, every column from `daily_sales` is NULL, including `store_id`, so `WHERE s.store_id = 1` throws out exactly the days the calendar was there to keep. The query still runs, and the gaps quietly disappear again.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "You LEFT JOIN a calendar of the 30 days of June 2025 to `daily_sales` and add `WHERE s.store_id = 1`. How many rows come back?",
        options: [
          {
            text: "30, one for each day in the calendar",
            whyNot:
              "That's what the `LEFT JOIN` returns, but `WHERE` runs after it. On a day with no website row, `s.store_id` is NULL, and `NULL = 1` isn't true.",
          },
          {
            text: "82, one for each store's sales",
            whyNot:
              "82 is every store's June rows, which is what you'd get with no store filter at all. `WHERE s.store_id = 1` keeps one store's.",
          },
          "27: the WHERE removes the three outage days, whose store_id is NULL",
          {
            text: "90, three stores times 30 days",
            whyNot:
              "The join only adds a row where a store actually traded, and Leeds closes on Sundays. The `WHERE` keeps just one store anyway.",
          },
        ],
        answer: 2,
        explanation:
          "The calendar gives 30 days, but `WHERE` runs after the join, and the outage days have NULL in every `daily_sales` column. Moving `s.store_id = 1` into the `ON` keeps all 30. Without any store filter you'd get 82: 27 website rows, 25 for Leeds and 30 for Harrogate.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "You join a calendar of June 2025 to the website's sales, with the store in the `ON`, and select `COALESCE(s.revenue, 0) AS revenue`. What does `AVG(revenue)` over the result average?",
        options: [
          {
            text: "Only the 27 days the website traded",
            whyNot:
              "That was true before the calendar. Now the outage days have rows too, each with revenue 0, and `AVG` counts every row it's given.",
          },
          {
            text: "Nothing: three NULLs make the whole average NULL",
            whyNot:
              "`COALESCE` has already turned those NULLs into 0. And `AVG` would only skip a NULL; it never makes the whole result NULL while other values remain.",
          },
          "All 30 days of June, with the outage days counted as 0",
          {
            text: "The same as before: zeros don't change an average",
            whyNot:
              "Zeros don't change a sum, but they do change an average: three more rows means the same total is divided by more days.",
          },
        ],
        answer: 2,
        explanation:
          "The calendar gives every day a row and `COALESCE` gives the gaps 0, so `AVG` becomes a per-calendar-day figure. That's often what you want, and it's never what `daily_sales` alone would give you.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Show 0, not NULL, on days the calendar found no sales.",
        before: "SELECT c.day, ",
        after: "(s.revenue, 0) AS revenue",
        answer: "COALESCE",
        explanation: "`COALESCE` returns its first argument that isn't NULL.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Every day of June, outage included",
        prompt:
          "Return the website's (`store_id = 1`) revenue for **every** day of June 2025: `day` and `revenue`, in date order, with 0 on days it has no row. The starter query runs, but it skips the outage.",
        language: "sql",
        dataset: "stores",
        starter: `SELECT day, revenue
FROM daily_sales
WHERE store_id = 1
  AND day >= '2025-06-01' AND day < '2025-07-01'
ORDER BY day;`,
        hint: "Build a calendar with `WITH RECURSIVE calendar(day) AS (SELECT '2025-06-01' UNION ALL SELECT date(day, '+1 day') FROM calendar WHERE day < '2025-06-30')`. LEFT JOIN `daily_sales` to it with the store in the `ON`, and wrap the revenue in `COALESCE`.",
        solution: `WITH RECURSIVE calendar(day) AS (
  SELECT '2025-06-01'
  UNION ALL
  SELECT date(day, '+1 day') FROM calendar WHERE day < '2025-06-30'
)
SELECT c.day, COALESCE(s.revenue, 0) AS revenue
FROM calendar AS c
LEFT JOIN daily_sales AS s
  ON s.day = c.day AND s.store_id = 1
ORDER BY c.day;`,
        tests: [
          {
            name: "Returns day and revenue",
            expression: 'columns == ["day", "revenue"]',
            show: "columns",
          },
          {
            name: "One row for each of June's 30 days",
            expression: "len(rows) == 30",
            show: "len(rows)",
          },
          {
            name: "The outage days show 0, not NULL",
            expression:
              'all(dict(rows).get(d, -1) == 0 for d in ("2025-06-10", "2025-06-11", "2025-06-12"))',
            show: '[dict(rows).get(d, "no row") for d in ("2025-06-10", "2025-06-11", "2025-06-12")]',
          },
          {
            name: "Only the website's sales: 37,381 in total",
            expression: "abs(sum(r[1] or 0 for r in rows) - 37381) < 0.01",
            show: "sum(r[1] or 0 for r in rows)",
          },
          {
            name: "Every day from 1 to 30 June, in order",
            expression: '[r[0] for r in rows] == [f"2025-06-{d:02d}" for d in range(1, 31)]',
            show: "[str(r[0])[-2:] for r in rows]",
          },
        ],
      },
    ],
  },
  "sql-time.lag": {
    summary: "Compare each period with the one before, and know when the comparison is fair.",
    xp: 190,
    blocks: [
      {
        kind: "text",
        body: '"Up 12% on last month" needs two numbers on the same row: this month and last. `LAG(x) OVER (ORDER BY ...)` fetches `x` from the previous row, without a self-join. `LEAD` fetches the next one. `LAG(x, 12)` reaches back 12 rows. A third argument, as in `LAG(x, 1, 0)`, is the value to use when there\'s no row that far back. Keep it for a count that really was 0 then, never as a stand-in for a period nobody measured: the next section explains why.',
      },
      {
        kind: "table",
        caption: "Revenue per store, month by month",
        collapsed: true,
        columns: ["month", "website", "leeds", "harrogate"],
        rows: [
          ["2024-01", 19901, 15019, null],
          ["2024-02", 20590, 15877, null],
          ["2024-03", 27064, 19917, null],
          ["2024-04", 29744, 23192, null],
          ["2024-05", 32772, 24841, null],
          ["2024-06", 35801, 27106, null],
          ["2024-07", 37272, 30058, null],
          ["2024-08", 34604, 26490, null],
          ["2024-09", 27782, 19916, null],
          ["2024-10", 25352, 19857, null],
          ["2024-11", 31499, 24481, null],
          ["2024-12", 36849, 26532, null],
          ["2025-01", 22709, 16480, null],
          ["2025-02", 22447, 18178, null],
          ["2025-03", 28682, 22662, null],
          ["2025-04", 31687, 24607, 13821],
          ["2025-05", 38244, 29378, 23710],
          ["2025-06", 37381, 30677, 24189],
          ["2025-07", 44417, 35415, 27917],
          ["2025-08", 40933, 30603, 26075],
          ["2025-09", 30399, 24525, 19584],
          ["2025-10", 30807, 24937, 20314],
          ["2025-11", 38196, 26907, 22521],
          ["2025-12", 40930, 28633, 23622],
        ],
        source: {
          query: `SELECT strftime('%Y-%m', day) AS month,
       SUM(CASE WHEN store_id = 1 THEN revenue END) AS website,
       SUM(CASE WHEN store_id = 2 THEN revenue END) AS leeds,
       SUM(CASE WHEN store_id = 3 THEN revenue END) AS harrogate
FROM daily_sales
GROUP BY month
ORDER BY month;`,
          dataset: "stores",
        },
      },
      {
        kind: "code",
        language: "sql",
        caption: "The chain's revenue, month on month",
        code: `WITH monthly AS (
  SELECT strftime('%Y-%m', day) AS month,
         SUM(revenue) AS revenue
  FROM daily_sales
  GROUP BY month
), compared AS (
  SELECT month, revenue,
         LAG(revenue) OVER (ORDER BY month) AS prev
  FROM monthly
)
SELECT month, revenue,
       revenue - prev AS change,
       ROUND(100.0 * (revenue - prev) / prev, 1) AS pct
FROM compared
ORDER BY month
LIMIT 4;

-- month    revenue  change   pct
-- 2024-01  34920.0  NULL     NULL
-- 2024-02  36467.0  1547.0   4.4
-- 2024-03  46981.0  10514.0  28.8
-- 2024-04  52936.0  5955.0   12.7`,
      },
      { kind: "heading", text: "The first row has nothing before it" },
      {
        kind: "text",
        body: "January 2024 has nothing before it, so its change is NULL, and NULL is the honest answer. Don't `COALESCE` it to 0: a 0 claims the month was flat, when in fact nobody knows.",
      },
      {
        kind: "callout",
        body: "**Watch out for two arithmetic traps.** Write `100.0 *`, not `100 *`: `orders` is an INTEGER, and dividing one integer by another gives an integer, so every change under 100% comes out as 0. And if the previous value can be 0, divide by `NULLIF(prev, 0)`. SQLite returns NULL when you divide by zero, but PostgreSQL and most other databases stop with an error.",
      },
      { kind: "heading", text: "The previous row isn't always the previous period" },
      {
        kind: "text",
        body: "`LAG` means *the previous row*, not *the previous period*. On Leeds's daily rows, Monday's previous row is Saturday, because Sunday has no row. Monthly totals here have every month, so `LAG(revenue, 12)` is the same month last year. Where a period might be missing, build a calendar first, as in the last lesson, and then `LAG` over that.",
      },
      {
        kind: "text",
        body: "`PARTITION BY store_id` compares each store only with itself. Watch the first row of a new store, though. Harrogate opened on 12 April 2025, part-way through the month:",
      },
      {
        kind: "table",
        caption: "Harrogate's first two months",
        columns: ["month", "trading_days", "revenue", "change_pct"],
        rows: [
          ["2025-04", 19, 13821, null],
          ["2025-05", 31, 23710, 71.6],
        ],
        source: {
          query: `WITH monthly AS (
  SELECT strftime('%Y-%m', day) AS month,
         COUNT(*) AS trading_days,
         SUM(revenue) AS revenue
  FROM daily_sales
  WHERE store_id = 3
  GROUP BY month
)
SELECT month, trading_days, revenue,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
             / LAG(revenue) OVER (ORDER BY month), 1) AS change_pct
FROM monthly
ORDER BY month
LIMIT 2;`,
          dataset: "stores",
        },
      },
      {
        kind: "text",
        body: "May is up 71.6% for no reason except that it's a whole month. A partial first period makes the second look like a boom, so compare from the first full one.",
      },
      { kind: "heading", text: "Like for like: better, or just bigger?" },
      {
        kind: "text",
        body: "Then there's the question of whether the comparison is fair at all. Harrogate didn't exist in 2024, so everything it took in 2025 looks like growth:",
      },
      {
        kind: "table",
        caption: "2025 against 2024",
        columns: ["stores", "revenue_2024", "revenue_2025", "growth_pct"],
        rows: [
          ["Harrogate", null, 201753, null],
          ["Website and Leeds", 632516, 719834, 13.8],
          ["All stores", 632516, 921587, 45.7],
        ],
        source: {
          query: `WITH yearly AS (
  SELECT CASE WHEN s.opened_on <= '2024-01-01'
              THEN 'Website and Leeds' ELSE 'Harrogate' END AS stores,
         SUM(CASE WHEN d.day < '2025-01-01' THEN d.revenue END) AS y2024,
         SUM(CASE WHEN d.day >= '2025-01-01' THEN d.revenue END) AS y2025
  FROM daily_sales AS d
  JOIN stores AS s ON s.id = d.store_id
  GROUP BY 1
)
SELECT stores, y2024 AS revenue_2024, y2025 AS revenue_2025,
       ROUND(100.0 * (y2025 - y2024) / y2024, 1) AS growth_pct
FROM yearly
UNION ALL
SELECT 'All stores', SUM(y2024), SUM(y2025),
       ROUND(100.0 * (SUM(y2025) - SUM(y2024)) / SUM(y2024), 1)
FROM yearly
ORDER BY revenue_2025;`,
          dataset: "stores",
        },
      },
      {
        kind: "text",
        body: "Both growth figures are true. The 13.8% for the stores that traded in both years is called **like-for-like** growth, and it's the one that tells you whether the business is doing better, rather than just bigger.",
      },
      {
        kind: "callout",
        body: "Two checks before you publish a period comparison. Is every period there, so that the previous row is really the previous period? And is the same set of things being counted in both periods?",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "`orders` is an INTEGER column. February 2024 had 541 orders and January had 522. In SQLite, what does `(orders - prev) / prev` return for February?",
        options: [
          {
            text: "3.6",
            whyNot:
              "3.6 is the percentage, and nothing in this expression multiplies by 100. Before that, look at the types: both columns are INTEGER.",
          },
          "0",
          {
            text: "0.036",
            whyNot:
              "That's the true ratio, but SQLite gives a decimal only when one side of the division is a decimal. Both sides here are INTEGER.",
          },
          {
            text: "NULL",
            whyNot:
              "SQLite gives NULL for a division only when one side is NULL or you divide by zero. Neither happens here: `prev` is 522.",
          },
        ],
        answer: 1,
        explanation:
          "19 / 522 is integer division, so the result is 0, and so is every change under 100%. `100.0 * (orders - prev) / prev` makes it a decimal: 3.6.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "The first month in a report has no month before it. What should its `change` show?",
        options: [
          "NULL. There's nothing to compare it with, and 0 would claim a flat month",
          {
            text: "0, because nothing changed",
            whyNot:
              "Nobody measured a change, which isn't the same as no change. A 0 tells the reader the month was flat, and nobody knows that.",
          },
          {
            text: "The month's own revenue, since it's all new",
            whyNot:
              "That treats the month before as zero revenue, a claim about a month nobody measured. Every report would start with an enormous jump.",
          },
          {
            text: "Nothing: drop the first month from the report",
            whyNot:
              "Dropping the row hides that month's revenue too, and the reader can't tell anything is missing.",
          },
        ],
        answer: 0,
        explanation:
          "A missing comparison is unknown, and NULL says so. 0 and the month's own revenue are both claims about a month nobody measured, and dropping the row hides that month's revenue too.",
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "The chain's revenue rose from 632,516 in 2024 to 921,587 in 2025, and 201,753 of 2025's came from the new Harrogate store. Which headline is accurate?",
        options: [
          {
            text: "Revenue grew 45.7%",
            whyNot:
              "True, but on its own it reads as though the existing business is booming. Much of the rise is a store that didn't exist in 2024.",
          },
          {
            text: "Revenue grew 13.8%, because Harrogate's sales don't count",
            whyNot:
              "Harrogate's sales are real revenue and do count. 13.8% describes only the stores that traded in both years, so calling it the chain's growth understates what the chain took.",
          },
          "Revenue grew 45.7% overall; the stores that traded in both years grew 13.8%",
          {
            text: "Growth can't be measured, because Harrogate has no 2024",
            whyNot:
              "Both years have a revenue total, so growth can be measured. A new store changes what the growth means, not whether there is any.",
          },
        ],
        answer: 2,
        explanation:
          "45.7% is true but reads as though the existing business is booming. Harrogate's sales are real and do count; they just aren't growth of anything. Reporting both numbers lets the reader see how much came from the new store.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Like-for-like growth, month by month",
        prompt:
          "For each month of 2025, compare the stores that traded all through 2024 (those opened on or before `2024-01-01`) with the same month a year earlier. Return `month`, `revenue`, `last_year` and `growth_pct` (rounded to 1 decimal place), in month order: 12 rows. The starter query counts every store and shows both years.",
        language: "sql",
        dataset: "stores",
        starter: `WITH monthly AS (
  SELECT strftime('%Y-%m', day) AS month,
         SUM(revenue) AS revenue
  FROM daily_sales
  GROUP BY month
), compared AS (
  SELECT month, revenue,
         LAG(revenue, 12) OVER (ORDER BY month) AS last_year
  FROM monthly
)
SELECT month, revenue, last_year,
       ROUND(100.0 * (revenue - last_year) / last_year, 1) AS growth_pct
FROM compared
ORDER BY month;`,
        hint: "Join `stores` in the first CTE and keep `s.opened_on <= '2024-01-01'`. Keep only 2025 in the **outer** query: filter any earlier and the 2024 months are gone before `LAG` can reach them.",
        solution: `WITH monthly AS (
  SELECT strftime('%Y-%m', d.day) AS month,
         SUM(d.revenue) AS revenue
  FROM daily_sales AS d
  JOIN stores AS s ON s.id = d.store_id
  WHERE s.opened_on <= '2024-01-01'
  GROUP BY month
), compared AS (
  SELECT month, revenue,
         LAG(revenue, 12) OVER (ORDER BY month) AS last_year
  FROM monthly
)
SELECT month, revenue, last_year,
       ROUND(100.0 * (revenue - last_year) / last_year, 1) AS growth_pct
FROM compared
WHERE month >= '2025-01'
ORDER BY month;`,
        tests: [
          {
            name: "Returns month, revenue, last_year and growth_pct",
            expression: 'columns == ["month", "revenue", "last_year", "growth_pct"]',
            show: "columns",
          },
          {
            name: "The 12 months of 2025",
            expression: 'len(rows) == 12 and all(r[0].startswith("2025-") for r in rows)',
            show: "[r[0] for r in rows]",
          },
          {
            name: "Every month has last year's figure",
            expression: "all(r[2] is not None for r in rows)",
            show: "[r[2] for r in rows][:4]",
          },
          {
            name: "Harrogate is left out: July is 79,832",
            expression: 'abs(dict((r[0], r[1]) for r in rows).get("2025-07", 0) - 79832) < 0.01',
            show: 'dict((r[0], r[1]) for r in rows).get("2025-07", "no row for 2025-07")',
          },
          {
            name: "July grew 18.6% on July 2024",
            expression: 'abs((dict((r[0], r[3]) for r in rows).get("2025-07") or 0) - 18.6) < 0.05',
            show: 'dict((r[0], r[3]) for r in rows).get("2025-07", "no row for 2025-07")',
          },
          {
            name: "In month order",
            expression: "[r[0] for r in rows] == sorted(r[0] for r in rows)",
            show: "[r[0] for r in rows]",
          },
        ],
      },
    ],
  },
  "sql-quality.checks": {
    summary:
      "Find duplicates, orphans, bad values and totals that don't reconcile before you report.",
    xp: 190,
    blocks: [
      {
        kind: "text",
        body: "Every query so far has trusted the data. Real data arrives from other systems, and each one has its own bugs. This lesson adds one such system to the shop: an export from its card provider, with one row per charge or refund. Before anyone reports revenue from it, it needs checking.",
      },
      {
        kind: "code",
        language: "text",
        caption: "The shop, plus the payments export",
        code: SQL_DATASETS.payments.schema,
      },
      {
        kind: "table",
        caption: "The payments export",
        collapsed: true,
        columns: ["id", "order_id", "created_at", "amount", "status"],
        rows: [
          [1, 101, "2026-01-04 10:12:00", 173, "succeeded"],
          [2, 102, "2026-01-09 18:40:00", 180, "succeeded"],
          [3, 103, "2026-01-15 09:05:00", 70, "succeeded"],
          [4, 103, "2026-01-19 11:30:00", -70, "refunded"],
          [5, 104, "2026-01-22 20:14:00", 195, "Succeeded"],
          [6, 105, "2026-02-02 08:55:00", 95, "succeeded"],
          [7, 106, "2026-02-06 13:20:00", 154, "succeeded"],
          [8, 106, "2026-02-06 13:20:00", 154, "succeeded"],
          [9, 107, "2026-02-11 16:02:00", 185, "failed"],
          [10, 108, "19/02/2026 12:47", 60, "succeeded"],
          [11, 109, "2026-02-25 07:31:00", 173, "succeeded"],
          [12, 110, "2026-03-03 19:45:00", 77, "succeeded "],
          [13, 111, "2026-03-08 10:10:00", 95, "succeeded"],
          [14, 111, "2026-03-10 15:00:00", -95, "refunded"],
          [15, 112, "2026-03-12 21:05:00", 180, "succeeded"],
          [16, 113, "2026-03-18 12:00:00", null, "succeeded"],
          [17, 999, "2026-03-20 14:22:00", 49, "succeeded"],
        ],
        source: { query: "SELECT * FROM payments ORDER BY id;", dataset: "payments" },
      },
      {
        kind: "text",
        body: "A data check is a query that should return nothing. If it returns rows, those rows are the problem. There are five kinds worth running on any new table, and then one more that ties it to the rest of the data.",
      },
      { kind: "heading", text: "1. Allowed values" },
      {
        kind: "text",
        body: "Group by any column that should hold a short list of values, and read the list.",
      },
      {
        kind: "code",
        language: "sql",
        code: `SELECT status, COUNT(*) AS payments
FROM payments
GROUP BY status;

-- status      payments
-- Succeeded   1
-- failed      1
-- refunded    2
-- succeeded   12
-- succeeded   1`,
      },
      {
        kind: "text",
        body: "Two rows both seem to say `succeeded`. The second one is `'succeeded '`, with a trailing space you can't see in the output. With the capital-S version, that's 14 successful payments spelled three ways, and `WHERE status = 'succeeded'` finds 12 of them. `LOWER(TRIM(status))` brings them back together.",
      },
      { kind: "heading", text: "2. Duplicates" },
      {
        kind: "text",
        body: "Decide what should be unique, then look for groups with more than one row. Here each payment has its own `id`, so group by everything else.",
      },
      {
        kind: "code",
        language: "sql",
        code: `SELECT order_id, created_at, amount, COUNT(*) AS copies
FROM payments
GROUP BY order_id, created_at, amount, status
HAVING COUNT(*) > 1;

-- order_id  created_at           amount  copies
-- 106       2026-02-06 13:20:00  154.0   2`,
      },
      {
        kind: "text",
        body: "Payments 7 and 8 are the same charge, recorded twice when the provider's notification arrived twice. Sum the export and order 106 has paid 308.0 for a 154.0 order.",
      },
      { kind: "heading", text: "3. Orphans" },
      {
        kind: "text",
        body: "A row that points at something that doesn't exist. The anti-join from SQL Foundations' joins lesson finds them: `LEFT JOIN` the table it should match, and keep the rows that found nothing.",
      },
      {
        kind: "code",
        language: "sql",
        code: `SELECT p.id, p.order_id
FROM payments AS p
LEFT JOIN orders AS o ON o.id = p.order_id
WHERE o.id IS NULL;

-- id  order_id
-- 17  999`,
      },
      { kind: "heading", text: "4. Missing values" },
      {
        kind: "text",
        body: "`COUNT(*)` counts rows and `COUNT(amount)` counts amounts, so the difference is how many are NULL. Here it's 17 against 16. That matters because `SUM` skips NULLs without a word: payment 16's missing amount just vanishes from the total.",
      },
      { kind: "heading", text: "5. Formats" },
      {
        kind: "text",
        body: "A date that isn't `YYYY-MM-DD` sorts and filters as the wrong date. `GLOB` matches a pattern of characters, so this finds any row that doesn't start with one:",
      },
      {
        kind: "code",
        language: "sql",
        code: `SELECT id, created_at
FROM payments
WHERE created_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*';

-- id  created_at
-- 10  19/02/2026 12:47`,
      },
      {
        kind: "text",
        body: "As text, `'19/02/2026'` sorts before `'2'`, so a filter for February finds 5 payments instead of 6. Don't fix a row like this by guessing, though. `19/02` can only mean the 19th of February, but `04/03` could be April or March. Ask where the export came from.",
      },
      { kind: "heading", text: "6. Reconciliation" },
      {
        kind: "text",
        body: "Compare the new data with something you already trust. The succeeded charges total 1,655. The paid orders total 1,653: 1,628 in items plus 25 in shipping. That's so close that it looks like rounding.",
      },
      {
        kind: "text",
        body: "It isn't. Compare them one order at a time instead. `expected` is what each order should have brought in: its total if it's paid, nothing if it isn't. Seven orders disagree:",
      },
      {
        kind: "table",
        caption: "Every order whose payments don't match",
        columns: ["order_id", "status", "expected", "collected", "difference"],
        rows: [
          [103, "refunded", 0, 70, 70],
          [106, "paid", 154, 308, 154],
          [111, "refunded", 0, 95, 95],
          [112, "paid", 197, 180, -17],
          [113, "paid", 25, 0, -25],
          [114, "paid", 324, 0, -324],
          [999, "no such order", 0, 49, 49],
        ],
        source: {
          // Kept back: it's most of the answer to this lesson's challenge.
          hideQuery: true,
          dataset: "payments",
          query: `WITH totals AS (
  SELECT o.id AS order_id, o.status,
         o.shipping + SUM(i.quantity * i.unit_price) AS order_total
  FROM orders AS o
  JOIN order_items AS i ON i.order_id = o.id
  GROUP BY o.id
), charged AS (
  SELECT order_id, SUM(amount) AS collected
  FROM payments
  WHERE LOWER(TRIM(status)) = 'succeeded'
  GROUP BY order_id
), compared AS (
  SELECT t.order_id, t.status,
         CASE WHEN t.status = 'paid' THEN t.order_total ELSE 0 END AS expected,
         COALESCE(c.collected, 0) AS collected
  FROM totals AS t
  LEFT JOIN charged AS c ON c.order_id = t.order_id
  UNION ALL
  SELECT c.order_id, 'no such order', 0, c.collected
  FROM charged AS c
  LEFT JOIN orders AS o ON o.id = c.order_id
  WHERE o.id IS NULL
)
SELECT order_id, status, expected, collected, collected - expected AS difference
FROM compared
WHERE collected <> expected
ORDER BY order_id;`,
        },
      },
      {
        kind: "text",
        body: "106 is the duplicate. 103 and 111 were charged and later refunded, so they aren't revenue. 112 was charged 17 too little, 113's amount is missing, 114 was never charged, and 999 is the orphan. The differences add up to the 2. A total that matches proves very little: reconcile row by row, at the grain where things should match, which here is one row per order.",
      },
      {
        kind: "callout",
        body: "Run the checks before the analysis and keep them. When the next export arrives, run them again first. A check that returned nothing last month is exactly the one that catches the new bug.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Why does `WHERE status = 'succeeded'` find 12 of the 14 successful payments?",
        options: [
          {
            text: "Two of them are duplicates",
            whyNot:
              "A duplicate has the same status as the original, so it passes the filter too. Duplicates push a count up, not down.",
          },
          {
            text: "SQLite ignores rows with a NULL amount",
            whyNot:
              "`WHERE status = ...` doesn't look at `amount` at all. A NULL amount drops out of `SUM`, not out of a filter on another column.",
          },
          {
            text: "Two of them belong to orders that don't exist",
            whyNot:
              "This query never touches `orders`, so it can't know an order is missing. The orphan payment passes the filter like any other row.",
          },
          "Two are spelled differently: 'Succeeded' and 'succeeded ' with a trailing space",
        ],
        answer: 3,
        explanation:
          "`=` compares text exactly, so capital letters and spaces count. `LOWER(TRIM(status)) = 'succeeded'` finds all 14. The duplicate and the orphan both pass the filter.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "Payments total 1,655 and paid orders total 1,653. What does that tell you about the payments?",
        options: [
          "Very little: several errors can cancel out, so reconcile order by order",
          {
            text: "They're correct, apart from 2 lost to rounding",
            whyNot:
              "Every amount in the export is a whole number, so there's nothing to round. A small gap between two totals can hide large errors in both directions.",
          },
          {
            text: "Exactly one payment is wrong, by 2",
            whyNot:
              "A total only shows the net difference. One error of 2, or several bigger ones that nearly cancel, give the same total.",
          },
          {
            text: "The shop was overpaid by 2",
            whyNot:
              "That holds only if every other payment were right. The total can't tell you which orders were overpaid, underpaid or missed.",
          },
        ],
        answer: 0,
        explanation:
          "Here, a duplicate, an orphan, two refunded charges, a missing payment, a missing amount and a short charge add up to +2. Only a check on each order shows them.",
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "`SELECT COUNT(*), COUNT(amount) FROM payments` returns 17 and 16. What does that mean?",
        options: [
          {
            text: "One payment is a duplicate",
            whyNot:
              "A duplicate has an amount, so `COUNT(amount)` counts it as well. Both counts would go up together.",
          },
          {
            text: "One payment has an amount of 0",
            whyNot:
              "0 is a value, and `COUNT(amount)` counts it just like 154. The two counts would still match.",
          },
          {
            text: "One payment's order doesn't exist",
            whyNot:
              "Neither count looks at `orders`. The orphan payment still has an amount, so both counts include it.",
          },
          "One payment has a NULL amount, which SUM will silently leave out",
        ],
        answer: 3,
        explanation:
          "`COUNT(column)` skips NULLs, so the difference between the two counts is how many values are missing. A 0 would be counted.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Which paid orders don't reconcile?",
        prompt:
          "For every **paid** order, compare its total (items plus shipping) with what its successful payments add up to. Return the orders where the two differ, as `order_id`, `order_total` and `collected`, in order of `order_id`. Show `collected` as 0 when nothing was collected. The starter runs, but it has several separate problems. Each test below checks one thing, so fix one at a time and watch which tests are still failing.",
        language: "sql",
        dataset: "payments",
        starter: `SELECT o.id AS order_id,
       SUM(i.quantity * i.unit_price) + o.shipping AS order_total,
       SUM(p.amount) AS collected
FROM orders AS o
JOIN order_items AS i ON i.order_id = o.id
JOIN payments AS p ON p.order_id = o.id
WHERE o.status = 'paid'
  AND p.status = 'succeeded'
GROUP BY o.id
HAVING order_total <> collected
ORDER BY order_id;`,
        hint: "Bring both sides to one row per order before joining: one CTE for each paid order's total, and one for each order's successful payments, using `LOWER(TRIM(status))`. Then `LEFT JOIN` the payments to the totals, so an order with no payment stays in, and compare `COALESCE(collected, 0)` with the total.",
        solution: `WITH order_totals AS (
  SELECT o.id AS order_id,
         o.shipping + SUM(i.quantity * i.unit_price) AS order_total
  FROM orders AS o
  JOIN order_items AS i ON i.order_id = o.id
  WHERE o.status = 'paid'
  GROUP BY o.id
), collected AS (
  SELECT order_id, SUM(amount) AS collected
  FROM payments
  WHERE LOWER(TRIM(status)) = 'succeeded'
  GROUP BY order_id
)
SELECT t.order_id, t.order_total, COALESCE(c.collected, 0) AS collected
FROM order_totals AS t
LEFT JOIN collected AS c ON c.order_id = t.order_id
WHERE COALESCE(c.collected, 0) <> t.order_total
ORDER BY t.order_id;`,
        tests: [
          {
            name: "Returns order_id, order_total and collected",
            expression: 'columns == ["order_id", "order_total", "collected"]',
            show: "columns",
          },
          {
            name: "Finds the four orders that don't reconcile: 106, 112, 113 and 114",
            expression: "sorted(r[0] for r in rows) == [106, 112, 113, 114]",
            show: "sorted(r[0] for r in rows)",
          },
          {
            name: "Doesn't flag 104 or 110, whose status is only spelled differently",
            expression: "not any(r[0] in (104, 110) for r in rows)",
            show: "[r for r in rows if r[0] in (104, 110)]",
          },
          {
            name: "Each order's total counts its items once: 106 is 154",
            expression: "dict((r[0], r[1]) for r in rows).get(106) == 154",
            show: 'dict((r[0], r[1]) for r in rows).get(106, "no row for 106")',
          },
          {
            name: "The duplicate shows up: 106 collected 308",
            expression: "dict((r[0], r[2]) for r in rows).get(106) == 308",
            show: 'dict((r[0], r[2]) for r in rows).get(106, "no row for 106")',
          },
          {
            name: "Order 114, with no payment, shows 0 collected",
            expression: "dict((r[0], r[2]) for r in rows).get(114) == 0",
            show: 'dict((r[0], r[2]) for r in rows).get(114, "no row for 114")',
          },
          {
            name: "In order of order_id",
            expression: "[r[0] for r in rows] == sorted(r[0] for r in rows)",
            show: "[r[0] for r in rows]",
          },
        ],
      },
    ],
  },
  "sql-project.capstone": {
    summary: "Answer a director's question end to end, and say what the number really means.",
    xp: 250,
    blocks: [
      {
        kind: "callout",
        body: "This is the independent capstone. The editor starts empty and the brief doesn't say which technique to use. Plan the steps first: what one row of each step means, where the months come from, and where the comparison has to happen. Use the earlier lessons as references, and open the hint only once you have a plan.",
      },
      {
        kind: "text",
        body: "The chain's director has seen the website's revenue level off and asks: *is the website taking over from the stores, or losing ground to them?* The answer is a table for 2025 with one row per month, plus a sentence on what it shows. Before you trust your table, reconcile it: the website and stores together should add up to the chain's 2025 revenue of 921,587.",
      },
      {
        kind: "table",
        caption: "The three stores",
        collapsed: true,
        columns: ["id", "name", "channel", "city", "opened_on"],
        rows: [
          [1, "Website", "web", null, "2022-03-01"],
          [2, "Leeds", "store", "Leeds", "2019-09-14"],
          [3, "Harrogate", "store", "Harrogate", "2025-04-12"],
        ],
        source: { query: "SELECT * FROM stores;", dataset: "stores" },
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Compare each month's share with the month before.",
        before: "web_share - ",
        after: "(web_share) OVER (ORDER BY month)",
        answer: "LAG",
        explanation: "`LAG` fetches the value from the previous row in the window's order.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Is the website taking over?",
        prompt:
          "For each month of 2025, return `month` (like `2025-01`), `web` (the website's revenue), `stores` (all stores' revenue together), `web_share` (the website's percentage of the month's total, rounded to 1 decimal place) and `share_change` (the change in `web_share` from the previous month, in percentage points, rounded to 1 decimal place). January is compared with December 2024. Sort by month.",
        language: "sql",
        dataset: "stores",
        starter: `-- Write the query from the brief. Plan the steps before you start.
`,
        hint: "Step 1: one row per month, with `web` and `stores` as conditional sums over `daily_sales` joined to `stores` on `channel`. Step 2: the share, `100.0 * web / (web + stores)`. Step 3: `LAG` over all 24 months. Keep only 2025 in the final query, after the `LAG`, or January has nothing to compare with.",
        solution: `WITH monthly AS (
  SELECT strftime('%Y-%m', d.day) AS month,
         SUM(CASE WHEN s.channel = 'web' THEN d.revenue ELSE 0 END) AS web,
         SUM(CASE WHEN s.channel = 'store' THEN d.revenue ELSE 0 END) AS stores
  FROM daily_sales AS d
  JOIN stores AS s ON s.id = d.store_id
  GROUP BY month
), shares AS (
  SELECT month, web, stores,
         100.0 * web / (web + stores) AS share
  FROM monthly
), compared AS (
  SELECT month, web, stores, share,
         share - LAG(share) OVER (ORDER BY month) AS change
  FROM shares
)
SELECT month, web, stores,
       ROUND(share, 1) AS web_share,
       ROUND(change, 1) AS share_change
FROM compared
WHERE month >= '2025-01'
ORDER BY month;`,
        tests: [
          {
            name: "Returns month, web, stores, web_share and share_change",
            expression: 'columns == ["month", "web", "stores", "web_share", "share_change"]',
            show: "columns",
          },
          {
            name: "The 12 months of 2025",
            expression: 'len(rows) == 12 and all(r[0].startswith("2025-") for r in rows)',
            show: "[r[0] for r in rows]",
          },
          {
            name: "Website and stores reconcile with the chain's 2025 revenue: 921,587",
            expression: "abs(sum(r[1] + r[2] for r in rows) - 921587) < 0.01",
            show: "sum(r[1] + r[2] for r in rows)",
          },
          {
            name: "stores counts Harrogate: April is 38,428",
            expression: 'abs(dict((r[0], r[2]) for r in rows).get("2025-04", 0) - 38428) < 0.01',
            show: 'dict((r[0], r[2]) for r in rows).get("2025-04", "no row for 2025-04")',
          },
          {
            name: "June's web_share is 40.5",
            expression: 'abs((dict((r[0], r[3]) for r in rows).get("2025-06") or 0) - 40.5) < 0.05',
            show: 'dict((r[0], r[3]) for r in rows).get("2025-06", "no row for 2025-06")',
          },
          {
            name: "January is compared with December 2024: -0.2",
            expression: 'abs((dict((r[0], r[4]) for r in rows).get("2025-01") or 99) + 0.2) < 0.11',
            show: 'dict((r[0], r[4]) for r in rows).get("2025-01", "no row for 2025-01")',
          },
          {
            name: "April shows the fall when Harrogate opened: -10.7",
            expression:
              'abs((dict((r[0], r[4]) for r in rows).get("2025-04") or 99) + 10.7) < 0.11',
            show: 'dict((r[0], r[4]) for r in rows).get("2025-04", "no row for 2025-04")',
          },
          {
            name: "In month order",
            expression: "[r[0] for r in rows] == sorted(r[0] for r in rows)",
            show: "[r[0] for r in rows]",
          },
        ],
      },
      { kind: "heading", text: "Now say what it means" },
      {
        kind: "text",
        body: "A table isn't an answer until someone can act on it. With your query passing, write the sentence for the director.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "Your table shows the website's share falling 10.7 points in April 2025, and staying between 40% and 44% for the rest of the year. What's the accurate sentence for the director?",
        options: [
          {
            text: "The website is losing customers to the stores",
            whyNot:
              "Revenue isn't customers, and the website took more in April than in March. A share can fall while the website grows, if the total grows faster.",
          },
          "The website's share fell because Harrogate opened on 12 April. Against Leeds alone, the store it competed with in both years, it's holding steady",
          {
            text: "The website had a bad April",
            whyNot:
              "The website's own revenue rose in April. Its share fell because something else was added to the total that month.",
          },
          {
            text: "A 10.7-point fall must be a data error, so leave April out",
            whyNot:
              "Something real changed in April 2025, and the data shows it. Leaving out a month you can't yet explain hides the most important row in the table.",
          },
        ],
        answer: 1,
        explanation:
          "A share is a fraction, and a new store adds to the bottom of it: the website took more in April than in March, and its share still fell. Compared like for like with Leeds alone, the idea from the LAG lesson, it had 56.8% of the two in 2024 and 56.5% in 2025.",
      },
    ],
  },
};
