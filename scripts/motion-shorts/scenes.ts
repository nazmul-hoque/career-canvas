/**
 * Shorts 11–20: the same ten lessons as the screen recordings (1–10), told as
 * motion graphics with a narrator. Every snippet, output and number here comes
 * from the lesson or its dataset; tests/… don't check this file, so when a
 * lesson changes, re-check the figures quoted below against it.
 */
import type { Beat, Short } from "./kit";

const end = (lesson: string): Beat => ({
  chip: "Ascent",
  theme: "dark",
  caption: "Free lessons. Real code. Real data.",
  say: "Try this lesson free, at ascent dot withcloud dot io.",
  body: (k) =>
    `<div class="end" style="display:flex;flex-direction:column;animation:${k.anim("pop", 0, 0.6)}">
      <img src="LOGO" alt=""><div class="name">Ascent</div>
      <div class="try">Try this lesson free</div>
      <div class="url">ascent.withcloud.io</div>
      <div class="lesson">${lesson}</div></div>`,
});

const CART_BUG = [
  "function cartTotal(items) {",
  "  return items.reduce((sum, item) => {",
  "    sum + item.price * item.quantity;",
  "  }, 0);",
  "}",
];
const CART_FIX = [
  "function cartTotal(items) {",
  "  return items.reduce(",
  "    (sum, item) =>",
  "      sum + item.price * item.quantity,",
  "    0,",
  "  );",
  "}",
];
const CART_TESTS = [
  "Totals a two-line cart correctly",
  "An empty cart totals 0",
  "A single item is price × quantity",
];

const HAPPY_BUG = [
  "SELECT c.name",
  "FROM customers AS c",
  "JOIN orders AS o ON o.customer_id = c.id",
  "WHERE o.status = 'paid'",
  "  AND o.status <> 'refunded'",
  "ORDER BY c.name;",
];
const HAPPY_FIX = [
  "SELECT c.name FROM customers AS c",
  "WHERE EXISTS (",
  "  SELECT 1 FROM orders AS o",
  "  WHERE o.customer_id = c.id",
  "    AND o.status = 'paid')",
  "AND NOT EXISTS (",
  "  SELECT 1 FROM orders AS o",
  "  WHERE o.customer_id = c.id",
  "    AND o.status = 'refunded')",
  "ORDER BY c.name;",
];

const SPENT_BUG = [
  "SELECT c.name, COUNT(*) AS orders,",
  "  SUM(i.quantity * i.unit_price)",
  "    + SUM(o.shipping) AS total_spent",
  "FROM orders AS o",
  "JOIN order_items AS i",
  "  ON i.order_id = o.id",
  "...",
];
const SPENT_FIX = [
  "WITH order_totals AS (",
  "  SELECT order_id,",
  "    SUM(quantity * unit_price) AS items",
  "  FROM order_items GROUP BY order_id",
  ")",
  "SELECT c.name, COUNT(*) AS orders,",
  "  SUM(t.items + o.shipping) AS total_spent",
  "FROM orders AS o",
  "JOIN order_totals AS t ON t.order_id = o.id",
  "...",
];

