import type { LessonBody } from "./lessons";

/**
 * JavaScript lessons added after the course learning-design audit. Guided
 * lessons are followed by sparse checkpoints, and the final project combines
 * async work with a real DOM rather than assessing those skills in isolation.
 */
export const javascriptLessonBodies: Record<string, LessonBody> = {
  "js-basics.values": {
    summary:
      "Store values with const and let, know their types, and handle numbers the way money needs.",
    xp: 100,
    blocks: [
      {
        kind: "text",
        body: "`const` names a value that won't be reassigned; `let` names one that will. Use `const` by default and `let` only when you need to reassign. (You'll see `var` in old code; its scoping rules are confusing, so don't write new code with it.)",
      },
      {
        kind: "code",
        language: "javascript",
        code: `const name = "Ada";        // string
let count = 3;             // number (integers and decimals are both "number")
const inStock = true;      // boolean
let coupon = null;         // "deliberately nothing"
let note;                  // undefined: declared, never given a value

typeof count               // "number"
typeof null                // "object", a famous historical mistake
Array.isArray([1, 2])      // true (typeof [] is also "object")`,
      },
      { kind: "heading", text: "Numbers for prices and quantities" },
      {
        kind: "text",
        body: "Prices, quantities and totals are all `number`. Three things about numbers catch people out, and every shop calculation in this course runs into them.",
      },
      {
        kind: "text",
        body: "**Decimals are approximate.** `0.1 + 0.2` is `0.30000000000000004`. For money, round the final answer to the cent with `Math.round(total * 100) / 100`: multiply into cents, round to a whole number, divide back. Round once, at the end, not after every step.",
      },
      {
        kind: "text",
        body: '**`toFixed` gives you text.** `(13.5).toFixed(2)` is the string `"13.50"`. That\'s right for showing a price and wrong for doing more maths with it, so keep numbers as numbers until the moment you display them.',
      },
      {
        kind: "text",
        body: '**Not every conversion works.** `Number("12")` is 12, but `Number("12 apples")` is `NaN`, "not a number", whose type is, confusingly, `"number"`. Test for it with `Number.isNaN(n)`; `n === NaN` is always false, because NaN isn\'t equal to anything, not even itself. `Number.isFinite(n)` is stricter, false for NaN and for `Infinity` too, and `Number.isInteger(n)` tells a whole number from a decimal.',
      },
      {
        kind: "code",
        language: "javascript",
        code: `Math.round(4.99 * 3 * 0.9 * 100) / 100   // 13.47
(13.5).toFixed(2)                        // "13.50", a string

Number("12 apples")                      // NaN
Number.isNaN(Number("12 apples"))        // true
NaN === NaN                              // false

Number.isFinite(1 / 0)                   // false: 1 / 0 is Infinity
Number.isInteger(3)                      // true
Number.isInteger(2.5)                    // false`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "`const label = (19.5).toFixed(2);` What's `label + 1`?",
        options: [
          {
            text: "20.5",
            whyNot:
              "That would need `+` to add, but `toFixed` hands back text, not a number, so `+` doesn't add here.",
          },
          '"19.501"',
          {
            text: '"20.50"',
            whyNot:
              "That would mean the 1 was added before the formatting. `label` is already text by the time `+` sees it, and `+` with text joins.",
          },
          {
            text: "NaN",
            whyNot:
              "NaN comes from maths that can't be done. `+` with a string on one side doesn't do maths at all, so it can't fail.",
          },
        ],
        answer: 1,
        explanation:
          '`toFixed` returns the string `"19.50"`, and `+` with a string joins text. Format only for display, after the maths is done.',
      },
      {
        kind: "mcq",
        id: "q2",
        question: '`const n = Number("12 apples");` Which check tells you the conversion failed?',
        options: [
          {
            text: "`n === NaN`",
            whyNot:
              "NaN isn't equal to anything, itself included, so this is false even when `n` is NaN.",
          },
          {
            text: "`n === null`",
            whyNot: "`Number` never returns null. A conversion that fails gives NaN instead.",
          },
          "`Number.isNaN(n)`",
          {
            text: '`typeof n !== "number"`',
            whyNot:
              'NaN\'s type is `"number"`, so this check lets the failed conversion straight through.',
          },
        ],
        answer: 2,
        explanation:
          "`Number.isNaN` is the one reliable test. NaN is a number by type and unequal to itself, so the other checks miss it.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Round a total to the nearest cent.",
        before: "Math.",
        after: "(total * 100) / 100",
        answer: "round",
        explanation:
          "`Math.round` rounds to the nearest whole number, so working in cents first rounds to the nearest cent.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Safe line totals",
        prompt:
          "Write three helpers. `roundToCent(amount)` returns the amount rounded to the nearest cent, as a number. `isWholeQuantity(value)` is true for a whole number that's 0 or more, and false for anything else, including decimals, negatives, `NaN` and the string `\"3\"`. `lineTotal(price, qty)` returns price × qty rounded to the cent, or `null` when the price isn't a finite number of 0 or more or the quantity isn't whole.",
        language: "javascript",
        starter: `function roundToCent(amount) {
  // your code here
}

function isWholeQuantity(value) {
  // your code here
}

function lineTotal(price, qty) {
  // your code here
}

console.log(roundToCent(0.1 + 0.2), lineTotal(4.99, 3));`,
        hint: "`roundToCent` is `Math.round(amount * 100) / 100`. `isWholeQuantity` needs `Number.isInteger(value)` and `value >= 0`. In `lineTotal`, return `null` unless `Number.isFinite(price)`, `price >= 0` and `isWholeQuantity(qty)`; then round `price * qty`.",
        solution: `function roundToCent(amount) {
  return Math.round(amount * 100) / 100;
}

function isWholeQuantity(value) {
  return Number.isInteger(value) && value >= 0;
}

function lineTotal(price, qty) {
  if (!Number.isFinite(price) || price < 0 || !isWholeQuantity(qty)) return null;
  return roundToCent(price * qty);
}`,
        tests: [
          {
            name: "Rounds to the nearest cent",
            expression: "roundToCent(0.1 + 0.2) === 0.3 && roundToCent(4.99 * 3 * 0.9) === 13.47",
          },
          {
            name: "Returns a number, not text",
            expression: 'typeof roundToCent(1.234) === "number" && roundToCent(10) === 10',
          },
          {
            name: "Whole quantities include 0",
            expression: "isWholeQuantity(3) === true && isWholeQuantity(0) === true",
          },
          {
            name: "Decimals, negatives, NaN and text aren't whole quantities",
            expression: '[2.5, -1, NaN, "3"].every((value) => isWholeQuantity(value) === false)',
          },
          {
            name: "Multiplies and rounds a line",
            expression:
              "lineTotal(4.99, 3) === 14.97 && lineTotal(0.1, 3) === 0.3 && lineTotal(5, 0) === 0",
          },
          {
            name: "Refuses impossible prices and quantities",
            expression:
              "lineTotal(NaN, 2) === null && lineTotal(Infinity, 1) === null && lineTotal(-1, 2) === null && lineTotal(5, 2.5) === null",
          },
        ],
      },
    ],
  },
  "js-basics.coercion": {
    summary:
      "Know when JavaScript changes a value's type behind your back, and compare and test values safely.",
    xp: 100,
    blocks: [
      {
        kind: "text",
        body: "Every value from the last lesson has a type. JavaScript will also change a value's type for you, without asking, and that's where most beginner bugs live.",
      },
      { kind: "heading", text: "`+` joins, `-` subtracts" },
      {
        kind: "text",
        body: '`"5" + 1` is `"51"`: when either side of `+` is a string, `+` joins text. But `"5" - 1` is `4`, because `-` only does maths, so it converts the string first. Form fields always give you strings, so convert on purpose with `Number(text)`, and watch out: `Number("")` is `0`, not "nothing". `.trim()` removes spaces from both ends of a string, so `" 3.5 ".trim()` is `"3.5"`; the strings lesson covers more.',
      },
      {
        kind: "code",
        language: "javascript",
        code: `"5" + 1          // "51"   joined
"5" - 1          // 4      converted, then subtracted
Number("5") + 1  // 6      converted on purpose
Number("")       // 0      an empty field is not "nothing"
" 3.5 ".trim()   // "3.5"`,
      },
      { kind: "heading", text: "Compare with `===`" },
      {
        kind: "text",
        body: '`==` converts before comparing, so `0 == ""`, `"1" == 1` and `null == undefined` are all `true`. `===` compares the type as well as the value, and converts nothing. Always use `===`; then a comparison means exactly what it says.',
      },
      { kind: "heading", text: "Truthy and falsy" },
      {
        kind: "text",
        body: 'In an `if`, these count as false: `false`, `0`, `""`, `null`, `undefined` and `NaN`. Everything else is true, including `"0"`, `[]` and `{}`. So `if (quantity)` treats a genuine quantity of 0 as missing. When 0 or an empty string is a real answer, test for what you mean, such as `quantity === null`; the conditionals lesson shows `??` for defaults.',
      },
      {
        kind: "mcq",
        id: "q1",
        question: 'A form gives you `const qty = "2"`. What\'s `qty + 1`?',
        options: [
          {
            text: "3",
            whyNot:
              "That needs `+` to add, but with a string on one side it joins text. Nothing here converts `qty` to a number.",
          },
          {
            text: '"3"',
            whyNot: "Joining doesn't do any arithmetic: it puts one piece of text after the other.",
          },
          {
            text: "NaN",
            whyNot:
              "NaN comes from maths that can't be done, like `\"two\" - 1`. `+` with a string doesn't do maths at all.",
          },
          '"21"',
        ],
        answer: 3,
        explanation:
          "With a string on either side, `+` joins text. Convert first: `Number(qty) + 1` is 3.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Which of these values is truthy?",
        options: [
          {
            text: "`0`",
            whyNot:
              "0 is one of the six falsy values, which is exactly why `if (quantity)` treats a real 0 as missing.",
          },
          {
            text: '`""`',
            whyNot: "The empty string is falsy. It's the only string that is.",
          },
          '`"0"`',
          {
            text: "`null`",
            whyNot: "`null` is falsy, like `undefined`: both mean there's nothing there.",
          },
        ],
        answer: 2,
        explanation:
          'Any non-empty string is truthy, including "0" and "false". Only the empty string is falsy.',
      },
      {
        kind: "mcq",
        id: "q3",
        question: "Which of these comparisons is `true`?",
        options: [
          '`0 == ""`',
          {
            text: '`0 === ""`',
            whyNot:
              "`===` never converts, and a number and a string are different types, so it's false.",
          },
          {
            text: '`"1" === 1`',
            whyNot: "A string and a number are different types, and `===` checks the type too.",
          },
          {
            text: "`null === undefined`",
            whyNot:
              "They're two different values with different types. Only the loose `==` treats them as equal.",
          },
        ],
        answer: 0,
        explanation:
          '`==` converts the empty string to 0 before comparing, so `0 == ""` is true. That surprise is why the rule is to use `===`.',
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Numbers from a form",
        prompt:
          'Write `toNumber(input)`: trim the text, return `null` if it\'s empty or isn\'t a number, and the number otherwise. Watch the traps: `Number("")` is `0`, and `"0"` is a real answer. Then write `formatPrice(amount)`, which returns text like `$12.00`.',
        language: "javascript",
        starter: `function toNumber(input) {
  // your code here
}

function formatPrice(amount) {
  // your code here
}

console.log(toNumber(" 3.5 "), formatPrice(0.1 + 0.2));`,
        hint: 'Trim with `String(input).trim()` and return `null` straight away if the result is `""`. Then `Number(text)`, checking `Number.isNaN(...)`. For the price: `"$" + amount.toFixed(2)`.',
        solution: `function toNumber(input) {
  const text = String(input).trim();
  if (text === "") return null;
  const n = Number(text);
  return Number.isNaN(n) ? null : n;
}

function formatPrice(amount) {
  return "$" + amount.toFixed(2);
}`,
        tests: [
          { name: "Reads a whole number", expression: `toNumber("12") === 12` },
          { name: "Trims spaces and reads decimals", expression: `toNumber(" 3.5 ") === 3.5` },
          {
            name: "Empty input is null, not 0",
            expression: `toNumber("") === null && toNumber("   ") === null`,
          },
          {
            name: "Text that isn't a number is null",
            expression: `toNumber("12 apples") === null`,
          },
          { name: '"0" is a real zero', expression: `toNumber("0") === 0` },
          {
            name: "Formats prices to two decimals",
            expression: `formatPrice(12) === "$12.00" && formatPrice(0.1 + 0.2) === "$0.30"`,
          },
        ],
      },
    ],
  },
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
          {
            text: "Hi, Ada",
            whyNot:
              "That's what backticks would print. These are ordinary single quotes, which never fill anything in.",
          },
          {
            text: "An error, because `name` isn't defined",
            whyNot:
              "`name` is defined on the line before. And inside ordinary quotes there's no variable at all, just text.",
          },
          {
            text: "Hi, undefined",
            whyNot:
              "That would mean `name` was looked up and found empty. In single quotes, nothing is looked up at all.",
          },
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
          {
            text: '`"ada@example.com"`',
            whyNot:
              "That's what the cleaned-up string is, but the line never stores it anywhere. String methods return a new string and leave `email` alone.",
          },
          {
            text: '`"Ada@Example.com"`, trimmed but not lowercased',
            whyNot:
              "Nothing applies halfway. Both methods ran, but their result, a new string, was thrown away.",
          },
          {
            text: "`undefined`",
            whyNot:
              "`email` still holds what the person typed. Calling methods on it doesn't empty it.",
          },
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
          'Write four small helpers, using template literals to build the text. `itemCount(n)` returns `"1 item"`, or `"0 items"`, `"3 items"` and so on. `receiptLine(name, qty, price)` returns a line like `"Headlamp × 2: $70.00"`, where `price` is the price of one and the total always shows two decimals. `matchesSearch(productName, query)` is true when the product name contains the query, ignoring case and any spaces around the query; an empty query matches everything. `maskCard(number)` returns `"•••• 4242"`: four dots, a space, and the last four digits, ignoring spaces around the number. The `×` and `•` characters are awkward to type, so plain `x` and `*` are fine too: `"Headlamp x 2: $70.00"`, `"**** 4242"`.',
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
            expression: `["Headlamp × 2: $70.00", "Headlamp x 2: $70.00"].includes(receiptLine("Headlamp", 2, 35))`,
          },
          {
            name: "The total always shows two decimals",
            expression: `["Sticker × 3: $0.30", "Sticker x 3: $0.30"].includes(receiptLine("Sticker", 3, 0.1))`,
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
            expression: `["•••• 4242", "**** 4242"].includes(maskCard("4242424242424242")) && ["•••• 1881", "**** 1881"].includes(maskCard(" 4000 0566 5566 1881 "))`,
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
        body: "This checkpoint starts from an empty editor: you write both functions yourself. Before you type any code, list the inputs that should give `null`, and open the hint only after your first run.",
      },
      {
        kind: "text",
        body: "Everything here comes from the lessons so far, used together. Form fields arrive as text, so a checkout does three jobs, in this order: check the input and turn it into numbers, do the maths, then format the answer for a person. Keep them apart. Format too early and you're doing maths on text; convert without checking and an empty field quietly becomes 0, which looks like a real answer.",
      },
      {
        kind: "text",
        body: "A plan that works: trim both inputs and return `null` for an empty one. Convert with `Number`, then turn away anything unusable: a price that isn't finite or is negative, a quantity that isn't a whole number. Work out the total, take off the member discount, and round to the cent once, at the end. Only the label turns the number into text.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Why must you check for an empty string before calling `Number(text)`?",
        options: [
          {
            text: "Number cannot read strings",
            whyNot:
              '`Number` exists to read strings: `Number("12")` is 12. The trouble is one string it reads too generously.',
          },
          '`Number("")` is 0, so an empty field would look like a real 0',
          {
            text: "Empty strings throw an error",
            whyNot:
              "Nothing throws, and that's the problem: `Number` hands back an ordinary-looking number instead.",
          },
          {
            text: "Number removes decimal places",
            whyNot:
              '`Number("3.5")` is 3.5, so decimals survive. An empty field is the input that goes wrong.',
          },
        ],
        answer: 1,
        explanation:
          'Checking for an empty string first keeps "nothing entered" apart from a genuine 0.',
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the check that accepts only whole-number quantities.",
        before: "if (!Number.",
        after: "(quantity)) return null;",
        answer: "isInteger",
        explanation:
          "`Number.isInteger` is true only for whole numbers, so it turns away 2.5 and NaN alike.",
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
        body: "This checkpoint gives you no function to start from. Before writing any code, sketch the object you're going to return and note what type each part is.",
      },
      {
        kind: "text",
        body: "This one brings the data lessons together. The input is an array of orders; the output is one new object holding two arrays, a number and an object of counts. Writing that result down first, with a small example, tells you what to set up before the loop and what to add inside it.",
      },
      {
        kind: "text",
        body: "Two rules from earlier apply. Reading data shouldn't change it, so don't sort, splice or edit the orders you're given. And an empty array is a normal input: it should give empty arrays, 0 and an empty object, not an error.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which array method is most likely to accidentally change the caller's input?",
        options: [
          {
            text: "`filter`",
            whyNot: "`filter` builds a new array and leaves the original as it was.",
          },
          {
            text: "`map`",
            whyNot: "`map` returns a new array too; the original keeps its items and their order.",
          },
          "`sort`",
          {
            text: "`reduce`",
            whyNot:
              "`reduce` only reads the array to build its result. It changes the input only if your own callback does.",
          },
        ],
        answer: 2,
        explanation:
          "`sort` reorders the array it's called on. Copy first, `[...orders].sort(...)`, when you need a different order.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the immutable update that adds a paid count.",
        before: "const next = { ...counts, paid: ",
        after: " };",
        answer: "(counts.paid ?? 0) + 1",
        explanation:
          "Spread makes a new object, and `?? 0` starts the count at 0 when there isn't one yet.",
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
        body: 'Keep behavior out of attributes such as `onclick="..."`. Give the control an id or class, select it in app.js, and attach a listener there: a function the browser calls when someone uses the control, which the events lesson covers properly. That keeps HTML responsible for meaning and JavaScript responsible for behavior, avoids global function names, and works with strict Content Security Policy.',
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
          {
            text: "The first function in app.js",
            whyNot:
              "With a 404, none of app.js reached the browser, so none of its functions ran, right or wrong.",
          },
          {
            text: "The button's CSS",
            whyNot:
              "Styles don't stop a script loading. The Network panel says the file itself never arrived.",
          },
          {
            text: "Add more console.log calls inside the missing file",
            whyNot: "Logs inside a file that never loads never run, so they'd tell you nothing.",
          },
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
  "js-browser.scope": {
    summary:
      "Know where a variable can be seen, let a function remember state privately, and split code into modules that share only what they export.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: "**Scope** is where a name can be seen. `let` and `const` are **block-scoped**: a variable declared inside `{ }` (an `if`, a loop, a function) exists only inside those braces. When JavaScript meets a name, it looks in the current block, then the block around it, and so on outwards to the top of the file. It never looks inwards, so an outer block can't see a variable declared inside an inner one.",
      },
      {
        kind: "code",
        language: "javascript",
        code: `const taxRate = 0.2;              // visible everywhere below

function priceWithTax(price) {
  const tax = price * taxRate;     // taxRate found one level out
  if (tax > 100) {
    const note = "high tax";       // exists only inside this if
  }
  return price + tax;              // note doesn't exist here
}

console.log(tax);                  // ReferenceError: tax is not defined`,
      },
      {
        kind: "text",
        body: "Keep variables in the smallest scope that works. A variable at the top of a classic script is **global**: every other script on the page can read it, change it, or collide with it by using the same name. That's how two libraries that both define `total` break each other. `var`, which you'll meet in older code, ignores blocks and is scoped to the whole function, which is why it leaks out of loops.",
      },
      {
        kind: "text",
        body: "A **closure** is what happens when a function uses a variable from the scope it was created in: the function keeps that variable alive, even after the outer function has returned. Each call to the outer function makes a fresh variable, so each closure has its own. It's the standard way to keep state **private**: nothing outside can reach `count` except through the functions you hand back.",
      },
      {
        kind: "code",
        language: "javascript",
        caption: "Two counters, each with its own private count",
        code: `function makeCounter() {
  let count = 0;                       // a new count for every call
  return {
    increment: () => ++count,
    value: () => count,
  };
}

const likes = makeCounter();
const views = makeCounter();
likes.increment(); likes.increment();
views.increment();
likes.value();   // 2
views.value();   // 1
likes.count;     // undefined: the variable isn't a property, and no one else can change it`,
      },
      {
        kind: "text",
        body: "Closures are everywhere once you look for them. The counter above is one, and so is any function you hand over to be called later, such as a timer's callback or, in the events lesson, a click handler that updates a variable declared outside it.",
      },
      {
        kind: "callout",
        body: "**Later on:** React's hooks are closures too, and a hook that kept hold of an old value is behind one of React's most common bugs. You won't need that until the React course, but it's this lesson's idea.",
      },
      {
        kind: "text",
        body: '**Modules** give every file its own scope. In a file loaded with `type="module"` (or imported by one), top-level variables are private to that file; nothing becomes global by accident. A file shares something by **exporting** it, and another file uses it by **importing** it by name. In the browser, the path needs the `./` and the `.js`. A module runs once, however many files import it, so they all share the same exported values.',
      },
      {
        kind: "code",
        language: "javascript",
        caption: "cart.js and app.js",
        code: `// cart.js
const items = [];                        // private to this file
export function addItem(item) {
  items.push(item);
}
export function itemCount() {
  return items.length;
}

// app.js, loaded with <script type="module" src="./app.js">
import { addItem, itemCount } from "./cart.js";
addItem({ id: "tent" });
itemCount();   // 1
items;         // ReferenceError: items is private to cart.js`,
      },
      {
        kind: "callout",
        body: "The lesson editor runs a single script, so it can't show `import` and `export` between files. The challenge practises scope and closures; to see modules work, make the two files above in a folder, serve it with your editor's local server, and open the page with the console open.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "`const handlers = []; for (var i = 0; i < 3; i++) handlers.push(() => i);` What does `handlers.map((h) => h())` give?",
        options: [
          {
            text: "`[0, 1, 2]`",
            whyNot:
              "That's what `let` would give, with a fresh `i` for each pass. `var` makes a single `i` that all three functions share.",
          },
          {
            text: "`[2, 2, 2]`",
            whyNot:
              "The loop stops when `i < 3` fails, and that check runs after the last `i++`, so the shared `i` doesn't stop at 2.",
          },
          {
            text: "`[undefined, undefined, undefined]`",
            whyNot:
              "Each function returns `i`, and `i` still exists after the loop: `var` keeps it alive for the whole function.",
          },
          "`[3, 3, 3]`",
        ],
        answer: 3,
        explanation:
          "`var` makes one `i` for the whole loop, and all three functions close over that same variable. By the time they're called the loop has finished, so `i` is 3. With `let`, each pass through the loop gets its own `i`, and you get `[0, 1, 2]`.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          '`cart.js` is loaded with `type="module"` and declares `let items = [];` at the top. A separate, classic script on the same page runs `console.log(items)`. What happens?',
        options: [
          {
            text: "It logs `[]`",
            whyNot:
              "That would need `items` to be shared with the page. A module's top-level variables stay inside the module.",
          },
          {
            text: "It logs `undefined`",
            whyNot:
              "`undefined` means a name exists without a value. Outside the module, this name doesn't exist at all.",
          },
          "`ReferenceError: items is not defined`",
          {
            text: "It logs whatever `window.items` holds, which the module set",
            whyNot: "Modules never create globals, so `window.items` is never set.",
          },
        ],
        answer: 2,
        explanation:
          "A module's top-level variables belong to that module, not to the page. Nothing is shared unless the module exports it and another module imports it.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the line so other files can import `addItem` from cart.js.",
        before: "",
        after: " function addItem(item) {",
        answer: "export",
        explanation:
          '`export` in front of a declaration shares it. Another module then writes `import { addItem } from "./cart.js";`.',
      },
      {
        kind: "challenge",
        id: "c1",
        title: "State that stays private",
        prompt:
          "Write `makeCounter(start = 0)`, which returns an object with `increment()` (adds 1 and returns the new value), `reset()` (goes back to `start`) and `value()`. Each counter keeps its own count, and the count must not be reachable as a property. Then write `once(fn)`, which returns a function that calls `fn` with its arguments the first time and returns the result; every later call returns that first result without calling `fn` again. That's how you stop a double-click submitting an order twice.",
        language: "javascript",
        starter: `function makeCounter(start = 0) {
  // your code here
}

function once(fn) {
  // your code here
}

const likes = makeCounter();
likes.increment();
console.log(likes.value());`,
        hint: "Inside `makeCounter`, declare `let count = start;` and return an object of arrow functions that read and change `count`. For `once`, keep `let called = false;` and `let result;` in `once`'s scope, and have the returned function check `called` before doing anything.",
        solution: `function makeCounter(start = 0) {
  let count = start;
  return {
    increment: () => ++count,
    reset: () => {
      count = start;
    },
    value: () => count,
  };
}

function once(fn) {
  let called = false;
  let result;
  return (...args) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}`,
        tests: [
          {
            name: "Counts up from its start",
            expression:
              "(() => { const c = makeCounter(5); c.increment(); return c.increment() === 7 && c.value() === 7; })()",
          },
          {
            name: "Starts at 0 by default, and reset goes back to the start",
            expression:
              "(() => { const a = makeCounter(); const b = makeCounter(10); a.increment(); b.increment(); a.reset(); b.reset(); return a.value() === 0 && b.value() === 10; })()",
          },
          {
            name: "Two counters never share a count",
            expression:
              "(() => { const a = makeCounter(); const b = makeCounter(); a.increment(); a.increment(); b.increment(); return a.value() === 2 && b.value() === 1; })()",
          },
          {
            name: "The count is private, not a property anyone can change",
            expression:
              '(() => { const c = makeCounter(); c.increment(); for (const key of Object.keys(c)) { if (typeof c[key] !== "function") return false; } c.count = 99; return c.value() === 1; })()',
          },
          {
            name: "once calls the function the first time, with its arguments",
            expression:
              '(() => { const place = once((total) => `order for ${total}`); return place(40) === "order for 40"; })()',
          },
          {
            name: "…and never again, returning the first result",
            expression:
              "(() => { let calls = 0; const place = once((total) => { calls++; return total; }); place(40); return place(99) === 40 && calls === 1; })()",
          },
          {
            name: "Each once-wrapped function remembers separately",
            expression:
              '(() => { const a = once(() => "a"); const b = once(() => "b"); a(); return b() === "b" && a() === "a"; })()',
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
        body: "This checkpoint gives you the page but no JavaScript. Plan the state and the `render` function first; then each event handler only has to change the state and call `render`.",
      },
      {
        kind: "text",
        body: "This brings the DOM lessons together. Keep the list in a JavaScript array, and treat the page as a picture of that array, never as the place the data lives. The submit handler checks the input and adds to the array. One click listener on the list removes from it. And one `render` function rebuilds the whole list and the count from the array, every time it runs.",
      },
      {
        kind: "text",
        body: "Build it in that order: `render` first, called once at startup so you can see it working, then adding, then removing.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Why should render clear the list before rebuilding it?",
        options: [
          {
            text: "Clearing is faster than appending",
            whyNot:
              "Speed isn't the reason, and for a short list there's hardly any difference. Think about what happens the second time `render` runs.",
          },
          {
            text: "Event listeners require an empty list",
            whyNot:
              "Listeners don't care what's in the list, and the delegated one sits on the container anyway.",
          },
          {
            text: "The browser cannot append twice",
            whyNot:
              "It can append as often as you like, which is exactly the problem if nothing is cleared first.",
          },
          "So that calling it twice gives the same page, instead of adding every row again",
        ],
        answer: 3,
        explanation:
          "If `render` always starts from an empty list, the page always matches the array, however many times it runs.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the safe assignment that displays a user-entered item as text.",
        before: "nameElement.",
        after: " = itemName;",
        answer: "textContent",
        explanation: "`textContent` shows the characters as text and never reads them as HTML.",
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
  "js-async.fetch": {
    summary:
      "Read and send JSON with fetch, treat a 404 or 500 as the failure it is, and show loading, empty and error states on the page.",
    xp: 170,
    blocks: [
      { kind: "heading", text: "JSON" },
      {
        kind: "text",
        body: "**JSON** is the text format almost every web API speaks. It looks like a JavaScript object, but it's stricter: keys and strings need double quotes, and there are no comments, no trailing commas, no functions and no `undefined`. `JSON.stringify(value)` turns a value into JSON text, and `JSON.parse(text)` turns the text back into a value. `JSON.parse` throws a `SyntaxError` on anything that isn't valid JSON, such as `\"{'name': 'Ada'}\"` with single quotes.",
      },
      {
        kind: "code",
        language: "javascript",
        code: `const order = { id: 101, items: ["tent"], note: undefined, placed: new Date("2026-03-01") };

JSON.stringify(order);
// '{"id":101,"items":["tent"],"placed":"2026-03-01T00:00:00.000Z"}'
// undefined properties vanish; dates become text and stay text after parsing

// localStorage only stores strings, so JSON is how you keep an object there
localStorage.setItem("cart", JSON.stringify(cart));
const saved = JSON.parse(localStorage.getItem("cart") ?? "[]");`,
      },
      { kind: "heading", text: "Reading with `fetch`, and checking `ok`" },
      {
        kind: "text",
        body: "`fetch(url)` makes a request and gives back a promise of a **response**. Reading the body is a second wait, because the headers arrive before the body does: `await response.json()` reads the body and parses it as JSON. A body can only be read once.",
      },
      {
        kind: "text",
        body: "The trap: `fetch` **only rejects when the request can't be made at all** (the network is down, the address is wrong). A `404 Not Found` or a `500` server error still *resolves*, with a response whose `ok` is `false` and whose `status` says what happened. Code that goes straight to `response.json()` then treats the server's error message as if it were the data. Check `response.ok` and throw, so every failure lands in one `catch`.",
      },
      {
        kind: "code",
        language: "javascript",
        caption: "Reading JSON, and sending it",
        code: `async function loadProduct(id) {
  const response = await fetch(\`/api/products/\${id}\`);
  if (!response.ok) throw new Error(\`Product \${id}: \${response.status}\`);
  return response.json();
}

async function addReview(productId, stars) {
  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },   // tell the server it's JSON
    body: JSON.stringify({ productId, stars }),         // the body must be text
  });
  if (!response.ok) throw new Error(\`Review not saved: \${response.status}\`);
  return response.json();
}`,
      },
      { kind: "heading", text: "Four outcomes on the page" },
      {
        kind: "text",
        body: "**On the page, a request has more than two outcomes.** It starts *loading*, then it succeeds with data, succeeds with *nothing* (an empty list is an answer, not an error), or fails. Show each one: say `Loading…` and disable the button that started it, render the data or an honest empty message, and on failure say so in words a person understands. `try`/`catch`/`finally` fits exactly: `finally` re-enables the button whichever way it went.",
      },
      {
        kind: "code",
        language: "javascript",
        caption: "A Load button that shows every outcome",
        code: `const button = document.querySelector("#load-reviews");
const list = document.querySelector("#reviews");
const status = document.querySelector("#review-status");

async function loadReviews(productId) {
  const response = await fetch(\`/api/reviews?product=\${productId}\`);
  if (!response.ok) throw new Error(\`Reviews: \${response.status}\`);
  return response.json();
}

button.addEventListener("click", async () => {
  list.replaceChildren();                 // clear what the last request showed
  status.textContent = "Loading…";        // 1. loading
  button.disabled = true;
  try {
    const reviews = await loadReviews(7);
    for (const review of reviews) {
      const item = document.createElement("li");
      item.textContent = review.text;
      list.append(item);
    }
    if (reviews.length === 0) status.textContent = "No reviews yet";     // 3. empty
    else if (reviews.length === 1) status.textContent = "1 review";      // 2. data
    else status.textContent = \`\${reviews.length} reviews\`;
  } catch {
    status.textContent = "Could not load reviews";                       // 4. failed
  } finally {
    button.disabled = false;              // whichever way it went
  }
});`,
      },
      {
        kind: "text",
        body: "Two details in it are easy to miss. The old rows are cleared *before* loading, so a failure doesn't leave the last answer on screen looking current. And the empty case is decided only after a successful reply: an empty array means the server answered and there's nothing to show, which deserves its own message rather than the error one.",
      },
      { kind: "heading", text: "Replies that arrive out of order" },
      {
        kind: "text",
        body: "One more thing goes wrong on real networks: responses don't always arrive in the order you asked. If someone searches for *shell* and then *lamp*, and the *shell* reply is slower, it lands last and replaces the right results. The capstone asks you to handle that: remember which request is the latest, and ignore any older reply.",
      },
      {
        kind: "callout",
        body: "**Try it in a browser:** open DevTools on any site, go to the Network panel, filter by Fetch/XHR, and click a request. The Response tab shows the JSON the page received, and the status column shows which requests failed.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          '`await fetch("/api/orders/999")` and the server answers `404 Not Found`. What happens?',
        options: [
          {
            text: "The promise rejects, so the `catch` block runs",
            whyNot:
              "`fetch` rejects only when no response arrives at all. A 404 is a response from the server.",
          },
          {
            text: "`fetch` returns `null`",
            whyNot: "`fetch` always hands back a promise of a response. It never returns `null`.",
          },
          "The promise resolves with a response whose `ok` is `false`, and your code has to check it",
          {
            text: "The browser retries until it gets a 200",
            whyNot: "Nothing retries on its own. One request goes out and one response comes back.",
          },
        ],
        answer: 2,
        explanation:
          "`fetch` rejects only when no response arrives at all. Any response, including a 404 or 500, resolves the promise. That's why `if (!response.ok) throw …` belongs straight after every `fetch`.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          'What does `JSON.stringify({ name: "Ada", nickname: undefined, joined: new Date("2026-01-05") })` produce?',
        options: [
          '`{"name":"Ada","joined":"2026-01-05T00:00:00.000Z"}`',
          {
            text: '`{"name":"Ada","nickname":undefined,"joined":"2026-01-05"}`',
            whyNot:
              "JSON has no `undefined`, so it can't appear in the output, and a date keeps its time of day as well.",
          },
          {
            text: '`{"name":"Ada","nickname":null,"joined":{}}`',
            whyNot:
              "Neither is converted that way: a property holding `undefined` is dropped, and a date becomes text, not an empty object.",
          },
          {
            text: "It throws, because `undefined` can't be turned into JSON",
            whyNot:
              "An `undefined` property isn't an error. `JSON.stringify` quietly leaves it out.",
          },
        ],
        answer: 0,
        explanation:
          "JSON has no `undefined`, so that property is left out entirely, and a date is written as ISO text. `JSON.parse` gives you that text back, not a `Date`: convert it with `new Date(text)` when you need one.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the line that reads the response body and parses it as JSON.",
        before: "const orders = await response.",
        after: "();",
        answer: "json",
        explanation:
          "`response.json()` reads the body and parses it. It returns a promise, so it needs its own `await`.",
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "A Load button disables itself while its request runs. Where does `button.disabled = false` go so that it always comes back?",
        options: [
          {
            text: "At the end of the `try` block, after the data is shown",
            whyNot:
              "If the request fails, the code jumps to `catch` before reaching that line, and the button stays disabled for good.",
          },
          {
            text: "In the `catch` block",
            whyNot:
              "Then it only comes back after a failure. A successful load would leave the button disabled.",
          },
          "In a `finally` block",
          {
            text: "Straight after the `fetch` call, before `await response.json()`",
            whyNot:
              "The request isn't finished at that point: reading the body is a second wait, and it can still fail.",
          },
        ],
        answer: 2,
        explanation:
          "`finally` runs after `try` whether it succeeded or `catch` handled a failure, so anything that must happen either way belongs there.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Order history from an API",
        prompt:
          "The starter contains a stand-in for the network: `fetch` answers like a real server, with real response objects, so your code is exactly what you'd write in a browser. Write `loadOrders(customer)`, which fetches `/api/orders?customer=` followed by the customer, throws an `Error` when the response isn't OK, and otherwise returns the parsed JSON. Write `saveNote(orderId, note)`, which POSTs `{ orderId, note }` as JSON to `/api/notes` with a `Content-Type: application/json` header and returns the parsed reply. Then make **Load orders** work: trim the customer field, clear the list, show `Loading…` and disable the button. List each order as `#101: $168.00`, and show `3 orders`, `1 order` or `No orders yet`. On any failure show `Could not load orders`. Re-enable the button when the request finishes, whether it worked or not.",
        language: "dom",
        html: `<label for="customer">Customer</label>
<input id="customer" value="ada">
<button id="load" type="button">Load orders</button>
<p id="status" role="status"></p>
<ul id="orders"></ul>`,
        starter: `// A stand-in for the network. Keep it: your code calls fetch() as usual,
// and gets real Response objects back, as it would in a browser.
const requests = [];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetch(url, options = {}) {
  requests.push({ url, ...options });
  await wait(20);
  const reply = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  if (url === "/api/notes" && options.method === "POST") return reply({ saved: true }, 201);
  const customer = new URL(url, "https://shop.example").searchParams.get("customer");
  if (customer === "ada") {
    return reply([
      { id: 101, total: 168 },
      { id: 104, total: 42.5 },
      { id: 109, total: 9.99 },
    ]);
  }
  if (customer === "solo") return reply([{ id: 120, total: 5 }]);
  if (customer === "new") return reply([]);
  if (customer === "broken") return reply({ error: "Database unavailable" }, 500);
  return reply({ error: "No such customer" }, 404);
}

async function loadOrders(customer) {
  // your code here
}

async function saveNote(orderId, note) {
  // your code here
}

// Make the Load orders button work here.
`,
        hint: "In `loadOrders`: `` const response = await fetch(`/api/orders?customer=${customer}`) ``, then `if (!response.ok) throw new Error(…)`, then `return response.json()`. `saveNote` passes a second argument to `fetch` with `method`, `headers` and `body: JSON.stringify({ orderId, note })`. For the button, put the `await` inside `try`, the failure message in `catch`, and `button.disabled = false` in `finally`.",
        solution: `// A stand-in for the network. Keep it: your code calls fetch() as usual,
// and gets real Response objects back, as it would in a browser.
const requests = [];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetch(url, options = {}) {
  requests.push({ url, ...options });
  await wait(20);
  const reply = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  if (url === "/api/notes" && options.method === "POST") return reply({ saved: true }, 201);
  const customer = new URL(url, "https://shop.example").searchParams.get("customer");
  if (customer === "ada") {
    return reply([
      { id: 101, total: 168 },
      { id: 104, total: 42.5 },
      { id: 109, total: 9.99 },
    ]);
  }
  if (customer === "solo") return reply([{ id: 120, total: 5 }]);
  if (customer === "new") return reply([]);
  if (customer === "broken") return reply({ error: "Database unavailable" }, 500);
  return reply({ error: "No such customer" }, 404);
}

async function loadOrders(customer) {
  const response = await fetch(\`/api/orders?customer=\${encodeURIComponent(customer)}\`);
  if (!response.ok) throw new Error(\`Orders for \${customer}: \${response.status}\`);
  return response.json();
}

async function saveNote(orderId, note) {
  const response = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, note }),
  });
  if (!response.ok) throw new Error(\`Note not saved: \${response.status}\`);
  return response.json();
}

const input = document.querySelector("#customer");
const button = document.querySelector("#load");
const status = document.querySelector("#status");
const list = document.querySelector("#orders");

button.addEventListener("click", async () => {
  list.replaceChildren();
  status.textContent = "Loading…";
  button.disabled = true;
  try {
    const orders = await loadOrders(input.value.trim());
    for (const order of orders) {
      const item = document.createElement("li");
      item.textContent = \`#\${order.id}: $\${order.total.toFixed(2)}\`;
      list.append(item);
    }
    const count = orders.length;
    status.textContent = count === 0 ? "No orders yet" : \`\${count} \${count === 1 ? "order" : "orders"}\`;
  } catch {
    status.textContent = "Could not load orders";
  } finally {
    button.disabled = false;
  }
});`,
        tests: [
          {
            name: "Shows loading and disables the button straight away",
            expression:
              '(click($("#load")), text("#status") === "Loading…" && $("#load").disabled === true)',
          },
          {
            name: "Lists each order from the JSON",
            expression:
              '(click($("#load")), await wait(80), $$("#orders li").length === 3 && text($$("#orders li")[0]) === "#101: $168.00" && text($$("#orders li")[2]) === "#109: $9.99" && text("#status") === "3 orders" && $("#load").disabled === false)',
          },
          {
            name: "Trims the customer and asks for their orders",
            expression:
              '(fill($("#customer"), "  ada "), click($("#load")), await wait(80), requests.at(-1).url === "/api/orders?customer=ada" && $$("#orders li").length === 3)',
          },
          {
            name: "One order reads as one",
            expression:
              '(fill($("#customer"), "solo"), click($("#load")), await wait(80), text("#status") === "1 order" && text("#orders li") === "#120: $5.00")',
          },
          {
            name: "An empty history is an answer, not an error",
            expression:
              '(fill($("#customer"), "new"), click($("#load")), await wait(80), text("#status") === "No orders yet" && $$("#orders li").length === 0)',
          },
          {
            name: "A 500 shows as a failure, not as orders",
            expression:
              '(fill($("#customer"), "broken"), click($("#load")), await wait(80), text("#status") === "Could not load orders" && $$("#orders li").length === 0 && $("#load").disabled === false)',
          },
          {
            name: "loadOrders returns the parsed JSON, and throws when the response isn't OK",
            expression:
              '(await loadOrders("ada")).length === 3 && (await loadOrders("broken").then(() => false, (e) => e instanceof Error)) && (await loadOrders("nobody").then(() => false, (e) => e instanceof Error))',
          },
          {
            name: "saveNote sends JSON, labelled as JSON",
            expression:
              '(await saveNote(101, "Gift wrap")).saved === true && requests.at(-1).url === "/api/notes" && requests.at(-1).method === "POST" && new Headers(requests.at(-1).headers).get("content-type").startsWith("application/json") && JSON.parse(requests.at(-1).body).note === "Gift wrap" && JSON.parse(requests.at(-1).body).orderId === 101',
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
          {
            text: "Type coercion",
            whyNot:
              "Nothing here changes a value's type. The results are right; they just arrive in the wrong order.",
          },
          "A stale-response race condition",
          {
            text: "Event bubbling",
            whyNot:
              "Bubbling is about which elements hear an event. This bug is about which reply arrives last.",
          },
          {
            text: "A syntax error",
            whyNot:
              "The code runs without complaint, which is exactly what makes this bug hard to spot.",
          },
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
