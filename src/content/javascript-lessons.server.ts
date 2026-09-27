import type { LessonBody } from "./lessons";

/**
 * JavaScript lessons added after the course learning-design audit. Guided
 * lessons are followed by sparse checkpoints, and the final project combines
 * async work with a real DOM rather than assessing those skills in isolation.
 */
export const javascriptLessonBodies: Record<string, LessonBody> = {
  "js-basics.strings": {
    summary:
      "Build text with template literals, clean up what people type, and remember that string methods hand back a new string.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: 'Text in JavaScript is a **string**, written in single or double quotes: `"Headlamp"` or `\'Headlamp\'`. Joining strings with `+` works, but gets hard to read the moment a sentence has more than one value in it: `"Total: $" + total + " for " + count + " items"`.',
      },
      {
        kind: "text",
        body: "A **template literal** uses backticks (`` ` ``, usually the key left of 1) instead of quotes. Inside it, `${ }` drops in the value of any expression: a variable, a calculation, a function call, even a ternary. It can also run over several lines. From here on, this is how you build text.",
      },
      {
        kind: "code",
        language: "javascript",
        code: `const name = "Ada";
const count = 3;
const total = 42.5;

\`Hello, \${name}!\`                          // "Hello, Ada!"
\`Total: $\${total.toFixed(2)}\`             // "Total: $42.50"
\`\${count} \${count === 1 ? "item" : "items"}\`   // "3 items"

'Hello, \${name}'   // "Hello, \${name}", exactly as typed: quotes don't interpolate`,
      },
      {
        kind: "text",
        body: "Two traps. **Only backticks interpolate**: with ordinary quotes, `${name}` is printed as those seven characters. And `${}` turns *anything* into text, so a missing value doesn't fail, it shows up on the page as `undefined`, `null` or `[object Object]`. When text looks wrong, check the value going in before the template around it.",
      },
      {
        kind: "text",
        body: '**Cleaning up what people type.** `trim()` removes spaces from both ends, and `toLowerCase()` makes comparisons ignore case, so `"  Ada@Example.com "` and `"ada@example.com"` can be treated as the same address. `includes("lamp")`, `startsWith("SKU-")` and `endsWith(".pdf")` answer yes/no questions. `slice(-4)` takes the last four characters, `padStart(3, "0")` turns `"7"` into `"007"`, and `replaceAll(" ", "")` strips every space. (`split` turns a string into an array; you\'ll use it once arrays arrive in the next module.)',
      },
      {
        kind: "text",
        body: "**Strings never change.** Every string method returns a *new* string and leaves the original alone. `email.trim();` on its own line does nothing useful; keep the result: `const clean = email.trim();`. That's the same rule as the array methods that don't mutate, which you'll meet next module.",
      },
      {
        kind: "callout",
        body: "Template literals build **text**. Later in this course you'll put text on the page, and building HTML with a template literal and handing it to `innerHTML` is how cross-site scripting happens. The DOM lessons show the safe way.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "`const name = \"Ada\"; console.log('Hi, ${name}');` What does it print?",
        options: [
          "Hi, Ada",
          "An error, because `name` isn't defined",
          "Hi, undefined",
          "Hi, ${name}",
        ],
        answer: 3,
        explanation:
          "Only backticks interpolate. Inside ordinary quotes, `${name}` is just seven characters of text. Write `` `Hi, ${name}` ``.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          'A sign-up form runs `email.trim().toLowerCase();` on its own line, then saves `email`. The person typed `"  Ada@Example.com "`. What gets saved?',
        options: [
          '`"  Ada@Example.com "`, unchanged',
          '`"ada@example.com"`',
          '`"Ada@Example.com"`, trimmed but not lowercased',
          "`undefined`",
        ],
        answer: 0,
        explanation:
          "String methods return a new string; they never change the original. The cleaned-up result was thrown away. Keep it: `const clean = email.trim().toLowerCase();`.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the template literal so it greets whoever is in `name`.",
        before: "const greeting = `Hello, ",
        after: "!`;",
        answer: "${name}",
        explanation:
          "`${ }` inside backticks drops in the value of the expression, here the variable `name`.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Text for a shop",
        prompt:
          'Write four small helpers, using template literals to build the text. `itemCount(n)` returns `"1 item"`, or `"0 items"`, `"3 items"` and so on. `receiptLine(name, qty, price)` returns a line like `"Headlamp × 2: $70.00"`, where `price` is the price of one and the total always shows two decimals. `matchesSearch(productName, query)` is true when the product name contains the query, ignoring case and any spaces around the query; an empty query matches everything. `maskCard(number)` returns `"•••• 4242"`: four dots, a space, and the last four digits, ignoring spaces around the number.',
        language: "javascript",
        starter: `function itemCount(n) {
  // your code here
}

function receiptLine(name, qty, price) {
  // your code here
}

function matchesSearch(productName, query) {
  // your code here
}

function maskCard(number) {
  // your code here
}

console.log(itemCount(3), receiptLine("Headlamp", 2, 35));`,
        hint: 'For the count: `` `${n} ${n === 1 ? "item" : "items"}` ``. For the receipt, multiply first, then `.toFixed(2)` inside the `${}`. For search, clean the query with `.trim().toLowerCase()`, return `true` if it\'s `""`, then compare against `productName.toLowerCase()` with `includes`. For the card: `number.trim().slice(-4)`.',
        solution: `function itemCount(n) {
  return \`\${n} \${n === 1 ? "item" : "items"}\`;
}

function receiptLine(name, qty, price) {
  return \`\${name} × \${qty}: $\${(qty * price).toFixed(2)}\`;
}

function matchesSearch(productName, query) {
  const q = query.trim().toLowerCase();
  if (q === "") return true;
  return productName.toLowerCase().includes(q);
}

function maskCard(number) {
  return \`•••• \${number.trim().slice(-4)}\`;
}`,
        tests: [
          {
            name: "One item, many items, and zero items",
            expression: `itemCount(1) === "1 item" && itemCount(3) === "3 items" && itemCount(0) === "0 items"`,
          },
          {
            name: "A receipt line totals the quantity",
            expression: `receiptLine("Headlamp", 2, 35) === "Headlamp × 2: $70.00"`,
          },
          {
            name: "The total always shows two decimals",
            expression: `receiptLine("Sticker", 3, 0.1) === "Sticker × 3: $0.30"`,
          },
          {
            name: "Search ignores case and surrounding spaces",
            expression: `matchesSearch("Trail Headlamp", "  headLAMP ") === true && matchesSearch("Water Bottle", "lamp") === false`,
          },
          {
            name: "An empty search matches everything",
            expression: `matchesSearch("Water Bottle", "") === true && matchesSearch("Water Bottle", "   ") === true`,
          },
          {
            name: "A card shows only its last four digits",
            expression: `maskCard("4242424242424242") === "•••• 4242" && maskCard(" 4000 0566 5566 1881 ") === "•••• 1881"`,
          },
        ],
      },
    ],
  },
  "js-basics.checkpoint": {
    summary:
      "Turn messy form-like text into a trustworthy checkout total using conversion, functions and guard clauses.",
    xp: 180,
    blocks: [
      {
        kind: "callout",
        body: "This checkpoint starts from an empty editor. Write down the invalid cases and boundary values before coding, and open the hint only after your first run.",
      },
      {
        kind: "text",
        body: "Real inputs arrive as strings. A robust calculation separates three jobs: normalise and validate the input, calculate with numbers, then format for a person. If conversion and formatting are mixed together, an empty field quietly becoming zero can look like a legitimate answer.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Why must you check for an empty string before calling `Number(text)`?",
        options: [
          "Number cannot read strings",
          '`Number("")` is 0, so a missing value can masquerade as a valid zero',
          "Empty strings throw an error",
          "Number removes decimal places",
        ],
        answer: 1,
        explanation:
          "An explicit empty check preserves the difference between no answer and the numeric value zero.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the check that accepts only whole-number quantities.",
        before: "if (!Number.",
        after: "(quantity)) return null;",
        answer: "isInteger",
        explanation: "Number.isInteger distinguishes whole numbers from decimals and NaN.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Checkout calculator",
        prompt:
          'From a blank editor, write `checkoutTotal(priceText, quantityText, member = false)`. Trim both inputs. Return `null` when either is empty, the price is negative or not numeric, or quantity is negative, non-numeric or not a whole number. Otherwise return price × quantity, with members receiving 10% off, rounded to the nearest cent. Then write `checkoutLabel(...)`, returning `"Total: $13.49"` for a total of 13.49, or `"Check your entries"` when the total is null. Do not print inside either function.',
        language: "javascript",
        starter: `// Write both functions from the brief. List the invalid cases first.
`,
        hint: "Normalise with `String(value).trim()`, reject empty text, then convert with `Number`. Validate with `Number.isFinite` and `Number.isInteger`. Round money using `Math.round(total * 100) / 100` and format with `.toFixed(2)` only in the label.",
        solution: `function checkoutTotal(priceText, quantityText, member = false) {
  const priceInput = String(priceText).trim();
  const quantityInput = String(quantityText).trim();
  if (priceInput === "" || quantityInput === "") return null;

  const price = Number(priceInput);
  const quantity = Number(quantityInput);
  if (!Number.isFinite(price) || price < 0) return null;
  if (!Number.isInteger(quantity) || quantity < 0) return null;

  const total = price * quantity * (member ? 0.9 : 1);
  return Math.round(total * 100) / 100;
}

function checkoutLabel(priceText, quantityText, member = false) {
  const total = checkoutTotal(priceText, quantityText, member);
  return total === null ? "Check your entries" : "Total: $" + total.toFixed(2);
}`,
        tests: [
          {
            name: "Calculates ordinary and member totals",
            expression:
              'checkoutTotal("4.99", "3") === 14.97 && checkoutTotal("4.99", "3", true) === 13.47',
          },
          {
            name: "Trims input and keeps a real zero",
            expression: 'checkoutTotal(" 5 ", " 2 ") === 10 && checkoutTotal("5", "0") === 0',
          },
          {
            name: "Rejects missing and non-numeric values",
            expression:
              'checkoutTotal("", "2") === null && checkoutTotal("5", " ") === null && checkoutTotal("five", "2") === null',
          },
          {
            name: "Rejects negative prices and invalid quantities",
            expression:
              'checkoutTotal("-1", "2") === null && checkoutTotal("5", "-2") === null && checkoutTotal("5", "2.5") === null',
          },
          {
            name: "Rounds only the final numeric answer",
            expression: 'checkoutTotal("14.99", "3", true) === 40.47',
          },
          {
            name: "Builds both successful and error labels",
            expression:
              'checkoutLabel("14.99", "1", true) === "Total: $13.49" && checkoutLabel("", "2") === "Check your entries"',
          },
          {
            name: "The label delegates the calculation",
            expression:
              '(original => { checkoutTotal = () => 7; const result = checkoutLabel("x", "y"); checkoutTotal = original; return result === "Total: $7.00"; })(checkoutTotal)',
          },
        ],
      },
    ],
  },
  "js-data.checkpoint": {
    summary:
      "Build a fresh summary from an array of order objects without changing the source data.",
    xp: 200,
    blocks: [
      {
        kind: "callout",
        body: "This checkpoint supplies no function skeleton. First draw the result object and label the type of every value inside it.",
      },
      {
        kind: "text",
        body: "A data transformation should have an explicit input and output shape. Here the input is an array of order objects. The output is one new object containing arrays, a number and a counts object. Unless the brief says otherwise, reading data should not sort, splice or rewrite the caller's records.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which array method is most likely to accidentally change the caller's input?",
        options: ["`filter`", "`map`", "`sort`", "`reduce`"],
        answer: 2,
        explanation:
          "sort changes the array it is called on. Copy first with [...orders].sort(...) when order matters.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the immutable update that adds a paid count.",
        before: "const next = { ...counts, paid: ",
        after: " };",
        answer: "(counts.paid ?? 0) + 1",
        explanation: "Spread creates a new object and ?? supplies zero only when paid is missing.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Summarise orders",
        prompt:
          "From a blank editor, write `summariseOrders(orders)`. Return `{ paidIds, revenue, statusCounts, highValueIds }`. `paidIds` contains paid order IDs in original order. `revenue` is the sum of paid totals. `statusCounts` counts every status. `highValueIds` contains paid order IDs whose total is at least 100. An empty input returns empty arrays, zero and an empty object. Do not modify the input array or its objects.",
        language: "javascript",
        starter: `// Write summariseOrders from the output shape in the brief.
`,
        hint: "Create the four result values before one loop or one reduce. Count every status, but add revenue and IDs only for paid orders. Return a new object at the end.",
        solution: `function summariseOrders(orders) {
  const paidIds = [];
  const highValueIds = [];
  const statusCounts = {};
  let revenue = 0;

  for (const order of orders) {
    statusCounts[order.status] = (statusCounts[order.status] ?? 0) + 1;
    if (order.status !== "paid") continue;
    paidIds.push(order.id);
    revenue += order.total;
    if (order.total >= 100) highValueIds.push(order.id);
  }

  return { paidIds, revenue, statusCounts, highValueIds };
}`,
        tests: [
          {
            name: "Builds every part of the summary",
            expression:
              'JSON.stringify(summariseOrders([{ id: 1, total: 120, status: "paid" }, { id: 2, total: 90, status: "pending" }, { id: 3, total: 30, status: "paid" }])) === JSON.stringify({ paidIds: [1, 3], revenue: 150, statusCounts: { paid: 2, pending: 1 }, highValueIds: [1] })',
          },
          {
            name: "Handles empty input",
            expression:
              "JSON.stringify(summariseOrders([])) === JSON.stringify({ paidIds: [], revenue: 0, statusCounts: {}, highValueIds: [] })",
          },
          {
            name: "Counts refunded orders without treating them as revenue",
            expression:
              'JSON.stringify(summariseOrders([{ id: 8, total: 500, status: "refunded" }])) === JSON.stringify({ paidIds: [], revenue: 0, statusCounts: { refunded: 1 }, highValueIds: [] })',
          },
          {
            name: "Includes the high-value boundary",
            expression:
              'JSON.stringify(summariseOrders([{ id: "a", total: 99, status: "paid" }, { id: "b", total: 100, status: "paid" }]).highValueIds) === JSON.stringify(["b"])',
          },
          {
            name: "Does not mutate the input",
            expression:
              '(() => { const orders = [{ id: 2, total: 5, status: "paid" }, { id: 1, total: 9, status: "pending" }]; const before = JSON.stringify(orders); summariseOrders(orders); return JSON.stringify(orders) === before; })()',
          },
        ],
      },
    ],
  },
  "js-browser.run": {
    summary:
      "Load JavaScript after the page is ready, separate markup from behavior, and use DevTools to see what actually ran.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: 'The lesson editor runs JavaScript for you; a real page must load it. Put application code in a .js file and reference it from the HTML. A classic script in the head needs `defer` so parsing continues and the DOM exists before the script runs. A `type="module"` script is deferred automatically and also gives you import, export and file-level scope.',
      },
      {
        kind: "code",
        language: "html",
        caption: "Two correct loading patterns—choose one, not both",
        code: `<!-- A classic script -->
<script src="./app.js" defer></script>

<!-- Or a modern module -->
<script src="./app.js" type="module"></script>`,
      },
      {
        kind: "text",
        body: 'Keep behavior out of attributes such as `onclick="..."`. Give the control an id or class, select it in app.js, and attach a listener there. That keeps HTML responsible for meaning and JavaScript responsible for behavior, avoids global function names, and works with strict Content Security Policy.',
      },
      {
        kind: "text",
        body: "Use DevTools as evidence. Console shows logs and uncaught errors. Sources shows the file the browser executed and supports breakpoints. Network answers whether app.js loaded at all—a 404 means debugging the JavaScript body cannot help. Modules and fetch requests should be served over your project's local development server rather than opened as a file URL.",
      },
      {
        kind: "text",
        body: "Browser JavaScript and server-side JavaScript are the same language with different surroundings. The browser provides `document`, `window` and `localStorage`; Node provides server and filesystem APIs. If `document is not defined`, the code is running outside a browser or before the page environment exists.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "The Network panel shows app.js returned 404. What should you fix first?",
        options: [
          "The script's src path, because none of that file ran",
          "The first function in app.js",
          "The button's CSS",
          "Add more console.log calls inside the missing file",
        ],
        answer: 0,
        explanation:
          "A 404 means the browser never received the script. Fix loading before debugging its behavior.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the attribute that lets a classic head script run after HTML parsing.",
        before: '<script src="./app.js" ',
        after: "></script>",
        answer: "defer",
        explanation: "defer downloads in parallel and executes after the document has been parsed.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Load the application deliberately",
        prompt:
          "Repair the document setup. Load exactly one external ./app.js as a module from the head. Remove all inline JavaScript, including event-handler attributes. Keep a real button with id `start`, and add a `noscript` message telling visitors that JavaScript is required. The application behavior belongs in app.js, not this HTML file.",
        language: "web",
        starter: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Trail timer</title>
    <script>
      document.querySelector("#status").textContent = "Ready";
    </script>
  </head>
  <body>
    <button onclick="start()">Start timer</button>
    <p id="status">Waiting</p>
    <script src="./app.js"></script>
  </body>
</html>`,
        hint: 'Delete both existing scripts and the onclick attribute. In the head add `<script src="./app.js" type="module"></script>`. Add `id="start"` to the button and a `<noscript>` element in the body.',
        solution: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Trail timer</title>
    <script src="./app.js" type="module"></script>
  </head>
  <body>
    <button id="start" type="button">Start timer</button>
    <p id="status">Waiting</p>
    <noscript>This timer requires JavaScript.</noscript>
  </body>
</html>`,
        tests: [
          {
            name: "Loads exactly one external app.js",
            expression:
              '$$("script").length === 1 && $("script")?.getAttribute("src") === "./app.js"',
          },
          {
            name: "Loads it as a module",
            expression: '$("script")?.getAttribute("type") === "module"',
          },
          {
            name: "Contains no inline JavaScript",
            expression:
              '$$("script").every((script) => text(script) === "") && $$("*").every((element) => Array.from(element.attributes).every((attribute) => !/^on/i.test(attribute.name)))',
          },
          {
            name: "Keeps an identifiable real button",
            expression:
              '!!$("button#start") && $("button#start")?.getAttribute("type") === "button"',
          },
          {
            name: "Explains the no-JavaScript case",
            expression: '/javascript/i.test(text("noscript"))',
          },
        ],
      },
    ],
  },
  "js-dom.checkpoint": {
    summary:
      "Build an interactive packing list from state, render it safely, and handle additions and removals through events.",
    xp: 230,
    blocks: [
      {
        kind: "callout",
        body: "This checkpoint provides the page but no JavaScript skeleton. Plan the state and render function first; event handlers should only change state and ask render to update the page.",
      },
      {
        kind: "text",
        body: "For an interface that changes, keep one source of truth in JavaScript. The DOM is an output of that state, not a second database. A submit handler validates and changes the array; a delegated click handler removes from it; and one idempotent render function rebuilds the list and status.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Why should render clear the list before rebuilding it?",
        options: [
          "Clearing is faster than appending",
          "Event listeners require an empty list",
          "The browser cannot append twice",
          "Calling render twice with unchanged state should produce the same page, not duplicate every row",
        ],
        answer: 3,
        explanation:
          "An idempotent render makes the page a predictable projection of current state.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the safe assignment that displays a user-entered item as text.",
        before: "nameElement.",
        after: " = itemName;",
        answer: "textContent",
        explanation: "textContent displays characters without parsing them as HTML.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Interactive packing list",
        prompt:
          "Write the JavaScript for the supplied page. Keep items in an array, initially empty. `render()` must clear `#items`, create one `li` per item using `textContent`, add a `button` labelled Remove with a `data-index`, and set `#count` to `0 items packed`, `1 item packed`, and so on. On form submit, prevent navigation, trim the input, ignore blank values, add the item, clear the input and render. Use one delegated click listener on `#items` to remove the selected item, then render. Call render once on startup.",
        language: "dom",
        html: `<form id="packing-form">
  <label for="item">Packing item</label>
  <input id="item" name="item" required>
  <button type="submit">Add item</button>
</form>
<ul id="items"></ul>
<p id="count" role="status"></p>`,
        starter: `// Build the packing-list state, render function and event handlers.
`,
        hint: 'Start with `const items = []` and finish render before wiring events. Store each index in `button.dataset.index`. In the list click handler, use `event.target.closest("button[data-index]")`, then `items.splice(Number(button.dataset.index), 1)`.',
        solution: `const items = [];
const form = document.querySelector("#packing-form");
const input = document.querySelector("#item");
const list = document.querySelector("#items");
const count = document.querySelector("#count");

function render() {
  list.replaceChildren();
  items.forEach((itemName, index) => {
    const row = document.createElement("li");
    const nameElement = document.createElement("span");
    nameElement.textContent = itemName;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.dataset.index = String(index);
    row.append(nameElement, remove);
    list.append(row);
  });
  count.textContent = items.length + " " + (items.length === 1 ? "item" : "items") + " packed";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const itemName = input.value.trim();
  if (!itemName) return;
  items.push(itemName);
  input.value = "";
  render();
});

list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-index]");
  if (!button) return;
  items.splice(Number(button.dataset.index), 1);
  render();
});

render();`,
        tests: [
          {
            name: "Starts with an honest empty state",
            expression: '$$("#items li").length === 0 && text("#count") === "0 items packed"',
          },
          {
            name: "Adds a trimmed item and clears the field",
            expression:
              '(fill($("#item"), "  Water  "), submit($("#packing-form")), $$("#items li").length === 1 && /Water/.test(text("#items li")) && $("#item").value === "" && text("#count") === "1 item packed")',
          },
          {
            name: "Ignores blank submissions",
            expression:
              '(fill($("#item"), "   "), submit($("#packing-form")), $$("#items li").length === 0)',
          },
          {
            name: "Displays input as text rather than HTML",
            expression:
              '(fill($("#item"), \'<img src=x onerror="alert(1)">\'), submit($("#packing-form")), $("#items img") === null && text("#items li").startsWith("<img"))',
          },
          {
            name: "Removes the selected row through the list listener",
            expression:
              '(fill($("#item"), "Water"), submit($("#packing-form")), fill($("#item"), "Map"), submit($("#packing-form")), click($$("#items button")[0]), $$("#items li").length === 1 && /Map/.test(text("#items li")) && text("#count") === "1 item packed")',
          },
          {
            name: "Rendering again never duplicates state",
            expression:
              '(fill($("#item"), "Water"), submit($("#packing-form")), render(), render(), $$("#items li").length === 1)',
          },
        ],
      },
    ],
  },
  "js-project.catalog": {
    summary:
      "Build a resilient asynchronous product search with loading, empty, error and stale-response states.",
    xp: 300,
    blocks: [
      {
        kind: "callout",
        body: "This independent capstone combines the whole course. The request function and HTML are supplied; state, DOM updates, event handling, async control flow and safe rendering are yours.",
      },
      {
        kind: "text",
        body: "Async interfaces have more than success and failure. A request begins in loading, may produce results or an honest empty state, and may fail. The user can also submit again before the first request finishes. If an old response arrives last and overwrites the newer result, the interface is wrong even though every request succeeded.",
      },
      {
        kind: "code",
        language: "javascript",
        caption: "A small request version prevents stale results",
        code: `let latestRequest = 0;

async function search(query) {
  const request = ++latestRequest;
  const results = await fetchResults(query);
  if (request !== latestRequest) return; // a newer search already started
  render(results);
}`,
      },
      {
        kind: "text",
        body: 'Keep status text in an element with `role="status"` so assistive technology announces loading and results without moving focus. Disable the submit button while the latest request is pending, but still make the handler correct if another submit is triggered. Render all product names with `textContent`.',
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A slow search for shell finishes after a newer search for lamp and replaces its results. What is this bug?",
        options: [
          "Type coercion",
          "A stale-response race condition",
          "Event bubbling",
          "A syntax error",
        ],
        answer: 1,
        explanation:
          "Completion order differed from request order. Track which request is latest and ignore older responses.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the keyword that waits for the asynchronous search result.",
        before: "const products = ",
        after: " searchProducts(query);",
        answer: "await",
        explanation: "await produces the fulfilled value inside an async function.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Product search that handles reality",
        prompt:
          "Write the interface logic for the supplied page. On submit, prevent navigation and trim the query. A blank query shows `Enter a search term` without requesting. For a real query, immediately clear results, show `Loading…`, and disable the button. Await `searchProducts`. Ignore a response or error if a newer request started. Render each returned product as an `li` using text, never HTML. Show `1 result`, `N results`, or `No products found`; failures show `Could not load products`. Re-enable the button only when the latest request settles.",
        language: "dom",
        html: `<form id="search-form">
  <label for="query">Search products</label>
  <input id="query" name="query">
  <button type="submit">Search</button>
</form>
<p id="status" role="status"></p>
<ul id="results"></ul>`,
        starter: `const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function searchProducts(query) {
  const normal = [
    { id: 1, name: "Headlamp" },
    { id: 2, name: "Rain Shell" },
    { id: 3, name: "Water Bottle" },
  ];
  if (query === "slow") {
    await wait(80);
    return [{ id: 4, name: "Slow Boots" }];
  }
  await wait(query === "fast" ? 10 : 30);
  if (query === "error") throw new Error("Service unavailable");
  if (query === "fast") return [{ id: 5, name: "Fast Pack" }];
  if (query === "unsafe") return [{ id: 6, name: '<img src=x onerror="alert(1)">' }];
  return normal.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()));
}

// Build the form, request-state and rendering logic from the brief.
`,
        hint: "Select the four elements and keep `let latestRequest = 0`. In the submit handler, increment it before validation, capture the value as `request`, then use try/catch/finally. Before every async DOM update, return when `request !== latestRequest`.",
        solution: `const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function searchProducts(query) {
  const normal = [
    { id: 1, name: "Headlamp" },
    { id: 2, name: "Rain Shell" },
    { id: 3, name: "Water Bottle" },
  ];
  if (query === "slow") {
    await wait(80);
    return [{ id: 4, name: "Slow Boots" }];
  }
  await wait(query === "fast" ? 10 : 30);
  if (query === "error") throw new Error("Service unavailable");
  if (query === "fast") return [{ id: 5, name: "Fast Pack" }];
  if (query === "unsafe") return [{ id: 6, name: '<img src=x onerror="alert(1)">' }];
  return normal.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()));
}

const form = document.querySelector("#search-form");
const input = document.querySelector("#query");
const button = form.querySelector('button[type="submit"]');
const status = document.querySelector("#status");
const results = document.querySelector("#results");
let latestRequest = 0;

function renderProducts(products) {
  results.replaceChildren();
  for (const product of products) {
    const item = document.createElement("li");
    item.textContent = product.name;
    results.append(item);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const request = ++latestRequest;
  const query = input.value.trim();
  if (!query) {
    results.replaceChildren();
    status.textContent = "Enter a search term";
    button.disabled = false;
    return;
  }

  results.replaceChildren();
  status.textContent = "Loading…";
  button.disabled = true;

  try {
    const products = await searchProducts(query);
    if (request !== latestRequest) return;
    renderProducts(products);
    status.textContent =
      products.length === 0
        ? "No products found"
        : products.length + " " + (products.length === 1 ? "result" : "results");
  } catch {
    if (request !== latestRequest) return;
    results.replaceChildren();
    status.textContent = "Could not load products";
  } finally {
    if (request === latestRequest) button.disabled = false;
  }
});`,
        tests: [
          {
            name: "Rejects a blank search without requesting",
            expression:
              '(fill($("#query"), "   "), submit($("#search-form")), await wait(5), text("#status") === "Enter a search term" && $$("#results li").length === 0 && $("#search-form button").disabled === false)',
          },
          {
            name: "Shows loading immediately and disables submission",
            expression:
              '(fill($("#query"), "lamp"), submit($("#search-form")), text("#status") === "Loading…" && $("#search-form button").disabled === true)',
          },
          {
            name: "Renders successful results and restores the button",
            expression:
              '(fill($("#query"), "a"), submit($("#search-form")), await wait(45), $$("#results li").length === 3 && text("#status") === "3 results" && $("#search-form button").disabled === false)',
          },
          {
            name: "Shows an honest empty state",
            expression:
              '(fill($("#query"), "nothing"), submit($("#search-form")), await wait(45), $$("#results li").length === 0 && text("#status") === "No products found")',
          },
          {
            name: "Handles request failure",
            expression:
              '(fill($("#query"), "error"), submit($("#search-form")), await wait(45), $$("#results li").length === 0 && text("#status") === "Could not load products" && $("#search-form button").disabled === false)',
          },
          {
            name: "Displays returned names as text",
            expression:
              '(fill($("#query"), "unsafe"), submit($("#search-form")), await wait(45), $("#results img") === null && text("#results li").startsWith("<img"))',
          },
          {
            name: "Ignores a stale response that arrives last",
            expression:
              '(fill($("#query"), "slow"), submit($("#search-form")), fill($("#query"), "fast"), submit($("#search-form")), await wait(100), $$("#results li").length === 1 && text("#results li") === "Fast Pack" && text("#status") === "1 result")',
          },
        ],
      },
    ],
  },
};