export const SHORTS: Short[] = [
  {
    n: 11,
    slug: "cart-undefined",
    lesson: { course: "javascript", id: "js-debug.fixit", title: "Debug the cart total" },
    beats: [
      {
        chip: "Spot the bug",
        theme: "dark",
        caption: "This cart total is broken",
        say: "This cart total should come to forty-four forty-eight. Instead, it returns undefined.",
        body: (k) =>
          k.code(CART_BUG, { label: "cart.js" }) +
          k.output([{ text: "undefined", kind: "big", at: 2.2 }], { at: 1.6 }),
      },
      {
        chip: "Spot the bug",
        theme: "dark",
        caption: "Pause. Can you see it?",
        say: "Pause, and find it. One word is missing.",
        body: (k) =>
          k.code(CART_BUG, { at: -1, label: "cart.js" }) + k.badge("⏸  Pause and look", 0.3),
      },
      {
        chip: "Why it breaks",
        theme: "light",
        caption: "Braces mean no automatic return",
        say: "Curly braces after the arrow start a function body, and a body returns nothing unless you write return. So after the first item, sum is undefined.",
        body: (k) =>
          k.code(CART_BUG, {
            at: -1,
            label: "cart.js",
            marks: [
              { line: 1, at: 0.6, kind: "bad" },
              { line: 2, at: 0.9, kind: "bad" },
              { line: 3, at: 1.2, kind: "bad" },
            ],
          }) +
          k.output(
            [
              { text: "sum = 0", kind: "log", at: 4.6 },
              { text: "sum = undefined", kind: "fail", at: 5.6 },
              { text: "sum = undefined", kind: "fail", at: 6.2 },
            ],
            { at: 4.2, label: "console.log(sum)" },
          ),
      },
      {
        chip: "The fix",
        theme: "light",
        caption: "Drop the braces",
        say: "Drop the braces, and the sum comes back on every call. All three tests pass.",
        body: (k) =>
          k.code(CART_FIX, { label: "cart.js", typeAt: 0.3, cps: 34 }) +
          k.output(
            CART_TESTS.map((text, i) => ({ text, kind: "pass" as const, at: 3.4 + i * 0.35 })),
            { at: 3.1, label: "Tests" },
          ),
      },
      {
        chip: "Part 2?",
        theme: "dark",
        caption: "…but look at that total 👀",
        say: "But look at the total it prints. That's a story for part two.",
        body: (k) =>
          k.output([{ text: "44.480000000000004", kind: "big", at: 0.4 }], { label: "Output" }),
      },
      end("JavaScript From Zero · Debug the cart total"),
    ],
  },

  {
    n: 12,
    slug: "happy-customers",
    lesson: {
      course: "sql",
      id: "sql-core.subqueries",
      title: "Subqueries: IN, EXISTS, or a join?",
    },
    beats: [
      {
        chip: "Spot the bug",
        theme: "dark",
        caption: "Customers with NO refunds…?",
        say: "We wanted every customer who never had a refund. Maja had one. She's on the list three times.",
        body: (k) =>
          k.table(
            ["name"],
            [
              ["Aisha Khan"],
              ["Emma Novak"],
              ["Liam Walsh"],
              ["Lucas Silva"],
              ["Maja Berg"],
              ["Maja Berg"],
              ["Maja Berg"],
              ["Noah Keller"],
              ["Noah Keller"],
              ["Sofia Rossi"],
              ["Sofia Rossi"],
            ],
            {
              stagger: 0.06,
              marks: [4, 5, 6].map((row) => ({ row, at: 3.6, kind: "bad" as const })),
            },
          ),
      },
      {
        chip: "Spot the bug",
        theme: "dark",
        caption: "Here's the query. Pause.",
        say: "Here's the query. Pause, and find the problem.",
        body: (k) => k.code(HAPPY_BUG, { label: "query.sql" }) + k.badge("⏸  Pause and look", 1.2),
      },
      {
        chip: "Why it breaks",
        theme: "light",
        caption: "WHERE checks one row at a time",
        say: "WHERE looks at one order at a time. A paid order is never also refunded, so that second check does nothing. Maja's refund only removes its own row.",
        body: (k) =>
          k.code(HAPPY_BUG, {
            at: -1,
            label: "query.sql",
            marks: [{ line: 4, at: 0.5, kind: "bad" }],
          }) +
          k.table(
            ["order", "customer", "status"],
            [
              ["101", "Maja Berg", "paid"],
              ["103", "Maja Berg", "refunded"],
              ["108", "Maja Berg", "paid"],
              ["114", "Maja Berg", "paid"],
            ],
            {
              at: 2.4,
              marks: [
                { row: 1, at: 6.6, kind: "dim" },
                { row: 0, at: 7.4, kind: "bad" },
                { row: 2, at: 7.4, kind: "bad" },
                { row: 3, at: 7.4, kind: "bad" },
              ],
            },
          ),
      },
      {
        chip: "The fix",
        theme: "light",
        caption: "Ask about the customer",
        say: "Ask about the customer instead: they have a paid order, and no refunded one.",
        body: (k) => k.code(HAPPY_FIX, { label: "query.sql", typeAt: 0.3, cps: 60, size: 28 }),
      },
      {
        chip: "Fixed",
        theme: "dark",
        caption: "5 names. No repeats.",
        say: "Five names, each one once, and nobody who had a refund.",
        body: (k) =>
          k.table(
            ["name"],
            [["Emma Novak"], ["Liam Walsh"], ["Lucas Silva"], ["Noah Keller"], ["Sofia Rossi"]],
            {
              marks: [0, 1, 2, 3, 4].map((row) => ({
                row,
                at: 1.6 + row * 0.1,
                kind: "good" as const,
              })),
            },
          ),
      },
      end("SQL Foundations · Subqueries: IN, EXISTS, or a join?"),
    ],
  },

  {
    n: 13,
    slug: "seven-orders",
    lesson: {
      course: "sql-analysis",
      id: "sql-analysis.ctes",
      title: "CTEs and numbers you can trust",
    },
    beats: [
      {
        chip: "Spot the bug",
        theme: "dark",
        caption: "She placed 3 orders. Not 7.",
        say: "This report says Maja placed seven orders. She placed three.",
        body: (k) =>
          k.table(["name", "orders", "total_spent"], [["Maja Berg", 7, 567]], {
            marks: [{ row: 0, at: 1.4, kind: "bad" }],
          }) + k.stat("7", { at: 1.2, label: "orders", tone: "bad", swap: { to: "3", at: 2.6 } }),
      },
      {
        chip: "Spot the bug",
        theme: "dark",
        caption: "Where do 4 extra come from?",
        say: "Pause. Where do the four extra orders come from?",
        body: (k) => k.code(SPENT_BUG, { label: "report.sql" }) + k.badge("⏸  Pause and look", 1),
      },
      {
        chip: "Why it breaks",
        theme: "light",
        caption: "One row per item, not per order",
        say: "Joining the items gives one row per item, not per order. Order one-oh-one has two items, so it's counted twice, and its five dollar shipping is charged twice.",
        body: (k) =>
          k.table(
            ["order", "item", "shipping"],
            [
              ["101", "Trail Runner Shoes", "5"],
              ["101", "Wool Socks", "5"],
            ],
            {
              label: "orders JOIN order_items",
              marks: [
                { row: 0, at: 5.4, kind: "bad" },
                { row: 1, at: 5.4, kind: "bad" },
              ],
            },
          ) +
          k.stat("$35", {
            at: 7.6,
            label: "shipping on paid orders",
            tone: "bad",
            swap: { to: "$25", at: 8.8 },
          }),
      },
      {
        chip: "The fix",
        theme: "light",
        caption: "Total each order first",
        say: "Total the items for each order first, then join one row per order.",
        body: (k) => k.code(SPENT_FIX, { label: "report.sql", typeAt: 0.3, cps: 70, size: 27 }),
      },
      {
        chip: "Fixed",
        theme: "dark",
        caption: "3 orders · $557",
        say: "Three orders, five hundred and fifty-seven dollars. Join first and count later, and the numbers lie.",
        body: (k) =>
          k.table(["name", "orders", "total_spent"], [["Maja Berg", 3, 557]], {
            marks: [{ row: 0, at: 1.2, kind: "good" }],
          }) + k.stat("3", { at: 0.8, label: "orders", tone: "good" }),
      },
      end("SQL for Analysis · CTEs and numbers you can trust"),
    ],
  },

  {
    n: 14,
    slug: "python-basket",
    lesson: { course: "python", id: "py-functions.define", title: "Designing reliable functions" },
    beats: [
      {
        chip: "Python quiz",
        theme: "dark",
        caption: "Call it twice. What comes back?",
        say: "Two calls, two different items. What does the second call return?",
        body: (k) =>
          k.code(
            [
              "def add(item, basket=[]):",
              "    basket.append(item)",
              "    return basket",
              "",
              "add(\"tent\")    # ['tent']",
              'add("stove")   # ?',
            ],
            { label: "basket.py" },
          ),
      },
      {
        chip: "Python quiz",
        theme: "light",
        caption: "Pick one",
        say: "Pause, and pick one.",
        body: (k) =>
          k.options(["['stove']", "['tent', 'stove']", "['stove', 'tent']", "An error"], [], {
            question: 'The second call, add("stove"), returns…',
          }),
      },
      {
        chip: "Python quiz",
        theme: "light",
        caption: "A? Here's why not",
        say: "Most people say just stove. Here's what Ascent tells you when you do.",
        body: (k) =>
          k.options(
            ["['stove']", "['tent', 'stove']", "['stove', 'tent']", "An error"],
            [
              {
                option: 0,
                at: 0.6,
                right: false,
                note: "That would need a fresh list on every call. The default list is made once, when the function is defined, and reused.",
              },
            ],
            { at: -1, question: 'The second call, add("stove"), returns…' },
          ),
      },
      {
        chip: "The answer",
        theme: "light",
        caption: "Tent AND stove",
        say: "It's tent, and stove. The default list is made once, when Python reads the def, and every call shares it.",
        body: (k) =>
          k.options(
            ["['stove']", "['tent', 'stove']", "['stove', 'tent']", "An error"],
            [
              {
                option: 0,
                at: -5,
                right: false,
                note: "That would need a fresh list on every call. The default list is made once, when the function is defined, and reused.",
              },
              {
                option: 1,
                at: 0.4,
                right: true,
                note: "Both calls share the single default list that was created when the function was defined.",
              },
            ],
            { at: -1, question: 'The second call, add("stove"), returns…' },
          ),
      },
      {
        chip: "The fix",
        theme: "light",
        caption: "Default to None",
        say: "Default to None, and make a fresh list inside the function.",
        body: (k) =>
          k.code(
            [
              "def add(item, basket=None):",
              "    if basket is None:",
              "        basket = []",
              "    basket.append(item)",
              "    return basket",
            ],
            { label: "basket.py", typeAt: 0.3, cps: 30 },
          ),
      },
      end("Python Essentials · Designing reliable functions"),
    ],
  },

  {
    n: 15,
    slug: "js-sort",
    lesson: { course: "javascript", id: "js-data.arrays", title: "Arrays and iteration" },
    beats: [
      {
        chip: "JavaScript quiz",
        theme: "dark",
        caption: "What does this return?",
        say: "Ten, nine, one, sorted. What does JavaScript give you?",
        body: (k) =>
          k.code(["[10, 9, 1].sort()"], { label: "console" }) +
          k.options(["[1, 9, 10]", "[10, 9, 1]", "[1, 10, 9]", "[9, 10, 1]"], [], { at: 1.6 }),
      },
      {
        chip: "JavaScript quiz",
        theme: "dark",
        caption: "Most people pick A",
        say: "Most people pick A. Here's what Ascent tells you when you do.",
        body: (k) =>
          k.code(["[10, 9, 1].sort()"], { at: -1, label: "console" }) +
          k.options(
            ["[1, 9, 10]", "[10, 9, 1]", "[1, 10, 9]", "[9, 10, 1]"],
            [
              {
                option: 0,
                at: 0.8,
                right: false,
                note: "That's numeric order, which sort only gives you with a comparison function like (a, b) => a - b. Without one, it compares the items as text.",
              },
            ],
            { at: -1 },
          ),
      },
      {
        chip: "The answer",
        theme: "light",
        caption: "Sorted as text",
        say: "It's one, ten, nine. Without a comparison function, sort compares text, and ten starts with a one.",
        body: (k) =>
          k.code(["[10, 9, 1].sort()", "// → [1, 10, 9]"], { label: "console" }) +
          k.chips([{ text: '"1"' }, { text: '"10"', tone: "bad" }, { text: '"9"' }], 2.6) +
          k.text("“10” starts with a “1”, and “1” comes before “9”", 4.4),
      },
      {
        chip: "The fix",
        theme: "light",
        caption: "Pass a compare function",
        say: "Pass a minus b, and the numbers come out in order.",
        body: (k) =>
          k.code(["[10, 9, 1].sort((a, b) => a - b)", "// → [1, 9, 10]"], {
            label: "console",
            typeAt: 0.3,
            cps: 26,
          }) +
          k.chips(
            [
              { text: "1", tone: "good" },
              { text: "9", tone: "good" },
              { text: "10", tone: "good" },
            ],
            2.4,
          ),
      },
      end("JavaScript From Zero · Arrays and iteration"),
    ],
  },

  {
    n: 16,
    slug: "fetch-404",
    lesson: { course: "javascript", id: "js-async.fetch", title: "Fetch and JSON" },
    beats: [
      {
        chip: "JavaScript quiz",
        theme: "dark",
        caption: "Does your catch run?",
        say: "The server answers four oh four, not found. Does your catch block run?",
        body: (k) =>
          k.code(
            [
              "try {",
              '  const res = await fetch("/api/orders/999");',
              "  show(await res.json());",
              "} catch (err) {",
              "  showError(err);",
              "}",
            ],
            { label: "orders.js", size: 28 },
          ) + k.badge("404 Not Found", 1.6, "red"),
      },
      {
        chip: "JavaScript quiz",
        theme: "dark",
        caption: "Pick one",
        say: "Pick one.",
        body: (k) =>
          k.options(
            [
              "The promise rejects, so catch runs",
              "fetch returns null",
              "It resolves, with ok set to false",
              "The browser retries until it gets a 200",
            ],
            [],
            { question: "fetch gets a 404. What happens?" },
          ),
      },
      {
        chip: "JavaScript quiz",
        theme: "dark",
        caption: "A 404 is still a response",
        say: "If you said catch, so did most of us. But fetch only rejects when no response arrives at all.",
        body: (k) =>
          k.options(
            [
              "The promise rejects, so catch runs",
              "fetch returns null",
              "It resolves, with ok set to false",
              "The browser retries until it gets a 200",
            ],
            [
              {
                option: 0,
                at: 0.4,
                right: false,
                note: "fetch rejects only when no response arrives at all. A 404 is a response from the server.",
              },
            ],
            { at: -1, question: "fetch gets a 404. What happens?" },
          ),
      },
      {
        chip: "The fix",
        theme: "light",
        caption: "Check response.ok yourself",
        say: "A four oh four is an answer. The promise resolves, so check ok yourself, and throw.",
        body: (k) =>
          k.code(
            [
              'const res = await fetch("/api/orders/999");',
              "if (!res.ok) {",
              '  throw new Error("HTTP " + res.status);',
              "}",
              "show(await res.json());",
            ],
            { label: "orders.js", typeAt: 0.3, cps: 40, size: 28, marks: [] },
          ),
      },
      end("JavaScript From Zero · Fetch and JSON"),
    ],
  },

  {
    n: 17,
    slug: "count-else",
    lesson: {
      course: "sql-analysis",
      id: "sql-analysis.conditional",
      title: "Conditional aggregation",
    },
    beats: [
      {
        chip: "SQL quiz",
        theme: "dark",
        caption: "15 orders. 11 paid.",
        say: "Fifteen orders, eleven of them paid. What does this count?",
        body: (k) =>
          k.row(
            k.stat("15", { label: "orders" }),
            k.stat("11", { at: 0.6, label: "paid", tone: "good" }),
          ) +
          k.code(
            [
              "SELECT COUNT(",
              "  CASE WHEN status = 'paid'",
              "  THEN 1 ELSE 0 END",
              ") FROM orders;",
            ],
            { at: 2, label: "query.sql" },
          ),
      },
      {
        chip: "SQL quiz",
        theme: "dark",
        caption: "11? Not quite.",
        say: "Eleven feels right. It isn't.",
        body: (k) =>
          k.options(
            ["15", "11", "4", "1"],
            [
              {
                option: 1,
                at: 0.8,
                right: false,
                note: "That's what you'd get without the ELSE 0. With it, every other order gets a 0 instead of NULL, and COUNT counts any value that isn't NULL.",
              },
            ],
            { question: "COUNT(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)" },
          ),
      },
      {
        chip: "The answer",
        theme: "light",
        caption: "COUNT counts anything not NULL",
        say: "It's fifteen. COUNT doesn't care whether a value is one or zero, only that it isn't NULL. ELSE zero hands it fifteen values.",
        body: (k) =>
          k.chips(
            [
              ...Array(11).fill({ text: "1", tone: "good" }),
              ...Array(4).fill({ text: "0", tone: "bad" }),
            ],
            1.2,
          ) + k.stat("15", { at: 6.4, label: "counted", tone: "bad" }),
      },
      {
        chip: "The fix",
        theme: "light",
        caption: "Drop the ELSE, or use SUM",
        say: "Drop the else, or use SUM. Eleven.",
        body: (k) =>
          k.code(
            ["SELECT COUNT(", "  CASE WHEN status = 'paid'", "  THEN 1 END", ") FROM orders;"],
            { label: "query.sql", typeAt: 0.2, cps: 40 },
          ) + k.stat("11", { at: 2.4, label: "paid", tone: "good" }),
      },
      end("SQL for Analysis · Conditional aggregation"),
    ],
  },

  {
    n: 18,
    slug: "git-wrong-branch",
    lesson: {
      course: "git",
      id: "git-rescue.wrong-branch",
      title: "Wrong branch and detached HEAD",
    },
    beats: [
      {
        chip: "Git rescue",
        theme: "dark",
        caption: "Committed to main by mistake",
        say: "You just committed to main. It belonged on a feature branch.",
        body: (k) =>
          k.terminal([
            {
              cmd: "git log --oneline",
              out: [
                "0e711ca (HEAD -> main) Add discount field",
                "8dcabb5 (origin/main) Add cart page",
              ],
              at: 0.3,
              mark: [0],
            },
          ]) +
          k.graph(
            [
              { hash: "0e711ca", msg: "Add discount field" },
              { hash: "8dcabb5", msg: "Add cart page" },
            ],
            [
              { text: "main", row: 0, col: 0, tone: "head" },
              { text: "origin/main", row: 1, col: 1, tone: "remote" },
            ],
            { at: 2.2 },
          ),
      },
      {
        chip: "Git rescue",
        theme: "dark",
        caption: "Not pushed yet = fixable",
        say: "It isn't pushed yet, so this takes three commands.",
        body: (k) =>
          k.terminal([
            {
              cmd: "git status",
              out: ["On branch main", "Your branch is ahead of 'origin/main'", "by 1 commit."],
              at: 0.2,
              mark: [1, 2],
            },
          ]),
      },
      {
        chip: "Step 1",
        theme: "light",
        caption: "Make the branch right here",
        say: "One. Make the branch right here. It already has your commit.",
        body: (k) =>
          k.terminal([
            {
              cmd: "git switch -c feature/discount",
              out: ["Switched to a new branch 'feature/discount'"],
              at: 0.3,
            },
          ]) +
          k.graph(
            [
              { hash: "0e711ca", msg: "Add discount field" },
              { hash: "8dcabb5", msg: "Add cart page" },
            ],
            [
              { text: "main", row: 0, col: 0, tone: "head" },
              { text: "feature/discount", row: 0, col: 1, tone: "branch", at: 2.4 },
              { text: "origin/main", row: 1, col: 1, tone: "remote" },
            ],
            { at: -1 },
          ),
      },
      {
        chip: "Step 2",
        theme: "light",
        caption: "Back to main",
        say: "Two. Switch back to main.",
        body: (k) =>
          k.terminal([{ cmd: "git switch main", out: ["Switched to branch 'main'"], at: 0.3 }]),
      },
      {
        chip: "Step 3",
        theme: "light",
        caption: "Put main back where GitHub has it",
        say: "Three. Reset main to where GitHub has it.",
        body: (k) =>
          k.terminal([
            {
              cmd: "git reset --hard origin/main",
              out: ["HEAD is now at 8dcabb5 Add cart page"],
              at: 0.3,
            },
          ]) +
          k.graph(
            [
              { hash: "0e711ca", msg: "Add discount field" },
              { hash: "8dcabb5", msg: "Add cart page" },
            ],
            [
              { text: "main", row: 0, col: 0, tone: "head", moveTo: { row: 1, at: 2.4 } },
              { text: "feature/discount", row: 0, col: 1, tone: "branch" },
              { text: "origin/main", row: 1, col: 1, tone: "remote" },
            ],
            { at: -1 },
          ),
      },
      {
        chip: "Fixed",
        theme: "dark",
        caption: "Nothing lost ✓",
        say: "Your commit is safe on its branch, and main is clean. Practise it in a sandbox where you can't break anything.",
        body: (k) =>
          k.terminal([
            {
              cmd: "git log --oneline --all",
              out: [
                "0e711ca (feature/discount) Add discount field",
                "8dcabb5 (HEAD -> main, origin/main) Add cart page",
              ],
              at: 0.3,
              mark: [0, 1],
            },
          ]),
      },
      end("Git & GitHub · Wrong branch and detached HEAD"),
    ],
  },

  {
    n: 19,
    slug: "git-reflog",
    lesson: { course: "git", id: "git-rescue.reflog", title: "Recover lost commits with reflog" },
    beats: [
      {
        chip: "Git rescue",
        theme: "dark",
        caption: "Reset. Deleted. Gone?",
        say: "I reset away a commit, then deleted a branch. Are they both gone?",
        body: (k) =>
          k.terminal([
            { cmd: "git reset --hard HEAD~1", out: [], at: 0.2 },
            { cmd: "git branch -D feature/wishlist", out: [], at: 1.6 },
            { cmd: "git log --oneline", out: ["8dcabb5 (HEAD -> main) Add cart page"], at: 3.4 },
          ]),
      },
      {
        chip: "git reflog",
        theme: "dark",
        caption: "Git keeps a diary",
        say: "Git almost never forgets. The reflog lists everywhere HEAD has been, and both commits are still there.",
        body: (k) =>
          k.terminal([
            {
              cmd: "git reflog",
              out: [
                "8dcabb5 HEAD@{0}: checkout: moving to main",
                "09aacff HEAD@{1}: commit: Add wishlist button",
                "8dcabb5 HEAD@{2}: checkout: moving to wishlist",
                "8dcabb5 HEAD@{3}: reset: moving to HEAD~1",
                "4638a30 HEAD@{4}: commit: Add coupon validation",
                "8dcabb5 HEAD@{5}: commit (initial): Add cart page",
              ],
              at: 0.2,
              mark: [1, 4],
            },
          ]),
      },
      {
        chip: "Step 1",
        theme: "light",
        caption: "Put the branch back",
        say: "Put the branch back on the wishlist commit.",
        body: (k) =>
          k.terminal([{ cmd: "git branch feature/wishlist HEAD@{1}", out: [], at: 0.3 }]),
      },
      {
        chip: "Step 2",
        theme: "light",
        caption: "Move main back before the reset",
        say: "Then move main back, to the commit from before the reset.",
        body: (k) =>
          k.terminal([
            {
              cmd: "git reset --hard HEAD@{4}",
              out: ["HEAD is now at 4638a30 Add coupon validation"],
              at: 0.3,
            },
          ]),
      },
      {
        chip: "Recovered",
        theme: "dark",
        caption: "Both back ✓",
        say: "Both back. Learn this one before you need it.",
        body: (k) =>
          k.graph(
            [
              { hash: "09aacff", msg: "Add wishlist button", at: 0.3 },
              { hash: "4638a30", msg: "Add coupon validation", at: 0.6 },
              { hash: "8dcabb5", msg: "Add cart page" },
            ],
            [
              { text: "feature/wishlist", row: 0, col: 0, tone: "branch", at: 0.9 },
              { text: "main", row: 1, col: 0, tone: "head", at: 1.2 },
              { text: "origin/main", row: 2, col: 0, tone: "remote" },
            ],
          ),
      },
      end("Git & GitHub · Recover lost commits with reflog"),
    ],
  },

  {
    n: 20,
    slug: "payments-reconcile",
    lesson: {
      course: "sql-analysis",
      id: "sql-quality.checks",
      title: "Checking the data before you trust it",
    },
    beats: [
      {
        chip: "Real data",
        theme: "dark",
        caption: "The bank says one thing…",
        say: "Our card provider's export doesn't match our orders. Let's find out why, in one query.",
        body: (k) =>
          k.row(
            k.stat("15", { label: "orders" }),
            k.stat("17", { at: 0.8, label: "payments", tone: "bad" }),
          ),
      },
      {
        chip: "Trap 1",
        theme: "dark",
        caption: "“succeeded”, spelled 3 ways",
        say: "First trap: succeeded is written three different ways, with a capital S, and with a trailing space. An exact match misses two of them.",
        body: (k) =>
          k.table(
            ["status", "n"],
            [
              ["[succeeded]", 12],
              ["[Succeeded]", 1],
              ["[succeeded ]", 1],
              ["[refunded]", 2],
              ["[failed]", 1],
            ],
            {
              label: "payments",
              marks: [
                { row: 1, at: 3.4, kind: "bad" },
                { row: 2, at: 4.4, kind: "bad" },
              ],
            },
          ),
      },
      {
        chip: "Trap 2",
        theme: "dark",
        caption: "The join doubles the money",
        say: "Second trap: joining items and payments together doubles the money. Order one-oh-one looks paid twice. It wasn't.",
        body: (k) =>
          k.table(["order_id", "order_total", "collected"], [[101, 173, 346]], {
            marks: [{ row: 0, at: 2.6, kind: "bad" }],
          }) +
          k.stat("$346", {
            at: 3.2,
            label: "collected for order 101",
            tone: "bad",
            swap: { to: "$173", at: 5.6 },
          }),
      },
      {
        chip: "The fix",
        theme: "light",
        caption: "Total each side. Clean the status.",
        say: "Total each side on its own, clean up the status, and keep the orders with no payment at all.",
        body: (k) =>
          k.code(
            [
              "collected AS (",
              "  SELECT order_id, SUM(amount) AS collected",
              "  FROM payments",
              "  WHERE LOWER(TRIM(status)) = 'succeeded'",
              "  GROUP BY order_id",
              ")",
              "SELECT ... FROM order_totals AS t",
              "LEFT JOIN collected AS c ON ...",
            ],
            {
              label: "reconcile.sql",
              typeAt: 0.3,
              cps: 55,
              size: 27,
              marks: [
                { line: 3, at: 4.6, kind: "good" },
                { line: 7, at: 5.4, kind: "good" },
              ],
            },
          ),
      },
      {
        chip: "Found",
        theme: "dark",
        caption: "4 real problems",
        say: "Four real problems. One customer charged twice, one seventeen dollars short, and two with nothing collected.",
        body: (k) =>
          k.table(
            ["order", "total", "collected", ""],
            [
              [106, 154, 308, "charged twice"],
              [112, 197, 180, "$17 short"],
              [113, 25, 0, "nothing"],
              [114, 324, 0, "nothing"],
            ],
            {
              stagger: 0.5,
              marks: [0, 1, 2, 3].map((row) => ({
                row,
                at: 1.2 + row * 1.1,
                kind: "bad" as const,
              })),
            },
          ),
      },
      end("SQL for Analysis · Checking the data before you trust it"),
    ],
  },
];
