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
        options: ["7", "15", "4", "11"],
        answer: 3,
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
        options: ["mid", "premium", "budget", "NULL"],
        answer: 0,
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
        question: "Only two customers come back. Why?",
        options: [
          "LEFT JOIN only works on primary keys",
          "Nobody else has a refund, so two is correct",
          "Refunds are stored in a different table",
          "WHERE runs after the join and drops every customer whose `o.status` isn't 'refunded', NULLs included. The condition belongs in ON",
        ],
        answer: 3,
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
      {
        kind: "text",
        body: "Now for the trap SQL Foundations warned about in its joins lesson. Shipping is charged once per **order**, but items are stored per **line**. Join the two and each order's shipping is repeated on every one of its lines.",
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
        body: "The paid orders actually charged 25.0 in shipping. The query says 35.0 because orders 101 and 108 each have two lines, so each of their 5.0 fees was counted twice. Nothing errors and nothing looks odd; the number is simply wrong. This is the most common way analysis goes quietly wrong.",
      },
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
          "`SUM(DISTINCT o.shipping)`",
          "Use LEFT JOIN instead of JOIN",
          "Total the items per order in a CTE first, then join one row per order",
          "Divide the result by `COUNT(*)`",
        ],
        answer: 2,
        explanation:
          "`SUM(DISTINCT ...)` collapses every 5.0 into a single 5.0, which is wrong in a different way. LEFT JOIN changes nothing here because every order has items. Only fixing the grain gives 25.0.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          'A dashboard counts "orders per customer" with `COUNT(*)` after joining `orders` to `order_items`. Maja has 3 paid orders with 7 item lines between them. What does the dashboard show for her?',
        options: ["3", "7", "10", "1"],
        answer: 1,
        explanation:
          "`COUNT(*)` counts rows, and after that join each row is an item line. Count before the join, or use `COUNT(DISTINCT o.id)`.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "What each customer really spent",
        prompt:
          "For each customer with paid orders, return `name`, `orders` (how many paid orders) and `total_spent` (items **plus** shipping, with each order's shipping counted once), highest `total_spent` first. The starter query runs, but its numbers are wrong: find out why and fix it.",
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
          },
          { name: "Seven customers have paid orders", expression: "len(rows) == 7" },
          {
            name: "orders counts orders, not item lines",
            expression: 'dict((r[0], r[1]) for r in rows).get("Maja Berg") == 3',
          },
          {
            name: "Each order's shipping is counted once",
            expression: 'abs(dict((r[0], r[2]) for r in rows).get("Maja Berg", 0) - 557) < 0.01',
          },
          {
            name: "Totals reconcile with items (1,628) plus shipping (25)",
            expression: "abs(sum(r[2] for r in rows) - 1653) < 0.01",
          },
          {
            name: "Highest spender first",
            expression: "[r[2] for r in rows] == sorted((r[2] for r in rows), reverse=True)",
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
        options: ["11", "4", "1", "15"],
        answer: 3,
        explanation:
          "The `ELSE 0` gives every other order a 0, and `COUNT` counts anything that isn't NULL. Drop the `ELSE` and it returns 11.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "`AVG(CASE WHEN status = 'paid' THEN items END)` gives 148.0. Why does adding `ELSE 0` change it to 108.53?",
        options: [
          "`AVG` rounds differently when it sees a 0",
          "The 4 orders that aren't paid now count as zeros in the average",
          "`ELSE 0` turns the whole column into integers",
          "It doesn't; the two queries return the same number",
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
          },
          { name: "One row per month", expression: "len(rows) == 3" },
          {
            name: "The status columns add up to orders",
            expression: "all(r[1] == r[2] + r[3] + r[4] for r in rows)",
          },
          {
            name: "January had no pending orders: 0, not NULL",
            expression: 'rows[0][0] == "2026-01" and rows[0][4] == 0',
          },
          {
            name: "March: 4 of 6 paid, 66.7%",
            expression:
              'any(r[0] == "2026-03" and r[2] == 4 and abs(r[5] - 66.7) < 0.05 for r in rows)',
          },
          {
            name: "In month order",
            expression: "[r[0] for r in rows] == sorted(r[0] for r in rows)",
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
      {
        kind: "text",
        body: "When values tie, `ROW_NUMBER` still counts 1, 2, 3 and breaks the tie arbitrarily. `RANK` gives tied rows the same number and then skips (1, 2, 2, 4). `DENSE_RANK` doesn't skip (1, 2, 2, 3).",
      },
      {
        kind: "text",
        body: "Window functions are calculated after `WHERE`, so you can't filter on one there. Compute it in a CTE and filter in the outer query. That's the standard way to get *the latest X per Y*.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "Paid orders per customer: Maja 3, Sofia 2, Noah 2, and four customers with 1. With `RANK() OVER (ORDER BY paid_orders DESC)`, what rank do the customers with 1 order get?",
        options: ["2", "3", "4", "5"],
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
          "ROW_NUMBER needs a PARTITION BY",
          "SQLite doesn't support window functions",
          "It should be HAVING instead of WHERE",
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
          },
          {
            name: "One row for each of the 7 customers with a paid order",
            expression: "len(rows) == 7 and len(set(r[0] for r in rows)) == 7",
          },
          {
            name: "Liam's later pending order doesn't count",
            expression: '("Liam Walsh", 102, "2026-01-09") in rows',
          },
          {
            name: "Maja's latest is her March order",
            expression: 'any(r[0] == "Maja Berg" and r[1] == 114 for r in rows)',
          },
          {
            name: "Sorted by name",
            expression: "[r[0] for r in rows] == sorted(r[0] for r in rows)",
          },
        ],
      },
    ],
  },
  "sql-time.dates": {
    summary: "Bucket days into weeks and months, and stop missing days from skewing the answer.",
    xp: 180,
    blocks: [
      {
        kind: "text",
        body: "The shop's 15 orders are too few to see anything happen over time, so this module uses a second database: two years of daily sales from a small chain of outdoor-gear stores, 2024 and 2025. It has a website, a store in Leeds, and a store in Harrogate that opened on 12 April 2025. There's one row per store per day it traded.",
      },
      { kind: "code", language: "text", caption: "The two tables", code: STORES_SCHEMA },
      {
        kind: "text",
        body: "SQLite has no date type. Dates are text in the form `YYYY-MM-DD`, and that form was chosen on purpose: because the year comes first and every part is zero-padded, sorting and comparing the text gives the same answer as comparing the dates. `'2025-06-09' < '2025-06-10'` is true. Stored as `'9/6/2025'`, neither sorting nor `<` would work.",
      },
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
      {
        kind: "text",
        body: "Notice the range: `>=` the first day and `<` the day after the last. That's called a half-open range, and it's worth the habit. `BETWEEN '2025-06-01' AND '2025-06-30'` works on plain dates, but if the column holds timestamps, `'2025-06-30 14:05'` sorts after `'2025-06-30'` and everything after midnight on the last day silently drops out.",
      },
      {
        kind: "text",
        body: "`date()` does arithmetic with modifiers. `date(day, '+1 day')` is tomorrow and `date(day, 'start of month')` the 1st. Weeks need two steps: `date(day, '-6 days', 'weekday 1')` goes back six days, then forward to the next Monday (staying put if it's already one), which lands on the Monday that starts the day's week. For the number of days between two dates, subtract their `julianday()` values: `julianday('2025-12-31') - julianday('2025-04-12')` is 263.0.",
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
      {
        kind: "text",
        body: "Each week has 7 days but only 6 rows, because Leeds is closed on Sundays and a closed day has **no row at all**. That matters the moment you average. `AVG(revenue)` over Leeds's 2025 rows is 1,009.68, which is its average *trading* day. Its average *calendar* day is 313,002 over 365 days, or 857.54. Both are real numbers; the mistake is reporting one when you meant the other. The website was also down from 10 to 12 June 2025, so June has 27 website rows, not 30.",
      },
      {
        kind: "text",
        body: "A missing row and a row that says 0 are different things. On 8 January 2025, Leeds opened through the snow and sold nothing, so that day has a row with 0 orders. `COUNT(*)` counts it; it doesn't count a Sunday.",
      },
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
      {
        kind: "callout",
        body: "Put the store filter in the `ON`, not in `WHERE`. On a day with no sales, every column from `daily_sales` is NULL, including `store_id`, so `WHERE s.store_id = 1` throws out exactly the days the calendar was there to keep. The query still runs, and the gaps quietly disappear again.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "Leeds took 7,072 in the week starting Monday 2 June 2025, and was closed on the Sunday. What does `AVG(revenue)` over that week's rows return?",
        options: [
          "1,010.29: 7,072 over the 7 days of the week",
          "NULL, because Sunday has no row",
          "An error, until Sunday is filled in",
          "1,178.67: 7,072 over the 6 rows that exist",
        ],
        answer: 3,
        explanation:
          "`AVG` divides by the rows it sees, and Sunday isn't one of them. For an average per calendar day, divide the total by 7, or join a calendar and count the closed day as 0.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "You LEFT JOIN a calendar of the 30 days of June 2025 to `daily_sales` and add `WHERE s.store_id = 1`. How many rows come back?",
        options: [
          "27: the WHERE removes the three outage days, whose store_id is NULL",
          "30, one for each day in the calendar",
          "82, one for each store's sales",
          "90, three stores times 30 days",
        ],
        answer: 0,
        explanation:
          "The calendar gives 30 days, but `WHERE` runs after the join, and the outage days have NULL in every `daily_sales` column. Moving `s.store_id = 1` into the `ON` keeps all 30. Without any store filter you'd get 82: 27 website rows, 25 for Leeds and 30 for Harrogate.",
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
          { name: "Returns day and revenue", expression: 'columns == ["day", "revenue"]' },
          { name: "One row for each of June's 30 days", expression: "len(rows) == 30" },
          {
            name: "The outage days show 0, not NULL",
            expression:
              'all(dict(rows).get(d, -1) == 0 for d in ("2025-06-10", "2025-06-11", "2025-06-12"))',
          },
          {
            name: "Only the website's sales: 37,381 in total",
            expression: "abs(sum(r[1] or 0 for r in rows) - 37381) < 0.01",
          },
          {
            name: "Every day from 1 to 30 June, in order",
            expression: '[r[0] for r in rows] == [f"2025-06-{d:02d}" for d in range(1, 31)]',
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
        body: '"Up 12% on last month" needs two numbers on the same row: this month and last. `LAG(x) OVER (ORDER BY ...)` fetches `x` from the previous row, without a self-join. `LEAD` fetches the next one. `LAG(x, 12)` reaches back 12 rows, and a third argument, as in `LAG(x, 1, 0)`, is what to use when there\'s no row that far back.',
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
      {
        kind: "text",
        body: "January 2024 has nothing before it, so its change is NULL, and NULL is the honest answer. Don't `COALESCE` it to 0: a 0 claims the month was flat, when in fact nobody knows. If the previous value can be 0, write `NULLIF(prev, 0)` in the denominator. SQLite returns NULL when you divide by zero, but PostgreSQL and most other databases stop with an error.",
      },
      {
        kind: "text",
        body: "Write `100.0 *`, not `100 *`, when the columns are whole numbers. `orders` is an INTEGER, and dividing one integer by another gives an integer, so every month-on-month change under 100%, up or down, comes out as 0.",
      },
      {
        kind: "text",
        body: "`PARTITION BY store_id` compares each store only with itself. Watch the first row of a new store, though. Harrogate opened on 12 April 2025, so its April has only 19 trading days, and its May is up 71.6% on April for no reason except that May is a whole month.",
      },
      {
        kind: "text",
        body: "`LAG` means *the previous row*, not *the previous period*. On Leeds's daily rows, Monday's previous row is Saturday, because Sunday has no row. Monthly totals here have every month, so `LAG(revenue, 12)` is the same month last year. Where a period might be missing, build a calendar first, as in the last lesson, and then `LAG` over that.",
      },
      {
        kind: "text",
        body: "Then there's the question of whether the comparison is fair. The chain took 921,587 in 2025, against 632,516 in 2024: up 45.7%. But 201,753 of 2025's revenue came from Harrogate, which didn't exist in 2024. Compare only the stores that traded in both years, the website and Leeds, and growth is 13.8%. That's called **like-for-like** growth, and it's the one that tells you whether the business is doing better, rather than just bigger.",
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
        options: ["3.6", "0.036", "0", "NULL"],
        answer: 2,
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
          "0, because nothing changed",
          "The month's own revenue, since it's all new",
          "Nothing: drop the first month from the report",
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
          "Revenue grew 45.7%",
          "Revenue grew 45.7% overall; the stores that traded in both years grew 13.8%",
          "Revenue grew 13.8%, because Harrogate's sales don't count",
          "Growth can't be measured, because Harrogate has no 2024",
        ],
        answer: 1,
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
          },
          {
            name: "The 12 months of 2025",
            expression: 'len(rows) == 12 and all(r[0].startswith("2025-") for r in rows)',
          },
          {
            name: "Every month has last year's figure",
            expression: "all(r[2] is not None for r in rows)",
          },
          {
            name: "Harrogate is left out: July is 79,832",
            expression: 'abs(dict((r[0], r[1]) for r in rows).get("2025-07", 0) - 79832) < 0.01',
          },
          {
            name: "July grew 18.6% on July 2024",
            expression: 'abs((dict((r[0], r[3]) for r in rows).get("2025-07") or 0) - 18.6) < 0.05',
          },
          {
            name: "In month order",
            expression: "[r[0] for r in rows] == sorted(r[0] for r in rows)",
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
        kind: "text",
        body: "A data check is a query that should return nothing. If it returns rows, those rows are the problem. There are five kinds worth running on any new table, and then one more that ties it to the rest of the data.",
      },
      {
        kind: "text",
        body: "**1. Allowed values.** Group by any column that should hold a short list of values, and read the list.",
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
      {
        kind: "text",
        body: "**2. Duplicates.** Decide what should be unique, then look for groups with more than one row. Here each payment has its own `id`, so group by everything else.",
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
      {
        kind: "text",
        body: "**3. Orphans.** A row that points at something that doesn't exist. The anti-join from SQL Foundations' joins lesson finds them: `LEFT JOIN` the table it should match, and keep the rows that found nothing.",
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
      {
        kind: "text",
        body: "**4. Missing values.** `COUNT(*)` counts rows and `COUNT(amount)` counts amounts, so the difference is how many are NULL. Here it's 17 against 16. That matters because `SUM` skips NULLs without a word: payment 16's missing amount just vanishes from the total.",
      },
      {
        kind: "text",
        body: "**5. Formats.** A date that isn't `YYYY-MM-DD` sorts and filters as the wrong date. `GLOB` matches a pattern of characters, so this finds any row that doesn't start with one:",
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
      {
        kind: "text",
        body: "**6. Reconciliation.** Compare the new data with something you already trust. The succeeded charges total 1,655. The paid orders total 1,653: 1,628 in items plus 25 in shipping. That's so close that it looks like rounding.",
      },
      {
        kind: "text",
        body: "It isn't. The 1,655 includes the duplicate (+154), the orphan (+49) and the charges on the two orders later refunded (+165). It's missing order 114, which has no payment (−324), and order 113's amount (−25). And order 112 was charged 17 less than its total. Those errors happen to cancel out to 2. A total that matches proves very little. Reconcile row by row, at the grain where things should match, which here is one row per order.",
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
          "Two of them are duplicates",
          "SQLite ignores rows with a NULL amount",
          "Two are spelled differently: 'Succeeded' and 'succeeded ' with a trailing space",
          "Two of them belong to orders that don't exist",
        ],
        answer: 2,
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
          "They're correct, apart from 2 lost to rounding",
          "Exactly one payment is wrong, by 2",
          "The shop was overpaid by 2",
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
          "One payment is a duplicate",
          "One payment has an amount of 0",
          "One payment's order doesn't exist",
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
          "For every **paid** order, compare its total (items plus shipping) with what its successful payments add up to. Return the orders where the two differ, as `order_id`, `order_total` and `collected`, in order of `order_id`. Show `collected` as 0 when nothing was collected. The starter runs, but it's wrong in several ways at once.",
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
          },
          {
            name: "Finds the four orders that don't reconcile: 106, 112, 113 and 114",
            expression: "sorted(r[0] for r in rows) == [106, 112, 113, 114]",
          },
          {
            name: "Doesn't flag 104 or 110, whose status is only spelled differently",
            expression: "not any(r[0] in (104, 110) for r in rows)",
          },
          {
            name: "Each order's total counts its items once: 106 is 154",
            expression: "dict((r[0], r[1]) for r in rows).get(106) == 154",
          },
          {
            name: "The duplicate shows up: 106 collected 308",
            expression: "dict((r[0], r[2]) for r in rows).get(106) == 308",
          },
          {
            name: "Order 114, with no payment, shows 0 collected",
            expression: "dict((r[0], r[2]) for r in rows).get(114) == 0",
          },
          {
            name: "In order of order_id",
            expression: "[r[0] for r in rows] == sorted(r[0] for r in rows)",
          },
        ],
      },
    ],
  },
};
