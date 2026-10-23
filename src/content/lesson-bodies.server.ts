import { findLesson } from "./curriculum";
import { claudeLessonBodies } from "./claude-lessons.server";
import { chatgptLessonBodies } from "./chatgpt-lessons.server";
import { figmaLessonBodies } from "./figma-lessons.server";
import { gitLessonBodies } from "./git-lessons.server";
import { genaiLessonBodies } from "./genai-lessons.server";
import { htmlCssLessonBodies } from "./html-css-lessons.server";
import { javascriptLessonBodies } from "./javascript-lessons.server";
import { nodeLessonBodies } from "./node-lessons.server";
import { productLessonBodies } from "./product-lessons.server";
import { pythonLessonBodies } from "./python-lessons.server";
import { reactLessonBodies } from "./react-lessons.server";
import { sqlLessonBodies } from "./sql-lessons.server";
import { typescriptLessonBodies } from "./typescript-lessons.server";
import { uxDesignLessonBodies } from "./ux-design-lessons.server";
import type { LessonBody } from "./lessons";

/**
 * The lessons that have not yet been moved into a per-course module. New
 * lessons belong in `<course>-lessons.server.ts`, not here — this file is the
 * merge point plus the remaining backlog, and shrinks as courses are extracted.
 */
const coreLessonBodies: Record<string, LessonBody> = {
  "js-basics.functions": {
    summary: "Functions package a job so you can run it whenever you need it.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: 'A function is a named recipe. You hand it ingredients (arguments), it does its work, and it hands something back (the return value). If a function does not return anything, calling it gives you `undefined`, one of the most common sources of the dreaded "why is my value empty?" bug.',
      },
      {
        kind: "code",
        language: "javascript",
        caption: "A function with an explicit return",
        code: `function total(price, quantity) {
  return price * quantity;
}

console.log(total(12, 3)); // 36`,
      },
      {
        kind: "text",
        body: '**Arrow functions** are a shorter way to write the same thing, and you\'ll see them everywhere: `const total = (price, quantity) => price * quantity;`. With a single expression after the arrow and no braces, its value is returned automatically. Add braces and you need `return` again. **Default parameters** fill in a missing argument: `function greet(name = "there")`.',
      },
      {
        kind: "callout",
        body: "Rule of thumb: if you ever write `const x = someFunction()` and `x` is undefined, check whether the function actually returns.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "What does `total(4, 5)` evaluate to if the function body is `price * quantity` with no `return`?",
        options: [
          "undefined",
          {
            text: "20",
            whyNot:
              "The multiplication does produce 20, but without `return` the function hands nothing back, so the call doesn't have that value.",
          },
          {
            text: "NaN",
            whyNot:
              "NaN comes from maths that can't be done. 4 times 5 works fine; the result just never leaves the function.",
          },
          {
            text: "It throws an error",
            whyNot:
              "Leaving out `return` isn't an error. The function runs to the end quietly, and the caller gets nothing back.",
          },
        ],
        answer: 0,
        explanation:
          "The multiplication happens, but nothing is handed back, so the call evaluates to undefined.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the arrow function so it hands back the doubled value.",
        before: "const double = (n) => ",
        after: ";",
        answer: "n * 2",
        explanation: "An arrow function with a single expression body returns that expression.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "`const add = (a, b) => { a + b; };` What does `add(2, 3)` return?",
        options: [
          {
            text: "5",
            whyNot:
              "`a + b` is worked out, but inside braces it's just a statement. Without `return`, the result is thrown away.",
          },
          "undefined",
          {
            text: '"23"',
            whyNot:
              "That would need one of them to be a string. 2 and 3 are numbers, so `+` adds; the question is whether the result leaves the function.",
          },
          {
            text: "An error",
            whyNot:
              "The code is valid: braces after `=>` start an ordinary function body. It just never returns anything.",
          },
        ],
        answer: 1,
        explanation:
          "The braces make it a block body, and a block needs an explicit `return`. Write `(a, b) => a + b` or `{ return a + b; }`.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Write a discount helper",
        prompt:
          "Write a function `applyDiscount(price, percent)` that returns the price after the discount. `applyDiscount(200, 25)` should return 150. When no percent is given, apply the standard 10%.",
        language: "javascript",
        starter: `function applyDiscount(price, percent) {
  // your code here
}

console.log(applyDiscount(200, 25));`,
        hint: "A 25% discount means you keep 75%: multiply by (100 - percent) / 100. A default parameter looks like `percent = 10`.",
        solution: `function applyDiscount(price, percent = 10) {
  return (price * (100 - percent)) / 100;
}`,
        tests: [
          { name: "applyDiscount(200, 25) === 150", expression: "applyDiscount(200, 25) === 150" },
          { name: "applyDiscount(80, 0) === 80", expression: "applyDiscount(80, 0) === 80" },
          { name: "applyDiscount(50, 100) === 0", expression: "applyDiscount(50, 100) === 0" },
          { name: "No percent means the standard 10%", expression: "applyDiscount(100) === 90" },
        ],
      },
    ],
  },
  "js-basics.conditionals": {
    summary:
      "Branch with if and the ternary, exit early with guard clauses, and choose ?? over || when 0 is a real value.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: '`if` / `else if` / `else` choose what runs, checking from the top and taking the first branch that\'s true. For choosing between two *values*, the ternary is tidier: `const label = inStock ? "In stock" : "Sold out";`.',
      },
      {
        kind: "text",
        body: "**Guard clauses** handle the odd cases first and leave the function early, so the main logic isn't buried three `if`s deep. Deal with bad input and exit, then write the normal path as if nothing can go wrong, because by then nothing can.",
      },
      {
        kind: "code",
        language: "javascript",
        code: `function shippingLabel(order) {
  if (!order) return "No order";                 // guard
  if (order.items.length === 0) return "Empty";  // guard

  return order.express ? "Express" : "Standard"; // the real work
}`,
      },
      {
        kind: "text",
        body: '`&&` and `||` return one of their operands, not just `true`/`false`, so they\'re often used for defaults: `const name = input || "Guest";`. But `||` falls through on **any** falsy value, including `0` and `""`. When 0 is a legitimate value (a quantity, a price, a volume), use `??`, which only falls through on `null` or `undefined`: `const qty = input ?? 1;`.',
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A customer sets a quantity of 0 to remove an item. The code says `const qty = input || 1;`. What's `qty`?",
        options: [
          {
            text: "0",
            whyNot:
              "That's what `??` would keep. `||` falls through on any falsy value, and 0 is falsy.",
          },
          {
            text: "undefined",
            whyNot: "`||` always returns one of its two sides, and neither side here is missing.",
          },
          {
            text: "null",
            whyNot:
              "Nothing here is null. `||` returns one of its two sides: the input or the default.",
          },
          "1",
        ],
        answer: 3,
        explanation:
          "0 is falsy, so `||` swaps in the default, and the item stays in the cart. `input ?? 1` keeps the 0.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Why prefer guard clauses to one large nested `if`?",
        options: [
          {
            text: "They run faster",
            whyNot:
              "Speed isn't the point: the same work gets done either way. The difference is how easy the code is to read.",
          },
          "Each odd case is handled and finished at the top, so the main logic reads straight down without nesting",
          {
            text: "JavaScript limits how deep `if`s can nest",
            whyNot:
              "There's no such limit. Deep nesting is legal; it's just hard for people to follow.",
          },
          {
            text: "They avoid needing `else`",
            whyNot:
              "Fewer `else`s is a side effect, not the reason. Think about what a reader meets first.",
          },
        ],
        answer: 1,
        explanation:
          "Code that reads top to bottom, with the exceptions dealt with first, is easier to read and to change.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Shipping rules with guard clauses",
        prompt:
          "Write `shippingCost(order)`. It returns `null` if the order is missing or `order.total` isn't a number (use guard clauses). Otherwise shipping is free from a total of 50 and costs 5 below that, and `express: true` adds 10. Then write `quantityOrDefault(qty)`, which returns `qty`, or 1 when it's `null` or `undefined`, keeping 0 as 0.",
        language: "javascript",
        starter: `function shippingCost(order) {
  // your code here
}

function quantityOrDefault(qty) {
  // your code here
}

console.log(shippingCost({ total: 30 }), shippingCost({ total: 80, express: true }));`,
        hint: 'Start with `if (!order || typeof order.total !== "number") return null;`. Then `let cost = order.total >= 50 ? 0 : 5;` and add 10 for express. For the default: `qty ?? 1`.',
        solution: `function shippingCost(order) {
  if (!order || typeof order.total !== "number") return null;
  let cost = order.total >= 50 ? 0 : 5;
  if (order.express) cost += 10;
  return cost;
}

function quantityOrDefault(qty) {
  return qty ?? 1;
}`,
        tests: [
          { name: "Under 50 costs 5", expression: `shippingCost({ total: 30 }) === 5` },
          { name: "Free from 50", expression: `shippingCost({ total: 50 }) === 0` },
          {
            name: "Express adds 10",
            expression: `shippingCost({ total: 80, express: true }) === 10 && shippingCost({ total: 20, express: true }) === 15`,
          },
          {
            name: "Bad input returns null instead of crashing",
            expression: `shippingCost(null) === null && shippingCost({}) === null && shippingCost({ total: "50" }) === null`,
          },
          {
            name: "0 stays 0; only missing becomes 1",
            expression: `quantityOrDefault(0) === 0 && quantityOrDefault(undefined) === 1 && quantityOrDefault(null) === 1 && quantityOrDefault(3) === 3`,
          },
        ],
      },
    ],
  },
  "js-data.arrays": {
    summary:
      "Store lists, loop over them, and know which methods change the original array and which return a new one.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "An array is an ordered list: `const prices = [120, 35, 20];`. Positions start at 0, so `prices[0]` is 120, and `prices.length` is 3.",
      },
      { kind: "heading", text: "Three ways to loop" },
      {
        kind: "text",
        body: "Loop with `for (const price of prices)` when you just need each item, and `prices.forEach((price, i) => …)` when you also need the position. The classic `for` loop counts for you: `for (let i = 0; i < prices.length; i++)` starts `i` at 0, keeps going while `i` is less than the length, and adds 1 after each pass. Use it when the position itself matters, such as stepping two at a time or stopping early.",
      },
      {
        kind: "code",
        language: "javascript",
        code: `const prices = [120, 35, 20];

for (const price of prices) {                // each item
  console.log(price);
}

prices.forEach((price, i) => {               // each item and its position
  console.log(i, price);
});

for (let i = 0; i < prices.length; i++) {    // start; keep going while; step
  console.log(i, prices[i]);
}`,
      },
      {
        kind: "text",
        body: "Declare the counter with `let`, as above. Each pass of the loop then gets its own `i`, which starts to matter once functions remember variables; the scope lesson shows what goes wrong with `var`.",
      },
      { kind: "heading", text: "Changing an array, or copying it" },
      {
        kind: "code",
        language: "javascript",
        code: `const cart = ["tent", "stove"];
cart.push("map");            // add to the end (changes cart)
cart.includes("stove");      // true
cart.indexOf("map");         // 2 (or -1 if not found)
const firstTwo = cart.slice(0, 2);   // a NEW array; cart is unchanged
const copy = [...cart];      // a shallow copy`,
      },
      {
        kind: "text",
        body: "**Know which methods mutate.** `push`, `pop`, `splice`, `reverse` and `sort` change the array in place, and every part of your code holding that array sees the change. `slice`, `map`, `filter`, `concat` and spread (`[...a]`) return a new one. Copy before mutating when the array isn't yours to change, like an array a function was given as its argument.",
      },
      { kind: "heading", text: "Each value once, with `Set`" },
      {
        kind: "text",
        body: "A `Set` is a collection that holds each value only once. Adding a value it already has does nothing, and it remembers the order values first arrived in. `has` asks whether a value is in it, and spreading a set into an array, `[...set]`, turns it back into a list.",
      },
      {
        kind: "code",
        language: "javascript",
        code: `const seen = new Set(["tent", "stove", "tent"]);
seen.size              // 2
seen.has("stove")      // true
seen.add("map");       // now tent, stove, map
[...seen]              // ["tent", "stove", "map"]`,
      },
      { kind: "heading", text: "Sorting numbers" },
      {
        kind: "text",
        body: '**`sort()` sorts as text by default.** `[120, 9, 35].sort()` gives `[120, 35, 9]`, because "1" comes before "3" and "9" in the alphabet. Pass a comparison function for numbers: `sort((a, b) => a - b)`. Because `sort` also mutates, the usual safe version is `[...prices].sort((a, b) => a - b)`, or `prices.toSorted(…)` in modern browsers.',
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What does `[10, 9, 1].sort()` return?",
        options: [
          {
            text: "[1, 9, 10]",
            whyNot:
              "That's numeric order, which `sort` only gives you with a comparison function like `(a, b) => a - b`. Without one, it compares the items as text.",
          },
          {
            text: "[10, 9, 1]",
            whyNot: "`sort` does reorder the array; this is just the original order back.",
          },
          "[1, 10, 9]",
          {
            text: "[9, 10, 1]",
            whyNot:
              'Compared as text, the first character decides, and "1" comes before "9", so neither item starting with 1 can end up last.',
          },
        ],
        answer: 2,
        explanation:
          'Without a comparison function, items are compared as strings: "1" < "10" < "9". Use `(a, b) => a - b` for numbers.',
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "A function does `items.sort(…)` on the array it was given, and returns it. What's the side effect?",
        options: [
          "The caller's array is reordered too, because `sort` changes the array in place and returns that same array",
          {
            text: "None, because sort returns a copy",
            whyNot:
              "`sort` returns the same array it was called on, already reordered. `toSorted` is the one that copies.",
          },
          {
            text: "The function returns undefined",
            whyNot:
              "`sort` returns the array, so the function hands it back as written. The surprise is somewhere else.",
          },
          {
            text: "It throws on the caller's array",
            whyNot:
              "Sorting someone else's array is allowed, which is exactly why this bug is easy to miss.",
          },
        ],
        answer: 0,
        explanation:
          "Sort a copy, `[...items].sort(…)`, so calling the function never changes data it doesn't own.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Arrays without side effects",
        prompt:
          "Write `sortPrices(prices)`, which returns the prices sorted from lowest to highest *as numbers*, without changing the array passed in. Write `lastN(items, n)`, which returns the last `n` items as a new array. And write `unique(items)`, which drops repeats and keeps first appearances in order.",
        language: "javascript",
        starter: `function sortPrices(prices) {
  // your code here
}

function lastN(items, n) {
  // your code here
}

function unique(items) {
  // your code here
}

console.log(sortPrices([120, 9, 35]));`,
        hint: "`[...prices].sort((a, b) => a - b)` sorts a copy numerically. `items.slice(-n)` takes from the end. `[...new Set(items)]` removes repeats and keeps order.",
        solution: `function sortPrices(prices) {
  return [...prices].sort((a, b) => a - b);
}

function lastN(items, n) {
  return items.slice(-n);
}

function unique(items) {
  return [...new Set(items)];
}`,
        tests: [
          {
            name: "Sorts numerically",
            expression: `sortPrices([120, 9, 35]).join() === "9,35,120"`,
          },
          {
            name: "Leaves the original array alone",
            expression: `(() => { const p = [3, 1, 2]; sortPrices(p); return p.join() === "3,1,2"; })()`,
          },
          {
            name: "Takes the last n items",
            expression: `lastN(["a", "b", "c", "d"], 2).join() === "c,d" && lastN(["a"], 3).join() === "a"`,
          },
          {
            name: "Removes repeats, keeping order",
            expression: `unique(["tent", "stove", "tent", "map"]).join() === "tent,stove,map"`,
          },
        ],
      },
    ],
  },
  "js-data.objects": {
    summary:
      "Group data in objects, read nested values safely, and update them without changing the original.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: 'An object groups named values: `const item = { id: "headlamp", price: 35, qty: 1 };`. Read with a dot (`item.price`) or brackets when the name is in a variable (`item[field]`). A property that doesn\'t exist is `undefined`, and reading a property *of* `undefined` throws, which is the most common error in JavaScript.',
      },
      {
        kind: "code",
        language: "javascript",
        code: `const customer = { name: "Ada", address: { city: "Oslo" } };

customer.address.city            // "Oslo"
customer.billing?.city           // undefined (optional chaining: no crash)
const { name, address: { city } } = customer;   // destructuring
const { phone = "none" } = customer;             // with a default`,
      },
      {
        kind: "text",
        body: "**Objects are passed by reference.** `const b = a` doesn't copy anything; both names point to the same object, so changing `b.qty` changes `a.qty` too. To update something without changing the original, build a new object with spread: `{ ...item, qty: 3 }`. Spread copies only one level deep, so update nested parts with spread too.",
      },
      {
        kind: "code",
        language: "javascript",
        code: `const cart = { owner: "Ada", items: [{ id: "a", qty: 1 }, { id: "b", qty: 2 }] };

const updated = {
  ...cart,
  items: cart.items.map((item) => (item.id === "a" ? { ...item, qty: 5 } : item)),
};
// cart is unchanged; updated has a new items array with a new "a" object`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "`const copy = original; copy.qty = 5;` What's `original.qty` now?",
        options: [
          {
            text: "Its old value",
            whyNot:
              "That would need `copy` to be a separate object. `const copy = original` gives the same object a second name.",
          },
          {
            text: "undefined",
            whyNot: "`qty` still exists, on the one object both names share. Nothing was removed.",
          },
          "5",
          {
            text: "It throws",
            whyNot:
              "Changing a property through either name is allowed, so there's nothing to throw about.",
          },
        ],
        answer: 2,
        explanation:
          "There's only one object, with two names. `{ ...original, qty: 5 }` makes a new one.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "`order.customer.address.city` throws \"Cannot read properties of undefined (reading 'city')\" for guest orders. What's the safe read?",
        options: [
          {
            text: '`order.customer.address.city || ""`',
            whyNot:
              "`||` only helps once a value has been read, and the crash happens during the read itself.",
          },
          "`order?.customer?.address?.city`",
          {
            text: '`order.customer.address["city"]`',
            whyNot:
              "Square brackets read the same property another way, so they fail in the same place.",
          },
          {
            text: "Wrap the whole page in try/catch",
            whyNot:
              "That hides the crash rather than handling the missing address, and stops everything after it.",
          },
        ],
        answer: 1,
        explanation:
          "`?.` stops and gives `undefined` as soon as a link in the chain is missing. The `||` version still crashes first, because the crash happens on the read itself.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Update a cart without mutating it",
        prompt:
          'Write `updateQuantity(cart, id, quantity)`, which returns a new cart where only the item with that `id` has the new quantity. The original cart must stay exactly as it was. Then write `describeCustomer(customer)`, which returns `"Ada (Oslo)"`, or `"Ada (no city)"` when there\'s no address. Use destructuring with defaults.',
        language: "javascript",
        starter: `const CART = {
  owner: "Ada",
  items: [
    { id: "headlamp", qty: 1 },
    { id: "bottle", qty: 2 },
  ],
};

function updateQuantity(cart, id, quantity) {
  // your code here
}

function describeCustomer(customer) {
  // your code here
}

console.log(updateQuantity(CART, "headlamp", 3));`,
        hint: '`{ ...cart, items: cart.items.map((item) => item.id === id ? { ...item, qty: quantity } : item) }`. For the customer: `const { name, address: { city = "no city" } = {} } = customer;`.',
        solution: `const CART = {
  owner: "Ada",
  items: [
    { id: "headlamp", qty: 1 },
    { id: "bottle", qty: 2 },
  ],
};

function updateQuantity(cart, id, quantity) {
  return {
    ...cart,
    items: cart.items.map((item) => (item.id === id ? { ...item, qty: quantity } : item)),
  };
}

function describeCustomer(customer) {
  const { name, address: { city = "no city" } = {} } = customer;
  return name + " (" + city + ")";
}`,
        tests: [
          {
            name: "Updates the right item",
            expression: `updateQuantity(CART, "headlamp", 3).items.find((i) => i.id === "headlamp").qty === 3`,
          },
          {
            name: "Leaves the other items as they were",
            expression: `(() => { const next = updateQuantity(CART, "headlamp", 3); return next.items.length === 2 && next.items.find((i) => i.id === "bottle").qty === 2 && next.owner === "Ada"; })()`,
          },
          {
            name: "The original cart is unchanged",
            expression: `(() => { updateQuantity(CART, "headlamp", 3); return CART.items[0].qty === 1; })()`,
          },
          {
            name: "Describes a customer with a city",
            expression: `describeCustomer({ name: "Ada", address: { city: "Oslo" } }) === "Ada (Oslo)"`,
          },
          {
            name: "…and one without an address",
            expression: `describeCustomer({ name: "Ada" }) === "Ada (no city)"`,
          },
        ],
      },
    ],
  },
  "js-data.transform": {
    summary:
      "Answer questions about data with map, filter and reduce, and chain them into readable pipelines.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: "Most everyday data work is three moves. **`filter`** keeps the items that pass a test. **`map`** turns each item into something else. **`reduce`** folds the whole list into one value: a total, a count, an object of groups. Each returns something new and leaves the original array alone.",
      },
      {
        kind: "code",
        language: "javascript",
        code: `const paid = orders.filter((o) => o.status === "paid");
const totals = paid.map((o) => o.total);
const revenue = totals.reduce((sum, t) => sum + t, 0);

// or as one pipeline
const revenue2 = orders
  .filter((o) => o.status === "paid")
  .reduce((sum, o) => sum + o.total, 0);`,
      },
      {
        kind: "text",
        body: "**Always give `reduce` a starting value** (the `0` above). Without one, `reduce` starts from the first item, which breaks when the items are objects, and it **throws on an empty array**: the day there are no orders, the page crashes. Relatives worth knowing: `find` (the first match), `some` and `every` (true/false answers), and `includes`.",
      },
      {
        kind: "code",
        language: "javascript",
        caption: "reduce into an object: totals per group",
        code: `const byCategory = paid.reduce((acc, o) => {
  acc[o.category] = (acc[o.category] ?? 0) + o.total;
  return acc;
}, {});`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "`[].reduce((sum, x) => sum + x)` (no starting value). What happens?",
        options: [
          {
            text: "It returns 0",
            whyNot:
              "0 would need a starting value to count from, and none was given. With no items and no start, there's nothing to return.",
          },
          {
            text: "It returns undefined",
            whyNot:
              "`reduce` doesn't quietly fall back to a value. An empty array with no starting value is treated as a mistake in your code.",
          },
          "It throws a TypeError",
          {
            text: "It returns []",
            whyNot:
              "`reduce` returns whatever the callback builds, beginning from the starting value. It never hands back the array itself.",
          },
        ],
        answer: 2,
        explanation:
          '"Reduce of empty array with no initial value." Pass the starting value, `reduce(fn, 0)`, and an empty list gives 0.',
      },
      {
        kind: "mcq",
        id: "q2",
        question: "You need the first order over 100, not all of them. Which method?",
        options: [
          "`find`",
          {
            text: "`filter`",
            whyNot:
              "`filter` returns every match, as an array, and checks the whole list to do it.",
          },
          {
            text: "`map`",
            whyNot: "`map` transforms every item and keeps them all. It never picks one out.",
          },
          {
            text: "`some`",
            whyNot:
              "`some` stops at the first match, but it only answers true or false, not which order it was.",
          },
        ],
        answer: 0,
        explanation:
          "`find` returns the first match (or `undefined`) and stops looking. `some` would only tell you whether one exists.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Questions about orders",
        prompt:
          "Using `ORDERS`, write `paidRevenue(orders)`, the sum of `total` for paid orders (an empty list gives 0). Write `bigSpenders(orders, min)`, the customer names of paid orders with a total of at least `min`, in order. And write `revenueByCategory(orders)`, an object of paid revenue per category.",
        language: "javascript",
        starter: `const ORDERS = [
  { id: 101, customer: "Maja Berg", category: "Apparel", total: 168, status: "paid" },
  { id: 102, customer: "Liam Walsh", category: "Apparel", total: 180, status: "paid" },
  { id: 103, customer: "Maja Berg", category: "Apparel", total: 65, status: "refunded" },
  { id: 104, customer: "Sofia Rossi", category: "Gear", total: 195, status: "paid" },
  { id: 105, customer: "Noah Keller", category: "Gear", total: 90, status: "paid" },
  { id: 106, customer: "Aisha Khan", category: "Apparel", total: 154, status: "paid" },
];

function paidRevenue(orders) {
  // your code here
}

function bigSpenders(orders, min) {
  // your code here
}

function revenueByCategory(orders) {
  // your code here
}

console.log(paidRevenue(ORDERS), revenueByCategory(ORDERS));`,
        hint: "Filter to paid first in each one. Revenue: `.reduce((sum, o) => sum + o.total, 0)`. Names: `.filter(…).map((o) => o.customer)`. Groups: reduce into `{}` with `acc[o.category] = (acc[o.category] ?? 0) + o.total`.",
        solution: `const ORDERS = [
  { id: 101, customer: "Maja Berg", category: "Apparel", total: 168, status: "paid" },
  { id: 102, customer: "Liam Walsh", category: "Apparel", total: 180, status: "paid" },
  { id: 103, customer: "Maja Berg", category: "Apparel", total: 65, status: "refunded" },
  { id: 104, customer: "Sofia Rossi", category: "Gear", total: 195, status: "paid" },
  { id: 105, customer: "Noah Keller", category: "Gear", total: 90, status: "paid" },
  { id: 106, customer: "Aisha Khan", category: "Apparel", total: 154, status: "paid" },
];

const paidOnly = (orders) => orders.filter((o) => o.status === "paid");

function paidRevenue(orders) {
  return paidOnly(orders).reduce((sum, o) => sum + o.total, 0);
}

function bigSpenders(orders, min) {
  return paidOnly(orders)
    .filter((o) => o.total >= min)
    .map((o) => o.customer);
}

function revenueByCategory(orders) {
  return paidOnly(orders).reduce((acc, o) => {
    acc[o.category] = (acc[o.category] ?? 0) + o.total;
    return acc;
  }, {});
}`,
        tests: [
          { name: "Paid revenue", expression: `paidRevenue(ORDERS) === 787` },
          { name: "An empty list gives 0, not a crash", expression: `paidRevenue([]) === 0` },
          {
            name: "Big spenders, paid orders only, in order",
            expression: `bigSpenders(ORDERS, 170).join() === "Liam Walsh,Sofia Rossi"`,
          },
          {
            name: "Revenue per category",
            expression: `JSON.stringify(revenueByCategory(ORDERS)) === JSON.stringify({ Apparel: 502, Gear: 285 })`,
          },
        ],
      },
    ],
  },
  "js-debug.errors": {
    summary:
      "Read an error message and stack trace to find the line, then throw errors that tell the next person what went wrong.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "When JavaScript hits a problem, it throws an **error** with a type, a message and a **stack trace**: the chain of function calls that led there. The first line says *what*; the top frame of the trace says *where*. Open the browser console (F12), click the file link, and you're on the line.",
      },
      {
        kind: "code",
        language: "text",
        caption: "A stack trace, as Chrome shows it",
        code: `Uncaught TypeError: Cannot read properties of undefined (reading 'price')
    at lineTotal (cart.js:4:30)
    at Array.reduce (<anonymous>)
    at orderTotal (cart.js:8:22)
    at HTMLButtonElement.<anonymous> (checkout.js:15:18)`,
      },
      {
        kind: "text",
        body: "Read that as a sentence: *on line 4 of cart.js, inside `lineTotal`, something was `undefined` and we tried to read `.price` from it*. Here, one line item has no product (it was deleted from the catalogue). The common types: **TypeError** (using a value the wrong way, like reading from `undefined` or calling something that isn't a function), **ReferenceError** (a name that doesn't exist, usually a typo), **SyntaxError** (the code can't even be parsed; nothing in the file runs).",
      },
      {
        kind: "text",
        body: "When *your* code finds a problem it can't handle, **throw an error that says what's wrong**: `throw new Error(\"Line 2 has no product\")`. That beats a TypeError from deep inside, because it names the actual problem. Where you can recover (show a message, skip the item), catch it with `try { … } catch (error) { … }`. Don't catch and ignore, though: an empty `catch` turns a clear error into a mystery.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "\"TypeError: Cannot read properties of undefined (reading 'price')\". What is undefined?",
        options: [
          {
            text: "`price`",
            whyNot:
              "`price` is the property being read. The message says the thing it was being read from was missing.",
          },
          {
            text: "The function that was called",
            whyNot:
              'A missing function gives "... is not a function". This message is about reading a property.',
          },
          {
            text: "The whole file",
            whyNot:
              "If the file hadn't loaded, none of it would run, and you'd see no error from inside it.",
          },
          "The object you tried to read `.price` *from*",
        ],
        answer: 3,
        explanation:
          "The message names the property being read. The thing to the *left* of `.price` was undefined, so look at where that value came from.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: '"ReferenceError: totl is not defined". What\'s the most likely cause?',
        options: [
          {
            text: "A network failure",
            whyNot:
              "A network failure shows up as a failed request, not as a missing name in your code.",
          },
          "A typo: `totl` instead of `total`, or a variable used outside the scope where it was declared",
          {
            text: "`totl` is null",
            whyNot:
              "A variable holding null still exists. \"is not defined\" means the name doesn't exist at all where it's used.",
          },
          {
            text: "The browser is out of date",
            whyNot:
              "Every browser understands variables. The error is about one name in your own code.",
          },
        ],
        answer: 1,
        explanation:
          "A ReferenceError means the name itself doesn't exist where it's used, which is almost always spelling or scope.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Fail with a useful message",
        prompt:
          "`orderTotal` crashes with a TypeError when a line has no product. Make it throw a plain `Error` naming the line instead, such as `Line 2 has no product`, counting lines from 1. Then write `safeTotal(order)`, which returns `{ total, error }`: the total and `null` when it works, `null` and the error's message when it doesn't.",
        language: "javascript",
        starter: `function orderTotal(order) {
  return order.items.reduce((sum, line) => sum + line.product.price * line.qty, 0);
}

function safeTotal(order) {
  // your code here
}

const broken = { items: [{ product: { name: "Headlamp", price: 35 }, qty: 1 }, { qty: 2 }] };
console.log(safeTotal(broken));`,
        hint: 'Replace the reduce\'s arrow with a function body: `(sum, line, i) => { if (!line.product) throw new Error("Line " + (i + 1) + " has no product"); return sum + …; }`. In `safeTotal`, use `try` and `catch (error)`.',
        solution: `function orderTotal(order) {
  return order.items.reduce((sum, line, i) => {
    if (!line.product) throw new Error("Line " + (i + 1) + " has no product");
    return sum + line.product.price * line.qty;
  }, 0);
}

function safeTotal(order) {
  try {
    return { total: orderTotal(order), error: null };
  } catch (error) {
    return { total: null, error: error.message };
  }
}`,
        tests: [
          {
            name: "Totals a good order",
            expression: `orderTotal({ items: [{ product: { name: "Headlamp", price: 35 }, qty: 2 }] }) === 70 && orderTotal({ items: [] }) === 0`,
          },
          {
            name: "A missing product throws an Error naming the line, not a TypeError",
            expression: `(() => { try { orderTotal({ items: [{ product: { name: "Headlamp", price: 35 }, qty: 1 }, { qty: 2 }] }); return false; } catch (e) { return !(e instanceof TypeError) && /line 2/i.test(e.message); } })()`,
          },
          {
            name: "safeTotal returns the total when it works",
            expression: `JSON.stringify(safeTotal({ items: [{ product: { name: "Bottle", price: 20 }, qty: 3 }] })) === JSON.stringify({ total: 60, error: null })`,
          },
          {
            name: "safeTotal reports the problem when it doesn't",
            expression: `(() => { const r = safeTotal({ items: [{ qty: 1 }] }); return r.total === null && /line 1/i.test(r.error); })()`,
          },
        ],
      },
    ],
  },
  "js-debug.fixit": {
    summary: "Debug a broken cart total by reading the evidence, not by guessing.",
    xp: 160,
    blocks: [
      {
        kind: "text",
        body: "A shopper reports that their cart total is wrong. Before changing a single character, form a theory: what would you *expect* each line to produce, and where does reality first disagree?",
      },
      {
        kind: "text",
        body: "That's the whole method, and it works on bugs of any size. **Reproduce** the bug reliably. **Read** what you've got (the error, the wrong value). **Guess** one specific cause. **Test** the guess with the smallest possible check: a `console.log` of the value you're unsure about, or a breakpoint in DevTools (click a line number in the Sources panel) so you can inspect every variable at that moment. Change one thing at a time; changing three at once teaches you nothing.",
      },
      {
        kind: "code",
        language: "javascript",
        caption: "The bug report",
        code: `Cart: 2 x 9.99, 1 x 24.50
Expected total: 44.48
Actual total: 0`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "A `reduce` returns 0 for a non-empty array. What is the most likely cause?",
        options: [
          {
            text: "The array is frozen",
            whyNot:
              "Freezing stops changes to an array, but `reduce` only reads it, so a frozen array reduces normally.",
          },
          {
            text: "reduce cannot be used on objects",
            whyNot:
              "This is an array, and `reduce` works on arrays of objects too. The bug is inside the callback.",
          },
          "The callback does not return the accumulator",
          {
            text: "The initial value must be omitted",
            whyNot:
              "Leaving it out makes things worse: an empty array then throws. The starting value is fine; look at what each call hands on.",
          },
        ],
        answer: 2,
        explanation:
          "If the callback forgets to return, the accumulator becomes undefined and the result collapses.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "You add `console.log(sum)` as the first line inside the reduce callback. It prints `0`, then `undefined`, `undefined`. What does that prove?",
        options: [
          "The first call gets the starting value, but every call after that receives `undefined`, so the callback isn't returning anything",
          {
            text: "The prices are wrong",
            whyNot:
              "The log shows `sum`, not the prices. Bad prices would give wrong numbers, not a missing value from the second call on.",
          },
          {
            text: "`console.log` broke the reduce",
            whyNot: "Logging only reads a value. It can't change what the callback returns.",
          },
          {
            text: "There are too many items",
            whyNot:
              "`reduce` handles any number of items, and the pattern starts on the second call whatever the length.",
          },
        ],
        answer: 0,
        explanation:
          "Each call's return value becomes the next call's `sum`. `undefined` after the first call points straight at a missing `return`.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Fix the cart total",
        prompt:
          "`cartTotal` should multiply each item's price by its quantity and sum the results. Fix it so `cartTotal(items)` returns 44.48.",
        language: "javascript",
        starter: `function cartTotal(items) {
  return items.reduce((sum, item) => {
    sum + item.price * item.quantity;
  }, 0);
}

const items = [
  { price: 9.99, quantity: 2 },
  { price: 24.5, quantity: 1 },
];

console.log(cartTotal(items));`,
        hint: "Look at the arrow function body. Is anything actually returned from it?",
        solution: `function cartTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}`,
        tests: [
          {
            name: "Totals a two-line cart correctly",
            expression:
              "Math.abs(cartTotal([{price:9.99,quantity:2},{price:24.5,quantity:1}]) - 44.48) < 0.001",
          },
          { name: "An empty cart totals 0", expression: "cartTotal([]) === 0" },
          {
            name: "A single item is price × quantity",
            expression: "cartTotal([{ price: 20, quantity: 3 }]) === 60",
          },
        ],
      },
    ],
  },
  "js-dom.select": {
    summary: "Find elements on the page, change their text and classes, and build new ones safely.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: 'The **DOM** is the page as JavaScript sees it: a tree of element objects you can find and change, and the browser updates the screen to match. `document.querySelector("#total")` finds the first element matching a CSS selector; `querySelectorAll(".item")` finds them all.',
      },
      {
        kind: "code",
        language: "javascript",
        code: `const total = document.querySelector("#total");
total.textContent = "Total: $90.00";      // set text
total.classList.add("highlight");         // add / remove / toggle classes
total.classList.toggle("empty", false);

const li = document.createElement("li");  // build an element
li.textContent = "Headlamp × 2";
document.querySelector("#cart").append(li);`,
      },
      {
        kind: "text",
        body: "**Use `textContent` for text, not `innerHTML`.** `innerHTML` parses its value as HTML, so a product name that happens to contain `<img src=x onerror=…>` becomes a real element that runs code. That's cross-site scripting (XSS), one of the most common security holes on the web. `textContent` always treats the value as plain text.",
      },
      {
        kind: "text",
        body: "A reliable pattern for lists: keep the data in an array, and write one `render` function that **clears the container and rebuilds it** from that array. `list.replaceChildren()` empties an element. Rendering from data every time is simpler than patching the page by hand.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A review shows the customer's name with `el.innerHTML = review.name`. Why is that dangerous?",
        options: [
          {
            text: "It's slower than textContent",
            whyNot:
              "It is a little slower, but that isn't the danger. Think about what happens when the name contains `<`.",
          },
          {
            text: "innerHTML strips spaces",
            whyNot: "It doesn't touch spaces. The risk is in how it treats tags inside the text.",
          },
          {
            text: "It only works in Chrome",
            whyNot:
              "`innerHTML` works in every browser, which is part of why the risk reaches every visitor.",
          },
          'A "name" containing HTML becomes real elements, and scripts in it can run on every visitor\'s page (XSS)',
        ],
        answer: 3,
        explanation:
          "Anything a user typed must be inserted as text. `el.textContent = review.name` shows the characters exactly as typed.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Calling `renderCart()` twice doubles every item on the page. What's missing?",
        options: [
          {
            text: "A `return` statement",
            whyNot:
              "A missing return can't add rows. The function runs; the problem is what it starts from each time.",
          },
          "Clearing the list before adding the items again",
          {
            text: "A second list",
            whyNot:
              "Another list would only double things somewhere else. The one list needs to start empty.",
          },
          {
            text: "`defer` on the script tag",
            whyNot:
              "`defer` decides when the script first runs. Calling `renderCart()` twice still runs it twice.",
          },
        ],
        answer: 1,
        explanation:
          "Render should produce the same page for the same data, however often it runs. Empty the container first.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Render the cart",
        prompt:
          "Write `renderCart(items)`. Clear `#cart`, then add one `li` per item reading `Headlamp × 2` (name, ×, quantity). Set `#total` to `Total: $90.00`. With no items, show `Your cart is empty` and add the class `empty` to `#cart`; remove that class when there are items. Use text, never HTML, for anything that came from data.",
        language: "dom",
        html: `<h2>Your cart</h2>
<ul id="cart"></ul>
<p id="total"></p>`,
        starter: `const CART = [
  { name: "Headlamp", price: 35, qty: 2 },
  { name: "Water Bottle", price: 20, qty: 1 },
];

function renderCart(items) {
  // your code here
}

renderCart(CART);`,
        hint: 'Find `#cart` and `#total`, then call `list.replaceChildren()`. For each item, `document.createElement("li")`, set its `textContent` to `item.name + " × " + item.qty`, and `append` it. Use `list.classList.toggle("empty", items.length === 0)`.',
        solution: `const CART = [
  { name: "Headlamp", price: 35, qty: 2 },
  { name: "Water Bottle", price: 20, qty: 1 },
];

function renderCart(items) {
  const list = document.querySelector("#cart");
  const total = document.querySelector("#total");
  list.replaceChildren();
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item.name + " × " + item.qty;
    list.append(li);
  }
  list.classList.toggle("empty", items.length === 0);
  const sum = items.reduce((s, item) => s + item.price * item.qty, 0);
  total.textContent = items.length ? "Total: $" + sum.toFixed(2) : "Your cart is empty";
}

renderCart(CART);`,
        tests: [
          {
            name: "One line per item",
            expression: `$$("#cart li").length === 2 && text($$("#cart li")[0]) === "Headlamp × 2"`,
          },
          { name: "Shows the total", expression: `text("#total") === "Total: $90.00"` },
          {
            name: "Rendering again doesn't duplicate",
            expression: `(renderCart(CART), renderCart(CART), $$("#cart li").length === 2)`,
          },
          {
            name: "An empty cart says so",
            expression: `(renderCart([]), $$("#cart li").length === 0 && $("#cart").classList.contains("empty") && text("#total") === "Your cart is empty")`,
          },
          {
            name: "…and recovers when items come back",
            expression: `(renderCart([]), renderCart(CART), !$("#cart").classList.contains("empty"))`,
          },
          {
            name: "Data is shown as text, never as HTML",
            expression: `(renderCart([{ name: '<img src=x onerror="alert(1)">', price: 1, qty: 1 }]), $("#cart img") === null && text("#cart li").startsWith("<img"))`,
          },
        ],
      },
    ],
  },
  "js-dom.events": {
    summary: "Respond to clicks and form input, keep state in one place, and re-render from it.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: '`element.addEventListener("click", handler)` runs `handler` every time the element is clicked. The handler receives an **event** object: `event.target` is the element that was clicked, and `event.preventDefault()` stops the browser\'s default action, such as a form submission reloading the page.',
      },
      {
        kind: "code",
        language: "javascript",
        code: `let quantity = 1;                       // the state: one source of truth

function render() {                     // the page, derived from state
  document.querySelector("#qty").textContent = String(quantity);
}

document.querySelector("#plus").addEventListener("click", () => {
  quantity += 1;                        // change state…
  render();                             // …then re-render
});

render();                               // and render once at the start`,
      },
      {
        kind: "text",
        body: '**Keep state in variables, not in the page.** Reading the current number back out of `#qty.textContent` and parsing it works until the text changes format. Store the number in a variable, change the variable in your handlers, and have one `render` function update the page from it. Rules like "between 1 and 10" then live in one place, and the page can never disagree with your data.',
      },
      {
        kind: "text",
        body: "Disable controls that can't do anything (`button.disabled = true`) rather than ignoring clicks silently; that's clearer, and assistive tech announces it. For lists that change, attach **one** listener to the container and check `event.target.closest(\"button\")`. This is called **event delegation**: it keeps working for items added later.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          'A newsletter form reloads the page on submit, wiping the "Thanks!" message your handler shows. What\'s missing?',
        options: [
          {
            text: "`return false` at the end of the file",
            whyNot:
              "The end of a file runs once, at load. It has no say in what happens when the form is submitted later.",
          },
          {
            text: "A `click` listener on the button instead",
            whyNot:
              "Clicking a submit button still submits the form, so the page reloads anyway, and pressing Enter in a field skips the click entirely.",
          },
          {
            text: "`async` on the handler",
            whyNot:
              "`async` changes what the handler returns, not what the browser does with the form.",
          },
          "`event.preventDefault()` in the submit handler",
        ],
        answer: 3,
        explanation:
          "A form's default action is to submit and navigate. `preventDefault()` keeps the page so your code can handle it.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "Rows are added to a list after the page loads, and their Delete buttons don't respond. Why?",
        options: [
          {
            text: "The buttons are disabled",
            whyNot:
              "Nothing in the code disabled them. They look normal; there's simply nothing listening to them.",
          },
          {
            text: "Click events don't work on new elements",
            whyNot:
              "New elements fire clicks like any other. What they lack is a listener of their own.",
          },
          'Listeners were attached to the buttons that existed at load time. Put one listener on the list and use `event.target.closest("button")`',
          {
            text: 'The list needs `role="list"`',
            whyNot:
              "`role` tells assistive technology what an element is. It has no effect on events.",
          },
        ],
        answer: 2,
        explanation:
          "A listener belongs to the element it was added to. Delegation listens on the container, which never changes.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "A quantity stepper",
        prompt:
          'Make the stepper work. `+` and `−` change the quantity, which stays between 1 and 10. Each button is disabled when it can\'t go any further, including on first load. "Add to cart" sets `#status` to `Added 3 to your cart` (with the current quantity). Keep the quantity in a variable and update the page from one `render` function.',
        language: "dom",
        html: `<div class="stepper">
  <button id="minus" aria-label="Decrease">−</button>
  <output id="qty">1</output>
  <button id="plus" aria-label="Increase">+</button>
</div>
<button id="add">Add to cart</button>
<p id="status" role="status"></p>`,
        starter: `let quantity = 1;

// Wire up #plus, #minus and #add, and keep the page in step with quantity.`,
        hint: "Write `render()` to set `#qty`'s text and each button's `.disabled` (`quantity <= 1`, `quantity >= 10`). In the click handlers, change `quantity` with `Math.min`/`Math.max`, then call `render()`. Call `render()` once at the end too.",
        solution: `let quantity = 1;
const MIN = 1;
const MAX = 10;

function render() {
  document.querySelector("#qty").textContent = String(quantity);
  document.querySelector("#minus").disabled = quantity <= MIN;
  document.querySelector("#plus").disabled = quantity >= MAX;
}

document.querySelector("#plus").addEventListener("click", () => {
  quantity = Math.min(MAX, quantity + 1);
  render();
});

document.querySelector("#minus").addEventListener("click", () => {
  quantity = Math.max(MIN, quantity - 1);
  render();
});

document.querySelector("#add").addEventListener("click", () => {
  document.querySelector("#status").textContent = "Added " + quantity + " to your cart";
});

render();`,
        tests: [
          {
            name: "Starts at 1 with − disabled",
            expression: `text("#qty") === "1" && $("#minus").disabled === true && $("#plus").disabled === false`,
          },
          {
            name: "+ increases the quantity",
            expression: `(click($("#plus")), click($("#plus")), text("#qty") === "3" && $("#minus").disabled === false)`,
          },
          {
            name: "Never goes below 1",
            expression: `(click($("#plus")), click($("#minus")), click($("#minus")), text("#qty") === "1")`,
          },
          {
            name: "Stops at 10, with + disabled",
            expression: `(Array.from({ length: 12 }).forEach(() => click($("#plus"))), text("#qty") === "10" && $("#plus").disabled === true)`,
          },
          {
            name: "Add to cart reports the quantity",
            expression: `(click($("#plus")), click($("#plus")), click($("#add")), text("#status") === "Added 3 to your cart")`,
          },
        ],
      },
    ],
  },
  "js-async.async": {
    summary:
      "Work with values that arrive later: promises, async/await, errors, and doing several things at once.",
    xp: 160,
    blocks: [
      {
        kind: "text",
        body: "Some work takes time: a network request, reading a file, a timer. JavaScript doesn't stop and wait; the call returns a **promise**, an object standing in for a value that will arrive (or fail) later. Inside an `async` function, `await` pauses *that function* until the promise settles, while the rest of the page carries on.",
      },
      {
        kind: "code",
        language: "javascript",
        code: `// A promise that settles after ms milliseconds: a stand-in for a network request.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadPrice(id) {
  await wait(50);                           // the "request" takes 50ms
  if (id === 999) throw new Error("Price " + id + " not found");
  return { 7: 35 }[id];
}

async function showPrice(id) {
  try {
    const price = await loadPrice(id);      // pauses showPrice, not the page
    console.log("Price:", price);
  } catch (error) {
    console.log(error.message);             // a rejected promise lands here
  }
}

showPrice(7);     // 50ms later: Price: 35
showPrice(999);   // 50ms later: Price 999 not found`,
      },
      {
        kind: "text",
        body: '`wait` stands in for a real request here; the next lesson makes real ones with `fetch`. `await` only works inside an `async` function, which is why `showPrice` exists. The one exception is the top level of a module, a file loaded with `type="module"` like the `app.js` from the browser lessons, where `await` can stand on its own.',
      },
      {
        kind: "text",
        body: "**Forgetting `await`** is the classic bug: you get the promise itself, not its value. `console.log` shows `Promise { <pending> }`, and `price * 2` is `NaN`. An `async` function *always* returns a promise, so whoever calls it has to `await` it too.",
      },
      {
        kind: "text",
        body: "**Independent requests shouldn't wait for each other.** Two `await`s in a row run one after the other: two 50ms requests take 100ms. Start both, then wait for both with `Promise.all([a(), b()])`, and they overlap: 50ms. `Promise.all` rejects as soon as any one of them fails. Use `Promise.allSettled` when you want every result regardless.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "`const price = loadPrice(7); console.log(price * 2);` prints `NaN`. Why?",
        options: [
          "`loadPrice` is async, so it returns a promise; without `await`, `price` is the promise, not the number",
          {
            text: "The price is missing",
            whyNot:
              "The price comes back fine once the request finishes. The problem is reading it before that happens.",
          },
          {
            text: "`console.log` can't print numbers",
            whyNot:
              "`console.log` prints numbers happily. The value it was given just isn't a number.",
          },
          {
            text: "`loadPrice` threw an error",
            whyNot:
              "An error would show up as a rejected promise, not as NaN. Nothing failed here; something wasn't waited for.",
          },
        ],
        answer: 0,
        explanation:
          "`const price = await loadPrice(7);`, inside an async function, gives you the number.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "A product page needs the price and the stock level, from two separate requests of about 200ms each. What's the faster way to get both?",
        options: [
          {
            text: "`const p = await getPrice(); const s = await getStock();`, about 400ms",
            whyNot:
              "That works, but the second request only starts after the first has finished, so the waits add up.",
          },
          "`const [p, s] = await Promise.all([getPrice(), getStock()]);`, about 200ms",
          {
            text: "Put both in `setTimeout`",
            whyNot:
              "`setTimeout` delays code. It doesn't run requests at the same time or give you their results.",
          },
          {
            text: "It makes no difference",
            whyNot:
              "Waiting for one before starting the other doubles the time. Starting both first lets them overlap.",
          },
        ],
        answer: 1,
        explanation:
          "The requests don't depend on each other, so start both before waiting. `Promise.all` waits for the slower one, not the sum.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Load a product, fast and safely",
        prompt:
          "`fetchPrice` and `fetchStock` stand in for real requests, each taking about 50ms. Write `productInfo(id)`, which returns `{ id, price, inStock }` with `inStock` true when the stock is above 0, fetching the price and stock **at the same time**. Then write `safePrice(id)`, which returns the price, or `null` if the request fails. The editor runs your code inside an `async` function, so the starter's last line can use `await` on its own, the way the top level of a module can.",
        language: "javascript",
        starter: `const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPrice(id) {
  await wait(50);
  if (id === 999) throw new Error("Product 999 not found");
  return { 1: 35, 2: 20 }[id];
}

async function fetchStock(id) {
  await wait(50);
  return { 1: 4, 2: 0 }[id] ?? 0;
}

async function productInfo(id) {
  // your code here
}

async function safePrice(id) {
  // your code here
}

console.log(await productInfo(1));`,
        hint: "`const [price, stock] = await Promise.all([fetchPrice(id), fetchStock(id)]);` then return the object. For `safePrice`, put the `await fetchPrice(id)` in `try` and return `null` from `catch`.",
        solution: `const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPrice(id) {
  await wait(50);
  if (id === 999) throw new Error("Product 999 not found");
  return { 1: 35, 2: 20 }[id];
}

async function fetchStock(id) {
  await wait(50);
  return { 1: 4, 2: 0 }[id] ?? 0;
}

async function productInfo(id) {
  const [price, stock] = await Promise.all([fetchPrice(id), fetchStock(id)]);
  return { id, price, inStock: stock > 0 };
}

async function safePrice(id) {
  try {
    return await fetchPrice(id);
  } catch {
    return null;
  }
}`,
        tests: [
          {
            name: "Returns the product's details",
            expression: `JSON.stringify(await productInfo(1)) === JSON.stringify({ id: 1, price: 35, inStock: true })`,
          },
          {
            name: "Zero stock isn't in stock",
            expression: `(await productInfo(2)).inStock === false`,
          },
          {
            name: "Fetches both at the same time",
            expression: `await (async () => { const started = Date.now(); await productInfo(1); return Date.now() - started < 90; })()`,
          },
          {
            name: "A failed request gives null, not a crash",
            expression: `(await safePrice(999)) === null && (await safePrice(1)) === 35`,
          },
        ],
      },
    ],
  },
  "html-basics.intro": {
    summary:
      "What the browser does with your HTML, and the few lines every page needs before any content.",
    xp: 90,
    blocks: [
      {
        kind: "text",
        body: "A browser reads your HTML from top to bottom and builds a tree of elements called the **DOM**. It's that tree, not your text file, that gets styled, laid out and read aloud by screen readers. Elements nest: `<p>` inside `<main>` inside `<body>`, and every element you open, you close.",
      },
      {
        kind: "code",
        language: "html",
        caption: "The skeleton every page starts from",
        code: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Rain shells — Trailhead Outdoor</title>
  </head>
  <body>
    <h1>Rain shells</h1>
  </body>
</html>`,
      },
      {
        kind: "text",
        body: "Each line earns its place. `<!doctype html>` switches the browser into standards mode. `lang` tells screen readers which voice to use and translators which language to translate from. `charset` stops accented letters turning into garbage. The **viewport** meta tag stops phones pretending to be a 980-pixel-wide desktop and shrinking your page to fit. `<title>` is the text in the browser tab and the headline in search results. Everything in `<head>` is information about the page; everything in `<body>` is the page.",
      },
      {
        kind: "text",
        body: "Browsers are forgiving: they quietly fix unclosed tags and misplaced elements rather than showing an error. That's good for visitors and bad for you, because a mistake can hide until it breaks a layout. Your browser's DevTools (the **Elements** panel) shows the tree the browser actually built, which isn't always the one you meant to write.",
      },
      {
        kind: "callout",
        body: "In these challenges you edit the whole page, and **Run** does two things. The **Preview** renders it in your browser, with a Phone/Desktop switch. The tests check the page's structure and which CSS rules apply to each element. They never measure pixels, because a real layout depends on your screen.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A page looks right on a laptop, but on a phone it's tiny and you have to pinch to zoom. What's most likely missing?",
        options: [
          "The doctype",
          "A `<title>`",
          "The `lang` attribute",
          '`<meta name="viewport" content="width=device-width, initial-scale=1">`',
        ],
        answer: 3,
        explanation:
          "Without it, mobile browsers lay the page out at around 980px wide and then scale it down to fit the screen.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "You forgot to close a `<div>`. What does the browser do?",
        options: [
          "It guesses where the element ends and carries on, so check the Elements panel to see what it actually built",
          "It shows an error page",
          "It refuses to render anything after it",
          "It closes it at the very end of the page, always",
        ],
        answer: 0,
        explanation:
          "HTML parsing never fails outright. The browser's guess is often not what you meant, which is why the DOM tree is the thing to check.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Fix the page skeleton",
        prompt:
          "This page is missing the essentials. Give `<html>` a `lang`, and add a `charset` meta tag, a viewport meta tag with `width=device-width`, and a `<title>`. A page should also have exactly one `h1`, so make the second heading an `h2`.",
        language: "web",
        starter: `<!doctype html>
<html>
  <head>
  </head>
  <body>
    <h1>Trailhead Outdoor</h1>
    <h1>New this week</h1>
    <p>Rain shells, headlamps and everything for a wet weekend.</p>
  </body>
</html>`,
        hint: 'Add `lang="en"` to `<html>`. Inside `<head>`: `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1">` and a `<title>`.',
        solution: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Trailhead Outdoor</title>
  </head>
  <body>
    <h1>Trailhead Outdoor</h1>
    <h2>New this week</h2>
    <p>Rain shells, headlamps and everything for a wet weekend.</p>
  </body>
</html>`,
        tests: [
          {
            name: "The page declares its language",
            expression: `/^[a-z]{2}/i.test($("html").getAttribute("lang") || "")`,
          },
          { name: "It declares a character set", expression: `$("meta[charset]") !== null` },
          {
            name: "It has a viewport meta tag for phones",
            expression: `/width=device-width/.test($('meta[name="viewport"]')?.getAttribute("content") || "")`,
          },
          { name: "It has a title", expression: `text("title").length > 0` },
          { name: "Exactly one h1", expression: `$$("h1").length === 1 && $$("h2").length === 1` },
        ],
      },
    ],
  },
  "html-basics.tags": {
    summary:
      "Choose elements for what they mean, so browsers, screen readers and search engines understand the page.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: 'Every element says what its content *is*. A `<div>` says nothing; a `<nav>` says "these are the site\'s main links"; a `<button>` says "pressing this does something". Screen readers let people jump between these **landmarks**, search engines weigh them, and browsers give them behaviour for free. A `<button>` can be focused with Tab and pressed with Enter or Space; a clickable `<div>` can\'t.',
      },
      {
        kind: "code",
        language: "html",
        caption: "The landmarks most pages need",
        code: `<header>   logo and site-wide things
  <nav>    the main navigation links, usually as a <ul>
<main>     the page's own content, exactly one per page
  <article>  a self-contained piece (a product, a post)
  <section>  a themed part of something, with its own heading
<aside>    related but secondary content
<footer>   contact, legal, secondary links`,
      },
      {
        kind: "text",
        body: "**Headings are the page's outline**, not a way to get big text. One `h1` says what the page is about. `h2`s are its sections, with `h3`s inside those, and you don't skip levels (an `h4` straight after an `h1`). Use CSS for size.",
      },
      {
        kind: "text",
        body: '**Links go somewhere; buttons do something.** Use `<a href>` for navigation and `<button>` for actions such as adding to a cart or opening a menu. Every image needs an `alt` attribute: describe what matters ("Rain shell jacket in orange, hood up"), or use `alt=""` for decoration, so screen readers skip it instead of reading out the file name.',
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          'An "Add to cart" control is a `<div>` with a click handler. What\'s the problem?',
        options: [
          "Divs can't be styled like buttons",
          "Keyboard users can't reach or press it, and screen readers don't announce it as a button. A `<button>` does all that for free",
          "It's slower",
          "Nothing, if it looks like a button",
        ],
        answer: 1,
        explanation:
          'Rebuilding a button from a div means re-adding focus, key handling and the role yourself, and it\'s usually done incompletely. Use the element that already means "button".',
      },
      {
        kind: "mcq",
        id: "q2",
        question: "A decorative wave graphic separates two sections. What `alt` should it have?",
        options: [
          "No alt attribute at all",
          '`alt="wave.svg"`',
          '`alt=""`, empty, so screen readers skip it',
          '`alt="decorative wave graphic separating sections"`',
        ],
        answer: 2,
        explanation:
          'With no alt at all, many screen readers read out the file name. An empty alt says "this is decoration"; describing it would add noise to every visit.',
      },
      {
        kind: "challenge",
        id: "c1",
        title: "From div soup to meaning",
        prompt:
          "Rewrite this product page with meaningful elements: a `header` with the site's links in a `nav` (as a list), one `main`, and a `footer`. Fix the headings so they don't skip a level, make \"Add to cart\" a real `button`, and give the product photo a descriptive `alt`.",
        language: "web",
        starter: `<div class="header">
  <div class="logo">Trailhead</div>
  <div class="nav">
    <a href="/tents">Tents</a>
    <a href="/jackets">Jackets</a>
    <a href="/sale">Sale</a>
  </div>
</div>
<div class="main">
  <h1>Rain Shell Jacket</h1>
  <img src="shell.jpg">
  <h4>Details</h4>
  <p>Fully taped seams, 180 g, packs into its own pocket.</p>
  <div class="button">Add to cart</div>
</div>
<div class="footer">© Trailhead Outdoor</div>`,
        hint: "Swap each `div` for the element that says what it is. Links in a `nav` go in `<ul><li><a>…</a></li></ul>`. After an `h1`, the next level down is `h2`.",
        solution: `<header>
  <p class="logo">Trailhead</p>
  <nav>
    <ul>
      <li><a href="/tents">Tents</a></li>
      <li><a href="/jackets">Jackets</a></li>
      <li><a href="/sale">Sale</a></li>
    </ul>
  </nav>
</header>
<main>
  <h1>Rain Shell Jacket</h1>
  <img src="shell.jpg" alt="Orange rain shell jacket with the hood up">
  <h2>Details</h2>
  <p>Fully taped seams, 180 g, packs into its own pocket.</p>
  <button type="button">Add to cart</button>
</main>
<footer>© Trailhead Outdoor</footer>`,
        tests: [
          {
            name: "Has header, nav, one main and footer",
            expression: `!!$("header") && !!$("header nav") && $$("main").length === 1 && !!$("footer")`,
          },
          { name: "The nav links are a list", expression: `$$("nav ul li a").length === 3` },
          {
            name: "Headings don't skip a level",
            expression: `(() => { const lv = $$("h1, h2, h3, h4, h5, h6").map((h) => Number(h.tagName[1])); return lv[0] === 1 && lv.every((l, i) => i === 0 || l <= lv[i - 1] + 1); })()`,
          },
          {
            name: "Add to cart is a real button",
            expression: `$$("button").some((b) => /add to cart/i.test(b.textContent))`,
          },
          {
            name: "The product photo describes itself",
            expression: `($("main img")?.getAttribute("alt") || "").trim().length > 5`,
          },
        ],
      },
    ],
  },
  "html-basics.forms": {
    summary:
      "Build forms everyone can fill in: labels, the right input types, names, and grouped choices.",
    xp: 140,
    blocks: [
      {
        kind: "text",
        body: "**Every field needs a label.** Connect it with `for` and `id`, or wrap the input inside the `<label>`. A proper label is read out by screen readers, and clicking it focuses the field (which matters on a phone). A placeholder isn't a label: it disappears as soon as someone starts typing, and it's often too faint to read.",
      },
      {
        kind: "code",
        language: "html",
        code: `<label for="email">Email</label>
<input id="email" name="email" type="email" autocomplete="email" required>

<label>
  Full name
  <input name="name" autocomplete="name" required>
</label>`,
      },
      {
        kind: "text",
        body: "The `type` attribute does real work. `email`, `tel` and `number` bring up the right phone keyboard and get basic checking for free. `name` is what's sent to the server; a field without one isn't submitted at all. `required` and `autocomplete` save people typing and mistakes.",
      },
      {
        kind: "text",
        body: '**Radio buttons that belong together share a `name`**, which is what makes them one group where only one can be picked. Put them in a `<fieldset>` with a `<legend>` asking the question ("Delivery"), so a screen reader announces the question with each option. End the form with a `<button type="submit">`: pressing Enter in a field submits the form through it.',
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          'A sign-up form uses placeholders ("Email", "Password") instead of labels. What goes wrong?',
        options: [
          "Nothing, because placeholders are shorter",
          "The form can't be submitted",
          "The inputs become optional",
          "The hint disappears while typing, it's often low-contrast, and some screen readers don't announce it as the field's name",
        ],
        answer: 3,
        explanation:
          "Once someone has typed into three fields, they can't see what any of them was for. Keep a visible label; a placeholder can add an example, like `name@example.com`.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Two delivery radio buttons can both be selected at once. Why?",
        options: [
          "They have different `name` attributes, so the browser treats them as separate groups",
          "They need `required`",
          "They're missing a `<fieldset>`",
          "Radios can't be in a form",
        ],
        answer: 0,
        explanation:
          "The shared `name` is what makes radios exclusive. The fieldset and legend are for the question, not the behaviour.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "A checkout form everyone can use",
        prompt:
          'Fix the form. Every field needs a label and a `name`. The email field should be `type="email"` and `required`. The two delivery options should be one radio group (same `name`) inside a `fieldset` with a `legend`. "Place order" should be a submit `button`.',
        language: "web",
        starter: `<form action="/checkout" method="post">
  <input placeholder="Email">
  <input placeholder="Full name">

  <p>Delivery</p>
  <input type="radio" value="standard"> Standard
  <input type="radio" value="express"> Express

  <div class="btn">Place order</div>
</form>`,
        hint: 'Wrap each input in a `<label>`, or give it an `id` and a matching `<label for>`. Put the radios in `<fieldset><legend>Delivery</legend>…</fieldset>` with `name="delivery"` on both.',
        solution: `<form action="/checkout" method="post">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="email" required>

  <label for="name">Full name</label>
  <input id="name" name="name" autocomplete="name" required>

  <fieldset>
    <legend>Delivery</legend>
    <label><input type="radio" name="delivery" value="standard" checked> Standard</label>
    <label><input type="radio" name="delivery" value="express"> Express</label>
  </fieldset>

  <button type="submit">Place order</button>
</form>`,
        tests: [
          {
            name: "Every field has a label",
            expression: `$$("input").length === 4 && $$("input").every((i) => labelOf(i))`,
          },
          {
            name: "Every field has a name",
            expression: `$$("input").every((i) => i.getAttribute("name"))`,
          },
          {
            name: "The email field is an email field, and required",
            expression: `!!$('input[type="email"][required]') && /email/i.test(labelOf('input[type="email"]') || "")`,
          },
          {
            name: "Delivery is one radio group with a legend",
            expression: `(() => { const r = $$('input[type="radio"]'); return r.length === 2 && new Set(r.map((x) => x.getAttribute("name"))).size === 1 && r.every((x) => !!x.closest("fieldset")?.querySelector("legend")); })()`,
          },
          {
            name: "Place order submits the form",
            expression: `$$("form button").some((b) => (b.getAttribute("type") || "submit") === "submit" && /place order/i.test(b.textContent))`,
          },
        ],
      },
    ],
  },
  "css-core.cascade": {
    summary:
      "Know exactly which rule wins when several target the same element, and keep it that way.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: 'When several rules set the same property on an element, the browser picks one by working down a fixed list. **1. Importance**: `!important` beats normal declarations. **2. Specificity**: the more specific selector wins. **3. Order**: among equals, the rule that comes later wins. Styles in a `style=""` attribute beat stylesheet rules. It isn\'t mysterious, just strict.',
      },
      {
        kind: "code",
        language: "text",
        caption: "Specificity: (ids, classes, elements), compared left to right",
        code: `p                      (0, 0, 1)
.price                 (0, 1, 0)
.product p             (0, 1, 1)
.product .price        (0, 2, 0)
#products p            (1, 0, 1)   one id beats any number of classes
:where(.x) p           (0, 0, 1)   :where() adds nothing
a:hover, [type=email]  pseudo-classes and attributes count as classes`,
      },
      {
        kind: "text",
        body: "**Inheritance** fills in what isn't set. Text properties (`color`, `font-*`, `line-height`) pass down from parent to child; box properties (`padding`, `border`, `width`) don't.",
      },
      {
        kind: "text",
        body: "The habit that avoids fights: **keep specificity low and flat**. Style with single classes, avoid ids in CSS, and don't nest selectors deeper than you need to. Reaching for `!important` usually means an earlier rule was too specific; fix that rule instead, or the next change will need an `!important` of its own. DevTools shows every rule that matched, with the losers crossed out.",
      },
      {
        kind: "code",
        language: "css",
        caption: "Scenario",
        code: `#products p  { color: #333; }
.sale-price  { color: #c00; }

/* <p class="sale-price"> inside <section id="products"> */`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What colour is the sale price?",
        options: [
          "#c00, because it's the later rule",
          "#c00, because a class beats an element",
          "#333, because `#products p` (1,0,1) beats `.sale-price` (0,1,0)",
          "It depends on the browser",
        ],
        answer: 2,
        explanation: "Specificity is checked before order. The id outweighs any number of classes.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "A `div` has `color: navy; padding: 2rem`, and a `p` inside it sets neither. What does the `p` get?",
        options: [
          "Both navy text and 2rem of padding",
          "Navy text, but no padding: colour inherits, padding doesn't",
          "Neither",
          "Padding only",
        ],
        answer: 1,
        explanation:
          "Text styling flows down so a whole article can share a font and colour. Box properties stay put, or every nested element would pile up padding.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Make the sale price red, properly",
        prompt:
          "The sale price should be red (`#c00`) and bold, while the product's other paragraphs stay `#333`. Right now an overly specific rule wins. Fix the selectors, without `!important` and without `style` attributes.",
        language: "web",
        starter: `<style>
  #products p { color: #333; }
  .sale-price { color: #c00; font-weight: 700; }
</style>

<section id="products">
  <article class="product">
    <h2>Headlamp</h2>
    <p>Rechargeable, 400 lumens.</p>
    <p class="sale-price">Now $29</p>
  </article>
</section>`,
        hint: "Lower the first rule to a class-based selector (`.product p`, which is 0,1,1) and make the price rule win on specificity, for example `.product .sale-price` (0,2,0).",
        solution: `<style>
  .product p { color: #333; }
  .product .sale-price { color: #c00; font-weight: 700; }
</style>

<section id="products">
  <article class="product">
    <h2>Headlamp</h2>
    <p>Rechargeable, 400 lumens.</p>
    <p class="sale-price">Now $29</p>
  </article>
</section>`,
        tests: [
          { name: "The sale price is red", expression: `style(".sale-price", "color") === "#c00"` },
          { name: "…and still bold", expression: `style(".sale-price", "font-weight") === "700"` },
          {
            name: "Other paragraphs stay #333",
            expression: `style(".product p:not(.sale-price)", "color") === "#333"`,
          },
          {
            name: "No !important and no style attributes",
            expression: `!/!\\s*important/i.test(source) && $$("[style]").length === 0`,
          },
        ],
      },
    ],
  },
  "css-core.boxmodel": {
    summary:
      "Content, padding, border and margin, the one reset that makes widths behave, and spacing with gap.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "Every element is a box made of four layers: **content**, then **padding** (space inside the border), then **border**, then **margin** (space outside, between boxes). Padding takes the element's background; margin is transparent.",
      },
      {
        kind: "text",
        body: "By default (`box-sizing: content-box`), `width` sets only the content. Padding and border are added on top, so a `300px` card with `20px` padding and a `1px` border is actually 342px wide, and it overflows its 300px column. Almost every modern stylesheet starts with one rule that makes `width` mean the whole box:",
      },
      {
        kind: "code",
        language: "css",
        code: `*, *::before, *::after {
  box-sizing: border-box;
}`,
      },
      {
        kind: "text",
        body: "Shorthands go clockwise from the top: `padding: 8px 16px` is 8 top and bottom, 16 left and right; four values are top, right, bottom, left. Vertical margins between blocks **collapse**: two 16px margins make 16px of space, not 32. For space *between* items in a flex or grid container, prefer `gap` on the container over margins on every child: it never doubles up and never leaves stray space after the last item.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "With the default `content-box`, how wide is `.card { width: 300px; padding: 20px; border: 1px solid }` on screen?",
        options: ["300px", "320px", "341px", "342px"],
        answer: 3,
        explanation:
          "300 + 20 + 20 + 1 + 1 = 342. With `border-box`, it would be exactly 300px, with the content shrinking to fit.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "What does `padding: 1.5rem 1rem` set?",
        options: [
          "1.5rem top and bottom, 1rem left and right",
          "1.5rem on the left and right, 1rem top and bottom",
          "1.5rem at the top, 1rem everywhere else",
          "1.5rem all round, with a 1rem gap",
        ],
        answer: 0,
        explanation:
          "Two values: vertical first, then horizontal. Four values go clockwise from the top.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Cards that fit their column",
        prompt:
          "These cards overflow their 300px column. Add the `border-box` reset for all elements. Give `.card` padding of `1.5rem` top and bottom and `1rem` left and right, in one shorthand. Then space the cards with `gap` on `.cards` (make it a flex column or a grid) instead of a margin on each card.",
        language: "web",
        starter: `<style>
  .cards { width: 300px; }
  .card { width: 300px; padding: 24px; border: 1px solid #ccc; margin-bottom: 16px; }
</style>

<div class="cards">
  <div class="card">Rain Shell Jacket</div>
  <div class="card">Headlamp</div>
</div>`,
        hint: "`*, *::before, *::after { box-sizing: border-box; }`, then `.card { padding: 1.5rem 1rem; }` and `.cards { display: flex; flex-direction: column; gap: 1rem; }` (or `display: grid`). Remove the margin.",
        solution: `<style>
  *, *::before, *::after { box-sizing: border-box; }
  .cards { width: 300px; display: grid; gap: 1rem; }
  .card { width: 300px; padding: 1.5rem 1rem; border: 1px solid #ccc; }
</style>

<div class="cards">
  <div class="card">Rain Shell Jacket</div>
  <div class="card">Headlamp</div>
</div>`,
        tests: [
          {
            name: "Width includes padding and border (border-box)",
            expression: `style(".card", "box-sizing") === "border-box" && style("body", "box-sizing") === "border-box"`,
          },
          {
            name: "Padding is 1.5rem top/bottom, 1rem left/right",
            expression: `style(".card", "padding-top") === "1.5rem" && style(".card", "padding-bottom") === "1.5rem" && style(".card", "padding-left") === "1rem" && style(".card", "padding-right") === "1rem"`,
          },
          {
            name: "The container spaces its cards with gap",
            expression: `["flex", "grid"].includes(style(".cards", "display")) && style(".cards", "row-gap") !== null`,
          },
          {
            name: "No margins on the cards",
            expression: `[null, "0"].includes(style(".card", "margin-bottom"))`,
          },
        ],
      },
    ],
  },
  "css-core.units": {
    summary:
      "Sizes that respect the reader's settings and adapt to the screen: rem, em, ch and clamp().",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "`px` is fixed. That sounds safe, but it ignores the reader: someone who has set their browser's default text size to 20px (common among people with low vision) still gets your 16px text. **`rem`** is relative to that root size (1rem is 16px by default), so text sized in rem grows with their setting. Use rem for font sizes and most spacing.",
      },
      {
        kind: "code",
        language: "text",
        code: `rem    relative to the root font size; the default for type and spacing
em     relative to this element's own font size; good for padding inside a button
%      relative to the parent (widths)
vw/vh  1% of the viewport's width/height
ch     about the width of a "0"; max-width: 65ch keeps lines readable
clamp(min, preferred, max)   fluid, within limits`,
      },
      {
        kind: "text",
        body: "**`em` compounds.** A list item at `1.2em` inside another at `1.2em` is 1.44 times the base, and a third level is 1.728. That's a trap for font sizes, but useful for padding: `padding: 0.75em 1.25em` on a button keeps it in proportion, whatever size its text is.",
      },
      {
        kind: "text",
        body: "**Fluid type with `clamp()`**: `font-size: clamp(2rem, 1rem + 4vw, 3.5rem)` grows with the screen between a floor and a ceiling, with no media queries. For text columns, limit the *line length* rather than the width: `max-width: 65ch` keeps lines readable on a 27-inch screen, and lets them fill a phone.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A reader sets their browser's default text size to 20px. Which body text grows to match?",
        options: [
          "`font-size: 16px`",
          "`font-size: 1rem`",
          "Both",
          "Neither: sites control their own sizes",
        ],
        answer: 1,
        explanation:
          "1rem follows the root size the reader chose; 16px stays 16px. (Page zoom scales both, but the text-size setting only affects relative units.)",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "`.menu li { font-size: 1.2em }`, and menus are nested three levels deep. How big is the innermost text?",
        options: [
          "1.2 × the base",
          "3.6 × the base",
          "1.728 × the base (1.2³)",
          "The same as the base",
        ],
        answer: 2,
        explanation:
          "Each level multiplies its parent's size. With `1.2rem`, every level would be exactly 1.2 × the root.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Readable at any size",
        prompt:
          "Replace the pixel sizes. Set the `body` font size in `rem`. Make the `h1` fluid with `clamp()`, using rem limits. Replace `.article`'s fixed width with a `max-width` between 45ch and 75ch. Give `.btn` padding in `em` so it scales with its text. No `font-size` anywhere should use `px`.",
        language: "web",
        starter: `<style>
  body { font-size: 16px; }
  h1 { font-size: 40px; }
  .article { width: 900px; }
  .btn { padding: 12px 20px; font-size: 14px; }
</style>

<article class="article">
  <h1>Packing for a wet weekend</h1>
  <p>A good rain shell, a spare base layer and a headlamp cover most of it…</p>
  <a class="btn" href="/rain">Shop rain gear</a>
</article>`,
        hint: "`body { font-size: 1rem; }`, `h1 { font-size: clamp(2rem, 1rem + 4vw, 3.5rem); }`, `.article { max-width: 65ch; }`, and `.btn { padding: 0.75em 1.25em; font-size: 0.875rem; }`.",
        solution: `<style>
  body { font-size: 1rem; }
  h1 { font-size: clamp(2rem, 1rem + 4vw, 3.5rem); }
  .article { max-width: 65ch; }
  .btn { padding: 0.75em 1.25em; font-size: 0.875rem; }
</style>

<article class="article">
  <h1>Packing for a wet weekend</h1>
  <p>A good rain shell, a spare base layer and a headlamp cover most of it…</p>
  <a class="btn" href="/rain">Shop rain gear</a>
</article>`,
        tests: [
          {
            name: "Body text is sized in rem",
            expression: `/^[\\d.]+rem$/.test(style("body", "font-size") || "")`,
          },
          {
            name: "The heading is fluid, with rem limits",
            expression: `/^clamp\\(\\s*[\\d.]+rem.*[\\d.]+rem\\s*\\)$/.test(style("h1", "font-size") || "")`,
          },
          {
            name: "The article limits its line length, not its width",
            expression: `(() => { const v = style(".article", "max-width") || ""; const n = parseFloat(v); return /ch$/.test(v) && n >= 45 && n <= 75 && style(".article", "width") === null; })()`,
          },
          {
            name: "Button padding scales with its text",
            expression: `/^[\\d.]+em$/.test(style(".btn", "padding-top") || "") && /^[\\d.]+em$/.test(style(".btn", "padding-left") || "")`,
          },
          {
            name: "No font size in px",
            expression: `declared("font-size").length >= 3 && declared("font-size").every((v) => !/px/.test(v))`,
          },
        ],
      },
    ],
  },
  "layout.flexbox": {
    summary: "Lay things out in a row or a column, and align them on both axes.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "`display: flex` on a container lays its children out along a line: a row by default, or a column with `flex-direction: column`. That line is the **main axis**, and across it runs the **cross axis**. Nearly all of flexbox is two questions: how should items be spread along the main axis, and how should they sit across it?",
      },
      {
        kind: "code",
        language: "css",
        code: `.site-header {
  display: flex;
  justify-content: space-between;  /* main axis: start, center, space-between… */
  align-items: center;             /* cross axis: stretch (default), center, start… */
  gap: 1rem;                       /* space between items */
}`,
      },
      {
        kind: "text",
        body: "Items can grow and shrink with `flex: 1` (take a share of the spare space) or `flex: none` (stay their natural size). `flex-wrap: wrap` lets items move onto a new line instead of squashing. And a handy trick: `margin-left: auto` on one item pushes it, and everything after it, to the far end.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "In a flex row, the logo is taller than the links, and you want everything centred vertically. Which property?",
        options: [
          "`justify-content: center`",
          "`vertical-align: middle`",
          "`flex-direction: column`",
          "`align-items: center`",
        ],
        answer: 3,
        explanation:
          "Vertical is the cross axis in a row, and `align-items` controls the cross axis. `justify-content` would bunch everything into the middle horizontally.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          'In a row of nav links, how do you push just the last one ("Cart") to the right-hand edge?',
        options: [
          "`float: right` on it",
          "`margin-left: auto` on it",
          "`justify-content: flex-end` on the container",
          "`position: absolute; right: 0`",
        ],
        answer: 1,
        explanation:
          "An auto margin soaks up all the free space on that side. `flex-end` on the container would push every item to the right, not just the last.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "A site header with flexbox",
        prompt:
          "Lay out the header: the logo, the menu and the cart link spread across the row (`space-between`) and centred vertically. The menu (`.menu`) should itself be a flex row with a `gap` between its links, and no list bullets.",
        language: "web",
        starter: `<style>
  .site-header { padding: 1rem; }
  .logo { font-size: 1.5rem; font-weight: 700; }
</style>

<header class="site-header">
  <a class="logo" href="/">Trailhead</a>
  <ul class="menu">
    <li><a href="/tents">Tents</a></li>
    <li><a href="/jackets">Jackets</a></li>
    <li><a href="/sale">Sale</a></li>
  </ul>
  <a class="cart" href="/cart">Cart (2)</a>
</header>`,
        hint: "`.site-header { display: flex; justify-content: space-between; align-items: center; }` and `.menu { display: flex; gap: 1.5rem; list-style: none; margin: 0; padding: 0; }`.",
        solution: `<style>
  .site-header {
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .logo { font-size: 1.5rem; font-weight: 700; }
  .menu {
    display: flex;
    gap: 1.5rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }
</style>

<header class="site-header">
  <a class="logo" href="/">Trailhead</a>
  <ul class="menu">
    <li><a href="/tents">Tents</a></li>
    <li><a href="/jackets">Jackets</a></li>
    <li><a href="/sale">Sale</a></li>
  </ul>
  <a class="cart" href="/cart">Cart (2)</a>
</header>`,
        tests: [
          {
            name: "The header is a flex row",
            expression: `style(".site-header", "display") === "flex" && [null, "row"].includes(style(".site-header", "flex-direction"))`,
          },
          {
            name: "Items spread across it",
            expression: `style(".site-header", "justify-content") === "space-between"`,
          },
          {
            name: "…and are centred vertically",
            expression: `style(".site-header", "align-items") === "center"`,
          },
          {
            name: "The menu is a flex row with a gap",
            expression: `style(".menu", "display") === "flex" && style(".menu", "column-gap") !== null`,
          },
          {
            name: "No bullets on the menu",
            expression: `[style(".menu", "list-style"), style(".menu", "list-style-type")].includes("none")`,
          },
        ],
      },
    ],
  },
  "layout.grid": {
    summary:
      "Use grid for rows and columns together, flexbox for one direction, and let the grid decide how many columns fit.",
    xp: 140,
    blocks: [
      {
        kind: "text",
        body: "**Flexbox is one-dimensional**: it lines items up in a row *or* a column, and each line sizes itself. **Grid is two-dimensional**: rows *and* columns, so items line up both ways. Reach for flex to arrange things *along* a line (a toolbar, a header), and for grid to arrange things *in* a layout (a gallery, a page).",
      },
      {
        kind: "code",
        language: "css",
        code: `.products {
  display: grid;
  grid-template-columns: repeat(3, 1fr);   /* three equal columns */
  gap: 1rem;
}
.featured { grid-column: span 2; }         /* this item is two columns wide */`,
      },
      {
        kind: "text",
        body: "`fr` is a share of the free space: `2fr 1fr` gives the first column two thirds. The most useful line in CSS layout lets the grid work out how many columns fit, with no media queries: `repeat(auto-fit, minmax(12rem, 1fr))`, meaning *as many columns as fit, each at least 12rem, sharing any leftover space*.",
      },
      {
        kind: "text",
        body: "`auto-fit` vs `auto-fill` only matters when there are fewer items than columns would fit. `auto-fill` keeps the empty column slots; `auto-fit` collapses them, so the items stretch to fill the row. For a product gallery, `auto-fit` is usually what you want.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which layout is grid a better fit for than flexbox?",
        options: [
          "A gallery of product cards whose columns should line up row after row",
          "A row of buttons in a toolbar",
          "A logo and links spread across a header",
          "Centring one icon inside a button",
        ],
        answer: 0,
        explanation:
          "Cards in columns need alignment in two directions at once. With flex-wrap, each row sizes itself, so the columns stop lining up.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "What does `grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr))` do on a phone 375px wide?",
        options: [
          "Three squashed columns",
          "One column: only one 12rem column fits, and it stretches to the full width",
          "A horizontal scrollbar",
          "Nothing, because it needs a media query",
        ],
        answer: 1,
        explanation:
          "12rem is 192px. Two of them plus a gap don't fit in 375px, so the grid makes one column. On a wide screen, it makes as many as fit.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "A product grid that fits any screen",
        prompt:
          "Replace the float layout. Make `.products` a grid that fits as many columns as it can, each at least `12rem` wide (`repeat(auto-fit, minmax(…))`), with a `gap`. Make the `.featured` product span two columns. Remove the floats and fixed widths from `.product`.",
        language: "web",
        starter: `<style>
  .product { float: left; width: 30%; margin: 1%; border: 1px solid #ddd; padding: 1rem; }
</style>

<section class="products">
  <article class="product featured">Rain Shell Jacket</article>
  <article class="product">Headlamp</article>
  <article class="product">Water Bottle</article>
  <article class="product">Trekking Poles</article>
  <article class="product">Wool Socks</article>
</section>`,
        hint: "`.products { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: 1rem; }` and `.featured { grid-column: span 2; }`. Delete `float`, `width` and `margin` from `.product`.",
        solution: `<style>
  .products {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: 1rem;
  }
  .product { border: 1px solid #ddd; padding: 1rem; }
  .featured { grid-column: span 2; }
</style>

<section class="products">
  <article class="product featured">Rain Shell Jacket</article>
  <article class="product">Headlamp</article>
  <article class="product">Water Bottle</article>
  <article class="product">Trekking Poles</article>
  <article class="product">Wool Socks</article>
</section>`,
        tests: [
          {
            name: "The container is a grid",
            expression: `style(".products", "display") === "grid"`,
          },
          {
            name: "Columns fit themselves: repeat(auto-fit/auto-fill, minmax(…))",
            expression: `/^repeat\\(\\s*auto-(fit|fill)\\s*,\\s*minmax\\(/.test(style(".products", "grid-template-columns") || "")`,
          },
          {
            name: "There's a gap between cards",
            expression: `style(".products", "row-gap") !== null`,
          },
          {
            name: "The featured product spans two columns",
            expression: `/span 2/.test(style(".featured", "grid-column") || "")`,
          },
          {
            name: "No floats or fixed widths on the cards",
            expression: `[null, "none"].includes(style(".product", "float")) && style(".product", "width") === null`,
          },
        ],
      },
    ],
  },
  "layout.responsive": {
    summary:
      "Make a layout that holds together from a phone to a widescreen monitor, mostly without media queries.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "Responsive design is less about breakpoints than about letting elements decide their own size. Before adding a single media query, get rid of what fights the screen: fixed widths, images wider than their container, and rows that can't wrap. A lot of layouts then work at every width on their own.",
      },
      {
        kind: "code",
        language: "css",
        caption: "Intrinsic layout: it wraps when it has to",
        code: `.cards {
  display: flex;
  flex-wrap: wrap;          /* move to a new line instead of squashing */
  gap: 1rem;
}
.card {
  flex: 1 1 15rem;          /* grow, shrink, and aim for 15rem before wrapping */
}
img {
  max-width: 100%;          /* never wider than its container */
  height: auto;             /* keep the proportions */
}`,
      },
      {
        kind: "text",
        body: "`flex: 1` tells an item to take a share of whatever space is left after its siblings have what they need. Adding a basis, as in `flex: 1 1 15rem`, says *about 15rem, but grow into spare space*. Three cards sit in a row on a laptop and stack on a phone, with no media query. Watch for one catch: a flex item won't shrink below its content's width unless you give it `min-width: 0`, which is why long URLs sometimes burst out of cards.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What does `flex: 1` expand to?",
        options: [
          "flex-grow: 1; flex-shrink: 1; flex-basis: 0%",
          "flex-grow: 1; flex-shrink: 0; flex-basis: auto",
          "width: 100%",
          "flex-basis: 1px",
        ],
        answer: 0,
        explanation:
          "With a basis of 0 the item ignores its content width and shares the free space evenly.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the declaration so the card fills the remaining width.",
        before: ".card { ",
        after: "; }",
        answer: "flex: 1",
        accept: ["flex: 1 1 0%", "flex: 1 1 0"],
        explanation: "flex: 1 is the shorthand for grow 1, shrink 1, basis 0%.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Cards that wrap on their own",
        prompt:
          "These cards have a fixed width, so they spill off a phone screen. Make `.cards` a wrapping flex row with a `gap`. Give `.card` `flex: 1 1` plus a basis (such as `15rem`) instead of a width. Stop images being wider than their card with `max-width: 100%`. Check both widths in the Preview.",
        language: "web",
        starter: `<style>
  .card { width: 400px; display: inline-block; border: 1px solid #ddd; padding: 1rem; }
</style>

<div class="cards">
  <div class="card"><img src="https://picsum.photos/600/300?1" alt="Rain shell on a hook"><h3>Rain Shell</h3></div>
  <div class="card"><img src="https://picsum.photos/600/300?2" alt="Headlamp on a tent pole"><h3>Headlamp</h3></div>
  <div class="card"><img src="https://picsum.photos/600/300?3" alt="Water bottle by a stream"><h3>Water Bottle</h3></div>
</div>`,
        hint: "`.cards { display: flex; flex-wrap: wrap; gap: 1rem; }`, `.card { flex: 1 1 15rem; }` (and delete `width`/`inline-block`), `img { max-width: 100%; height: auto; }`.",
        solution: `<style>
  .cards { display: flex; flex-wrap: wrap; gap: 1rem; }
  .card { flex: 1 1 15rem; border: 1px solid #ddd; padding: 1rem; }
  img { max-width: 100%; height: auto; }
</style>

<div class="cards">
  <div class="card"><img src="https://picsum.photos/600/300?1" alt="Rain shell on a hook"><h3>Rain Shell</h3></div>
  <div class="card"><img src="https://picsum.photos/600/300?2" alt="Headlamp on a tent pole"><h3>Headlamp</h3></div>
  <div class="card"><img src="https://picsum.photos/600/300?3" alt="Water bottle by a stream"><h3>Water Bottle</h3></div>
</div>`,
        tests: [
          {
            name: "The cards wrap instead of overflowing",
            expression: `style(".cards", "display") === "flex" && style(".cards", "flex-wrap") === "wrap"`,
          },
          { name: "There's a gap between them", expression: `style(".cards", "row-gap") !== null` },
          {
            name: "Cards grow from a basis instead of a fixed width",
            expression: `style(".card", "flex-grow") === "1" && /^[\\d.]+(rem|em|px)$/.test(style(".card", "flex-basis") || "") && style(".card", "width") === null`,
          },
          {
            name: "Images never overflow their card",
            expression: `style("img", "max-width") === "100%"`,
          },
        ],
      },
    ],
  },
  "layout.media": {
    summary:
      "Mobile-first media queries, with breakpoints set by the content rather than by device names.",
    xp: 140,
    blocks: [
      {
        kind: "text",
        body: "When intrinsic layout isn't enough (a sidebar that should sit beside the content on a wide screen, say), a **media query** applies rules only when a condition is true. Write your CSS **mobile-first**: the base rules are for small screens, and `min-width` queries add to them as space appears.",
      },
      {
        kind: "code",
        language: "css",
        code: `.layout { display: grid; gap: 1rem; }        /* phones: one column */

@media (min-width: 48rem) {                   /* 768px at default text size */
  .layout { grid-template-columns: 15rem 1fr; }   /* sidebar + content */
}`,
      },
      {
        kind: "text",
        body: "Why mobile-first? Small screens get the simplest CSS, with no overrides to undo; each query only *adds*; and it pushes you to decide what matters most. The desktop-first alternative, with `max-width` queries undoing a wide layout, tends to pile up overrides.",
      },
      {
        kind: "text",
        body: "Choose a **breakpoint where the content breaks**, not where a particular phone ends: widen the Preview until the layout looks cramped or stretched, and put the breakpoint there. Write breakpoints in `rem` or `em`, so they respond when someone enlarges their text. Media queries also cover preferences: `@media (prefers-reduced-motion: reduce)` is where to switch off animations for people who get motion sickness.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: 'What does "mobile-first" CSS mean in practice?',
        options: [
          "Designing only for phones",
          "Using `max-width` queries to fix the desktop layout for phones",
          "Detecting the device with JavaScript",
          "Base styles for small screens, with `min-width` media queries adding layout as the screen grows",
        ],
        answer: 3,
        explanation:
          "The small-screen styles apply everywhere, and larger screens get extra rules on top. Nothing has to be undone.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Why write a breakpoint as `48rem` rather than `768px`?",
        options: [
          "rem is faster",
          "It's the same thing either way",
          "A rem breakpoint moves with the reader's text size, so if they enlarge text the layout switches earlier and stays readable",
          "Pixels aren't allowed in media queries",
        ],
        answer: 2,
        explanation:
          "At the default size the two are identical. The difference shows for exactly the readers who need it: larger text means content breaks sooner, and an em/rem breakpoint follows it.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Go mobile-first",
        prompt:
          "This layout is desktop-first: a two-column grid that a `max-width` query takes apart for phones. Rewrite it mobile-first. By default, `.layout` is a one-column grid and `.menu` stacks as a column. A `min-width` query in `rem` or `em` adds the `15rem 1fr` columns and turns the menu into a row. Check both widths in the Preview.",
        language: "web",
        starter: `<style>
  .layout { display: grid; grid-template-columns: 15rem 1fr; gap: 1rem; }
  .menu { display: flex; gap: 1rem; list-style: none; padding: 0; }

  @media (max-width: 767px) {
    .layout { grid-template-columns: 1fr; }
    .menu { flex-direction: column; }
  }
</style>

<div class="layout">
  <aside>
    <ul class="menu">
      <li><a href="/tents">Tents</a></li>
      <li><a href="/jackets">Jackets</a></li>
    </ul>
  </aside>
  <main><h1>Rain shells</h1><p>Everything for a wet weekend.</p></main>
</div>`,
        hint: "Base rules: `.layout { display: grid; gap: 1rem; }` and `.menu { display: flex; flex-direction: column; … }`. Then `@media (min-width: 48rem) { .layout { grid-template-columns: 15rem 1fr; } .menu { flex-direction: row; } }`.",
        solution: `<style>
  .layout { display: grid; gap: 1rem; }
  .menu { display: flex; flex-direction: column; gap: 1rem; list-style: none; padding: 0; }

  @media (min-width: 48rem) {
    .layout { grid-template-columns: 15rem 1fr; }
    .menu { flex-direction: row; }
  }
</style>

<div class="layout">
  <aside>
    <ul class="menu">
      <li><a href="/tents">Tents</a></li>
      <li><a href="/jackets">Jackets</a></li>
    </ul>
  </aside>
  <main><h1>Rain shells</h1><p>Everything for a wet weekend.</p></main>
</div>`,
        tests: [
          {
            name: "On a phone: one column",
            expression: `style(".layout", "display", 375) === "grid" && [null, "1fr", "none"].includes(style(".layout", "grid-template-columns", 375))`,
          },
          {
            name: "On a wide screen: sidebar and content",
            expression: `style(".layout", "grid-template-columns", 1024) === "15rem 1fr"`,
          },
          {
            name: "The menu stacks on a phone and runs in a row when there's room",
            expression: `style(".menu", "flex-direction", 375) === "column" && style(".menu", "flex-direction", 1024) === "row"`,
          },
          {
            name: "Mobile-first: only min-width queries, in rem or em",
            expression: `media().length > 0 && media().every((q) => /min-width\\s*:\\s*[\\d.]+r?em/.test(q))`,
          },
        ],
      },
    ],
  },
  "da-clean.clean": {
    summary:
      "Load a messy export with pandas, find what's wrong with it, and fix it in code you can re-run.",
    xp: 160,
    blocks: [
      {
        kind: "text",
        body: "Every analysis starts with data that's messier than it looks, and every conclusion inherits that mess. This course uses **pandas**, Python's table library. A **DataFrame** is a table, and each column is a **Series**. (The first run downloads pandas into your browser, which takes a few seconds; after that it's instant.)",
      },
      {
        kind: "code",
        language: "python",
        caption: "First look: always these three",
        code: `import io
import pandas as pd

df = pd.read_csv("orders.csv")      # or io.StringIO(text), as in the challenge
df.head()                           # the first rows
df.info()                           # column types and how many values are missing
df.duplicated().sum()               # exact duplicate rows`,
      },
      {
        kind: "text",
        body: 'What to look for. **Numbers stored as text**: `"$1,173.00"` makes the whole column text (`object`), so it can\'t be summed. **Inconsistent labels**: `"apparel "`, `"APPAREL"` and `"Apparel"` are three categories to a computer. **Duplicates** from a double export. **Test data** that was never real. **Missing values**, where you have to decide whether the row is still usable.',
      },
      {
        kind: "code",
        language: "python",
        code: `df["category"] = df["category"].str.strip().str.title()          # "apparel " → "Apparel"
df["amount"] = pd.to_numeric(
    df["amount"].astype(str).str.replace(r"[$,]", "", regex=True),
    errors="coerce",                                              # unparseable → NaN
)
df = df.drop_duplicates()
df = df[df["customer"] != "TEST"]
df = df.dropna(subset=["amount"])                                 # can't use a row with no amount
df["region"] = df["region"].fillna("Unknown")                     # but a missing region is fine`,
      },
      {
        kind: "text",
        body: "**Clean in code, never by hand in the raw file.** A function you can re-run on next month's export is the whole point, and it documents every decision you made. Keep the raw data untouched, and count the rows before and after each step, so you can say exactly what was removed and why.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          '`df["amount"].sum()` returns `"$168.00180195…"`, a long string, instead of a number. Why?',
        options: [
          "pandas can't add money",
          "There are missing values",
          "The CSV has the wrong encoding",
          "The column is text (`object`), because some values contain `$` and commas, so `sum` joins the strings together",
        ],
        answer: 3,
        explanation:
          "One non-numeric value makes the whole column text. Strip the symbols and convert with `pd.to_numeric` before any arithmetic.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "A row has an amount but no region. What's the better default?",
        options: [
          "Drop the row, because incomplete data is bad data",
          "Guess the region from the customer's name",
          'Keep it and label the region "Unknown", so revenue totals stay complete and the gap stays visible',
          "Fill it with the most common region",
        ],
        answer: 2,
        explanation:
          "Dropping it would silently understate revenue, and guessing invents data. Decide per column: an amount is essential, a region usually isn't.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Clean the export",
        prompt:
          'Write `clean(df)`, which returns a cleaned copy (leave `df` itself unchanged). It should: drop exact duplicate rows; drop the test order (customer `TEST`); tidy `category` (trim spaces, title case); turn `amount` into numbers, dropping rows that have none; and fill a missing `region` with `"Unknown"`.',
        language: "python",
        starter: `import io
import pandas as pd

RAW = """order_id,date,customer,region,category,amount,status
1001,2026-01-05,Maja Berg,North,Apparel,$168.00,paid
1002,2026-01-09,Liam Walsh,West,apparel ,180,paid
1003,2026-01-15,Maja Berg,North,Apparel,65,refunded
1004,2026-01-22,Sofia Rossi,South,Gear,195,paid
1004,2026-01-22,Sofia Rossi,South,Gear,195,paid
1005,2026-02-02,Noah Keller,,Gear,90,paid
1006,2026-02-06,Aisha Khan,West,APPAREL,154,paid
1007,2026-02-11,Liam Walsh,West,Footwear,,pending
1008,2026-02-19,Maja Berg,North,Gear,55,paid
1009,2026-02-25,Lucas Silva,South,Footwear,"$1,173.00",paid
1010,2026-03-03,Sofia Rossi,South,Apparel,72,paid
9999,2026-03-05,TEST,North,Gear,1,paid
1011,2026-03-08,Aisha Khan,West,Gear,90,refunded
1012,2026-03-12,Emma Novak,East,Apparel,197,paid
1013,2026-03-18,Noah Keller,North,gear,20,paid
1014,2026-03-24,Maja Berg,North,Footwear,324,paid
"""

def load():
    return pd.read_csv(io.StringIO(RAW))

def clean(df):
    # your code here
    return df

raw = load()
print(len(raw), "rows before")
print(clean(raw))`,
        hint: 'Start with `df = df.drop_duplicates().copy()` so you never modify the original. Then filter out `TEST`, use `.str.strip().str.title()`, `pd.to_numeric(..., errors="coerce")` and `dropna(subset=["amount"])`, and `fillna("Unknown")`.',
        solution: `import io
import pandas as pd

RAW = """order_id,date,customer,region,category,amount,status
1001,2026-01-05,Maja Berg,North,Apparel,$168.00,paid
1002,2026-01-09,Liam Walsh,West,apparel ,180,paid
1003,2026-01-15,Maja Berg,North,Apparel,65,refunded
1004,2026-01-22,Sofia Rossi,South,Gear,195,paid
1004,2026-01-22,Sofia Rossi,South,Gear,195,paid
1005,2026-02-02,Noah Keller,,Gear,90,paid
1006,2026-02-06,Aisha Khan,West,APPAREL,154,paid
1007,2026-02-11,Liam Walsh,West,Footwear,,pending
1008,2026-02-19,Maja Berg,North,Gear,55,paid
1009,2026-02-25,Lucas Silva,South,Footwear,"$1,173.00",paid
1010,2026-03-03,Sofia Rossi,South,Apparel,72,paid
9999,2026-03-05,TEST,North,Gear,1,paid
1011,2026-03-08,Aisha Khan,West,Gear,90,refunded
1012,2026-03-12,Emma Novak,East,Apparel,197,paid
1013,2026-03-18,Noah Keller,North,gear,20,paid
1014,2026-03-24,Maja Berg,North,Footwear,324,paid
"""

def load():
    return pd.read_csv(io.StringIO(RAW))

def clean(df):
    df = df.drop_duplicates().copy()
    df = df[df["customer"] != "TEST"]
    df["category"] = df["category"].str.strip().str.title()
    df["amount"] = pd.to_numeric(
        df["amount"].astype(str).str.replace(r"[$,]", "", regex=True), errors="coerce"
    )
    df = df.dropna(subset=["amount"])
    df["region"] = df["region"].fillna("Unknown")
    return df.reset_index(drop=True)`,
        tests: [
          {
            name: "Removes the duplicate, the test order and the row with no amount",
            expression: "len(clean(load())) == 13",
          },
          {
            name: "Amounts are numbers, and add up",
            expression:
              'clean(load())["amount"].dtype.kind == "f" and clean(load())["amount"].sum() == 2783',
          },
          {
            name: "Categories are consistent",
            expression:
              'sorted(clean(load())["category"].unique()) == ["Apparel", "Footwear", "Gear"]',
          },
          {
            name: "A missing region is labelled, not dropped",
            expression: '(clean(load())["region"] == "Unknown").sum() == 1',
          },
          {
            name: "The raw data is left unchanged",
            expression:
              '(lambda raw: (clean(raw), len(raw) == 16 and raw["amount"].iloc[0] == "$168.00")[1])(load())',
          },
        ],
      },
    ],
  },
  "da-clean.eda": {
    summary:
      "Summarise by group, look at who and what drives the totals, and notice when one row is doing the talking.",
    xp: 160,
    blocks: [
      {
        kind: "text",
        body: "**Exploratory analysis** means asking the data simple questions before you commit to a story. How many of each thing? What drives the total? What looks odd? Most of it is one pattern: **split** the rows into groups, **apply** a calculation to each, and **combine** the results into a table.",
      },
      {
        kind: "code",
        language: "python",
        code: `paid = df[df["status"] == "paid"]                    # decide what counts first
paid["category"].value_counts()                     # how many of each
paid.groupby("category").agg(
    orders=("order_id", "count"),
    revenue=("amount", "sum"),
    avg_order=("amount", "mean"),
).sort_values("revenue", ascending=False)`,
      },
      {
        kind: "text",
        body: "**Decide what counts before you count.** Refunds and pending orders aren't revenue. Filtering them out first, and saying so in the output, is the difference between a number people can trust and one they have to question.",
      },
      {
        kind: "text",
        body: 'Then look for **concentration**. When one group or one customer makes up a big share of a total, check how many rows that is. A category that leads on revenue with two orders is a very different story from one that leads with two hundred. `df.sort_values("amount", ascending=False).head()` shows the biggest rows, and they\'re often the story, or the error.',
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: the paid-order summary",
        code: `category   orders  revenue  avg_order
Footwear        2   1497.0      748.5
Apparel         5    771.0      154.2
Gear            4    360.0       90.0`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          'Someone concludes "Footwear is our strongest category". What should you check first?',
        options: [
          "Whether Footwear's two orders include an unusual one: one order of 1,173 accounts for most of it",
          "Nothing, because the revenue is highest",
          "Whether the average order value is rounded",
          "Whether Gear has more products",
        ],
        answer: 0,
        explanation:
          'With two orders, one large B2B sale decides the ranking. Without it, Footwear would be 324, the smallest of the three. Report it as "driven by one large order", or show the ranking with and without it.',
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Why filter to paid orders *before* grouping, rather than after?",
        options: [
          "It's faster",
          "`groupby` can't handle text columns",
          "Every figure in the summary (counts, sums and averages) should describe the same set of orders; refunds would inflate all three",
          "It doesn't matter",
        ],
        answer: 2,
        explanation:
          "Filter first, then group, and say in the table's title what was included. Apparel would read 836 with its refund left in, not 771.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "What drives the revenue?",
        prompt:
          "Using the cleaned data, write `summary_by_category(df)`: **paid orders only**, one row per category (as the index) with the columns `orders`, `revenue` and `avg_order`, sorted by revenue, highest first. Then write `top_customers(df, n)`, which returns the names of the `n` customers with the most paid revenue, as a list, highest first.",
        language: "python",
        starter: `import io
import pandas as pd

CLEAN = """order_id,date,customer,region,category,amount,status
1001,2026-01-05,Maja Berg,North,Apparel,168.0,paid
1002,2026-01-09,Liam Walsh,West,Apparel,180.0,paid
1003,2026-01-15,Maja Berg,North,Apparel,65.0,refunded
1004,2026-01-22,Sofia Rossi,South,Gear,195.0,paid
1005,2026-02-02,Noah Keller,Unknown,Gear,90.0,paid
1006,2026-02-06,Aisha Khan,West,Apparel,154.0,paid
1008,2026-02-19,Maja Berg,North,Gear,55.0,paid
1009,2026-02-25,Lucas Silva,South,Footwear,1173.0,paid
1010,2026-03-03,Sofia Rossi,South,Apparel,72.0,paid
1011,2026-03-08,Aisha Khan,West,Gear,90.0,refunded
1012,2026-03-12,Emma Novak,East,Apparel,197.0,paid
1013,2026-03-18,Noah Keller,North,Gear,20.0,paid
1014,2026-03-24,Maja Berg,North,Footwear,324.0,paid
"""

def load():
    return pd.read_csv(io.StringIO(CLEAN))

def summary_by_category(df):
    # your code here
    pass

def top_customers(df, n):
    # your code here
    pass

print(summary_by_category(load()))`,
        hint: '`paid = df[df["status"] == "paid"]`, then `paid.groupby("category").agg(orders=("order_id", "count"), revenue=("amount", "sum"), avg_order=("amount", "mean"))` and `.sort_values("revenue", ascending=False)`. For customers: `groupby("customer")["amount"].sum()`, sort, then `.head(n).index.tolist()`.',
        solution: `import io
import pandas as pd

CLEAN = """order_id,date,customer,region,category,amount,status
1001,2026-01-05,Maja Berg,North,Apparel,168.0,paid
1002,2026-01-09,Liam Walsh,West,Apparel,180.0,paid
1003,2026-01-15,Maja Berg,North,Apparel,65.0,refunded
1004,2026-01-22,Sofia Rossi,South,Gear,195.0,paid
1005,2026-02-02,Noah Keller,Unknown,Gear,90.0,paid
1006,2026-02-06,Aisha Khan,West,Apparel,154.0,paid
1008,2026-02-19,Maja Berg,North,Gear,55.0,paid
1009,2026-02-25,Lucas Silva,South,Footwear,1173.0,paid
1010,2026-03-03,Sofia Rossi,South,Apparel,72.0,paid
1011,2026-03-08,Aisha Khan,West,Gear,90.0,refunded
1012,2026-03-12,Emma Novak,East,Apparel,197.0,paid
1013,2026-03-18,Noah Keller,North,Gear,20.0,paid
1014,2026-03-24,Maja Berg,North,Footwear,324.0,paid
"""

def load():
    return pd.read_csv(io.StringIO(CLEAN))

def summary_by_category(df):
    paid = df[df["status"] == "paid"]
    return paid.groupby("category").agg(
        orders=("order_id", "count"),
        revenue=("amount", "sum"),
        avg_order=("amount", "mean"),
    ).sort_values("revenue", ascending=False)

def top_customers(df, n):
    paid = df[df["status"] == "paid"]
    return paid.groupby("customer")["amount"].sum().sort_values(ascending=False).head(n).index.tolist()`,
        tests: [
          {
            name: "One row per category, highest revenue first",
            expression:
              'list(summary_by_category(load()).index) == ["Footwear", "Apparel", "Gear"]',
          },
          {
            name: "Only paid orders count",
            expression:
              'summary_by_category(load())["revenue"].sum() == 2628 and summary_by_category(load()).loc["Apparel", "revenue"] == 771',
          },
          {
            name: "Counts orders and averages them",
            expression:
              'summary_by_category(load()).loc["Apparel", "orders"] == 5 and abs(summary_by_category(load()).loc["Footwear", "avg_order"] - 748.5) < 1e-9',
          },
          {
            name: "Top customers by paid revenue",
            expression: 'top_customers(load(), 3) == ["Lucas Silva", "Maja Berg", "Sofia Rossi"]',
          },
        ],
      },
    ],
  },
  "da-reason.stats": {
    summary:
      "Mean or median, what spread tells you, and a principled way to flag outliers instead of guessing.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: "\"The average order is 239\" sounds like a fact about a typical customer. It isn't. Nine of the shop's eleven paid orders are under 200, and one is a B2B order of 1,173. The **mean** (the sum divided by the count) is pulled up by that one order to 238.9. The **median** (the middle value when sorted) is 168, which is much closer to what a typical order looks like.",
      },
      {
        kind: "text",
        body: 'Use the **median** for "typical" whenever the data is skewed (order values, salaries, house prices, response times), where a few large values stretch one side. Use the **mean** when you need totals to add up: *mean × count = total*, which is what planning and budgets need. Often the honest answer is to report both.',
      },
      {
        kind: "text",
        body: "**Outliers**: don't eyeball them, and don't delete them quietly. A standard rule uses the **interquartile range** (IQR). Q1 is the value a quarter of the way up the sorted data and Q3 is three quarters of the way; IQR = Q3 − Q1. Anything below Q1 − 1.5×IQR or above Q3 + 1.5×IQR gets flagged. A flag means *look at it*: it might be an error, or it might be your most important customer.",
      },
      {
        kind: "code",
        language: "python",
        code: `s = pd.Series(amounts)
s.mean(), s.median()
q1, q3 = s.quantile(0.25), s.quantile(0.75)
iqr = q3 - q1
flagged = s[(s < q1 - 1.5 * iqr) | (s > q3 + 1.5 * iqr)]
s.describe()      # count, mean, std, min, quartiles, max in one go`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          'Finance asks for next quarter\'s revenue forecast: expected orders × a typical order value. Which "typical" value should the forecast use?',
        options: [
          "The median, because it's more representative",
          "The mean, because mean × count reproduces the total, including the big orders that do happen",
          "The mode",
          "The largest order",
        ],
        answer: 1,
        explanation:
          "For totals, the mean is the right tool; the median would understate revenue whenever large orders are part of the business. For describing a typical customer, it's the other way round.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Your IQR rule flags one order of 1,173. What do you do?",
        options: [
          "Delete it, since outliers distort the analysis",
          "Nothing, since it's a real order",
          "Replace it with the median",
          'Check it\'s genuine, then report with it and note its effect ("median 168; one B2B order of 1,173 lifts the mean to 239")',
        ],
        answer: 3,
        explanation:
          "Flagging is for investigating, not deleting. If it's real, it belongs in revenue. The reader needs to know it's there so they don't mistake one order for a trend.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Describe the order values honestly",
        prompt:
          "Write `describe_amounts(amounts)`, which returns a dict with the `mean`, the `median`, and the sorted list of `outliers` by the 1.5 × IQR rule. Use pandas' `quantile` for Q1 and Q3.",
        language: "python",
        starter: `import pandas as pd

AMOUNTS = [168, 180, 195, 90, 154, 55, 1173, 72, 197, 20, 324]   # paid orders

def describe_amounts(amounts):
    # your code here
    pass

print(describe_amounts(AMOUNTS))`,
        hint: "Make a `pd.Series(amounts)`. Take `q1 = s.quantile(0.25)` and `q3 = s.quantile(0.75)`, compute the two fences, and return `sorted(s[(s < low) | (s > high)].tolist())`.",
        solution: `import pandas as pd

AMOUNTS = [168, 180, 195, 90, 154, 55, 1173, 72, 197, 20, 324]

def describe_amounts(amounts):
    s = pd.Series(amounts, dtype=float)
    q1, q3 = s.quantile(0.25), s.quantile(0.75)
    iqr = q3 - q1
    low, high = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    return {
        "mean": s.mean(),
        "median": s.median(),
        "outliers": sorted(s[(s < low) | (s > high)].tolist()),
    }`,
        tests: [
          { name: "The median is 168", expression: 'describe_amounts(AMOUNTS)["median"] == 168' },
          {
            name: "The mean is pulled up to about 238.9",
            expression: 'abs(describe_amounts(AMOUNTS)["mean"] - 238.9090909) < 1e-6',
          },
          {
            name: "Flags the B2B order",
            expression: 'describe_amounts(AMOUNTS)["outliers"] == [1173]',
          },
          {
            name: "Flags low outliers too",
            expression: 'describe_amounts([10, 11, 12, 13, 14, -40])["outliers"] == [-40]',
          },
          {
            name: "Even data has no outliers",
            expression: 'describe_amounts([1, 2, 3, 4, 5])["outliers"] == []',
          },
        ],
      },
    ],
  },
  "da-reason.compare": {
    summary:
      "Compare rates rather than counts, spot when the mix of groups flips a result, and don't read causes into correlations.",
    xp: 170,
    blocks: [
      {
        kind: "text",
        body: '"Region North had 50 refunds and South had 20" says nothing until you know how many orders each had. Compare **rates** (refunds ÷ orders), not raw **counts**, whenever the groups differ in size. Show the base alongside the rate, because 50% of 4 orders isn\'t the same evidence as 50% of 4,000.',
      },
      {
        kind: "text",
        body: "Say whether a change is in **percentage points** or **percent**. A conversion rate going from 10% to 12% is **+2 points**, or **+20%**. Both are true, and they sound very different; writing the wrong one is a common way to exaggerate a result by accident.",
      },
      {
        kind: "text",
        body: "**Simpson's paradox**: a comparison can point one way inside every group and the opposite way overall, when the groups are mixed in different proportions. In an A/B test, variant B can win on mobile *and* on desktop yet lose overall, simply because B happened to get most of the mobile traffic, which converts worse for everyone. The fix is to compare like with like, within segments, and to check that the groups were comparable in the first place.",
      },
      {
        kind: "code",
        language: "text",
        caption: "The A/B test in this lesson's challenge",
        code: `variant  device   visitors  conversions   rate
A        mobile        200           10     5%
A        desktop       800           80    10%
B        mobile        800           48     6%
B        desktop       200           22    11%

Overall: A 90 / 1000 = 9%     B 70 / 1000 = 7%`,
      },
      {
        kind: "text",
        body: 'Finally, **correlation isn\'t causation**. Customers who use the mobile app spend more, but maybe your biggest spenders are the ones who bother to install the app. Before saying "X causes Y", ask what else could explain both. The reliable way to establish cause is a controlled experiment: randomise who gets X.',
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Based on the table above, which variant is better?",
        options: [
          "A, since it converts 9% against B's 7% overall",
          "B converts better on both devices. A only wins overall because B got most of the mobile traffic, so check why the split was uneven before deciding",
          "Neither, because the difference is too small",
          "A, because it had more desktop visitors",
        ],
        answer: 1,
        explanation:
          "Within each device B is ahead (6% vs 5%, 11% vs 10%). The overall numbers compare different traffic mixes. An uneven split in a randomised test is itself a bug worth finding.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Checkout conversion went from 4% to 5%. Which statement is accurate?",
        options: [
          "Conversion rose by 1 percentage point, a 25% relative increase",
          "Conversion rose by 1%",
          "Conversion rose by 5%",
          "Conversion doubled",
        ],
        answer: 0,
        explanation:
          "5 − 4 = 1 point; 1 ÷ 4 = 25%. Say which one you mean, and when it matters, give both.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Find the paradox",
        prompt:
          "Write `overall_rates(df)`, a Series of conversion rate by variant (total conversions ÷ total visitors, not an average of rates). Write `segment_rates(df)`, a DataFrame of rates with devices as the index and variants as the columns. Then write `better_in_every_segment(df)`, which returns the variant that has the higher rate in every device, or `None` if no variant does.",
        language: "python",
        starter: `import pandas as pd

TEST = pd.DataFrame({
    "variant": ["A", "A", "B", "B"],
    "device": ["mobile", "desktop", "mobile", "desktop"],
    "visitors": [200, 800, 800, 200],
    "conversions": [10, 80, 48, 22],
})

def overall_rates(df):
    # your code here
    pass

def segment_rates(df):
    # your code here
    pass

def better_in_every_segment(df):
    # your code here
    pass

print(overall_rates(TEST))
print(segment_rates(TEST))`,
        hint: 'Overall: `g = df.groupby("variant")[["conversions", "visitors"]].sum()`, then `g["conversions"] / g["visitors"]`. Segments: add a `rate` column, then `df.pivot(index="device", columns="variant", values="rate")`. For the winner, check each variant: `(table[v] >= table.max(axis=1)).all()`, and make sure the other variant isn\'t tied everywhere.',
        solution: `import pandas as pd

TEST = pd.DataFrame({
    "variant": ["A", "A", "B", "B"],
    "device": ["mobile", "desktop", "mobile", "desktop"],
    "visitors": [200, 800, 800, 200],
    "conversions": [10, 80, 48, 22],
})

def overall_rates(df):
    totals = df.groupby("variant")[["conversions", "visitors"]].sum()
    return totals["conversions"] / totals["visitors"]

def segment_rates(df):
    df = df.assign(rate=df["conversions"] / df["visitors"])
    return df.pivot(index="device", columns="variant", values="rate")

def better_in_every_segment(df):
    table = segment_rates(df)
    for variant in table.columns:
        others = table.drop(columns=variant)
        if (table[variant].values[:, None] > others.values).all():
            return variant
    return None`,
        tests: [
          {
            name: "Overall rates pool the visitors",
            expression:
              'abs(overall_rates(TEST)["A"] - 0.09) < 1e-9 and abs(overall_rates(TEST)["B"] - 0.07) < 1e-9',
          },
          {
            name: "Rates per device and variant",
            expression:
              'abs(segment_rates(TEST).loc["mobile", "B"] - 0.06) < 1e-9 and abs(segment_rates(TEST).loc["desktop", "A"] - 0.10) < 1e-9',
          },
          { name: "B wins in every segment", expression: 'better_in_every_segment(TEST) == "B"' },
          {
            name: "No winner when the segments disagree",
            expression:
              'better_in_every_segment(pd.DataFrame({"variant": ["A", "A", "B", "B"], "device": ["m", "d", "m", "d"], "visitors": [100, 100, 100, 100], "conversions": [5, 20, 6, 10]})) is None',
          },
        ],
      },
    ],
  },
  "da-tell.charts": {
    summary:
      "Get the table into the shape a chart needs: aggregated, ordered, gaps filled, and shares when shares are the point.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: "Choosing the chart type is the easy part (the Excel course covers it: lines for change over time, sorted bars for ranking). Most charting pain comes from **data in the wrong shape**. A chart wants one row per point on the x-axis and one column per series, already aggregated, in the right order, with no gaps.",
      },
      {
        kind: "code",
        language: "python",
        caption: "Long rows → a wide table, one column per series",
        code: `df["month"] = df["date"].str[:7]                    # "2026-02-25" → "2026-02"
table = df[df["status"] == "paid"].pivot_table(
    index="month", columns="category", values="amount",
    aggfunc="sum", fill_value=0,
).sort_index()
table.plot()      # in a notebook: a line per category, months in order`,
      },
      {
        kind: "text",
        body: 'Three details decide whether the chart is honest. **Fill the gaps with 0** when "no sales" is the truth: a missing value draws a broken line or quietly skips a month. **Order the x-axis** by time, not alphabetically, and not by how the data happened to arrive. And ask whether the story is *amounts* or *shares*: "Footwear was 80% of February" needs each row divided by its total, shown as a 100% stacked bar.',
      },
      {
        kind: "code",
        language: "text",
        caption: "Paid revenue by month (the challenge's result)",
        code: `category  Apparel  Footwear    Gear
month
2026-01     348.0       0.0   195.0
2026-02     154.0    1173.0   145.0
2026-03     269.0     324.0    20.0`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "January had no Footwear sales. Without `fill_value=0`, that cell is NaN. What does a line chart of Footwear show?",
        options: [
          "A line starting at 0 in January",
          "An error",
          "A line that starts in February, as if Footwear didn't exist yet, instead of showing zero sales in January",
          "Nothing different",
        ],
        answer: 2,
        explanation:
          'NaN means "unknown" and is skipped; 0 means "none". They tell different stories, so fill only when zero is the truth.',
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          'The message is "Footwear\'s share of revenue jumped in February". Which chart makes that clear?',
        options: [
          "A 100% stacked bar per month, each row divided by its month's total",
          "A pie chart of the whole quarter",
          "A line chart of raw revenue for each category",
          "A table of the raw orders",
        ],
        answer: 0,
        explanation:
          'Shares need a common base. Raw amounts mix the question "how big was February" with "how was it split".',
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Chart-ready tables",
        prompt:
          "Write `monthly_by_category(df)`: paid revenue with months (`YYYY-MM`, taken from `date`) as the index in time order, categories as the columns, and 0 where a category had no sales. Then write `share_by_month(table)`, which divides each row by that row's total, so every month adds up to 1.",
        language: "python",
        starter: `import io
import pandas as pd

CLEAN = """order_id,date,customer,region,category,amount,status
1001,2026-01-05,Maja Berg,North,Apparel,168.0,paid
1002,2026-01-09,Liam Walsh,West,Apparel,180.0,paid
1003,2026-01-15,Maja Berg,North,Apparel,65.0,refunded
1004,2026-01-22,Sofia Rossi,South,Gear,195.0,paid
1005,2026-02-02,Noah Keller,Unknown,Gear,90.0,paid
1006,2026-02-06,Aisha Khan,West,Apparel,154.0,paid
1008,2026-02-19,Maja Berg,North,Gear,55.0,paid
1009,2026-02-25,Lucas Silva,South,Footwear,1173.0,paid
1010,2026-03-03,Sofia Rossi,South,Apparel,72.0,paid
1011,2026-03-08,Aisha Khan,West,Gear,90.0,refunded
1012,2026-03-12,Emma Novak,East,Apparel,197.0,paid
1013,2026-03-18,Noah Keller,North,Gear,20.0,paid
1014,2026-03-24,Maja Berg,North,Footwear,324.0,paid
"""

def load():
    return pd.read_csv(io.StringIO(CLEAN))

def monthly_by_category(df):
    # your code here
    pass

def share_by_month(table):
    # your code here
    pass

print(monthly_by_category(load()))`,
        hint: 'Add the month with `df["date"].str[:7]` (use `df.assign(...)` to avoid changing the input). Then `pivot_table(..., aggfunc="sum", fill_value=0).sort_index()`. For shares: `table.div(table.sum(axis=1), axis=0)`.',
        solution: `import io
import pandas as pd

CLEAN = """order_id,date,customer,region,category,amount,status
1001,2026-01-05,Maja Berg,North,Apparel,168.0,paid
1002,2026-01-09,Liam Walsh,West,Apparel,180.0,paid
1003,2026-01-15,Maja Berg,North,Apparel,65.0,refunded
1004,2026-01-22,Sofia Rossi,South,Gear,195.0,paid
1005,2026-02-02,Noah Keller,Unknown,Gear,90.0,paid
1006,2026-02-06,Aisha Khan,West,Apparel,154.0,paid
1008,2026-02-19,Maja Berg,North,Gear,55.0,paid
1009,2026-02-25,Lucas Silva,South,Footwear,1173.0,paid
1010,2026-03-03,Sofia Rossi,South,Apparel,72.0,paid
1011,2026-03-08,Aisha Khan,West,Gear,90.0,refunded
1012,2026-03-12,Emma Novak,East,Apparel,197.0,paid
1013,2026-03-18,Noah Keller,North,Gear,20.0,paid
1014,2026-03-24,Maja Berg,North,Footwear,324.0,paid
"""

def load():
    return pd.read_csv(io.StringIO(CLEAN))

def monthly_by_category(df):
    paid = df[df["status"] == "paid"].assign(month=lambda d: d["date"].str[:7])
    return paid.pivot_table(
        index="month", columns="category", values="amount", aggfunc="sum", fill_value=0
    ).sort_index()

def share_by_month(table):
    return table.div(table.sum(axis=1), axis=0)`,
        tests: [
          {
            name: "Months in time order",
            expression:
              'list(monthly_by_category(load()).index) == ["2026-01", "2026-02", "2026-03"]',
          },
          {
            name: "One column per category",
            expression:
              'list(monthly_by_category(load()).columns) == ["Apparel", "Footwear", "Gear"]',
          },
          {
            name: "Paid revenue per cell, with 0 for no sales",
            expression:
              'monthly_by_category(load()).loc["2026-02", "Footwear"] == 1173 and monthly_by_category(load()).loc["2026-01", "Footwear"] == 0 and monthly_by_category(load()).loc["2026-01", "Apparel"] == 348',
          },
          {
            name: "Shares add up to 1 each month",
            expression:
              '(abs(share_by_month(monthly_by_category(load())).sum(axis=1) - 1) < 1e-9).all() and abs(share_by_month(monthly_by_category(load())).loc["2026-03", "Apparel"] - 269 / 613) < 1e-9',
          },
        ],
      },
    ],
  },
  "da-tell.dashboard": {
    summary:
      "Pick a few metrics that drive decisions, define them precisely, and give every number something to compare against.",
    xp: 180,
    blocks: [
      {
        kind: "text",
        body: "A dashboard is for a **decision** someone makes regularly: who looks at it, how often, and what will they do differently depending on what they see? If nobody can answer that, you're building a report nobody reads. Start with 3 to 5 headline metrics (KPIs) and put the most important one where the eye lands first, at the top left.",
      },
      {
        kind: "text",
        body: '**Define every metric in writing**, because "revenue" means three things to three people. *Revenue*: the sum of paid order amounts in the month; refunds and pending orders excluded. *Orders*: the count of paid orders. *Average order value (AOV)*: revenue ÷ orders. *Refund rate*: refunded orders ÷ (paid + refunded) orders. Put the definitions on the dashboard itself, or one click away.',
      },
      {
        kind: "text",
        body: '**A number alone means nothing.** Revenue 613: is that good? Give every tile a comparison: the previous period, the same month last year, or a target. Show amounts as a **% change** and rates as a **change in points** (refund rate 0% → 20% is +20 points; "+∞%" helps nobody). When there\'s nothing to divide by, show a dash rather than an error or a zero.',
      },
      {
        kind: "code",
        language: "text",
        caption: "March vs February, as tiles",
        code: `Revenue   613     ▼ 58% vs Feb (1,472)   ← Feb included one B2B order of 1,173
Orders    4       — flat
AOV       153.25  ▼ 58%
Refunds   20%     ▲ 20 pts (from 0%)`,
      },
      {
        kind: "text",
        body: "Look at that revenue tile: down 58%, but almost entirely because February had one unusual order. A good dashboard **annotates** a movement like that, so nobody launches a rescue plan for a problem that isn't there. Avoid **vanity metrics** (page views, total sign-ups ever) that only go up and never change a decision, and show when the data was last refreshed.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "Refund rate went from 0% last month to 20% this month. How should the tile show the change?",
        options: [
          "+∞%",
          "+20 percentage points, alongside the counts (1 refund in 5 orders)",
          "+20%",
          "Leave the change blank",
        ],
        answer: 1,
        explanation:
          "Rates change in points. The counts show how little evidence one refund in five orders is, which stops people over-reacting.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Which of these makes the best headline KPI for a shop's weekly trading meeting?",
        options: [
          "Total registered users since launch",
          "Page views",
          "Number of products in the catalogue",
          "Paid revenue this week against the same week last year, with the definition shown",
        ],
        answer: 3,
        explanation:
          "It's defined, it's compared against something meaningful, and it moves in response to things the team can act on. The others only grow, or don't connect to a decision.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "KPI tiles",
        prompt:
          'Write `kpis(df, month)`, which returns a dict with `revenue`, `orders`, `aov` and `refund_rate` for a `YYYY-MM` month, using the definitions above. `aov` and `refund_rate` are `None` when there\'s nothing to divide by. Then write `tiles(df, month, previous)`, which returns, for each KPI, `{"value", "previous", "change"}`. `change` is the relative change for revenue, orders and AOV (`None` if previous is 0 or None), and the difference in points for `refund_rate` (`None` if either value is None).',
        language: "python",
        starter: `import io
import pandas as pd

CLEAN = """order_id,date,customer,region,category,amount,status
1001,2026-01-05,Maja Berg,North,Apparel,168.0,paid
1002,2026-01-09,Liam Walsh,West,Apparel,180.0,paid
1003,2026-01-15,Maja Berg,North,Apparel,65.0,refunded
1004,2026-01-22,Sofia Rossi,South,Gear,195.0,paid
1005,2026-02-02,Noah Keller,Unknown,Gear,90.0,paid
1006,2026-02-06,Aisha Khan,West,Apparel,154.0,paid
1008,2026-02-19,Maja Berg,North,Gear,55.0,paid
1009,2026-02-25,Lucas Silva,South,Footwear,1173.0,paid
1010,2026-03-03,Sofia Rossi,South,Apparel,72.0,paid
1011,2026-03-08,Aisha Khan,West,Gear,90.0,refunded
1012,2026-03-12,Emma Novak,East,Apparel,197.0,paid
1013,2026-03-18,Noah Keller,North,Gear,20.0,paid
1014,2026-03-24,Maja Berg,North,Footwear,324.0,paid
"""

def load():
    return pd.read_csv(io.StringIO(CLEAN))

def kpis(df, month):
    # your code here
    pass

def tiles(df, month, previous):
    # your code here
    pass

print(tiles(load(), "2026-03", "2026-02"))`,
        hint: 'Filter with `df["date"].str.startswith(month)`. Count the paid and refunded orders separately; guard both divisions with `if ... else None`. In `tiles`, compute each KPI for both months and pick the right kind of change per metric.',
        solution: `import io
import pandas as pd

CLEAN = """order_id,date,customer,region,category,amount,status
1001,2026-01-05,Maja Berg,North,Apparel,168.0,paid
1002,2026-01-09,Liam Walsh,West,Apparel,180.0,paid
1003,2026-01-15,Maja Berg,North,Apparel,65.0,refunded
1004,2026-01-22,Sofia Rossi,South,Gear,195.0,paid
1005,2026-02-02,Noah Keller,Unknown,Gear,90.0,paid
1006,2026-02-06,Aisha Khan,West,Apparel,154.0,paid
1008,2026-02-19,Maja Berg,North,Gear,55.0,paid
1009,2026-02-25,Lucas Silva,South,Footwear,1173.0,paid
1010,2026-03-03,Sofia Rossi,South,Apparel,72.0,paid
1011,2026-03-08,Aisha Khan,West,Gear,90.0,refunded
1012,2026-03-12,Emma Novak,East,Apparel,197.0,paid
1013,2026-03-18,Noah Keller,North,Gear,20.0,paid
1014,2026-03-24,Maja Berg,North,Footwear,324.0,paid
"""

def load():
    return pd.read_csv(io.StringIO(CLEAN))

def kpis(df, month):
    in_month = df[df["date"].str.startswith(month)]
    paid = in_month[in_month["status"] == "paid"]
    refunded = in_month[in_month["status"] == "refunded"]
    revenue = float(paid["amount"].sum())
    orders = len(paid)
    settled = orders + len(refunded)
    return {
        "revenue": revenue,
        "orders": orders,
        "aov": revenue / orders if orders else None,
        "refund_rate": len(refunded) / settled if settled else None,
    }

def tiles(df, month, previous):
    now, before = kpis(df, month), kpis(df, previous)
    out = {}
    for name in now:
        value, prev = now[name], before[name]
        if name == "refund_rate":
            change = value - prev if value is not None and prev is not None else None
        else:
            change = (value - prev) / prev if value is not None and prev else None
        out[name] = {"value": value, "previous": prev, "change": change}
    return out`,
        tests: [
          {
            name: "March's KPIs match the definitions",
            expression:
              'kpis(load(), "2026-03") == {"revenue": 613, "orders": 4, "aov": 153.25, "refund_rate": 0.2}',
          },
          {
            name: "January's refund rate counts refunded against settled orders",
            expression: 'kpis(load(), "2026-01")["refund_rate"] == 0.25',
          },
          {
            name: "Revenue change is relative",
            expression:
              '(lambda t: t["revenue"]["value"] == 613 and t["revenue"]["previous"] == 1472 and abs(t["revenue"]["change"] - (613 / 1472 - 1)) < 1e-9)(tiles(load(), "2026-03", "2026-02"))',
          },
          {
            name: "Refund rate change is in points",
            expression:
              'abs(tiles(load(), "2026-03", "2026-02")["refund_rate"]["change"] - 0.2) < 1e-9',
          },
          {
            name: "A month with no orders doesn't crash",
            expression:
              'kpis(load(), "2026-04") == {"revenue": 0, "orders": 0, "aov": None, "refund_rate": None} and tiles(load(), "2026-04", "2026-03")["revenue"]["change"] == -1',
          },
        ],
      },
    ],
  },
  "xl-core.formulas": {
    summary:
      "The anatomy of a formula, the functions you'll use daily, and the difference between a value and how it's shown.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "A formula starts with `=` and calculates from other cells, so when an input changes, every result that depends on it updates. That's the whole point of a spreadsheet, and it only works if you **refer to cells rather than typing their numbers into formulas**. `=E2*F2` stays right when E2 changes; `=2*24` doesn't.",
      },
      {
        kind: "code",
        language: "text",
        caption: "The functions you'll use every day",
        code: `=SUM(G2:G13)          add up a range
=AVERAGE(G2:G13)      mean (blanks are skipped, zeros are not)
=MIN(...)  =MAX(...)  smallest and largest
=COUNT(A2:A20)        how many cells hold numbers
=COUNTA(A2:A20)       how many cells aren't empty
=ROUND(B2*1.25, 2)    round the value itself, to 2 decimals
=IF(I2>=1000, "Target met", "Below target")
=IFERROR(B2/C2, 0)    a fallback when the calculation errors`,
      },
      {
        kind: "text",
        body: "**How a number is shown isn't what it is.** Formatting a cell to two decimals changes the display, not the value: a cell showing 3.33 may hold 3.3333, and every formula that uses it sees 3.3333. When the rounded value is what should count (prices, tax), round it with `ROUND`.",
      },
      {
        kind: "text",
        body: "Read the error values rather than fearing them: `#DIV/0!` (divided by zero or an empty cell), `#VALUE!` (text where a number was expected), `#NAME?` (a misspelled function), `#REF!` (a reference to a cell that's gone) and `#N/A` (a lookup found nothing, which is the next lesson but two).",
      },
      {
        kind: "callout",
        body: "In these challenges you write one line per formula: a cell, then its formula, like `I2 =SUM(G2:G13)`. Give a range instead, like `G2:G13 =E2*F2`, and the formula is filled down it exactly as Excel's fill handle would do. The formulas run on a spreadsheet engine built for this course. It supports the everyday functions (SUM, AVERAGE, IF, SUMIFS, XLOOKUP, VLOOKUP, INDEX/MATCH and more) and behaves the way Excel does for them.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario",
        code: `A1 holds =10/3 and is formatted to show 2 decimals: 3.33
B1 holds =A1*3 and shows 10.00`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Someone checks with a calculator: 3.33 × 3 = 9.99. Why does B1 say 10.00?",
        options: [
          "Excel has a rounding bug",
          "B1 is formatted differently",
          "A1 holds 3.3333…; the format only changes how it's shown. Use `=ROUND(10/3, 2)` if 3.33 is the value you mean",
          "Multiplication rounds up",
        ],
        answer: 2,
        explanation:
          "Formatting is cosmetic. When a rounded figure is the one that should count (an invoice line, say), round the value itself.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          'Column A has 18 filled rows: 15 order ids, and 3 cells reading "pending". What do `=COUNT(A2:A19)` and `=COUNTA(A2:A19)` return?',
        options: ["18 and 18", "15 and 18", "18 and 15", "15 and 15"],
        answer: 1,
        explanation:
          "`COUNT` counts only numbers; `COUNTA` counts anything that isn't empty. A gap between the two is a quick way to spot text hiding in a numeric column.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Line totals and a summary",
        prompt:
          'Fill column G with each line\'s total (qty × unit price). Then, next to the labels in column H: **I2** total revenue, **I3** the average line total, **I4** the largest line, **I5** the number of lines, and **I6** "Target met" if revenue is at least 1,000, or "Below target" if not.',
        language: "excel",
        sheet: "lines",
        starter: `# One line per formula: a cell (or a range to fill), then the formula.
G2:G13  =
I2      =
I3      =
I4      =
I5      =
I6      =`,
        hint: '`G2:G13 =E2*F2` fills down. Then use `SUM`, `AVERAGE`, `MAX` and `COUNT` over `G2:G13`, and `=IF(I2>=1000,"Target met","Below target")`.',
        solution: `G2:G13  =E2*F2
I2      =SUM(G2:G13)
I3      =AVERAGE(G2:G13)
I4      =MAX(G2:G13)
I5      =COUNT(G2:G13)
I6      =IF(I2>=1000,"Target met","Below target")`,
        tests: [
          {
            name: "Each line total is qty × unit price",
            expression: `nearAll(values("G2:G13"), [120, 48, 180, 35, 40, 90, 130, 35, 108, 72, 162, 120])`,
          },
          {
            name: "Totals follow the data, not typed-in numbers",
            expression: `valueWith("G3", { E3: 5 }) === 120`,
          },
          {
            name: "Revenue adds up the totals",
            expression: `value("I2") === 1140 && valueWith("I2", { E2: 2 }) === 1260`,
          },
          {
            name: "Average and largest line",
            expression: `near(value("I3"), 95) && value("I4") === 180`,
          },
          { name: "Counts the lines", expression: `value("I5") === 12` },
          {
            name: "The target check responds to the data",
            expression: `value("I6") === "Target met" && valueWith("I6", { F4: 1 }) === "Below target"`,
          },
        ],
      },
    ],
  },
  "xl-core.refs": {
    summary:
      "Relative, absolute and mixed references, and laying out a model that survives changes.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: "When you fill a formula down or across, Excel adjusts its references. A **relative** reference, `B2`, means *the cell this far away from me*, so filled one row down it becomes `B3`. An **absolute** reference, `$G$1`, means *exactly this cell*, and it never moves. That's how every row can use the same discount rate.",
      },
      {
        kind: "code",
        language: "text",
        code: `B2      relative: moves both ways when filled
$G$1    absolute: never moves
$A2     column fixed, row moves: filled across it stays in column A
A$1     row fixed, column moves: filled down it stays in row 1

Press F4 (Windows) or Cmd+T (Mac) while editing a reference to cycle through these.`,
      },
      {
        kind: "text",
        body: "The classic bug: `C2 =B2*(1-G1)` works in row 2, but filled down, row 3 becomes `=B3*(1-G2)` and quietly uses the wrong cell. Anchor anything every row shares: `=B2*(1-$G$1)`.",
      },
      {
        kind: "text",
        body: "**Models that don't break** follow a few habits. Put the **inputs** (rates, targets, assumptions) in their own labelled cells, never typed into formulas. Use **one consistent formula per column**, filled, so there's no row that was fixed by hand. Add a **check cell** that should always be TRUE or zero, such as the total of the summary equalling the total of the data. Then when someone changes the VAT rate next year, it's one cell, and everything follows.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: C2 holds =B2*(1-G1), filled down to C7",
        code: `C2  =B2*(1-G1)     → 108     correct
C3  =B3*(1-G2)     → 135     wrong: uses the VAT cell
C4  =B4*(1-G3)     → 65      wrong: G3 is empty`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What's the fix?",
        options: [
          "Type the formula into each row by hand",
          "Use `=B2*0.9` so there's no reference to go wrong",
          "Move the discount into column C",
          "Anchor the discount: `=B2*(1-$G$1)`, then fill down",
        ],
        answer: 3,
        explanation:
          "The `$` keeps every row pointing at G1. Typing 0.9 into the formula works today and silently breaks the day the discount changes.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "A grid has categories down column I and months across row 1. One formula in J2 is filled across and down the whole grid. How should it refer to the category and the month?",
        options: ["`$I2` and `J$1`", "`I2` and `J1`", "`$I$2` and `$J$1`", "`I$2` and `$J1`"],
        answer: 0,
        explanation:
          "The category must stay in column I while its row changes (`$I2`). The month must stay in row 1 while its column changes (`J$1`). You'll build exactly this in the pivot lesson.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "A price list that follows its inputs",
        prompt:
          "The discount rate is in **G1** and VAT in **G2**. Fill **C2:C7** with each sale price (list price less the discount), and **D2:D7** with the sale price including VAT. Write one formula per column, and make sure that changing G1 or G2 updates every row.",
        language: "excel",
        sheet: "pricing",
        starter: `# Discount is in G1, VAT in G2.
C2:C7  =
D2:D7  =`,
        hint: "Sale price: `=B2*(1-$G$1)`. With VAT: `=C2*(1+$G$2)`. The `$` keeps every row pointing at the same input.",
        solution: `C2:C7  =B2*(1-$G$1)
D2:D7  =C2*(1+$G$2)`,
        tests: [
          {
            name: "Sale prices",
            expression: `nearAll(values("C2:C7"), [108, 162, 58.5, 31.5, 18, 81])`,
          },
          {
            name: "Prices including VAT",
            expression: `nearAll(values("D2:D7"), [135, 202.5, 73.125, 39.375, 22.5, 101.25])`,
          },
          {
            name: "Every row follows the discount in G1",
            expression: `near(valueWith("C7", { G1: 0.5 }), 45) && near(valueWith("C2", { G1: 0 }), 120)`,
          },
          {
            name: "…and the VAT rate in G2",
            expression: `near(valueWith("D5", { G2: 0 }), 31.5)`,
          },
        ],
      },
    ],
  },
  "xl-core.conditional": {
    summary:
      "Add up, count and average only the rows that match, including conditions you can change.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: "Most analysis questions sound like *the total of X where Y*. `SUMIFS` answers them: first the range to add up, then as many **range, criteria** pairs as you need. A row only counts if it meets every condition. `COUNTIFS` and `AVERAGEIFS` work the same way.",
      },
      {
        kind: "code",
        language: "text",
        code: `=SUMIFS(G2:G13, C2:C13, "Apparel")                  Apparel revenue
=SUMIFS(G2:G13, C2:C13, "Apparel", B2:B13, "Mar")   Apparel revenue in March
=COUNTIFS(B2:B13, "Feb")                            lines in February
=AVERAGEIFS(G2:G13, C2:C13, "Gear")                 average Gear line`,
      },
      {
        kind: "text",
        body: 'Criteria are text with an optional operator: `">=100"`, `"<>Gear"`, and `"Wool*"` (where `*` matches anything and `?` matches one character). Text matching ignores case. To use a **cell** in a criterion, join the operator to it with `&`: `">="&J7`. Writing `">=J7"` compares against the letters *J7*.',
      },
      {
        kind: "text",
        body: 'Watch the argument order. `SUMIFS` puts the sum range **first**, but the older `SUMIF` puts it **last**: `=SUMIF(C2:C13, "Apparel", G2:G13)`. Every range in one `SUMIFS` must also be the same size, or you get `#VALUE!`. Put the conditions in labelled cells, as this challenge does, and one formula answers the question for any category.',
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "The threshold is in J7. Which formula counts the lines with a total of at least that amount?",
        options: [
          '`=COUNTIFS(G2:G13, ">=J7")`',
          "`=COUNTIFS(G2:G13, >=J7)`",
          '`=COUNTIFS(G2:G13, ">="&J7)`',
          "`=COUNTIFS(J7, G2:G13)`",
        ],
        answer: 2,
        explanation:
          'Inside quotes, J7 is just two letters. `&` builds the criterion text from the operator and the cell\'s value, for example ">=100".',
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Which formula adds up column G for the Gear rows?",
        options: [
          '`=SUMIFS(C2:C13, "Gear", G2:G13)`',
          '`=SUMIF(G2:G13, "Gear", C2:C13)`',
          '`=SUMIFS(G2:G13, "Gear")`',
          '`=SUMIFS(G2:G13, C2:C13, "Gear")`',
        ],
        answer: 3,
        explanation:
          'SUMIFS: what to add up, then where to look and what to look for. (The SUMIF equivalent is `=SUMIF(C2:C13, "Gear", G2:G13)`.)',
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Answer the questions",
        prompt:
          "Each question in column I gets its answer in column J. **J2** Apparel revenue. **J3** the number of lines in Feb. **J4** Apparel revenue in Mar. **J5** the number of lines whose total is at least the threshold in **J7**. **J6** revenue for the category named in **J8**. J5 and J6 must follow their input cells.",
        language: "excel",
        sheet: "conditional",
        starter: `# Totals are in G2:G13, month in B, category in C.
J2  =
J3  =
J4  =
J5  =
J6  =`,
        hint: 'Build J5 from `">="&J7`, and use J8 directly as the criteria in J6: `=SUMIFS(G2:G13,C2:C13,J8)`.',
        solution: `J2  =SUMIFS(G2:G13,C2:C13,"Apparel")
J3  =COUNTIFS(B2:B13,"Feb")
J4  =SUMIFS(G2:G13,C2:C13,"Apparel",B2:B13,"Mar")
J5  =COUNTIFS(G2:G13,">="&J7)
J6  =SUMIFS(G2:G13,C2:C13,J8)`,
        tests: [
          { name: "Apparel revenue", expression: `value("J2") === 592` },
          { name: "Lines in February", expression: `value("J3") === 4` },
          { name: "Apparel revenue in March", expression: `value("J4") === 234` },
          {
            name: "Uses the threshold in J7",
            expression: `value("J5") === 6 && valueWith("J5", { J7: 150 }) === 2`,
          },
          {
            name: "Uses the category in J8",
            expression: `value("J6") === 348 && valueWith("J6", { J8: "Gear" }) === 200`,
          },
        ],
      },
    ],
  },
  "xl-core.lookups": {
    summary:
      "Pull a value from another table by its key, handle keys that aren't there, and avoid VLOOKUP's silent failures.",
    xp: 160,
    blocks: [
      {
        kind: "text",
        body: "A **lookup** fetches a value from another table using a key: the price for a product code, or the region for a customer id. `XLOOKUP` (in Microsoft 365, Excel 2021 and later, and Google Sheets) takes what to find, where to find it, and what to return, and matches exactly by default.",
      },
      {
        kind: "code",
        language: "text",
        code: `=XLOOKUP(B2, $H$2:$H$7, $J$2:$J$7)                 the price for the code in B2
=XLOOKUP(B2, $H$2:$H$7, $J$2:$J$7, "Not found")    …with a value for missing codes`,
      },
      {
        kind: "text",
        body: "When the key isn't in the table, a lookup returns `#N/A`. That's information, not noise: a product code that doesn't exist should be visible. Prefer XLOOKUP's own *if not found* argument to wrapping everything in `IFERROR`, because IFERROR also hides the typos and broken ranges you'd want to see.",
      },
      {
        kind: "text",
        body: "**Why VLOOKUP bites.** `=VLOOKUP(B2, H2:J7, 3, FALSE)` does the same job, with three traps. First, its last argument defaults to **approximate** match, so leaving off `FALSE` on an unsorted code list returns a *wrong* row with no error at all. Second, the column number `3` is typed in, so inserting a column in the table silently shifts the result. Third, it can only return columns to the right of the key. If you're stuck with an old Excel, `INDEX(J2:J7, MATCH(B2, H2:H7, 0))` avoids the last two.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: product codes aren't sorted",
        code: `=VLOOKUP("XXX-999", $H$2:$J$7, 3)     → 90
There is no product XXX-999, and there's no error either.`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Why did it return a price for a product that doesn't exist?",
        options: [
          "XXX-999 is hidden somewhere in the table",
          "The fourth argument was left out, so VLOOKUP used approximate match: it assumes sorted keys and returns the last row that isn't greater than the code",
          "Column 3 is the wrong column",
          "VLOOKUP can't read text codes",
        ],
        answer: 1,
        explanation:
          "Approximate match is for bands, like tax brackets on sorted thresholds. For codes and ids, always match exactly: `FALSE` in VLOOKUP, or XLOOKUP, which is exact by default and returns #N/A (or your fallback) for a missing code.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          '`=VLOOKUP(B2, H2:J7, 3, FALSE)` worked. Then someone inserted a "Supplier" column between Category and Price. What does the formula return now?',
        options: [
          "The supplier: column 3 of the table is now Supplier, and there's no error to warn you",
          "The price, because Excel adjusts it",
          "#REF!",
          "#N/A",
        ],
        answer: 0,
        explanation:
          "The range grows to H2:K7, but the typed-in 3 doesn't move. XLOOKUP's return range adjusts with the insertion, so it keeps returning the price.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Price the order lines",
        prompt:
          "The product table is in **H1:J7** (code, category, price). Fill **D2:D7** with each line's unit price and **E2:E7** with its category, looked up by the product code in column B. A code that isn't in the table should show \"Not found\" rather than #N/A. Line 6's code is lower-case; it should still match.",
        language: "excel",
        sheet: "lookup",
        starter: `# Product table: codes H2:H7, categories I2:I7, prices J2:J7.
D2:D7  =
E2:E7  =`,
        hint: '`=XLOOKUP(B2,$H$2:$H$7,$J$2:$J$7,"Not found")`. Anchor the table with `$`, because every row looks in the same place.',
        solution: `D2:D7  =XLOOKUP(B2,$H$2:$H$7,$J$2:$J$7,"Not found")
E2:E7  =XLOOKUP(B2,$H$2:$H$7,$I$2:$I$7,"Not found")`,
        tests: [
          {
            name: "Unit prices",
            expression: `nearAll(values("D2:D7"), [120, 24, 35, "Not found", 180, 20])`,
          },
          {
            name: "Categories",
            expression: `nearAll(values("E2:E7"), ["Footwear", "Apparel", "Gear", "Not found", "Apparel", "Gear"])`,
          },
          {
            name: "An unknown code says so instead of #N/A",
            expression: `value("D5") === "Not found" && value("E5") === "Not found"`,
          },
          {
            name: "Prices follow the product table",
            expression: `valueWith("D6", { J3: 199 }) === 199`,
          },
        ],
      },
    ],
  },
  "xl-analysis.pivots": {
    summary:
      "Summarise thousands of rows by dragging fields, and know exactly what the pivot is calculating.",
    xp: 170,
    blocks: [
      {
        kind: "text",
        body: "A **pivot table** summarises a list without formulas. You drag fields into four areas: **Rows** (one row per category), **Columns** (one column per month), **Values** (what to calculate, such as the sum of Total) and **Filters** (which rows to include). To make one, click in your data, then Insert → PivotTable.",
      },
      {
        kind: "text",
        body: "Three things catch people out. First, **a pivot doesn't update itself**: after the data changes, right-click it and choose Refresh. Second, if the data isn't a **Table** (Ctrl+T), new rows added below it aren't included even after a refresh. Third, if a numbers column contains a single blank or text cell, the pivot defaults to **Count** instead of Sum, and the totals look plausible and are wrong. Always read the Values label: *Sum of Total*, not *Count of Total*.",
      },
      {
        kind: "text",
        body: "A pivot is a grid of `SUMIFS`, one per cell, and knowing that makes you better at both. When a report needs fixed layouts, labels and checks that survive other people's edits, analysts often build the grid with formulas instead. That's the challenge: build the pivot yourself with **one** formula filled across the grid, using the mixed references from two lessons ago.",
      },
      {
        kind: "text",
        body: "Whichever way you build it, **reconcile**: the grand total of the summary must equal the total of the source data. A check cell like `=M5=SUM(G2:G13)`, which should always say TRUE, catches a filter left on, a row outside the range, or a category spelled two ways.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "You pasted April's orders under the March data, but the pivot still shows only Jan–Mar. What happened?",
        options: [
          "Pivots only handle three months",
          "The pivot hasn't been refreshed, and if the source isn't a Table, its range doesn't include the new rows",
          "April needs its own pivot",
          "The Month field needs sorting",
        ],
        answer: 1,
        explanation:
          "Make the source a Table (Ctrl+T) so its range grows with the data, then Refresh. Both steps are needed.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "A pivot's Values area says \"Count of Amount\" and shows small whole numbers. What's most likely?",
        options: [
          "Amount contains a blank or text cell, so Excel defaulted to Count. Fix the data and switch it to Sum",
          "Every amount is 1",
          "Count is the correct summary for money",
          "The pivot is filtered",
        ],
        answer: 0,
        explanation:
          'One stray text cell ("n/a", a space) flips the default. Clean the column, then set Summarize Values By → Sum.',
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Build the pivot by hand",
        prompt:
          "Fill the grid with revenue by category (rows, **I2:I4**) and month (columns, **J1:L1**) using **one** formula entered for J2 and filled across **J2:L4**. Then add row totals in **M2:M4**, column totals and the grand total in **J5:M5**, and a check in **M7** that's TRUE when the grand total equals the total of G2:G13.",
        language: "excel",
        sheet: "pivot",
        starter: `# One formula for J2, filled across the whole grid.
J2:L4  =
M2:M4  =
J5:M5  =
M7     =`,
        hint: "`=SUMIFS($G$2:$G$13,$C$2:$C$13,$I2,$B$2:$B$13,J$1)`. The data ranges are fully anchored, the category column is fixed (`$I2`) and the month row is fixed (`J$1`).",
        solution: `J2:L4  =SUMIFS($G$2:$G$13,$C$2:$C$13,$I2,$B$2:$B$13,J$1)
M2:M4  =SUM(J2:L2)
J5:M5  =SUM(J2:J4)
M7     =M5=SUM(G2:G13)`,
        tests: [
          {
            name: "Revenue by category and month",
            expression: `nearAll(values("J2:L4"), [228, 130, 234, 120, 108, 120, 75, 125, 0])`,
          },
          { name: "Row totals", expression: `nearAll(values("M2:M4"), [592, 348, 200])` },
          {
            name: "Column totals and the grand total",
            expression: `nearAll(values("J5:M5"), [423, 363, 354, 1140])`,
          },
          {
            name: "The grid follows its labels (mixed references)",
            expression: `valueWith("L4", { I4: "Apparel" }) === 234 && valueWith("K2", { K1: "Jan" }) === 228`,
          },
          { name: "The check cell reconciles with the source", expression: `value("M7") === true` },
        ],
      },
    ],
  },
  "xl-analysis.charts": {
    summary:
      "Pick the chart that fits the question, and don't let the axis tell a different story from the data.",
    xp: 100,
    blocks: [
      {
        kind: "text",
        body: 'A chart exists to make one comparison obvious. Decide what that comparison is *before* choosing the chart, and put it in the title as a finding ("Apparel drove Q1 revenue"), not as a label ("Revenue by category").',
      },
      {
        kind: "code",
        language: "text",
        caption: "Match the chart to the question",
        code: `How does it change over time?       line chart (time on the horizontal axis)
Which categories are biggest?       bar chart, sorted, largest first
How is a whole split? (2–4 parts)   stacked bar; a pie only if there are very few slices
How do two measures relate?         scatter plot`,
      },
      {
        kind: "text",
        body: "**Bars must start at zero.** A bar's length *is* the value, so starting the axis at 95 makes 96 look like half of 98. Line charts can zoom in on a range, as long as the axis is clearly labelled. Avoid 3-D effects (they distort sizes), dual axes (the reader can't tell which line belongs to which scale), and legends the eye has to hunt through. Label the series directly instead.",
      },
      {
        kind: "text",
        body: "Keep the chart honest to its source. Chart from the summary you've reconciled, include the units, and note what's excluded: *paid orders only; refunds excluded*.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "You want to show how monthly revenue changed over the last 12 months. Which chart?",
        options: [
          "A pie with one slice per month",
          "A 3-D column chart",
          "A scatter plot of revenue against order count",
          "A line chart with months in order along the horizontal axis",
        ],
        answer: 3,
        explanation:
          "Change over time is a line's job: the slope is the story. Twelve pie slices hide it completely.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario: a bar chart of satisfaction scores",
        code: `Store A  98%   ████████████████████
Store B  96%   ████████████
axis starts at 95%`,
      },
      {
        kind: "mcq",
        id: "q2",
        question: "What's wrong with this chart?",
        options: [
          "Nothing: the difference is real",
          "It should be a pie",
          "Bars that start at 95% make a 2-point gap look like a 2-to-1 gap. Start bars at zero, or show the numbers without bars",
          "The bars need 3-D shading",
        ],
        answer: 2,
        explanation:
          "A bar's length encodes its value. Cut the axis and the lengths lie, even though every number printed on the chart is correct.",
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "Revenue is split across nine product categories. What's the clearest way to show the split?",
        options: [
          "A bar chart sorted from largest to smallest",
          "A pie chart with nine slices",
          "A line chart of the categories",
          "A pie chart with a legend",
        ],
        answer: 0,
        explanation:
          'People compare lengths far more accurately than angles, and sorting puts the answer ("which is biggest?") first.',
      },
    ],
  },
  "py-basics.hello": {
    summary: "Run your first lines of Python, print output, and store values in variables.",
    xp: 80,
    blocks: [
      {
        kind: "text",
        body: "A Python program is a list of instructions that runs from top to bottom, one line at a time. The first instruction most people learn is `print`, which shows a value on screen. Text goes in quotes, and anything after a `#` is a **comment**: a note for humans that Python ignores.",
      },
      {
        kind: "code",
        language: "python",
        code: `# This line is a comment
print("Hello, Python!")
print(2 + 3)        # 5: without quotes, Python calculates
print("2 + 3")      # 2 + 3: in quotes, it's just text`,
      },
      {
        kind: "text",
        body: 'A **variable** is a name for a value, so you can use it again later. `name = "Ada"` means *let `name` refer to "Ada"*. The `=` sign assigns; it isn\'t the equals from maths, so `count = count + 1` is perfectly sensible: work out `count + 1`, then store the result back in `count`.',
      },
      {
        kind: "code",
        language: "python",
        code: `name = "Ada"
city = "Oslo"
print("Hello, " + name + "!")   # + joins pieces of text
print(name, "lives in", city)   # print adds a space between items`,
      },
      {
        kind: "text",
        body: "Names are case-sensitive (`City` and `city` are different), and Python style writes them in `snake_case`. When you misspell one, Python stops with a `NameError` saying which name it doesn't know. Errors are normal and useful: read the **last line** first, because it says what went wrong.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: 'What do `print("7 * 6")` and `print(7 * 6)` show?',
        options: [
          {
            text: "42 and 42",
            whyNot:
              "Quotes make text. The first print shows those characters exactly as typed; it doesn't work anything out.",
          },
          "7 * 6 and 42",
          {
            text: "7 * 6 and 7 * 6",
            whyNot:
              "Without quotes, Python works the expression out before printing, so the second line isn't shown as written.",
          },
          {
            text: "An error, because you can't multiply in print",
            whyNot:
              "You can put any expression inside print(). Python evaluates it first, then prints the result.",
          },
        ],
        answer: 1,
        explanation:
          "Quotes make text, shown exactly as written. Without quotes, Python evaluates the expression first.",
      },
      {
        kind: "code",
        language: "python",
        caption: "Scenario",
        code: `points = 10
points = points + 5
print(points)`,
      },
      {
        kind: "mcq",
        id: "q2",
        question: "What does this print?",
        options: [
          "15",
          {
            text: "10",
            whyNot:
              "The second line changes what points refers to before print runs. Python works out the right-hand side and stores the result.",
          },
          {
            text: "points + 5",
            whyNot:
              "There are no quotes, so this isn't text. Python evaluates the right-hand side and stores the number it gets.",
          },
          {
            text: "An error, because points can't equal points + 5",
            whyNot:
              "= isn't a claim that both sides are equal. It works out the right side first, then points the name at the result.",
          },
        ],
        answer: 0,
        explanation:
          "The right-hand side is worked out first (10 + 5), and then the name `points` is pointed at the result. `=` stores a value; it doesn't state that two things are equal.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Greet yourself",
        prompt:
          "Put your own name and city into the variables `name` and `city`, then print exactly `Hello, <name> from <city>!`, for example `Hello, Ada from Oslo!`. Build the message from the variables rather than typing it out.",
        language: "python",
        starter: `name = ""
city = ""

print("Hello!")`,
        hint: 'Fill in both strings, then join the pieces with `+`: `"Hello, " + name + " from " + city + "!"`.',
        solution: `name = "Ada"
city = "Oslo"

print("Hello, " + name + " from " + city + "!")`,
        tests: [
          {
            name: "name and city are filled in",
            expression:
              'isinstance(name, str) and isinstance(city, str) and name.strip() != "" and city.strip() != ""',
          },
          {
            name: "Prints the greeting built from them",
            expression: '__stdout__.strip() == "Hello, " + name + " from " + city + "!"',
          },
        ],
      },
    ],
  },
  "py-basics.types": {
    summary:
      "Numbers and text behave differently. Convert between them, and format output with f-strings.",
    xp: 100,
    blocks: [
      {
        kind: "text",
        body: 'Every value has a **type**. The ones you\'ll use constantly are `int` (whole numbers, like `3`), `float` (decimals, like `24.5`), `str` (text, like `"socks"`) and `bool` (`True` or `False`). `type(x)` tells you which one you have. Most beginner bugs are a value of one type where another was expected.',
      },
      {
        kind: "code",
        language: "python",
        code: `7 / 2      # 3.5   / always gives a float
7 // 2     # 3     // divides and rounds down
7 % 2      # 1     % is the remainder
2 ** 3     # 8     ** is power
0.1 + 0.2  # 0.30000000000000004: floats are approximations`,
      },
      {
        kind: "text",
        body: '**Text isn\'t a number, even when it looks like one.** `"3" + "4"` is `"34"`, because `+` joins strings. Data from forms, files and web requests almost always arrives as text, so convert it first: `int("3")`, `float("24.50")`, and `str(3)` to go the other way. Converting text that isn\'t a number raises a `ValueError`.',
      },
      {
        kind: "text",
        body: 'Strings come with methods: `.strip()` trims spaces from both ends, `.lower()` and `.upper()` change case, `.replace(",", "")` swaps text, and `len(s)` counts characters. They return a *new* string. Strings never change in place, so keep the result: `s = s.strip()`.',
      },
      {
        kind: "code",
        language: "python",
        caption: "f-strings: the readable way to build text",
        code: `item, qty, price = "Wool Socks", 3, 24
print(f"{qty} x {item} costs \${qty * price:.2f}")
# 3 x Wool Socks costs $72.00   (.2f = two decimal places)`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: 'A form gives you `qty = "2"` and `extra = "3"`. What is `qty + extra`?',
        options: [
          {
            text: "5",
            whyNot:
              "That would need numbers. Both values came from a form as strings, and + on two strings joins them.",
          },
          {
            text: '"5"',
            whyNot:
              "+ on strings doesn't add the digits up. It joins the two pieces of text end to end.",
          },
          {
            text: "An error",
            whyNot:
              "Adding two strings is allowed: + joins them. The error comes when you mix a string with a number.",
          },
          '"23"',
        ],
        answer: 3,
        explanation:
          "Both are strings, so `+` joins them. Use `int(qty) + int(extra)` to get 5, and convert as soon as the data comes in.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "Which expression gives the number of whole boxes of 6 you can fill with 20 items?",
        options: [
          {
            text: "20 / 6",
            whyNot: "/ always gives a float, here 3.333…, and you can't fill a third of a box.",
          },
          {
            text: "20 % 6",
            whyNot:
              "% gives the remainder: the items left over after filling boxes, not how many boxes were filled.",
          },
          "20 // 6",
          {
            text: "round(20 / 6)",
            whyNot:
              "round happens to give the right count here, but it rounds to the nearest whole number. With 23 items it gives 4, and only 3 boxes can be filled.",
          },
        ],
        answer: 2,
        explanation:
          "`//` divides and rounds down: 3 full boxes. `%` gives what's left over (2), and `round` would give 3 here but rounds up past .5.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Prices in, receipt out",
        prompt:
          'Write `parse_price(text)`, which turns price text like `"$1,299.50"` or `" 20 "` into a float, ignoring spaces, `$` and commas. Then write `receipt_line(item, qty, unit_price)`, which returns a line like `3 x Wool Socks @ $24.00 = $72.00`, with both amounts to two decimal places.',
        language: "python",
        starter: `def parse_price(text):
    # your code here
    pass

def receipt_line(item, qty, unit_price):
    # your code here
    pass

print(receipt_line("Wool Socks", 3, parse_price("$24")))`,
        hint: 'Chain the string methods: `text.strip().replace("$", "").replace(",", "")`, then `float(...)`. For the line, use an f-string with `:.2f` on both amounts.',
        solution: `def parse_price(text):
    return float(text.strip().replace("$", "").replace(",", ""))

def receipt_line(item, qty, unit_price):
    return f"{qty} x {item} @ \${unit_price:.2f} = \${qty * unit_price:.2f}"`,
        tests: [
          {
            name: "Reads a price with $ and commas",
            expression: 'parse_price("$1,299.50") == 1299.5',
          },
          {
            name: "Ignores surrounding spaces and returns a float",
            expression: 'parse_price(" 20 ") == 20.0 and isinstance(parse_price("20"), float)',
          },
          {
            name: "Builds the receipt line",
            expression: 'receipt_line("Wool Socks", 3, 24) == "3 x Wool Socks @ $24.00 = $72.00"',
          },
          {
            name: "Rounds to two decimal places",
            expression: 'receipt_line("Headlamp", 1, 34.999) == "1 x Headlamp @ $35.00 = $35.00"',
          },
        ],
      },
    ],
  },
  "py-basics.flow": {
    summary: "Make decisions with if, elif and else, and know what Python counts as true.",
    xp: 110,
    blocks: [
      {
        kind: "text",
        body: "`if` runs a block of code only when a condition is true. The block is whatever is **indented** underneath; indentation isn't decoration in Python, it's how the language knows what belongs to the `if`. Add `elif` for more cases and `else` for everything left over.",
      },
      {
        kind: "code",
        language: "python",
        code: `score = 87

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
else:
    grade = "C"

print(grade)  # B`,
      },
      {
        kind: "text",
        body: "Python checks the conditions from top to bottom and runs **only the first** true branch. Order matters: put the strictest condition first, or it will never be reached.",
      },
      {
        kind: "text",
        body: 'Comparisons give `True` or `False`: `==` (equal; a single `=` assigns, and `if x = 5:` is a syntax error), `!=`, `<`, `<=`, `>`, `>=`. Combine them with `and`, `or` and `not`, and test membership with `in`: `if country in ("NO", "SE", "DK"):`.',
      },
      {
        kind: "text",
        body: "Any value can stand in for a condition. **Empty and zero values count as false**: `\"\"`, `0`, `0.0`, `[]`, `{}` and `None`. Everything else counts as true. That's why `if name:` means *if name isn't empty*.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Why must the `>= 90` branch come before `>= 80`?",
        options: [
          {
            text: "Python sorts conditions automatically",
            whyNot:
              "Python never reorders conditions. It checks them top to bottom and runs the first one that matches.",
          },
          "A score of 95 also satisfies >= 80, so the looser branch would win first",
          {
            text: "elif cannot follow a stricter condition",
            whyNot:
              "elif can follow any condition. Python accepts this order happily; it just gives the wrong grade.",
          },
          {
            text: "It does not matter",
            whyNot:
              "It matters: only the first matching branch runs, so a high score would stop at the looser check.",
          },
        ],
        answer: 1,
        explanation: "Only the first matching branch runs, so looser conditions must come last.",
      },
      {
        kind: "code",
        language: "python",
        caption: "Scenario: the user typed only spaces",
        code: `name = "   ".strip()

if name:
    print("Hi", name)
else:
    print("Please enter your name")`,
      },
      {
        kind: "mcq",
        id: "q2",
        question: "What does this print?",
        options: [
          {
            text: "Hi",
            whyNot:
              ".strip() removes all the spaces, leaving an empty string. An empty string counts as false, so the if branch doesn't run.",
          },
          {
            text: "Hi followed by three spaces",
            whyNot:
              ".strip() removes the spaces before the check, and what's left is empty, which counts as false.",
          },
          {
            text: "An error, because a string isn't a condition",
            whyNot:
              "Any value can be a condition. A string counts as true when it has characters and false when it's empty.",
          },
          "Please enter your name",
        ],
        answer: 3,
        explanation:
          "`.strip()` leaves an empty string, and an empty string counts as false, so the `else` branch runs.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Grade the score",
        prompt:
          "Write a function `grade(score)` returning 'A' for 90+, 'B' for 80-89, and 'C' below 80.",
        language: "python",
        starter: `def grade(score):
    # your code here
    pass

print(grade(87))`,
        hint: "Use if / elif / else and `return` inside each branch, strictest condition first.",
        solution: `def grade(score):
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    return "C"`,
        tests: [
          { name: "95 scores an A", expression: 'grade(95) == "A"' },
          { name: "90 is the boundary for an A", expression: 'grade(90) == "A"' },
          { name: "87 scores a B", expression: 'grade(87) == "B"' },
          { name: "80 is the boundary for a B", expression: 'grade(80) == "B"' },
          { name: "Anything under 80 scores a C", expression: 'grade(41) == "C"' },
        ],
      },
    ],
  },
  "py-collections.lists": {
    summary:
      "Store ordered values, change a list deliberately, and know when two names point to the same list.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "A **list** holds values in order: `temps = [12, 15, 9]`. Positions (indexes) start at **0**, so `temps[0]` is 12 and `temps[-1]` is the last item. `len(temps)` is 3. Slices take a range: `temps[0:2]` is `[12, 15]`, and the end index isn't included.",
      },
      {
        kind: "code",
        language: "python",
        code: `basket = ["tent", "stove"]
basket.append("headlamp")     # add to the end
basket.insert(0, "map")       # add at a position
basket.remove("stove")        # remove the first match
last = basket.pop()           # remove and return the last item
print(basket, last)           # ['map', 'tent'] headlamp`,
      },
      {
        kind: "text",
        body: 'Reading a missing position raises `IndexError`. Before taking the first item from data that might be empty, check `if items:`. Membership is safer when you only care whether a value exists: `if "map" in basket:`.',
      },
      {
        kind: "text",
        body: "**The classic list surprise:** `b = a` does not copy a list; it gives the same list a second name. Changing `b` therefore changes `a`. Use `a.copy()`, `list(a)` or the full slice `a[:]` when the caller's original list must remain unchanged.",
      },
      {
        kind: "code",
        language: "python",
        caption: "Scenario",
        code: `packed = ["tent", "stove"]
checklist = packed
checklist.append("water")
print(packed)`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What does this print?",
        options: [
          "['tent', 'stove', 'water']",
          {
            text: "['tent', 'stove']",
            whyNot:
              "checklist = packed doesn't copy the list. Both names point at the same list, so the append shows up through packed too.",
          },
          {
            text: "['water']",
            whyNot:
              "append adds to the end; it doesn't replace what's already there. And both names share one list.",
          },
          {
            text: "An error, because packed wasn't changed",
            whyNot:
              "Printing it is fine. packed was changed, because checklist is the same list under another name.",
          },
        ],
        answer: 0,
        explanation:
          "`checklist = packed` gives one list two names, so appending through either name changes that one list. Use `checklist = packed.copy()` for an independent list.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the expression that makes an independent, shallow copy of `packed`.",
        before: "checklist = packed.",
        after: "()",
        answer: "copy",
        explanation:
          "copy creates a new outer list, so appending to checklist does not append to packed.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Update a packing list safely",
        prompt:
          "Write `update_packing_list(items, add_item, remove_item=None)`. Return a new list, leaving `items` unchanged. Remove the first occurrence of `remove_item` when it was supplied and exists, then append `add_item`. Also write `ends(items)`, returning `(first, last)`, or `(None, None)` for an empty list.",
        language: "python",
        starter: `def update_packing_list(items, add_item, remove_item=None):
    pass

def ends(items):
    pass`,
        hint: "Copy first. Remove only when `remove_item is not None and remove_item in updated`. For `ends`, handle an empty list before reading indexes 0 and -1.",
        solution: `def update_packing_list(items, add_item, remove_item=None):
    updated = items.copy()
    if remove_item is not None and remove_item in updated:
        updated.remove(remove_item)
    updated.append(add_item)
    return updated

def ends(items):
    if not items:
        return None, None
    return items[0], items[-1]`,
        tests: [
          {
            name: "Removes one item and appends the new one",
            expression:
              'update_packing_list(["tent", "stove"], "water", "stove") == ["tent", "water"]',
          },
          {
            name: "Leaves the caller's list unchanged",
            expression:
              '(lambda original: (update_packing_list(original, "water", "stove"), original == ["tent", "stove"])[1])(["tent", "stove"])',
          },
          {
            name: "A missing removal item is harmless",
            expression: 'update_packing_list(["tent"], "water", "map") == ["tent", "water"]',
          },
          {
            name: "Returns the first and last values",
            expression: 'ends(["tent", "stove", "water"]) == ("tent", "water")',
          },
          { name: "Handles an empty list", expression: "ends([]) == (None, None)" },
        ],
      },
    ],
  },
  "py-collections.dicts": {
    summary: "Look values up by key, count things, and handle keys that aren't there.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: 'A **dictionary** maps keys to values: `prices = {"tent": 180, "stove": 75}`. You look a value up by its key, `prices["tent"]`, instead of by position. Keys are unique, and they\'re usually strings or numbers. Dictionaries remember the order items were added.',
      },
      {
        kind: "code",
        language: "python",
        code: `prices = {"tent": 180, "stove": 75}
prices["headlamp"] = 35          # add or update
"tent" in prices                 # True: checks the keys
prices.get("map")                # None: no error if missing
prices.get("map", 0)             # 0: a default you choose
for item, price in prices.items():
    print(f"{item}: \${price}")`,
      },
      {
        kind: "text",
        body: "`prices[\"map\"]` raises a `KeyError` when the key isn't there. That's the right behaviour when a missing key really is a bug. When missing is normal, use `.get(key, default)` or check with `in` first.",
      },
      {
        kind: "code",
        language: "python",
        caption: "The counting pattern",
        code: `counts = {}
for word in ["tent", "stove", "tent"]:
    counts[word] = counts.get(word, 0) + 1
print(counts)   # {'tent': 2, 'stove': 1}`,
      },
      {
        kind: "text",
        body: 'Real data is often a **list of dictionaries**, one per record: `[{"name": "Tent", "price": 180}, …]`. Loop over the list, and read each record\'s fields by key.',
      },
      {
        kind: "code",
        language: "python",
        caption: "Scenario",
        code: `stock = {"tent": 4, "stove": 0}
print(stock["headlamp"])`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What happens?",
        options: [
          {
            text: "It prints 0",
            whyNot:
              "Square brackets don't supply a default. Only .get() lets you choose a value for a missing key.",
          },
          {
            text: "It prints None",
            whyNot:
              "Square brackets don't fall back to anything. .get() without a default would, but this line doesn't use .get().",
          },
          "A `KeyError: 'headlamp'` stops the program",
          {
            text: "It adds headlamp with value 0",
            whyNot:
              "Reading with square brackets never adds a key. Only assigning to stock[...] does that.",
          },
        ],
        answer: 2,
        explanation:
          'Square brackets require the key to exist. Use `stock.get("headlamp", 0)` when a missing item simply means none in stock.',
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "Which line correctly counts `word` in a `counts` dictionary, whether or not it's been seen before?",
        options: [
          "`counts[word] = counts.get(word, 0) + 1`",
          {
            text: "`counts[word] += 1`",
            whyNot:
              "This works for words already counted, but the first time a word appears there's no key to add to, so it raises an error.",
          },
          {
            text: "`counts.append(word)`",
            whyNot:
              "Dictionaries have no append; that's a list method. This line raises an AttributeError.",
          },
          {
            text: "`counts[word] = 1`",
            whyNot:
              "This sets the count back to 1 every time, so a word seen five times still shows 1.",
          },
        ],
        answer: 0,
        explanation:
          "`+= 1` raises a `KeyError` the first time a word appears, and `= 1` resets the count. `.get(word, 0)` starts new words at zero.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Count the words",
        prompt:
          "Write `count_words(text)`, which returns a dictionary of how often each word appears. Ignore letter case, and ignore the punctuation `.,!?` at the ends of words. Then write `top_word(counts)`, which returns the most frequent word. On a tie, return the one that comes first alphabetically.",
        language: "python",
        starter: `def count_words(text):
    # your code here
    pass

def top_word(counts):
    # your code here
    pass

print(count_words("The tent, the stove. THE end!"))`,
        hint: '`text.lower().split()` gives the words, and `word.strip(".,!?")` cleans each one. For `top_word`, loop over `sorted(counts)` (which sorts the keys alphabetically) and keep the first word with the highest count.',
        solution: `def count_words(text):
    counts = {}
    for word in text.lower().split():
        word = word.strip(".,!?")
        if word:
            counts[word] = counts.get(word, 0) + 1
    return counts

def top_word(counts):
    best = None
    for word in sorted(counts):
        if best is None or counts[word] > counts[best]:
            best = word
    return best`,
        tests: [
          {
            name: "Counts words, ignoring case and punctuation",
            expression:
              'count_words("The tent, the stove. THE end!") == {"the": 3, "tent": 1, "stove": 1, "end": 1}',
          },
          { name: "Empty text gives an empty dictionary", expression: 'count_words("") == {}' },
          {
            name: "Finds the most common word",
            expression: 'top_word({"a": 2, "b": 3, "c": 1}) == "b"',
          },
          {
            name: "A tie goes to the first word alphabetically",
            expression: 'top_word({"pear": 2, "apple": 2}) == "apple"',
          },
        ],
      },
    ],
  },
  "py-collections.comprehensions": {
    summary:
      "Build lists and dictionaries in one readable line, and know when a loop reads better.",
    xp: 140,
    blocks: [
      {
        kind: "text",
        body: "A **list comprehension** is a loop that builds a list, written in a single expression. Read it aloud: *the square of n, for every n in numbers, if n is even*.",
      },
      {
        kind: "code",
        language: "python",
        code: `numbers = [1, 2, 3, 4, 5, 6]
squares = [n * n for n in numbers if n % 2 == 0]
print(squares)  # [4, 16, 36]

# The loop it replaces:
squares = []
for n in numbers:
    if n % 2 == 0:
        squares.append(n * n)`,
      },
      {
        kind: "text",
        body: 'The same shape builds a **dictionary**, `{p["name"]: p["price"] for p in products}`, or feeds a function directly without making a list: `sum(p["price"] for p in products)`.',
      },
      {
        kind: "text",
        body: "**Use one when it reads more clearly than the loop, and not otherwise.** A comprehension is for *building a value*. If the loop exists to do something (print, save, send), write a loop. If you need two `if`s and a nested `for` to squeeze it into one line, a loop will be easier to read and to debug.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the comprehension that keeps only names longer than three characters.",
        before: "[name for name in names ",
        after: "]",
        answer: "if len(name) > 3",
        explanation: "The filter clause comes after the for clause.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What is `[n for n in range(10) if n % 3 == 0]`?",
        options: [
          {
            text: "[3, 6, 9]",
            whyNot:
              "range(10) starts at 0, and 0 divided by 3 leaves no remainder, so it belongs in the result.",
          },
          "[0, 3, 6, 9]",
          {
            text: "[0, 3, 6, 9, 10]",
            whyNot:
              "range(10) stops before 10, and 10 % 3 is 1 anyway, so it wouldn't pass the condition.",
          },
          {
            text: "[1, 4, 7]",
            whyNot:
              "These numbers leave a remainder of 1. The condition keeps numbers where n % 3 is 0.",
          },
        ],
        answer: 1,
        explanation:
          "`range(10)` starts at 0, and 0 % 3 is 0, so 0 is kept. The range stops before 10.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Why is `[print(order) for order in orders]` poor style?",
        options: [
          {
            text: "It's slower than a loop",
            whyNot:
              "Speed isn't the issue. The problem is what the code tells a reader it's doing.",
          },
          {
            text: "Comprehensions can't call functions",
            whyNot:
              "Comprehensions can call any function. This one runs fine; it's just the wrong tool for the job.",
          },
          {
            text: "It prints in reverse order",
            whyNot:
              "It prints in the normal order. The trouble is the list it builds and then throws away.",
          },
          "It builds a list of `None`s nobody wants, just to print. Printing is an action, so write a `for` loop",
        ],
        answer: 3,
        explanation:
          'A comprehension tells the reader "I\'m making a list". Using one for its side effects misleads them and throws the list away.',
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Only the paid orders",
        prompt:
          "Write `paid_totals(orders)`, which returns a list of the `total` of every order whose `status` is 'paid', in the original order. Then write `total_by_id(orders)`, which returns a dictionary mapping each paid order's `id` to its `total`. Use comprehensions for both.",
        language: "python",
        starter: `def paid_totals(orders):
    # your code here
    pass

def total_by_id(orders):
    # your code here
    pass`,
        hint: 'Loop over `orders` inside square brackets (a list) or curly brackets with `key: value` (a dict), and filter with `if o["status"] == "paid"`.',
        solution: `def paid_totals(orders):
    return [o["total"] for o in orders if o["status"] == "paid"]

def total_by_id(orders):
    return {o["id"]: o["total"] for o in orders if o["status"] == "paid"}`,
        tests: [
          {
            name: "Keeps only the paid orders",
            expression:
              'paid_totals([{"id": 1, "total": 10, "status": "paid"}, {"id": 2, "total": 99, "status": "pending"}]) == [10]',
          },
          {
            name: "Keeps the original order",
            expression:
              'paid_totals([{"id": 1, "total": 5, "status": "paid"}, {"id": 2, "total": 7, "status": "paid"}]) == [5, 7]',
          },
          { name: "An empty list gives an empty list", expression: "paid_totals([]) == []" },
          {
            name: "Maps paid order ids to totals",
            expression:
              'total_by_id([{"id": 1, "total": 10, "status": "paid"}, {"id": 2, "total": 99, "status": "refunded"}, {"id": 3, "total": 4, "status": "paid"}]) == {1: 10, 3: 4}',
          },
        ],
      },
    ],
  },
  "py-functions.define": {
    summary:
      "Package code into functions, return results instead of printing them, and avoid the default-argument trap.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "A **function** packages a job under a name, so you can run it whenever you need it and test it on its own. `def` defines it, **parameters** are its inputs, and `return` hands a result back to whoever called it.",
      },
      {
        kind: "code",
        language: "python",
        code: `def shipping_cost(total, express=False):
    """What shipping costs for an order of this total."""
    cost = 0 if total >= 50 else 5
    if express:
        cost += 10
    return cost

shipping_cost(30)                 # 5
shipping_cost(80, express=True)   # 10: named (keyword) arguments read clearly`,
      },
      {
        kind: "text",
        body: "**Return, don't print.** `print` shows a value to a human and then it's gone. `return` gives it to the code that called the function, which can store it, test it or pass it on. A function with no `return` returns `None`, and that is the source of many *why is my variable None?* bugs.",
      },
      {
        kind: "text",
        body: "Variables created inside a function are **local**: they exist only while the function runs. Pass in what a function needs and return what it produces. Don't reach out to change variables outside it.",
      },
      {
        kind: "text",
        body: "**The default-argument trap.** A default value is created *once*, when the function is defined, not on every call. `def add(item, basket=[])` therefore shares one list between every call that uses the default, and items pile up from earlier calls. Use `None` as the default and create the list inside the function.",
      },
      {
        kind: "code",
        language: "python",
        caption: "Scenario",
        code: `def greet(name):
    print("Hello, " + name)

message = greet("Ada")
print(message)`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What does the last line print?",
        options: [
          {
            text: "Hello, Ada",
            whyNot:
              "That line is printed by greet itself, but the function hands nothing back, so message doesn't hold it.",
          },
          {
            text: "message",
            whyNot:
              "print(message) shows what the variable holds, not its name. You'd need quotes to print the word itself.",
          },
          "None",
          {
            text: "Nothing at all",
            whyNot:
              "print always shows something, even for a variable that holds no real value. The question is what greet gave back.",
          },
        ],
        answer: 2,
        explanation:
          '`greet` prints its greeting, but it returns nothing, so `message` is `None`. Change the function to `return "Hello, " + name` and do the printing outside it.',
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          '`def add(item, basket=[]): basket.append(item); return basket`. You call `add("tent")` and then `add("stove")`. What does the second call return?',
        options: [
          {
            text: "['stove']",
            whyNot:
              "That would need a fresh list on every call. The default list is made once, when the function is defined, and reused.",
          },
          "['tent', 'stove']",
          {
            text: "['stove', 'tent']",
            whyNot:
              "append adds to the end, so the order follows the order of the calls. And both calls share one list.",
          },
          {
            text: "An error",
            whyNot:
              "Python allows a list as a default, which is what makes this bug so quiet. Both calls run without complaint.",
          },
        ],
        answer: 1,
        explanation:
          "Both calls share the single default list that was created with the function. Write `basket=None` and `if basket is None: basket = []`.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Shipping rules as functions",
        prompt:
          'Write `shipping_cost(total, country="NO", express=False)`. Domestic (`"NO"`) orders ship free from 50 and cost 5 below that. Other countries ship free from 150 and cost 15 below that. Express adds 10 either way. Then write `add_item(item, basket=None)`, which returns the basket with the item appended, where calls without a basket never share one.',
        language: "python",
        starter: `def shipping_cost(total, country="NO", express=False):
    # your code here
    pass

def add_item(item, basket=None):
    # your code here
    pass

print(shipping_cost(40), shipping_cost(200, country="DE", express=True))`,
        hint: "Choose the threshold and fee from `country` first, work out the cost, then add 10 if `express`. In `add_item`: `if basket is None: basket = []`.",
        solution: `def shipping_cost(total, country="NO", express=False):
    if country == "NO":
        cost = 0 if total >= 50 else 5
    else:
        cost = 0 if total >= 150 else 15
    if express:
        cost += 10
    return cost

def add_item(item, basket=None):
    if basket is None:
        basket = []
    basket.append(item)
    return basket`,
        tests: [
          { name: "Domestic orders under 50 cost 5", expression: "shipping_cost(40) == 5" },
          { name: "Domestic orders ship free from 50", expression: "shipping_cost(50) == 0" },
          {
            name: "Other countries: 15, free from 150",
            expression:
              'shipping_cost(100, country="DE") == 15 and shipping_cost(150, country="DE") == 0',
          },
          {
            name: "Express adds 10",
            expression:
              'shipping_cost(200, country="DE", express=True) == 10 and shipping_cost(20, express=True) == 15',
          },
          {
            name: "add_item calls don't share a basket",
            expression: 'add_item("tent") == ["tent"] and add_item("stove") == ["stove"]',
          },
          {
            name: "add_item adds to a basket you pass in",
            expression: 'add_item("map", ["tent"]) == ["tent", "map"]',
          },
        ],
      },
    ],
  },
  "py-functions.errors": {
    summary:
      "Read a traceback from the bottom up, catch only what you expect, and raise clear errors yourself.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "When something goes wrong, Python stops and prints a **traceback**. Read it from the **bottom up**. The last line gives the error's type and message, and the lines just above it show the file, line number and code where it happened. Everything higher up is the chain of calls that led there.",
      },
      {
        kind: "code",
        language: "text",
        caption: "A traceback",
        code: `Traceback (most recent call last):
  File "report.py", line 12, in <module>
    total = order_total(lines)
  File "report.py", line 5, in order_total
    total += int(line["qty"])
ValueError: invalid literal for int() with base 10: 'two'`,
      },
      {
        kind: "text",
        body: 'The usual suspects: `NameError` (a misspelled name), `TypeError` (the wrong type, like `"3" + 4`), `ValueError` (the right type but a bad value, like `int("two")`), `KeyError` and `IndexError` (something that isn\'t there), `ZeroDivisionError`, and `AttributeError: \'NoneType\' …`, which usually means a function returned `None` when you expected a value.',
      },
      {
        kind: "code",
        language: "python",
        caption: "Handle the errors you expect, and raise clear ones yourself",
        code: `def parse_age(text):
    try:
        age = int(text)
    except ValueError:
        raise ValueError(f"Age must be a whole number, not {text!r}")
    if age < 0:
        raise ValueError("Age can't be negative")
    return age`,
      },
      {
        kind: "text",
        body: "**Catch narrowly.** `except ValueError:` handles the problem you anticipated. A bare `except:`, or `except Exception: pass`, also swallows the typos and bugs you *didn't* anticipate, and the program carries on with bad data and no clue why. When your own function gets bad input, `raise` an error whose message says what was wrong.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "In the traceback above, where do you look first, and what's wrong?",
        options: [
          {
            text: "Line 12: `order_total` doesn't exist",
            whyNot:
              "Line 12 is where the call started, and order_total clearly exists: the traceback shows it running. Read the bottom lines.",
          },
          {
            text: "The top line: the traceback started",
            whyNot:
              "The top line only announces that a traceback follows. What went wrong is at the bottom.",
          },
          "The last lines: in `order_total` on line 5, a quantity was the text 'two', which `int` can't convert",
          {
            text: "Line 5 is fine; the bug must be in `int`",
            whyNot:
              "int is working correctly: 'two' isn't a number written in digits. The problem is the data reaching line 5.",
          },
        ],
        answer: 2,
        explanation:
          "The bottom says what happened and where. The data has a quantity written out in words, so either clean the data or handle that `ValueError` deliberately.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "What's wrong with wrapping a whole script in `try: … except Exception: pass`?",
        options: [
          "It hides every error, bugs included, so the script carries on with bad results and no way to see why",
          {
            text: "Nothing, because the script never crashes",
            whyNot:
              "Not crashing isn't the same as working. The script carries on with bad results and gives no sign why.",
          },
          {
            text: "It makes the script slower",
            whyNot:
              "Speed isn't the issue. The cost is information: every error, real bugs included, disappears.",
          },
          {
            text: "`Exception` doesn't catch `ValueError`",
            whyNot:
              "Exception does catch ValueError, and nearly everything else. That's exactly the problem.",
          },
        ],
        answer: 0,
        explanation:
          "A crash with a traceback is information. Catch the specific error you can actually handle, and let everything else surface.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Quantities you can trust",
        prompt:
          'Write `parse_quantity(text)`, which returns the whole number in `text` (spaces allowed). It raises `ValueError("Quantity must be a whole number")` for anything that isn\'t one, and `ValueError("Quantity must be at least 1")` for 0 or less. Then write `safe_total(lines)`, which adds up the valid quantities in a list of strings and returns `(total, bad_lines)`, where `bad_lines` lists the rejected strings. Don\'t change `error_of`; the tests use it.',
        language: "python",
        starter: `def parse_quantity(text):
    # your code here
    pass

def safe_total(lines):
    # your code here
    pass

def error_of(fn):
    """Used by the tests: the (type, message) a call raises, or None."""
    try:
        fn()
    except Exception as exc:
        return (type(exc).__name__, str(exc))
    return None

print(safe_total(["2", "x", "3", "-1"]))`,
        hint: "In `parse_quantity`, wrap `int(text)` in `try` / `except ValueError:` and raise your own message from there, then check `< 1`. In `safe_total`, call it inside `try` and, in `except ValueError:`, append the line to `bad_lines`.",
        solution: `def parse_quantity(text):
    try:
        qty = int(text)
    except ValueError:
        raise ValueError("Quantity must be a whole number")
    if qty < 1:
        raise ValueError("Quantity must be at least 1")
    return qty

def safe_total(lines):
    total = 0
    bad_lines = []
    for line in lines:
        try:
            total += parse_quantity(line)
        except ValueError:
            bad_lines.append(line)
    return total, bad_lines

def error_of(fn):
    """Used by the tests: the (type, message) a call raises, or None."""
    try:
        fn()
    except Exception as exc:
        return (type(exc).__name__, str(exc))
    return None`,
        tests: [
          { name: "Reads a quantity, ignoring spaces", expression: 'parse_quantity(" 3 ") == 3' },
          {
            name: "Rejects text that isn't a whole number",
            expression:
              'error_of(lambda: parse_quantity("three")) == ("ValueError", "Quantity must be a whole number") and error_of(lambda: parse_quantity("2.5")) == ("ValueError", "Quantity must be a whole number")',
          },
          {
            name: "Rejects zero and negatives",
            expression:
              'error_of(lambda: parse_quantity("0")) == ("ValueError", "Quantity must be at least 1") and error_of(lambda: parse_quantity("-4")) == ("ValueError", "Quantity must be at least 1")',
          },
          {
            name: "safe_total adds the good lines and reports the bad ones",
            expression: 'safe_total(["2", "x", "3", "-1"]) == (5, ["x", "-1"])',
          },
        ],
      },
    ],
  },
  "py-functions.automate": {
    summary:
      "Read a CSV file, total it up, and write a report, like a script you'd actually run on Monday morning.",
    xp: 180,
    blocks: [
      {
        kind: "text",
        body: "This is where Python pays for itself: a task you'd otherwise do by hand every week, done in a few seconds. Most of these tasks have the same shape. **Read** a file, **clean and total** the data, and **write** the result somewhere.",
      },
      {
        kind: "text",
        body: 'Open files with `with`, which closes them for you even if an error happens halfway through. Pass `encoding="utf-8"` so accented names survive, and for CSV files also pass `newline=""` (the `csv` module handles line endings itself).',
      },
      {
        kind: "code",
        language: "python",
        code: `import csv
from decimal import Decimal

with open("sales.csv", encoding="utf-8", newline="") as f:
    for row in csv.DictReader(f):          # each row is a dict keyed by the header
        amount = Decimal(row["amount"])    # exact decimal money
        print(row["category"], amount)

with open("summary.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["category", "total"])
    writer.writerow(["Gear", "55.00"])`,
      },
      {
        kind: "text",
        body: "**Real files are messy.** Validate the header once, then validate each row. A row may have `n/a`, a blank category or a non-finite number. Skip bad rows and **say so** by counting them rather than crashing on row 3,000 or quietly treating bad data as zero. For money, use `Decimal` from the original CSV text; converting through `float` first can carry binary rounding error into the result.",
      },
      {
        kind: "text",
        body: "Use the local-workflow lesson to save this as `report.py`, pass real input and output paths, and run it in a terminal. The challenge runs in the browser's small temporary file system, so `open()` works here too; its files disappear when the page is reset.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Why open files with `with open(...) as f:` rather than `f = open(...)`?",
        options: [
          {
            text: "It reads the file faster",
            whyNot:
              "with doesn't change how fast a file is read. It changes what happens when the block ends.",
          },
          {
            text: "It's required for CSV files",
            whyNot: "Any file can be opened either way. with isn't specific to CSV files.",
          },
          {
            text: "It creates the file if it's missing",
            whyNot:
              'Whether a missing file gets created depends on the mode, like "w", not on with.',
          },
          "The file is closed automatically when the block ends, even if an error happens inside it",
        ],
        answer: 3,
        explanation:
          "Unclosed files can lose writes that haven't been flushed, and they hold the file open. `with` guarantees the file is closed.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "A weekly sales file sometimes has `n/a` in the amount column. What should the script do?",
        options: [
          {
            text: "Crash, so someone fixes the file",
            whyNot:
              "One bad value would stop the whole weekly report, though the rest of the data is still useful.",
          },
          {
            text: "Count `n/a` as 0 without mentioning it",
            whyNot:
              "A total that silently counts unknown amounts as zero looks right and isn't, and nobody learns rows were affected.",
          },
          "Skip those rows, count them, and report how many were skipped",
          {
            text: "Delete those rows from the source file",
            whyNot:
              "A report script shouldn't change its source data. Deleting rows destroys the evidence that they needed fixing.",
          },
        ],
        answer: 2,
        explanation:
          "The report stays useful and honest about what it left out. Silently treating bad data as 0 produces a total that looks right and isn't.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the exact-money conversion directly from CSV text.",
        before: "amount = ",
        after: '(row["amount"])',
        answer: "Decimal",
        explanation:
          "Decimal reads the written base-10 amount without first introducing a float approximation.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "The Monday sales report",
        prompt:
          'Write `summarise(in_path, out_path)`. Require columns `date,category,amount`; otherwise raise `ValueError("CSV must contain date, category, amount")`. Total valid amounts per non-blank category with `Decimal`, then write `category,total`, highest total first and two decimals. Skip blank categories and invalid, negative or non-finite amounts. Return `(rows_used, rows_skipped)`. Let a missing input keep its normal `FileNotFoundError`. The starter creates `sales.csv`.',
        language: "python",
        starter: `import csv
from decimal import Decimal, InvalidOperation

SALES = """date,category,amount
2026-03-01,Apparel,65.00
2026-03-01,Gear,35.00
2026-03-02,Footwear,120.00
2026-03-02,Apparel,24.00
2026-03-03,Gear,n/a
2026-03-03,Gear,20.00
2026-03-04,Apparel,180.00
"""
with open("sales.csv", "w", encoding="utf-8", newline="") as f:
    f.write(SALES)

def captured_error(call):
    """Testing helper. Do not change it."""
    try:
        call()
    except Exception as error:
        return type(error).__name__, str(error)
    return None

def summarise(in_path, out_path):
    # your code here
    pass

print(summarise("sales.csv", "summary.csv"))
print(open("summary.csv", encoding="utf-8").read())`,
        hint: "Create the `DictReader`, validate `reader.fieldnames`, then loop. Parse with `Decimal` inside a narrow `try` that catches `InvalidOperation`. Also reject `not amount.is_finite()` and negative amounts. Sort `totals.items()` by each total in reverse order.",
        solution: `import csv
from decimal import Decimal, InvalidOperation

SALES = """date,category,amount
2026-03-01,Apparel,65.00
2026-03-01,Gear,35.00
2026-03-02,Footwear,120.00
2026-03-02,Apparel,24.00
2026-03-03,Gear,n/a
2026-03-03,Gear,20.00
2026-03-04,Apparel,180.00
"""
with open("sales.csv", "w", encoding="utf-8", newline="") as f:
    f.write(SALES)

def captured_error(call):
    """Testing helper. Do not change it."""
    try:
        call()
    except Exception as error:
        return type(error).__name__, str(error)
    return None

def summarise(in_path, out_path):
    totals = {}
    used = skipped = 0
    with open(in_path, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        required = {"date", "category", "amount"}
        if not required.issubset(reader.fieldnames or []):
            raise ValueError("CSV must contain date, category, amount")
        for row in reader:
            category = (row["category"] or "").strip()
            try:
                amount = Decimal((row["amount"] or "").strip())
            except InvalidOperation:
                skipped += 1
                continue
            if not category or not amount.is_finite() or amount < 0:
                skipped += 1
                continue
            totals[category] = totals.get(category, Decimal("0")) + amount
            used += 1
    with open(out_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["category", "total"])
        for category, total in sorted(totals.items(), key=lambda kv: kv[1], reverse=True):
            writer.writerow([category, f"{total:.2f}"])
    return used, skipped`,
        tests: [
          {
            name: "Returns how many rows were used and skipped",
            expression: 'summarise("sales.csv", "summary.csv") == (6, 1)',
          },
          {
            name: "Writes the header",
            expression:
              'summarise("sales.csv", "summary.csv") and open("summary.csv", encoding="utf-8").read().splitlines()[0] == "category,total"',
          },
          {
            name: "Totals per category, highest first, two decimals",
            expression:
              'summarise("sales.csv", "summary.csv") and open("summary.csv", encoding="utf-8").read().splitlines()[1:] == ["Apparel,269.00", "Footwear,120.00", "Gear,55.00"]',
          },
          {
            name: "Works on a different file",
            expression:
              '(open("other.csv", "w", encoding="utf-8", newline="").write("date,category,amount\\n2026-04-01,Gear,10\\n2026-04-02,Gear,oops\\n") > 0) and summarise("other.csv", "other-out.csv") == (1, 1) and open("other-out.csv", encoding="utf-8").read().splitlines() == ["category,total", "Gear,10.00"]',
          },
          {
            name: "Rejects a file with missing columns",
            expression:
              '(open("bad-sales.csv", "w", encoding="utf-8", newline="").write("date,amount\\n2026-04-01,10\\n") > 0) and captured_error(lambda: summarise("bad-sales.csv", "bad-out.csv")) == ("ValueError", "CSV must contain date, category, amount")',
          },
          {
            name: "Skips blank categories and negative or non-finite amounts",
            expression:
              '(open("messy.csv", "w", encoding="utf-8", newline="").write("date,category,amount\\n2026-04-01,,10\\n2026-04-02,Gear,-2\\n2026-04-03,Gear,NaN\\n2026-04-04,Gear,0.10\\n2026-04-05,Gear,0.20\\n") > 0) and summarise("messy.csv", "messy-out.csv") == (2, 3) and open("messy-out.csv", encoding="utf-8").read().splitlines()[1] == "Gear,0.30"',
          },
        ],
      },
    ],
  },
  "react-core.first": {
    summary:
      "Components are functions that turn data into UI. Write one, and render it with conditions.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: 'React rests on one idea: **the screen is a function of your data**. You don\'t tell the page *how* to change ("find the price, replace its text"). You describe what it should look like for the data you have, and React works out what to update. Most React bugs come from working against that idea.',
      },
      {
        kind: "text",
        body: "A **component** is a function whose name starts with a capital letter and that returns JSX. JSX looks like HTML, but it's JavaScript: `<h3>{product.name}</h3>` compiles to a function call, and anything inside `{}` is an ordinary JavaScript expression. A few differences from HTML follow from that: `className` instead of `class`, `htmlFor` instead of `for`, and a component returns one root element (wrap siblings in `<>…</>` when you need to).",
      },
      {
        kind: "code",
        language: "jsx",
        code: `function Price({ amount }) {
  return <p>\${amount.toFixed(2)}</p>;
}

function Stock({ count }) {
  // A condition is just JavaScript: a ternary picks one of two elements
  return count === 0 ? <p>Sold out</p> : <p>In stock: {count}</p>;
}`,
      },
      {
        kind: "text",
        body: "Data comes in as **props**, a single object argument that's usually destructured: `function Price({ amount })`. You use a component like a tag, `<Price amount={35} />`, and the curly braces pass any JavaScript value, not just strings.",
      },
      {
        kind: "text",
        body: "Watch out for `{count && <p>…</p>}`. When `count` is `0`, `&&` returns `0`, and React renders numbers, so a stray **0** appears on the page. Use `count > 0 && …` or a ternary.",
      },
      {
        kind: "callout",
        body: 'In these challenges React is already loaded: `useState` and the other hooks are available without importing. You can still write `import { useState } from "react"` out of habit; it\'s ignored. The Preview panel shows your `App` each time you click Run.',
      },
      {
        kind: "code",
        language: "jsx",
        caption: "Scenario",
        code: `function CartBadge({ count }) {
  return <span>Cart {count && <b>{count}</b>}</span>;
}

<CartBadge count={0} />`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What does this render when the cart is empty?",
        options: ["Cart", "Cart 0", "Cart false", "Nothing, because the component returns null"],
        answer: 1,
        explanation:
          "`0 && …` evaluates to `0`, and React renders numbers (`false`, `null` and `undefined` render nothing). Write `count > 0 && …`.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "You define `function productCard() {…}` and render `<productCard />`. Nothing appears, and there's no error. Why?",
        options: [
          "Components must be arrow functions",
          "It needs to be exported first",
          "Props are missing",
          "A lowercase tag is treated as an HTML element, so React renders an unknown `<productcard>` element instead of calling your function",
        ],
        answer: 3,
        explanation:
          "Capitalised names are components and lowercase names are HTML tags. Rename it to `ProductCard`.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "A product card",
        prompt:
          'Write `ProductCard({ product })`. It should render the product\'s name in an `h3`, the price formatted like `$35.00`, and "Sold out" when `stock` is 0 or "In stock: 4" otherwise. Make sure no stray 0 appears on the page. `App` already renders two cards.',
        language: "react",
        starter: `const PRODUCTS = [
  { id: 1, name: "Trail Runner Shoes", price: 120, stock: 4 },
  { id: 2, name: "Camp Stove", price: 75, stock: 0 },
];

function ProductCard({ product }) {
  // your code here
  return null;
}

export default function App() {
  return (
    <div>
      <ProductCard product={PRODUCTS[0]} />
      <ProductCard product={PRODUCTS[1]} />
    </div>
  );
}`,
        hint: "Return an `<article>` holding an `<h3>`, a `<p>` with `${product.price.toFixed(2)}`, and a ternary on `product.stock === 0`.",
        solution: `const PRODUCTS = [
  { id: 1, name: "Trail Runner Shoes", price: 120, stock: 4 },
  { id: 2, name: "Camp Stove", price: 75, stock: 0 },
];

function ProductCard({ product }) {
  return (
    <article>
      <h3>{product.name}</h3>
      <p>\${product.price.toFixed(2)}</p>
      {product.stock === 0 ? <p>Sold out</p> : <p>In stock: {product.stock}</p>}
    </article>
  );
}

export default function App() {
  return (
    <div>
      <ProductCard product={PRODUCTS[0]} />
      <ProductCard product={PRODUCTS[1]} />
    </div>
  );
}`,
        tests: [
          {
            name: "Shows the name as a heading",
            expression: `await render(<ProductCard product={{ id: 9, name: "Headlamp", price: 35, stock: 2 }} />);
return getByRole("heading", { name: "Headlamp" }) !== null;`,
          },
          {
            name: "Formats the price with two decimals",
            expression: `await render(<ProductCard product={{ id: 9, name: "Headlamp", price: 35, stock: 2 }} />);
return text().includes("$35.00");`,
          },
          {
            name: "Shows the stock when there is some",
            expression: `await render(<ProductCard product={{ id: 9, name: "Headlamp", price: 35, stock: 2 }} />);
return text().includes("In stock: 2");`,
          },
          {
            name: "Says sold out, with no stray 0 on the page",
            expression: `await render(<ProductCard product={{ id: 8, name: "Camp Stove", price: 75, stock: 0 }} />);
return text().includes("Sold out") && !text().includes("In stock") && !text().split(" ").includes("0");`,
          },
          {
            name: "App shows both products",
            expression: `await render(<App />);
return getAllByRole("heading").length === 2;`,
          },
        ],
      },
    ],
  },
  "react-core.props": {
    summary: "Split a screen into components, pass data down, and send events back up.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "Real screens are built from small components that each do one job. Start by drawing boxes on the design: a box that repeats (a product row) or has its own clear purpose (a filter panel) is a component.",
      },
      {
        kind: "text",
        body: "**Data flows down, events flow up.** A parent passes data to a child as props, and props are read-only, so the child never changes them. When the child needs to change something the parent owns, the parent passes a function as well (`onClose`, `onSelect`) and the child calls it.",
      },
      {
        kind: "text",
        body: "**`children` is how components compose.** Whatever you put between a component's tags arrives as `props.children`. That lets a `Panel` provide the frame (title, close button, spacing) while the caller decides what goes inside, which beats a component with twelve boolean props for every possible variation.",
      },
      {
        kind: "code",
        language: "jsx",
        code: `function Card({ title, children }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

<Card title="Shipping">
  <p>Free over $50.</p>
</Card>`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "A `SizePicker` child needs to change the size stored in its parent. How?",
        options: [
          'The parent passes `size` and an `onChange` function; the child calls `onChange("M")`',
          'The child sets `props.size = "M"`',
          "The child keeps its own copy of the size and the parent reads it",
          "Store the size in a global variable",
        ],
        answer: 0,
        explanation:
          "Props are read-only, and a copy would drift out of sync. The owner of the data passes down both the value and a way to change it.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "A `Panel` has grown the props `showHeader`, `headerText`, `showFooter`, `footerText`, `footerButton` and `footerButtonOnClick`. What's the better design?",
        options: [
          "Add a `config` object with the same fields",
          "Split it into `PanelWithHeader` and `PanelWithFooter`",
          "Let callers pass the content as `children`, keeping only what every panel shares (such as the title)",
          "Keep adding props as new cases appear",
        ],
        answer: 2,
        explanation:
          "Composition lets each caller decide what goes inside, without the component having to predict every variation.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Compose a panel",
        prompt:
          'Write `Panel({ title, children, onClose })`. It renders a `section` containing an `h2` with the title, a button labelled "Close" that calls `onClose`, and then the `children`. `App` is written for you: it hides the panel when it\'s closed, and shows a "Show filters" button to bring it back. (You\'ll write state like that yourself in the next lesson.)',
        language: "react",
        starter: `function Panel({ title, children, onClose }) {
  // your code here
  return null;
}

export default function App() {
  const [open, setOpen] = useState(true);
  if (!open) return <button onClick={() => setOpen(true)}>Show filters</button>;
  return (
    <Panel title="Filters" onClose={() => setOpen(false)}>
      <p>Pick a size and a colour.</p>
    </Panel>
  );
}`,
        hint: "Return `<section>` holding `<h2>{title}</h2>`, `<button onClick={onClose}>Close</button>` and `{children}`.",
        solution: `function Panel({ title, children, onClose }) {
  return (
    <section>
      <h2>{title}</h2>
      <button onClick={onClose}>Close</button>
      {children}
    </section>
  );
}

export default function App() {
  const [open, setOpen] = useState(true);
  if (!open) return <button onClick={() => setOpen(true)}>Show filters</button>;
  return (
    <Panel title="Filters" onClose={() => setOpen(false)}>
      <p>Pick a size and a colour.</p>
    </Panel>
  );
}`,
        tests: [
          {
            name: "Renders the title and the children",
            expression: `await render(<Panel title="Sizes" onClose={() => {}}><p>Pick one</p></Panel>);
return getByRole("heading", { name: "Sizes" }) !== null && getByText("Pick one") !== null;`,
          },
          {
            name: "Close calls onClose",
            expression: `let closed = 0;
await render(<Panel title="Sizes" onClose={() => closed++}><p>Pick one</p></Panel>);
await click(getByRole("button", { name: "Close" }));
return closed === 1;`,
          },
          {
            name: "In App, closing hides the panel and Show filters brings it back",
            expression: `await render(<App />);
await click(getByRole("button", { name: "Close" }));
const hidden = queryByRole("heading", { name: "Filters" }) === null;
await click(getByRole("button", { name: "Show filters" }));
return hidden && getByRole("heading", { name: "Filters" }) !== null;`,
          },
        ],
      },
    ],
  },
  "react-core.state": {
    summary:
      "Give components memory with useState, update it without mutating, and compute what you can.",
    xp: 160,
    blocks: [
      {
        kind: "text",
        body: "**State** is a component's memory. `const [count, setCount] = useState(0)` gives you the current value and a function to replace it. Calling the setter doesn't change the variable you're holding. It asks React to render the component again, and on that render `useState` returns the new value.",
      },
      {
        kind: "text",
        body: "**Never mutate state; replace it.** React decides whether to re-render by checking whether you gave it a *different* value. `items.push(x); setItems(items)` hands back the same array, so React sees nothing new. Build a new array or object instead: `[...items, x]`, `items.filter(…)`, `{ ...form, email }`.",
      },
      {
        kind: "code",
        language: "jsx",
        code: `// When the next value depends on the current one, pass a function.
// React gives it the latest value, even if several updates are queued.
setItems((current) => [...current, newItem]);
setCount((c) => c + 1);`,
      },
      {
        kind: "text",
        body: "**Don't store what you can calculate.** If `total` can be worked out from the cart lines, compute it while rendering: `const total = lines.reduce(…)`. Keeping it in its own state means updating two things every time, and sooner or later one update gets missed.",
      },
      {
        kind: "text",
        body: "When two components need the same state, move it up to their closest common parent and pass it down. This is called **lifting state up**, and it keeps a single source of truth.",
      },
      {
        kind: "code",
        language: "jsx",
        caption: "Scenario: clicking Add does nothing on screen",
        code: `function add(item) {
  items.push(item);
  setItems(items);
}`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Why doesn't the list update?",
        options: [
          "`setItems` is asynchronous and needs `await`",
          "It's the same array object, so React sees no change and skips the re-render. Use `setItems([...items, item])`",
          "Arrays can't be stored in state",
          "`push` returns the new length",
        ],
        answer: 1,
        explanation:
          "React compares the old and new values by identity. The contents changed, but the array is the same object, so nothing tells React to re-render.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "A cart keeps `lines` and `total` in two `useState`s and updates both on add and on remove. After a few removals, the total is wrong. What's the lasting fix?",
        options: [
          "Remove the `total` state and calculate it from `lines` during render",
          "Add a `useEffect` that sets `total` whenever `lines` changes",
          "Recalculate `total` when the page loads",
          "Store the total in `localStorage`",
        ],
        answer: 0,
        explanation:
          "A value calculated during render can't disagree with its source. An effect would work, but it renders once with the wrong total first, and it's code you don't need.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Fix the cart",
        prompt:
          "This cart's total goes wrong after you remove something. Make the total always match the lines: adding shows a new line and updates the total, and removing a line updates both. Fixing the total properly will expose a second bug. Fix that one too.",
        language: "react",
        starter: `const CATALOG = [
  { id: "headlamp", name: "Headlamp", price: 35 },
  { id: "bottle", name: "Water Bottle", price: 20 },
];

let nextKey = 1;

export default function App() {
  const [lines, setLines] = useState([]);
  const [total, setTotal] = useState(0);

  function add(product) {
    lines.push({ key: nextKey++, ...product });
    setLines(lines);
    setTotal(total + product.price);
  }

  function remove(key) {
    setLines(lines.filter((line) => line.key !== key));
  }

  return (
    <div>
      {CATALOG.map((product) => (
        <button key={product.id} onClick={() => add(product)}>
          Add {product.name}
        </button>
      ))}
      <ul>
        {lines.map((line) => (
          <li key={line.key}>
            {line.name} <button onClick={() => remove(line.key)}>Remove</button>
          </li>
        ))}
      </ul>
      <p>Total: \${total}</p>
    </div>
  );
}`,
        hint: "Delete the `total` state and compute `const total = lines.reduce((sum, line) => sum + line.price, 0)`. Adding then stops showing up on screen, because `push` changes the same array. Build a new one with `setLines((current) => [...current, line])`.",
        solution: `const CATALOG = [
  { id: "headlamp", name: "Headlamp", price: 35 },
  { id: "bottle", name: "Water Bottle", price: 20 },
];

let nextKey = 1;

export default function App() {
  const [lines, setLines] = useState([]);
  const total = lines.reduce((sum, line) => sum + line.price, 0);

  function add(product) {
    const line = { key: nextKey++, ...product };
    setLines((current) => [...current, line]);
  }

  function remove(key) {
    setLines((current) => current.filter((line) => line.key !== key));
  }

  return (
    <div>
      {CATALOG.map((product) => (
        <button key={product.id} onClick={() => add(product)}>
          Add {product.name}
        </button>
      ))}
      <ul>
        {lines.map((line) => (
          <li key={line.key}>
            {line.name} <button onClick={() => remove(line.key)}>Remove</button>
          </li>
        ))}
      </ul>
      <p>Total: \${total}</p>
    </div>
  );
}`,
        tests: [
          {
            name: "Adding shows a line",
            expression: `await render(<App />);
await click(getByRole("button", { name: "Add Headlamp" }));
return getAllByRole("listitem").length === 1;`,
          },
          {
            name: "The total adds up",
            expression: `await render(<App />);
await click(getByRole("button", { name: "Add Headlamp" }));
await click(getByRole("button", { name: "Add Water Bottle" }));
return text().includes("Total: $55");`,
          },
          {
            name: "Removing updates the lines and the total",
            expression: `await render(<App />);
await click(getByRole("button", { name: "Add Headlamp" }));
await click(getByRole("button", { name: "Add Water Bottle" }));
await click(getAllByRole("button", { name: "Remove" })[0]);
return getAllByRole("listitem").length === 1 && text().includes("Total: $20");`,
          },
          {
            name: "The same product can be added twice",
            expression: `await render(<App />);
const add = getByRole("button", { name: "Add Headlamp" });
await click(add);
await click(add);
return getAllByRole("listitem").length === 2 && text().includes("Total: $70");`,
          },
        ],
      },
    ],
  },
  "react-hooks.effect": {
    summary: "Use effects only to sync with the outside world, and always clean up after them.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: "`useEffect` runs code *after* React has updated the screen. It exists for one job: **keeping your component in sync with something outside React**, such as a timer, a subscription, a browser API or a network connection. It isn't for calculating values or for reacting to clicks.",
      },
      {
        kind: "text",
        body: "Before writing an effect, check whether you need one. Values derived from props or state are calculated during render. Things that happen because the user did something belong in the event handler. A good share of effects in real codebases are the first case in disguise, and they cost an extra render and a class of bugs.",
      },
      {
        kind: "code",
        language: "jsx",
        code: `useEffect(() => {
  const id = setInterval(() => setTicks((t) => t + 1), 1000);
  return () => clearInterval(id);   // cleanup: runs before the next run, and on unmount
}, [running]);                       // dependencies: re-run only when these change`,
      },
      {
        kind: "text",
        body: "Three rules prevent most effect bugs. **List every value from the component the effect uses** in the dependency array; leave it out altogether and the effect runs after every render. **Return a cleanup** for anything you start (timers, listeners, subscriptions), or you'll stack a new one on every re-run. And **use the updater form** (`setTicks(t => t + 1)`) inside long-lived callbacks, because the callback captured the value from the render that created it and will keep seeing that old value.",
      },
      {
        kind: "callout",
        body: "In development, React's Strict Mode deliberately runs each effect, cleans it up and runs it again. If that breaks something (two intervals, doubled requests), the effect is missing its cleanup, and it would have broken in production eventually too.",
      },
      {
        kind: "code",
        language: "jsx",
        caption: "Scenario",
        code: `const [first, setFirst] = useState("Ada");
const [last, setLast] = useState("Lovelace");
const [fullName, setFullName] = useState("");

useEffect(() => {
  setFullName(first + " " + last);
}, [first, last]);`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What's the better way to write this?",
        options: [
          "Add `fullName` to the dependency array",
          "Use `useLayoutEffect` so it runs sooner",
          "Move it to a custom hook",
          'Drop the state and effect: `const fullName = first + " " + last;`',
        ],
        answer: 3,
        explanation:
          "It's derived data. Calculating it during render is simpler and never shows a stale value for a frame.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          'An effect calls `window.addEventListener("resize", onResize)` and returns nothing. The component mounts and unmounts as the user switches tabs. What happens over time?',
        options: [
          "Nothing, because React removes listeners automatically",
          "The browser ignores duplicate listeners",
          "Listeners pile up, one per mount, and each keeps calling a handler for a component that's gone",
          "The effect throws on the second mount",
        ],
        answer: 2,
        explanation:
          'React knows nothing about listeners you add yourself. Return `() => window.removeEventListener("resize", onResize)`.',
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Fix the stopwatch",
        prompt:
          "This stopwatch ticks every 100 ms while running. Instead it speeds up, Stop doesn't stop it, and the count jumps about. Fix the effect so it counts steadily while running, stops when stopped, and Reset puts it back to 0.",
        language: "react",
        starter: `export default function App() {
  const [running, setRunning] = useState(false);
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    if (!running) return;
    setInterval(() => {
      setTicks(ticks + 1);
    }, 100);
  });

  return (
    <div>
      <p>{ticks} ticks</p>
      <button onClick={() => setRunning(!running)}>{running ? "Stop" : "Start"}</button>
      <button onClick={() => { setRunning(false); setTicks(0); }}>Reset</button>
    </div>
  );
}`,
        hint: "Three changes: keep the interval's id and `return () => clearInterval(id)`; add `[running]` as the dependency array; and use `setTicks((t) => t + 1)` so the callback never reads a stale `ticks`.",
        solution: `export default function App() {
  const [running, setRunning] = useState(false);
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTicks((t) => t + 1);
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  return (
    <div>
      <p>{ticks} ticks</p>
      <button onClick={() => setRunning(!running)}>{running ? "Stop" : "Start"}</button>
      <button onClick={() => { setRunning(false); setTicks(0); }}>Reset</button>
    </div>
  );
}`,
        tests: [
          {
            name: "Counts steadily while running",
            expression: `await render(<App />);
await click(getByRole("button", { name: "Start" }));
await sleep(540);
const n = Number(text().match(/(\\d+) ticks/)[1]);
return n >= 4 && n <= 6;`,
          },
          {
            name: "Stop stops it",
            expression: `await render(<App />);
await click(getByRole("button", { name: "Start" }));
await sleep(320);
await click(getByRole("button", { name: "Stop" }));
const stoppedAt = text();
await sleep(320);
return text() === stoppedAt;`,
          },
          {
            name: "Reset goes back to 0",
            expression: `await render(<App />);
await click(getByRole("button", { name: "Start" }));
await sleep(250);
await click(getByRole("button", { name: "Reset" }));
await sleep(250);
return text().startsWith("0 ticks");`,
          },
        ],
      },
    ],
  },
  "react-hooks.custom": {
    summary: "Pull stateful logic into a hook you can reuse, and know the rules hooks live by.",
    xp: 160,
    blocks: [
      {
        kind: "text",
        body: "When two components need the same *behaviour* (a toggle, a debounced search, a value synced to local storage), move it into a **custom hook**: a function whose name starts with `use` and that calls other hooks. Components stay short, and the behaviour gets one name and one place to fix bugs.",
      },
      {
        kind: "code",
        language: "jsx",
        code: `function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn((v) => !v);
  return [on, toggle];
}

const [menuOpen, toggleMenu] = useToggle();`,
      },
      {
        kind: "text",
        body: "A custom hook shares **logic, not state**. Each component that calls `useToggle()` gets its own separate `on`. To share one value between components, lift the state up or use context.",
      },
      {
        kind: "text",
        body: "**The rules of hooks:** call them at the top level of a component or of another hook, never inside a condition, a loop or a nested function. React matches each hook to its stored state by call order, so a hook that runs on some renders and not others shifts every hook after it onto the wrong state.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "`Header` and `Sidebar` both call `useToggle()`. Clicking the header's toggle…",
        options: [
          "Toggles both, because they share the hook",
          "Toggles only the header's value; each call has its own state",
          "Throws, because a hook can only be used once",
          "Toggles whichever component rendered last",
        ],
        answer: 1,
        explanation:
          "Every call to a hook creates independent state. Custom hooks reuse behaviour, not data.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Why is `if (isAdmin) { useEffect(…) }` a bug?",
        options: [
          "Effects can't read props",
          "Admins need a different hook",
          "React tracks hooks by call order; when `isAdmin` changes, every later hook lines up with the wrong state",
          "It's only a lint warning",
        ],
        answer: 2,
        explanation:
          "Call the hook unconditionally and put the condition inside it: `useEffect(() => { if (!isAdmin) return; … }, [isAdmin])`.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "useDebouncedValue",
        prompt:
          "A search box shouldn't query on every keystroke. Write `useDebouncedValue(value, delay)`: it returns `value` unchanged on the first render, then only updates once `value` has stopped changing for `delay` milliseconds. Each change restarts the wait. The search box in `App` shows the result.",
        language: "react",
        starter: `function useDebouncedValue(value, delay) {
  // your code here
  return value;
}

export default function App() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 300);
  return (
    <div>
      <label htmlFor="search">Search</label>
      <input id="search" value={query} onChange={(e) => setQuery(e.target.value)} />
      <p>Searching for: {debounced || "nothing yet"}</p>
    </div>
  );
}`,
        hint: "Keep the debounced value in `useState(value)`. In a `useEffect` on `[value, delay]`, start a `setTimeout` that sets it, and return `() => clearTimeout(id)` so each new keystroke cancels the previous timer.",
        solution: `function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function App() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 300);
  return (
    <div>
      <label htmlFor="search">Search</label>
      <input id="search" value={query} onChange={(e) => setQuery(e.target.value)} />
      <p>Searching for: {debounced || "nothing yet"}</p>
    </div>
  );
}`,
        tests: [
          {
            name: "Returns the starting value straight away",
            expression: `function Probe() {
  return <p>{useDebouncedValue("tents", 50)}</p>;
}
await render(<Probe />);
return text() === "tents";`,
          },
          {
            name: "Doesn't update while you're typing",
            expression: `await render(<App />);
await fill(getByLabelText("Search"), "boots");
return text().includes("Searching for: nothing yet");`,
          },
          {
            name: "Updates once typing stops",
            expression: `await render(<App />);
await fill(getByLabelText("Search"), "boots");
await sleep(400);
return text().includes("Searching for: boots");`,
          },
          {
            name: "Each keystroke restarts the wait",
            expression: `await render(<App />);
const box = getByLabelText("Search");
await fill(box, "b");
await sleep(100);
await fill(box, "bo");
await sleep(100);
await fill(box, "boots");
await sleep(150);
const stillWaiting = text().includes("nothing yet");
await sleep(250);
return stillWaiting && text().includes("Searching for: boots");`,
          },
        ],
      },
    ],
  },
  "react-data.lists": {
    summary: "Render arrays with map, and give every item a key that follows it around.",
    xp: 140,
    blocks: [
      {
        kind: "text",
        body: "To render a list, `map` your data to elements: `{tasks.map((task) => <li key={task.id}>{task.title}</li>)}`. Filter and sort the *data* before mapping. Don't try to hide elements afterwards.",
      },
      {
        kind: "text",
        body: "The **key** is how React recognises an item from one render to the next. When the list changes, React matches old and new elements by key, and it keeps each item's state and DOM (typed text, focus, open or closed) with its key. A good key is stable and unique among its siblings, which usually means an id from your data.",
      },
      {
        kind: "text",
        body: '**The index is a bad key for any list that can reorder, insert or delete.** With `key={index}`, React thinks "item 0 is still item 0" after you sort, so the text someone typed into the first row stays in the first row while the task it belonged to moves elsewhere. With `key={Math.random()}` it\'s worse: every render gives every item a new identity, so React throws the DOM away and inputs lose focus as you type.',
      },
      {
        kind: "code",
        language: "jsx",
        code: `// Index keys: fine for a static list that never changes order
{tags.map((tag, i) => <span key={i}>{tag}</span>)}

// Anything that sorts, filters, inserts or holds state: use the data's id
{tasks.map((task) => <TaskRow key={task.id} task={task} />)}`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "Each row of a sortable list has a note field, and the list uses `key={index}`. A user types a note on the first row, then sorts. What happens?",
        options: [
          "The note moves with its task",
          "The note disappears",
          "React throws a key warning and refuses to sort",
          "The note stays on the first row, which now shows a different task",
        ],
        answer: 3,
        explanation:
          "React keeps the input at key 0, and key 0 is now a different task. The state follows the key, and the key followed the position.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Why is `key={crypto.randomUUID()}` inside `map` a bug?",
        options: [
          "Every render creates new keys, so React remounts every row: inputs lose focus and state resets",
          "UUIDs are too long for keys",
          "Keys must be numbers",
          "It's fine, because the keys are unique",
        ],
        answer: 0,
        explanation:
          "A key has to be the same across renders for the same item. Generate the id once, when the item is created, and store it with the data.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Notes that stay put",
        prompt:
          'Each task has a note field. Type a note for "Charge headlamp", then click "Sort A–Z": the note ends up on the wrong task. Fix it so every note stays with its own task, whichever way the list is sorted.',
        language: "react",
        starter: `const TASKS = [
  { id: "t1", title: "Pack tent", added: 1 },
  { id: "t2", title: "Buy gas canister", added: 2 },
  { id: "t3", title: "Charge headlamp", added: 3 },
];

export default function App() {
  const [sortBy, setSortBy] = useState("newest");
  const tasks = [...TASKS].sort((a, b) =>
    sortBy === "title" ? a.title.localeCompare(b.title) : b.added - a.added,
  );

  return (
    <div>
      <button onClick={() => setSortBy("title")}>Sort A–Z</button>
      <button onClick={() => setSortBy("newest")}>Newest first</button>
      <ul>
        {tasks.map((task, index) => (
          <li key={index}>
            {task.title}
            <input aria-label={\`Note for \${task.title}\`} defaultValue="" />
          </li>
        ))}
      </ul>
    </div>
  );
}`,
        hint: "The note lives in the `<input>`'s DOM, and React keeps that DOM with the key. Give each row a key that belongs to the task rather than the position.",
        solution: `const TASKS = [
  { id: "t1", title: "Pack tent", added: 1 },
  { id: "t2", title: "Buy gas canister", added: 2 },
  { id: "t3", title: "Charge headlamp", added: 3 },
];

export default function App() {
  const [sortBy, setSortBy] = useState("newest");
  const tasks = [...TASKS].sort((a, b) =>
    sortBy === "title" ? a.title.localeCompare(b.title) : b.added - a.added,
  );

  return (
    <div>
      <button onClick={() => setSortBy("title")}>Sort A–Z</button>
      <button onClick={() => setSortBy("newest")}>Newest first</button>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            {task.title}
            <input aria-label={\`Note for \${task.title}\`} defaultValue="" />
          </li>
        ))}
      </ul>
    </div>
  );
}`,
        tests: [
          {
            name: "Sorting still lists every task",
            expression: `await render(<App />);
await click(getByRole("button", { name: "Sort A–Z" }));
return getAllByRole("listitem").length === 3;`,
          },
          {
            name: "A note stays with its task after sorting",
            expression: `await render(<App />);
await fill(getByLabelText("Note for Charge headlamp"), "spare batteries");
await click(getByRole("button", { name: "Sort A–Z" }));
return getByLabelText("Note for Charge headlamp").value === "spare batteries";`,
          },
          {
            name: "…and doesn't turn up on another task",
            expression: `await render(<App />);
await fill(getByLabelText("Note for Charge headlamp"), "spare batteries");
await click(getByRole("button", { name: "Sort A–Z" }));
return getByLabelText("Note for Buy gas canister").value === "";`,
          },
          {
            name: "Sorting back keeps it too",
            expression: `await render(<App />);
await fill(getByLabelText("Note for Charge headlamp"), "spare batteries");
await click(getByRole("button", { name: "Sort A–Z" }));
await click(getByRole("button", { name: "Newest first" }));
return getByLabelText("Note for Charge headlamp").value === "spare batteries";`,
          },
        ],
      },
    ],
  },
  "react-data.forms": {
    summary:
      "Controlled inputs, errors shown at the right moment, and a submit that can't fire twice.",
    xp: 170,
    blocks: [
      {
        kind: "text",
        body: "A **controlled input** takes its value from state and reports changes back: `value={email}` together with `onChange={(e) => setEmail(e.target.value)}`. State becomes the single source of truth, so validating, resetting or pre-filling the form is ordinary state work.",
      },
      {
        kind: "text",
        body: "**Show errors at the right moment.** \"Invalid email\" appearing after the first letter is shouting at someone who hasn't finished typing. The common rule: show a field's error once the user has *left* the field (blur), or when they try to submit, and from then on update it live as they fix it.",
      },
      {
        kind: "text",
        body: 'Make errors accessible. Put the message next to its field, give it `role="alert"` so screen readers announce it, and link it to the input with `aria-describedby`. Say how to fix the problem ("Use at least 8 characters"), not just that there is one.',
      },
      {
        kind: "text",
        body: "**Submitting is a state too.** Call `event.preventDefault()` so the browser doesn't reload the page. While the request is in flight, disable the button and change its label, so a double-click can't create two accounts. Afterwards, show a result, and handle the case where the server says no.",
      },
      {
        kind: "code",
        language: "jsx",
        code: `const [status, setStatus] = useState("idle"); // "idle" | "submitting" | "done"

<button type="submit" disabled={status === "submitting"}>
  {status === "submitting" ? "Creating account…" : "Create account"}
</button>`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: 'When should a sign-up form first show "Enter a valid email address"?',
        options: [
          "As soon as the page loads",
          "On the first keystroke",
          "When the user leaves the email field, or tries to submit, with an invalid value",
          "Only after the server rejects it",
        ],
        answer: 2,
        explanation:
          "That's early enough to help and late enough not to nag. Once the error is showing, update it on every keystroke so it disappears the moment the value is fixed.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          'Some customers are charged twice when they double-click "Place order". What\'s the front-end fix?',
        options: [
          "Disable the button and show progress while the request is in flight",
          "Add a confirmation dialog",
          "Debounce the click by one second",
          "Tell customers to click once",
        ],
        answer: 0,
        explanation:
          "A disabled button can't fire a second submit, and the progress label says why. The server should also reject duplicates, but the UI shouldn't invite them.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "A sign-up form that behaves",
        prompt:
          'Finish `SignupForm({ onSubmit })`. Email must contain "@" and the password must be at least 8 characters. Show each field\'s error (with `role="alert"`) once the field has been left, or after a submit attempt, and never before. Only a valid form calls `onSubmit({ email, password })`. `onSubmit` returns a promise: while it\'s pending, the button reads "Creating account…" and is disabled. When it resolves, show "Account created".',
        language: "react",
        starter: `function SignupForm({ onSubmit }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ email, password });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label htmlFor="password">Password</label>
      <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Create account</button>
    </form>
  );
}

export default function App() {
  return <SignupForm onSubmit={() => new Promise((resolve) => setTimeout(resolve, 800))} />;
}`,
        hint: 'Compute the errors from the values on every render. Keep a `touched` object (set on blur, and for every field on submit) and show an error only when its field is touched. Add a `status` state: return early from submit if there are errors or you\'re already submitting, `await onSubmit(...)`, then set `"done"`.',
        solution: `function validate({ email, password }) {
  const errors = {};
  if (!email.includes("@")) errors.email = "Enter a valid email address.";
  if (password.length < 8) errors.password = "Use at least 8 characters.";
  return errors;
}

function SignupForm({ onSubmit }) {
  const [values, setValues] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle");
  const errors = validate(values);

  const update = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));
  const leave = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ email: true, password: true });
    if (Object.keys(errors).length > 0 || status === "submitting") return;
    setStatus("submitting");
    await onSubmit(values);
    setStatus("done");
  }

  if (status === "done") return <p role="status">Account created</p>;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" value={values.email} onChange={update("email")}
        onBlur={leave("email")} aria-describedby="email-error" />
      {touched.email && errors.email ? <p id="email-error" role="alert">{errors.email}</p> : null}
      <label htmlFor="password">Password</label>
      <input id="password" type="password" value={values.password} onChange={update("password")}
        onBlur={leave("password")} aria-describedby="password-error" />
      {touched.password && errors.password ? <p id="password-error" role="alert">{errors.password}</p> : null}
      <button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

export default function App() {
  return <SignupForm onSubmit={() => new Promise((resolve) => setTimeout(resolve, 800))} />;
}`,
        tests: [
          {
            name: "No error while the field is still being filled in",
            expression: `await render(<SignupForm onSubmit={async () => {}} />);
await fill(getByLabelText("Email"), "ada");
return queryByRole("alert") === null;`,
          },
          {
            name: "Leaving the email field shows its error",
            expression: `await render(<SignupForm onSubmit={async () => {}} />);
const email = getByLabelText("Email");
await fill(email, "ada");
await blur(email);
return /email/i.test(getByRole("alert").textContent);`,
          },
          {
            name: "Submitting an empty form shows both errors and sends nothing",
            expression: `let calls = 0;
await render(<SignupForm onSubmit={async () => { calls++; }} />);
await click(getByRole("button", { name: "Create account" }));
return getAllByRole("alert").length === 2 && calls === 0;`,
          },
          {
            name: "A valid form sends the values",
            expression: `const sent = [];
await render(<SignupForm onSubmit={async (values) => { sent.push(values); }} />);
await fill(getByLabelText("Email"), "ada@example.com");
await fill(getByLabelText("Password"), "correct horse");
await click(getByRole("button", { name: "Create account" }));
return sent.length === 1 && sent[0].email === "ada@example.com" && sent[0].password === "correct horse";`,
          },
          {
            name: "Disabled while submitting, so a double-click sends once",
            expression: `let calls = 0;
await render(<SignupForm onSubmit={() => { calls++; return new Promise((r) => setTimeout(r, 200)); }} />);
await fill(getByLabelText("Email"), "ada@example.com");
await fill(getByLabelText("Password"), "correct horse");
await click(getByRole("button", { name: "Create account" }));
const busy = getByRole("button", { name: "Creating account…" });
const disabled = busy.disabled;
await click(busy);
await sleep(300);
return disabled && calls === 1 && text().includes("Account created");`,
          },
        ],
      },
    ],
  },
  "react-data.fetch": {
    summary:
      "Handle loading, error, empty and success, and never show a response that arrived too late.",
    xp: 190,
    blocks: [
      {
        kind: "text",
        body: "Every screen that loads data has **four states**, and users see all of them: **loading**, **error** (with a way to try again), **empty** (loaded fine, nothing to show) and **success**. Tutorials build the last one. Production is the other three.",
      },
      {
        kind: "text",
        body: 'Model those states as **one** status rather than separate booleans. `isLoading`, `isError` and `data` stored separately can combine into states that make no sense, such as loading and failed at the same time. `{ status: "loading" | "error" | "success", products }` can only ever be one of them.',
      },
      {
        kind: "code",
        language: "jsx",
        code: `useEffect(() => {
  let ignore = false;                       // set by the cleanup below
  setState({ status: "loading" });
  fetchProducts()
    .then((products) => { if (!ignore) setState({ status: "success", products }); })
    .catch(() => { if (!ignore) setState({ status: "error" }); });
  return () => { ignore = true; };          // a newer request has started: drop this one
}, [fetchProducts, attempt]);`,
      },
      {
        kind: "text",
        body: '**Responses arrive out of order.** Type "boo" then "boots" quickly, and the "boo" results can arrive last and overwrite the right ones. The `ignore` flag in the cleanup makes each effect run discard its response once a newer run has started. (An `AbortController` goes further and cancels the request itself.)',
      },
      {
        kind: "text",
        body: "In a real app, reach for a data library instead of hand-writing this in every component. TanStack Query (which this platform uses) adds caching, deduplication, retries and refetching on focus, and gives you the same states:",
      },
      {
        kind: "code",
        language: "jsx",
        caption: "With TanStack Query (not run here)",
        code: `const { data, isPending, isError, refetch } = useQuery({
  queryKey: ["products"],
  queryFn: fetchProducts,
});`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A component tracks `isLoading`, `isError` and `products` in three separate `useState`s. Which bug does that invite?",
        options: [
          "It re-renders too often",
          "It can't show an empty state",
          "The data can't be cached",
          "States that can't happen together can still be stored together, like loading and failed at once, if one setter call is missed",
        ],
        answer: 3,
        explanation:
          "Three booleans allow eight combinations, and only four of them are meaningful. A single status value makes the impossible ones impossible to store.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "On a search page, results sometimes show matches for the previous query. What's the cause, and the fix?",
        options: [
          "The API is slow, so add a spinner",
          "An older request resolved after a newer one. Ignore stale responses in the effect's cleanup, or use a data library that does it for you",
          "Debounce the input",
          "Clear the results before each request",
        ],
        answer: 1,
        explanation:
          "Debouncing makes it rarer but doesn't stop it; any two requests can finish out of order. Only discarding stale responses fixes it.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "All four states",
        prompt:
          'Rewrite `ProductList({ fetchProducts })` so it shows "Loading products…" while the request is pending. If it fails, show "Couldn\'t load products." with `role="alert"` and a "Try again" button that fetches again. If it succeeds with no products, show "No products yet.". Otherwise show a list of product names. `fetchProducts` returns a promise of `[{ id, name }]` and can reject.',
        language: "react",
        starter: `function ProductList({ fetchProducts }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, [fetchProducts]);

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}

const SAMPLE = [
  { id: 1, name: "Headlamp" },
  { id: 2, name: "Water Bottle" },
];
const loadSample = () => new Promise((resolve) => setTimeout(() => resolve(SAMPLE), 600));

export default function App() {
  return <ProductList fetchProducts={loadSample} />;
}`,
        hint: 'Keep one `state` object with a `status`. Keep an `attempt` counter in the effect\'s dependencies, and have "Try again" increment it. Use `.then` and `.catch` with an `ignore` flag set in the cleanup, then return a different element for each status.',
        solution: `function ProductList({ fetchProducts }) {
  const [state, setState] = useState({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    setState({ status: "loading" });
    fetchProducts()
      .then((products) => {
        if (!ignore) setState({ status: "success", products });
      })
      .catch(() => {
        if (!ignore) setState({ status: "error" });
      });
    return () => {
      ignore = true;
    };
  }, [fetchProducts, attempt]);

  if (state.status === "loading") return <p>Loading products…</p>;
  if (state.status === "error") {
    return (
      <div>
        <p role="alert">Couldn't load products.</p>
        <button onClick={() => setAttempt((a) => a + 1)}>Try again</button>
      </div>
    );
  }
  if (state.products.length === 0) return <p>No products yet.</p>;
  return (
    <ul>
      {state.products.map((product) => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}

const SAMPLE = [
  { id: 1, name: "Headlamp" },
  { id: 2, name: "Water Bottle" },
];
const loadSample = () => new Promise((resolve) => setTimeout(() => resolve(SAMPLE), 600));

export default function App() {
  return <ProductList fetchProducts={loadSample} />;
}`,
        tests: [
          {
            name: "Shows loading while the request is pending",
            expression: `await render(<ProductList fetchProducts={() => new Promise(() => {})} />);
return text() === "Loading products…";`,
          },
          {
            name: "Shows the products",
            expression: `await render(<ProductList fetchProducts={async () => [{ id: 1, name: "Headlamp" }, { id: 2, name: "Water Bottle" }]} />);
await waitFor(() => getAllByRole("listitem").length === 2);
return getByText("Water Bottle") !== null;`,
          },
          {
            name: "Says so when there are no products",
            expression: `await render(<ProductList fetchProducts={async () => []} />);
await waitFor(() => text() === "No products yet.");
return true;`,
          },
          {
            name: "Shows an error and Try again fetches again",
            expression: `let attempts = 0;
const flaky = async () => {
  attempts++;
  if (attempts === 1) throw new Error("503");
  return [{ id: 1, name: "Headlamp" }];
};
await render(<ProductList fetchProducts={flaky} />);
await waitFor(() => getByRole("alert"));
await click(getByRole("button", { name: "Try again" }));
await waitFor(() => getAllByRole("listitem").length === 1);
return attempts === 2;`,
          },
        ],
      },
    ],
  },
  "ml-core.fit": {
    summary: "What training actually does, fitting a line by hand, and why a baseline comes first.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: "Supervised learning means learning from examples that come with the answer. Each example has **features**, the things you know in advance (how far a parcel travels), and a **label**, the thing you want to predict (how many days it takes). Training searches for the model parameters that make the predictions on those examples as good as possible. Prediction applies them to new cases.",
      },
      {
        kind: "text",
        body: "The simplest model is a straight line: `days = w × distance + b`. Training picks the `w` (slope) and `b` (intercept) that minimise the squared errors. For a single feature there's a closed-form answer, and it's all the maths this lesson needs:",
      },
      {
        kind: "code",
        language: "text",
        caption: "Least squares for one feature",
        code: `w = Σ (x − mean(x)) × (y − mean(y))  /  Σ (x − mean(x))²
b = mean(y) − w × mean(x)`,
      },
      {
        kind: "text",
        body: '**Always build a baseline first**: the dumbest reasonable prediction, such as "every parcel takes the average number of days". A model is only worth having by the margin it beats that. It sounds obvious, but plenty of production models turn out to barely beat the average once someone checks.',
      },
      {
        kind: "text",
        body: "Measure error with a metric people can read. **Mean absolute error (MAE)** is the average size of a miss, in the label's own units: an MAE of 0.2 means predictions are off by about a fifth of a day on average.",
      },
      {
        kind: "code",
        language: "python",
        caption: "The same thing with scikit-learn, which is what you'd use at work (not run here)",
        code: `from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error

X = [[50], [120], [200], [310], [400], [520]]   # one row per parcel, one column per feature
y = [1, 2, 2, 3, 4, 5]
model = LinearRegression().fit(X, y)
mean_absolute_error(y, model.predict(X))`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "Predicting delivery days, your model's MAE is 1.9 days. Predicting the average for every parcel gives an MAE of 2.0. What does that tell you?",
        options: [
          "The model is good, because an MAE under 2 is low",
          "The model barely beats guessing the average, so find out why before using it",
          "The baseline must be wrong",
          "You need more decimal places",
        ],
        answer: 1,
        explanation:
          "Whether an error is good or bad depends on what it's compared with. A tenth of a day better than the dumbest possible guess means the features carry little signal, or the model isn't using them.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "You want to predict whether a customer will return an item. Which of these is the label?",
        options: [
          "Whether the item was returned",
          "The item's price",
          "The customer's number of past orders",
          "The product category",
        ],
        answer: 0,
        explanation:
          "The label is the outcome you want to predict. The other three are known at the time of purchase, so they're candidate features.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Fit a line and beat the baseline",
        prompt:
          "Write `fit_line(xs, ys)`, which returns `(w, b)` using the least-squares formulas above; `predict(model, x)`, which returns `w * x + b`; and `mae(actual, predicted)`. The tests check your model against the average-guess baseline on the delivery data.",
        language: "python",
        starter: `DISTANCE = [50, 120, 200, 310, 400, 520]   # km
DAYS = [1, 2, 2, 3, 4, 5]

def fit_line(xs, ys):
    # your code here
    pass

def predict(model, x):
    # your code here
    pass

def mae(actual, predicted):
    # your code here
    pass

model = fit_line(DISTANCE, DAYS)
print(model)`,
        hint: "Work out `mx` and `my` (the means) first. `w` is the sum of `(x - mx) * (y - my)` divided by the sum of `(x - mx) ** 2`, and `b = my - w * mx`. For `mae`, average `abs(a - p)` over the pairs.",
        solution: `DISTANCE = [50, 120, 200, 310, 400, 520]
DAYS = [1, 2, 2, 3, 4, 5]

def fit_line(xs, ys):
    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
    w = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
    return w, my - w * mx

def predict(model, x):
    w, b = model
    return w * x + b

def mae(actual, predicted):
    return sum(abs(a - p) for a, p in zip(actual, predicted)) / len(actual)`,
        tests: [
          {
            name: "Recovers an exact line",
            expression:
              "all(abs(a - e) < 1e-9 for a, e in zip(fit_line([1, 2, 3], [3, 5, 7]), (2.0, 1.0)))",
          },
          { name: "predict applies w and b", expression: "predict((2.0, 1.0), 10) == 21.0" },
          {
            name: "mae is the average size of a miss",
            expression: "mae([1, 2, 3], [1, 3, 5]) == 1.0",
          },
          {
            name: "The model beats the average-guess baseline",
            expression:
              "mae(DAYS, [predict(fit_line(DISTANCE, DAYS), x) for x in DISTANCE]) < mae(DAYS, [sum(DAYS) / len(DAYS)] * len(DAYS))",
          },
        ],
      },
    ],
  },
  "ml-core.evaluate": {
    summary:
      "Accuracy, precision and recall, and picking the one that matches the cost of a mistake.",
    xp: 160,
    blocks: [
      {
        kind: "text",
        body: 'For classification, **accuracy** (the share of predictions that are right) is the first number everyone reaches for, and often the wrong one. If 5 in 100 orders are fraudulent, a model that says "never fraud" is 95% accurate and catches nothing.',
      },
      {
        kind: "text",
        body: "Count the four outcomes instead. This table is called the **confusion matrix**. For the positive class (fraud):",
      },
      {
        kind: "code",
        language: "text",
        code: `                  predicted fraud   predicted fine
actually fraud    true positive     false negative   ← missed fraud
actually fine     false positive    true negative
                  ↑ blocked a good customer`,
      },
      {
        kind: "text",
        body: "**Precision** = TP / (TP + FP): of the orders you flagged, how many were really fraud? **Recall** = TP / (TP + FN): of the real fraud, how much did you catch? Most models output a score, and you choose the threshold. Raising it trades recall for precision, and lowering it does the opposite.",
      },
      {
        kind: "text",
        body: "Choose by the cost of each mistake. If missing a case is expensive (fraud, a disease screen), favour recall. If a false alarm is expensive (sending a real customer's email to spam, blocking a card at the till), favour precision. Say the choice out loud, because it's a product decision as much as a technical one.",
      },
      {
        kind: "code",
        language: "python",
        caption: "With scikit-learn (not run here)",
        code: `from sklearn.metrics import confusion_matrix, precision_score, recall_score

precision_score(y_true, y_pred)   # labels: 1 = fraud, 0 = fine
recall_score(y_true, y_pred)
confusion_matrix(y_true, y_pred)`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A spam filter's worst failure is hiding a real email from a customer. Which metric do you protect first?",
        options: [
          "Recall on spam",
          "Accuracy",
          "Precision on spam: when it says spam, it had better be spam",
          "Training speed",
        ],
        answer: 2,
        explanation:
          "A false positive (a real email marked as spam) is the costly mistake, and precision is the metric that counts false positives. Some spam will get through as a result, and that's the price.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "Out of 1,000 orders, 20 are fraudulent. A model flags 10 orders, and 8 of them are fraud. What are its precision and recall?",
        options: [
          "Precision 0.4, recall 0.8",
          "Precision 0.8, recall 0.8",
          "Precision 0.99, recall 0.4",
          "Precision 0.8, recall 0.4",
        ],
        answer: 3,
        explanation:
          "Precision is 8 correct out of 10 flagged, which is 0.8. Recall is 8 caught out of 20 real cases, which is 0.4. Accuracy would be (1000 − 2 − 12) / 1000 = 98.6%, which sounds great and says nothing about the 12 missed frauds.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Metrics that don't lie",
        prompt:
          "Write `confusion(y_true, y_pred)`, which returns a dict with the counts `tp`, `fp`, `fn` and `tn` (labels are 1 for positive, 0 for negative). Then write `precision(c)` and `recall(c)`, which take that dict and return `0.0` when the denominator is zero, rather than crashing.",
        language: "python",
        starter: `def confusion(y_true, y_pred):
    # your code here
    pass

def precision(c):
    # your code here
    pass

def recall(c):
    # your code here
    pass

# 100 orders, 5 of them fraud, and a model that never says "fraud"
Y_TRUE = [1] * 5 + [0] * 95
LAZY = [0] * 100
print(confusion(Y_TRUE, LAZY))`,
        hint: "Loop over `zip(y_true, y_pred)` and count each of the four combinations. Precision is `tp / (tp + fp)` and recall is `tp / (tp + fn)`, each guarded with `if ... == 0: return 0.0`.",
        solution: `def confusion(y_true, y_pred):
    c = {"tp": 0, "fp": 0, "fn": 0, "tn": 0}
    for t, p in zip(y_true, y_pred):
        if t == 1 and p == 1:
            c["tp"] += 1
        elif t == 0 and p == 1:
            c["fp"] += 1
        elif t == 1 and p == 0:
            c["fn"] += 1
        else:
            c["tn"] += 1
    return c

def precision(c):
    flagged = c["tp"] + c["fp"]
    return c["tp"] / flagged if flagged else 0.0

def recall(c):
    actual = c["tp"] + c["fn"]
    return c["tp"] / actual if actual else 0.0

Y_TRUE = [1] * 5 + [0] * 95
LAZY = [0] * 100`,
        tests: [
          {
            name: "Counts all four outcomes",
            expression:
              'confusion([1, 1, 0, 0, 1], [1, 0, 1, 0, 1]) == {"tp": 2, "fp": 1, "fn": 1, "tn": 1}',
          },
          {
            name: "Precision is tp / (tp + fp)",
            expression: 'abs(precision({"tp": 8, "fp": 2, "fn": 12, "tn": 978}) - 0.8) < 1e-9',
          },
          {
            name: "Recall is tp / (tp + fn)",
            expression: 'abs(recall({"tp": 8, "fp": 2, "fn": 12, "tn": 978}) - 0.4) < 1e-9',
          },
          {
            name: "The 95%-accurate lazy model has zero recall",
            expression: "recall(confusion(Y_TRUE, LAZY)) == 0.0",
          },
          {
            name: "No crash when nothing is flagged",
            expression: "precision(confusion(Y_TRUE, LAZY)) == 0.0",
          },
        ],
      },
    ],
  },
  "ml-honest.split": {
    summary: "Hold data back, keep it untouched, and stop information leaking from test to train.",
    xp: 160,
    blocks: [
      {
        kind: "text",
        body: "A model's score on the data it was trained on tells you almost nothing, because it has seen the answers. To estimate how it will do on new cases, you hold data back. The **training set** fits the model. The **validation set** compares models and settings. The **test set** is used once, at the end, as the honest estimate. Every time you look at the test score and change something, it becomes a little less honest.",
      },
      {
        kind: "text",
        body: "**Leakage** is information from the held-out data reaching training by the back door, and it produces scores that collapse in production. The classic case is preprocessing: if you compute the mean and standard deviation for scaling over *all* the data before splitting, the training set has already been shaped by the test set. Fit every preprocessing step on the training set only, then apply it unchanged to validation, test and production.",
      },
      {
        kind: "text",
        body: "Two more leaks to watch for. **Duplicates**: the same customer or near-identical rows on both sides of the split, so the model is tested on things it has memorised; split by customer, not by row. **Time**: if you're predicting the future, train on the past and test on the later period. A random split lets the model peek at next month.",
      },
      {
        kind: "code",
        language: "python",
        caption: "With scikit-learn (not run here): the scaler is fitted on the training data only",
        code: `from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)
scaler = StandardScaler().fit(X_train)      # learns mean and std from training data
X_train_s = scaler.transform(X_train)
X_test_s = scaler.transform(X_test)          # reuses the training mean and std`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A churn model scored 94% on the test set and 81% in its first month live. The notebook scaled the whole dataset, then split it. What's the most likely culprit?",
        options: [
          "The production servers are slower",
          "Leakage: the test set shaped the preprocessing, so the test score was optimistic",
          "81% is just bad luck",
          "The model needs more layers",
        ],
        answer: 1,
        explanation:
          "Scaling before splitting lets test-set statistics into training. It's rarely the whole gap, but it's the first thing to fix, because the reported 94% was never an honest number.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "You're predicting next month's sales per store from two years of history. How should you split?",
        options: [
          "Randomly, 80/20",
          "Put each store's data in a random half",
          "No split is needed for a time series",
          "By time: train on the earlier months and test on the most recent ones",
        ],
        answer: 3,
        explanation:
          "In production the model only ever knows the past. A time split recreates that, while a random split lets it learn from months that come after the ones it's tested on.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Scale without leaking",
        prompt:
          "Write `fit_scaler(values)`, which returns `(mean, std)` using the population standard deviation (divide by n); `scale(values, scaler)`, which returns `(v - mean) / std` for each value; and `split_then_scale(train, test)`, which returns `(scaled_train, scaled_test)` with **both** scaled by statistics fitted on `train` alone. The training values are never all equal.",
        language: "python",
        starter: `import math

def fit_scaler(values):
    # your code here
    pass

def scale(values, scaler):
    # your code here
    pass

def split_then_scale(train, test):
    # your code here
    pass

print(split_then_scale([1, 2, 3], [4]))`,
        hint: "`mean = sum(values) / len(values)`, and `std = math.sqrt(sum((v - mean) ** 2 for v in values) / len(values))`. In `split_then_scale`, call `fit_scaler(train)` once and use that result for both lists.",
        solution: `import math

def fit_scaler(values):
    mean = sum(values) / len(values)
    std = math.sqrt(sum((v - mean) ** 2 for v in values) / len(values))
    return mean, std

def scale(values, scaler):
    mean, std = scaler
    return [(v - mean) / std for v in values]

def split_then_scale(train, test):
    scaler = fit_scaler(train)
    return scale(train, scaler), scale(test, scaler)`,
        tests: [
          {
            name: "fit_scaler returns mean and population std",
            expression:
              "all(abs(a - e) < 1e-4 for a, e in zip(fit_scaler([1, 2, 3]), (2.0, 0.8165)))",
          },
          {
            name: "Scaled training data has mean 0",
            expression: "abs(sum(split_then_scale([1, 2, 3], [4])[0])) < 1e-9",
          },
          {
            name: "The test set is scaled with the training statistics",
            expression: "abs(split_then_scale([1, 2, 3], [4])[1][0] - 2.4495) < 1e-4",
          },
          {
            name: "Test values never change the scaler",
            expression:
              "split_then_scale([1, 2, 3], [4])[0] == split_then_scale([1, 2, 3], [400, -7])[0]",
          },
        ],
      },
    ],
  },
  "ml-honest.overfitting": {
    summary: "Recognise a model that memorised its training data, and dial its flexibility back.",
    xp: 170,
    blocks: [
      {
        kind: "text",
        body: "A model **overfits** when it learns the training data too well: noise, typos and one-off flukes included. The telltale sign is the gap between scores. Excellent on the training set, noticeably worse on validation. A model that's bad on both is **underfitting**: too simple, or missing the features that matter.",
      },
      {
        kind: "text",
        body: "**k-nearest neighbours** makes this easy to see. To classify a new point, find the `k` closest training points and take a majority vote. With `k = 1` every training point is its own nearest neighbour, so training accuracy is always 100%, and a single mislabelled point carves out a little region of wrong answers around itself. A larger `k` outvotes the noise, and past a point it starts to blur real boundaries.",
      },
      {
        kind: "text",
        body: "Every model family has a dial like `k`: tree depth, the number of features, regularisation strength. Choose it on **validation** data, never training data. With little data, use **cross-validation**: split into, say, 5 folds, validate on each fold in turn, and average the scores, so one lucky split doesn't decide.",
      },
      {
        kind: "code",
        language: "python",
        caption: "With scikit-learn (not run here)",
        code: `from sklearn.model_selection import cross_val_score
from sklearn.neighbors import KNeighborsClassifier

for k in (1, 3, 5, 9):
    scores = cross_val_score(KNeighborsClassifier(n_neighbors=k), X, y, cv=5)
    print(k, scores.mean())`,
      },
      {
        kind: "code",
        language: "text",
        caption: "Scenario",
        code: `model            train accuracy   validation accuracy
deep tree        99%              71%
shallow tree     84%              82%`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which model should you prefer, and why?",
        options: [
          "The shallow tree: its validation score is higher and close to its training score, so it generalises",
          "The deep tree: 99% is the best number",
          "Neither: 84% is too low",
          "Average the two",
        ],
        answer: 0,
        explanation:
          "The deep tree's 28-point gap is overfitting. What you care about is performance on data the model hasn't seen, and the shallow tree wins there.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Which change is most likely to help an overfitting model?",
        options: [
          "Add more features",
          "Train for longer",
          "Get more training data, or make the model simpler (for example a larger k or a shallower tree)",
          "Tune it until the training score reaches 100%",
        ],
        answer: 2,
        explanation:
          "More data makes noise harder to memorise, and a simpler model has less capacity to memorise it. The other three give the model more room to overfit.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Watch k-nearest neighbours overfit",
        prompt:
          "Write `knn_predict(train, point, k)`, where `train` is a list of `((x, y), label)` pairs: find the `k` training points closest to `point` (straight-line distance) and return the most common label among them. Then write `accuracy(train, data, k)`, the share of `data` that `knn_predict` gets right. `TRAIN` contains one mislabelled point. The tests show what it does to `k = 1`.",
        language: "python",
        starter: `import math
from collections import Counter

TRAIN = [
    ((1.0, 1.0), "A"), ((1.5, 1.2), "A"), ((0.8, 1.6), "A"), ((1.3, 0.7), "A"),
    ((5.0, 5.0), "B"), ((5.5, 4.6), "B"), ((4.7, 5.3), "B"), ((5.2, 5.6), "B"),
    ((1.15, 1.05), "B"),   # mislabelled: it sits in the middle of the A points
]
VALID = [
    ((1.1, 1.0), "A"), ((1.25, 1.1), "A"), ((0.9, 1.3), "A"),
    ((5.1, 5.0), "B"), ((4.9, 4.8), "B"),
]

def knn_predict(train, point, k):
    # your code here
    pass

def accuracy(train, data, k):
    # your code here
    pass

print(accuracy(TRAIN, TRAIN, 1), accuracy(TRAIN, VALID, 1), accuracy(TRAIN, VALID, 3))`,
        hint: "`sorted(train, key=lambda item: math.dist(item[0], point))[:k]` gives the neighbours, and `Counter(label for _, label in neighbours).most_common(1)[0][0]` gives the vote.",
        solution: `import math
from collections import Counter

TRAIN = [
    ((1.0, 1.0), "A"), ((1.5, 1.2), "A"), ((0.8, 1.6), "A"), ((1.3, 0.7), "A"),
    ((5.0, 5.0), "B"), ((5.5, 4.6), "B"), ((4.7, 5.3), "B"), ((5.2, 5.6), "B"),
    ((1.15, 1.05), "B"),
]
VALID = [
    ((1.1, 1.0), "A"), ((1.25, 1.1), "A"), ((0.9, 1.3), "A"),
    ((5.1, 5.0), "B"), ((4.9, 4.8), "B"),
]

def knn_predict(train, point, k):
    neighbours = sorted(train, key=lambda item: math.dist(item[0], point))[:k]
    return Counter(label for _, label in neighbours).most_common(1)[0][0]

def accuracy(train, data, k):
    return sum(knn_predict(train, p, k) == label for p, label in data) / len(data)`,
        tests: [
          {
            name: "k = 1 copies its nearest neighbour, noise included",
            expression: 'knn_predict(TRAIN, (1.1, 1.0), 1) == "B"',
          },
          {
            name: "k = 3 outvotes the noise",
            expression: 'knn_predict(TRAIN, (1.1, 1.0), 3) == "A"',
          },
          {
            name: "k = 1 scores 100% on its own training data",
            expression: "accuracy(TRAIN, TRAIN, 1) == 1.0",
          },
          {
            name: "…but k = 3 does better on validation data",
            expression: "accuracy(TRAIN, VALID, 3) > accuracy(TRAIN, VALID, 1)",
          },
        ],
      },
    ],
  },
  "ml-ship.features": {
    summary:
      "Turn raw columns into features a model can use, without leaking the answer into them.",
    xp: 160,
    blocks: [
      {
        kind: "text",
        body: "Models only see numbers, and the way you turn raw columns into numbers usually matters more than which algorithm you choose. Three jobs come up every time: encoding categories, handling missing values, and making sure no feature secretly contains the label.",
      },
      {
        kind: "text",
        body: '**Categories.** Turning `city` into Oslo = 1, Dublin = 2, Milan = 3 tells a linear model that Milan is "three times" Oslo, which is nonsense. **One-hot encoding** gives each category its own 0/1 column instead. Learn the list of categories from the training data, and decide what an unseen category does in production. The usual answer is all zeros, meaning "none of the ones I know".',
      },
      {
        kind: "text",
        body: "**Missing values.** Fill them in (with the training mean, for example) *and* add a column that says the value was missing. Missingness is often signal in its own right: a customer who never entered a phone number behaves differently from one who did.",
      },
      {
        kind: "text",
        body: "**Target leakage** is a feature that wouldn't exist at prediction time, or that exists only because of the outcome. To predict whether a customer will churn next month, `cancellation_reason` is a perfect predictor, and it's useless, because you only have it after they've churned. For every feature, ask: would I know this at the moment I need to make the prediction?",
      },
      {
        kind: "code",
        language: "python",
        caption: "With scikit-learn (not run here)",
        code: `from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer

encoder = OneHotEncoder(handle_unknown="ignore").fit(train[["city"]])   # unseen → all zeros
imputer = SimpleImputer(strategy="mean", add_indicator=True).fit(train[["age"]])`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "You're predicting at checkout whether an order will be returned. Which feature is target leakage?",
        options: [
          "The product category",
          "Whether the customer has returned anything before",
          "The order total",
          "Whether a refund was issued for the order",
        ],
        answer: 3,
        explanation:
          "A refund happens after the return, so the feature is the label in disguise. The other three are all known at checkout.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "Your model was trained on orders from five countries. An order arrives from a sixth. What should the country encoding do?",
        options: [
          "Crash, so someone notices",
          "Give it a new number, 6",
          "Map it to an all-zeros one-hot vector, and log it so you can see how often it happens",
          "Assign it to the most common country",
        ],
        answer: 2,
        explanation:
          'All zeros honestly says "not one I know" and lets the other features do the work. Logging it tells you when a new market is big enough to retrain for.',
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Encode categories and missing values",
        prompt:
          "Write `fit_categories(values)`, which returns the sorted distinct values from training, ignoring `None`. Write `one_hot(value, categories)`, which returns a list of 0/1 with a 1 in that category's position, or all zeros for `None` or an unseen value. Then write `impute(values, fill)`, which returns `(filled, was_missing)`: `None` replaced by `fill`, and a 0/1 list marking where it was.",
        language: "python",
        starter: `TRAIN_CITIES = ["Oslo", "Dublin", None, "Oslo", "Milan"]

def fit_categories(values):
    # your code here
    pass

def one_hot(value, categories):
    # your code here
    pass

def impute(values, fill):
    # your code here
    pass

cats = fit_categories(TRAIN_CITIES)
print(cats, one_hot("Oslo", cats), one_hot("Lisbon", cats))`,
        hint: "`sorted({v for v in values if v is not None})` gives the categories, and `[1 if value == c else 0 for c in categories]` gives the encoding.",
        solution: `TRAIN_CITIES = ["Oslo", "Dublin", None, "Oslo", "Milan"]

def fit_categories(values):
    return sorted({v for v in values if v is not None})

def one_hot(value, categories):
    return [1 if value == c else 0 for c in categories]

def impute(values, fill):
    return [fill if v is None else v for v in values], [1 if v is None else 0 for v in values]`,
        tests: [
          {
            name: "Learns sorted categories, ignoring None",
            expression: 'fit_categories(TRAIN_CITIES) == ["Dublin", "Milan", "Oslo"]',
          },
          {
            name: "One column per category",
            expression: 'one_hot("Oslo", ["Dublin", "Milan", "Oslo"]) == [0, 0, 1]',
          },
          {
            name: "An unseen category is all zeros",
            expression: 'one_hot("Lisbon", ["Dublin", "Milan", "Oslo"]) == [0, 0, 0]',
          },
          {
            name: "Missing values are filled and flagged",
            expression: "impute([30, None, 50], 40) == ([30, 40, 50], [0, 1, 0])",
          },
        ],
      },
    ],
  },
  "ml-ship.deploy": {
    summary:
      "Ship a model with its preprocessing, watch its inputs drift, and know when to retrain.",
    xp: 170,
    blocks: [
      {
        kind: "text",
        body: "A model in a notebook is a finding. A model in production is a system, and most of what goes wrong happens around the model rather than inside it.",
      },
      {
        kind: "text",
        body: "**Training/serving skew.** Production must transform inputs exactly the way training did: the same scaler, the same category list, the same fill values, the same units. Save the preprocessing and the model together as one versioned artifact (a scikit-learn `Pipeline` does this), and never re-implement the preprocessing by hand in the serving code.",
      },
      {
        kind: "text",
        body: "**Monitoring.** Labels often arrive late (you learn whether an order was returned weeks afterwards), so watch the **inputs** as well as the accuracy. If a feature's live average moves several training standard deviations away from what the model was trained on, the model is being asked about a world it hasn't seen. That's a signal to investigate and perhaps retrain.",
      },
      {
        kind: "text",
        body: "**Have a fallback.** Keep the baseline from the first lesson running. If the model's service fails, or its inputs look broken, serve the baseline and raise an alert. A slightly worse answer beats a crash or a confident wrong one.",
      },
      {
        kind: "code",
        language: "python",
        caption: "With scikit-learn (not run here): one artifact, preprocessing included",
        code: `from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
import joblib

pipeline = make_pipeline(StandardScaler(), LogisticRegression()).fit(X_train, y_train)
joblib.dump(pipeline, "returns-model-v3.joblib")   # the same file is loaded by the service`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A delivery-time model was trained with distances in kilometres. The new mobile app sends miles. What happens?",
        options: [
          "Predictions quietly shift, with no error. That's training/serving skew, and it's caught by input monitoring or by shipping preprocessing with the model",
          "The model adapts automatically",
          "Nothing: the distance is still a number",
          "An error is raised",
        ],
        answer: 0,
        explanation:
          "Every distance is now about 0.62 of what the model expects, so every prediction is too short and nothing crashes. Silent failures like this are why production monitoring watches the inputs.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "Whether an order is returned is only known 30 days later. What can you watch in the meantime to catch a problem early?",
        options: [
          "Nothing: wait for the labels",
          "The input features' distributions compared with training, and the spread of the model's predictions",
          "The server's CPU usage",
          "The number of deployments",
        ],
        answer: 1,
        explanation:
          "Input drift and a sudden change in what the model predicts both show up the same day. Accuracy confirms the problem a month later.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Check for drift",
        prompt:
          "Write `drift_report(train_stats, live, threshold)`. `train_stats` maps each feature to `(mean, std)` from training, and `live` maps each feature to a list of recent values. Return the sorted names of the features whose live mean is more than `threshold` training standard deviations away from the training mean. Skip features that have no live values.",
        language: "python",
        starter: `TRAIN_STATS = {"distance_km": (240.0, 150.0), "items": (2.1, 1.2), "age": (40.0, 10.0)}
LIVE = {"distance_km": [210, 260, 250], "items": [2, 3, 1], "age": [62, 70, 66]}

def drift_report(train_stats, live, threshold):
    # your code here
    pass

print(drift_report(TRAIN_STATS, LIVE, 2.0))`,
        hint: "For each feature with live values, compute `abs(live_mean - mean) / std` and keep the feature if that's above `threshold`. `sorted(...)` the result.",
        solution: `TRAIN_STATS = {"distance_km": (240.0, 150.0), "items": (2.1, 1.2), "age": (40.0, 10.0)}
LIVE = {"distance_km": [210, 260, 250], "items": [2, 3, 1], "age": [62, 70, 66]}

def drift_report(train_stats, live, threshold):
    drifted = []
    for feature, (mean, std) in train_stats.items():
        values = live.get(feature) or []
        if not values:
            continue
        if abs(sum(values) / len(values) - mean) / std > threshold:
            drifted.append(feature)
    return sorted(drifted)`,
        tests: [
          {
            name: "Flags the feature that moved",
            expression: 'drift_report(TRAIN_STATS, LIVE, 2.0) == ["age"]',
          },
          {
            name: "A higher threshold tolerates more",
            expression: "drift_report(TRAIN_STATS, LIVE, 3.0) == []",
          },
          {
            name: "Measures in training standard deviations",
            expression: 'drift_report({"x": (0.0, 1.0)}, {"x": [1.5]}, 1.0) == ["x"]',
          },
          {
            name: "Skips features with no live values",
            expression:
              'drift_report({"x": (0.0, 1.0), "y": (0.0, 1.0)}, {"x": [9]}, 1.0) == ["x"]',
          },
        ],
      },
    ],
  },
};

/**
 * The authored lessons, answers included. Server-only: the Start plugin refuses
 * to bundle `*.server.*` into the client, which is what keeps the answer key out
 * of the browser. The browser gets `toPublicBody()` through `getLessonFn`, and
 * learns which lessons exist from `lesson-manifest.gen.ts` — regenerate that with
 * `bun run lessons:manifest` after adding or removing a body.
 *
 * Merged rather than spread so a lesson id claimed by two modules is a loud
 * failure: spreading would silently keep whichever came last, taking the other
 * lesson's questions and XP with it.
 */
export const bodies: Record<string, LessonBody> = (() => {
  const merged: Record<string, LessonBody> = {};
  const sources: Record<string, LessonBody>[] = [
    claudeLessonBodies,
    chatgptLessonBodies,
    figmaLessonBodies,
    genaiLessonBodies,
    gitLessonBodies,
    htmlCssLessonBodies,
    javascriptLessonBodies,
    nodeLessonBodies,
    productLessonBodies,
    pythonLessonBodies,
    reactLessonBodies,
    sqlLessonBodies,
    typescriptLessonBodies,
    uxDesignLessonBodies,
    coreLessonBodies,
  ];
  for (const source of sources) {
    for (const [id, body] of Object.entries(source)) {
      if (id in merged) throw new Error(`Duplicate lesson body id: ${id}`);
      merged[id] = body;
    }
  }
  return merged;
})();

export function getLessonBody(courseId: string, lessonId: string): LessonBody | null {
  if (!findLesson(courseId, lessonId)) return null;
  return bodies[lessonId] ?? null;
}
