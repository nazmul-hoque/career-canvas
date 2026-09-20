import type { LessonBody } from "./lessons";

// Lessons added after the React learning-design audit. They move from guided
// repairs to sparse checkpoints and finally an independent application.
export const reactLessonBodies: Record<string, LessonBody> = {
  "react-core.checkpoint": {
    summary:
      "Combine components, props, state and derived data in a filterable inventory without duplicating state.",
    xp: 220,
    blocks: [
      {
        kind: "callout",
        body: "This checkpoint starts with data and a blank editor. Sketch the component boundary and identify source state versus calculated values before writing JSX.",
      },
      {
        kind: "text",
        body: "A good React model stores the smallest source of truth. The search text and checkbox value change over time, so they are state. The visible products and result count can be calculated from that state and the products prop during every render.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which values belong in state for a filterable product list?",
        options: [
          "The query and in-stock setting; derive the filtered products and count",
          "The query, filtered products and count",
          "A copy of the products prop",
          "Only the filtered products",
        ],
        answer: 0,
        explanation:
          "Store what the user changes. Calculated values stay consistent when they are derived during render.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the immutable, case-insensitive filter.",
        before: "products.filter((p) => p.name.",
        after: "(query.toLowerCase()))",
        answer: "toLowerCase().includes",
        explanation: "Normalising both strings makes matching independent of letter case.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Inventory explorer",
        prompt:
          'From the supplied data, write `ProductRow({ product })` and `InventoryApp({ products })`. Render a search input labelled "Search products", a checkbox labelled "Only in stock", text such as "3 products", and a list of matching products in their original order. Each row shows its name and either "In stock" or "Sold out". Search is case-insensitive; the filters work together; and no matches shows "No matching products.". Store only the two filter controls in state. Do not mutate `products`.',
        language: "react",
        starter: `const PRODUCTS = [
  { id: "lamp", name: "Headlamp", inStock: true },
  { id: "shell", name: "Rain Shell", inStock: false },
  { id: "bottle", name: "Water Bottle", inStock: true },
];

// Write ProductRow and InventoryApp from the brief.

export default function App() {
  return <InventoryApp products={PRODUCTS} />;
}`,
        hint: "Keep `query` and `onlyInStock` in state. Derive `visible` with one filter, render it with stable product IDs as keys, and use a real labelled checkbox.",
        solution: `const PRODUCTS = [
  { id: "lamp", name: "Headlamp", inStock: true },
  { id: "shell", name: "Rain Shell", inStock: false },
  { id: "bottle", name: "Water Bottle", inStock: true },
];

function ProductRow({ product }) {
  return (
    <li>
      <strong>{product.name}</strong> — {product.inStock ? "In stock" : "Sold out"}
    </li>
  );
}

function InventoryApp({ products }) {
  const [query, setQuery] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const normalisedQuery = query.trim().toLowerCase();
  const visible = products.filter(
    (product) =>
      product.name.toLowerCase().includes(normalisedQuery) &&
      (!onlyInStock || product.inStock),
  );

  return (
    <section>
      <h2>Inventory</h2>
      <label htmlFor="product-search">Search products</label>
      <input
        id="product-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <label>
        <input
          type="checkbox"
          checked={onlyInStock}
          onChange={(event) => setOnlyInStock(event.target.checked)}
        />
        Only in stock
      </label>
      <p>{visible.length} {visible.length === 1 ? "product" : "products"}</p>
      {visible.length === 0 ? (
        <p>No matching products.</p>
      ) : (
        <ul>
          {visible.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function App() {
  return <InventoryApp products={PRODUCTS} />;
}`,
        tests: [
          {
            name: "Shows every product and the initial count",
            expression: `await render(<InventoryApp products={[
  { id: "a", name: "Headlamp", inStock: true },
  { id: "b", name: "Rain Shell", inStock: false },
  { id: "c", name: "Bottle", inStock: true },
]} />);
return getAllByRole("listitem").length === 3 && text().includes("3 products");`,
          },
          {
            name: "Search is case-insensitive",
            expression: `await render(<InventoryApp products={[
  { id: "a", name: "Headlamp", inStock: true },
  { id: "b", name: "Rain Shell", inStock: false },
]} />);
await fill(getByLabelText("Search products"), "LAMP");
return getAllByRole("listitem").length === 1 && text().includes("Headlamp");`,
          },
          {
            name: "The stock filter removes sold-out products",
            expression: `await render(<InventoryApp products={[
  { id: "a", name: "Headlamp", inStock: true },
  { id: "b", name: "Rain Shell", inStock: false },
]} />);
await click(getByLabelText("Only in stock"));
return getAllByRole("listitem").length === 1 && !text().includes("Rain Shell");`,
          },
          {
            name: "Both filters apply together",
            expression: `await render(<InventoryApp products={[
  { id: "a", name: "Blue Lamp", inStock: true },
  { id: "b", name: "Blue Shell", inStock: false },
  { id: "c", name: "Red Bottle", inStock: true },
]} />);
await fill(getByLabelText("Search products"), "blue");
await click(getByLabelText("Only in stock"));
return text().includes("Blue Lamp") && !text().includes("Blue Shell") && text().includes("1 product");`,
          },
          {
            name: "Explains an empty result",
            expression: `await render(<InventoryApp products={[{ id: "a", name: "Headlamp", inStock: true }]} />);
await fill(getByLabelText("Search products"), "tent");
return text().includes("No matching products.") && getAllByRole("listitem").length === 0;`,
          },
          {
            name: "Does not mutate its input",
            expression: `const products = Object.freeze([
  Object.freeze({ id: "b", name: "Bottle", inStock: true }),
  Object.freeze({ id: "a", name: "Headlamp", inStock: false }),
]);
await render(<InventoryApp products={products} />);
await fill(getByLabelText("Search products"), "head");
return products[0].id === "b" && products.length === 2;`,
          },
        ],
      },
    ],
  },
  "react-hooks.reducer": {
    summary:
      "Move related state transitions into a pure reducer so every event has one explicit result.",
    xp: 210,
    blocks: [
      {
        kind: "text",
        body: "Several state values that change together are easier to reason about as one state machine. `useReducer(reducer, initialState)` returns the current state and `dispatch`. An event dispatches a plain action; the reducer decides the next state.",
      },
      {
        kind: "code",
        language: "jsx",
        code: `function reducer(state, action) {
  if (action.type === "resolved") {
    return state.map((ticket) =>
      ticket.id === action.id ? { ...ticket, status: "resolved" } : ticket,
    );
  }
  return state;
}

const [tickets, dispatch] = useReducer(reducer, initialTickets);
dispatch({ type: "resolved", id: 42 });`,
      },
      {
        kind: "text",
        body: "Reducers must be pure: the same state and action produce the same result, with no requests, timers or mutation. That makes transitions testable without rendering. Event handlers may perform an external action and dispatch the result, but the reducer only calculates.",
      },
      {
        kind: "text",
        body: "An unknown action should either throw during development or return the existing state unchanged. Returning a fresh copy for no change causes unnecessary renders and hides misspelled action names.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What belongs inside a reducer?",
        options: [
          "A fetch request followed by a state update",
          "A pure calculation from the current state and an action to the next state",
          "Reading localStorage",
          "Calling an analytics service",
        ],
        answer: 1,
        explanation:
          "Reducers calculate state. External work belongs in event handlers or effects.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the immutable update of one matching record.",
        before: "ticket.id === action.id ? { ",
        after: ', status: "resolved" } : ticket',
        answer: "...ticket",
        explanation: "Spreading preserves the other fields while creating a new object.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "A support queue reducer",
        prompt:
          'Write `ticketReducer(state, action)` for `"assign"`, `"resolve"` and `"reopen"` actions. Assign sets the matching ticket\'s `owner` from the action. Resolve and reopen set its status. Never mutate state or unrelated tickets; an unknown action returns the exact same state object. Then write `SupportQueue({ initialTickets })` with `useReducer`: show each ticket title, status and owner (or "Unassigned"), plus "Assign to me", and either "Resolve" or "Reopen" buttons.',
        language: "react",
        starter: `const STARTING_TICKETS = [
  { id: 1, title: "Cannot sign in", status: "open", owner: null },
  { id: 2, title: "Update address", status: "resolved", owner: "Ada" },
];

// Write ticketReducer and SupportQueue.

export default function App() {
  return <SupportQueue initialTickets={STARTING_TICKETS} />;
}`,
        hint: "Map over state for known actions. Return a copied ticket only for the matching id. In the component, dispatch plain objects from button click handlers.",
        solution: `const STARTING_TICKETS = [
  { id: 1, title: "Cannot sign in", status: "open", owner: null },
  { id: 2, title: "Update address", status: "resolved", owner: "Ada" },
];

function ticketReducer(state, action) {
  if (action.type === "assign") {
    return state.map((ticket) =>
      ticket.id === action.id ? { ...ticket, owner: action.owner } : ticket,
    );
  }
  if (action.type === "resolve" || action.type === "reopen") {
    const status = action.type === "resolve" ? "resolved" : "open";
    return state.map((ticket) =>
      ticket.id === action.id ? { ...ticket, status } : ticket,
    );
  }
  return state;
}

function SupportQueue({ initialTickets }) {
  const [tickets, dispatch] = useReducer(ticketReducer, initialTickets);
  return (
    <ul>
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <h3>{ticket.title}</h3>
          <p>Status: {ticket.status}</p>
          <p>Owner: {ticket.owner || "Unassigned"}</p>
          <button onClick={() => dispatch({ type: "assign", id: ticket.id, owner: "Me" })}>
            Assign to me
          </button>
          {ticket.status === "open" ? (
            <button onClick={() => dispatch({ type: "resolve", id: ticket.id })}>Resolve</button>
          ) : (
            <button onClick={() => dispatch({ type: "reopen", id: ticket.id })}>Reopen</button>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function App() {
  return <SupportQueue initialTickets={STARTING_TICKETS} />;
}`,
        tests: [
          {
            name: "Reducer assigns without changing the input",
            expression: `const state = [{ id: 1, title: "Help", status: "open", owner: null }];
const next = ticketReducer(state, { type: "assign", id: 1, owner: "Sam" });
return state[0].owner === null && next !== state && next[0].owner === "Sam";`,
          },
          {
            name: "Reducer resolves and reopens",
            expression: `const open = [{ id: 1, title: "Help", status: "open", owner: null }];
const resolved = ticketReducer(open, { type: "resolve", id: 1 });
const reopened = ticketReducer(resolved, { type: "reopen", id: 1 });
return resolved[0].status === "resolved" && reopened[0].status === "open";`,
          },
          {
            name: "Unknown actions preserve identity",
            expression: `const state = [{ id: 1, title: "Help", status: "open", owner: null }];
return ticketReducer(state, { type: "misspelled" }) === state;`,
          },
          {
            name: "Assign button updates the matching ticket",
            expression: `await render(<SupportQueue initialTickets={[
  { id: 1, title: "First", status: "open", owner: null },
]} />);
await click(getByRole("button", { name: "Assign to me" }));
return text().includes("Owner: Me");`,
          },
          {
            name: "Resolve changes both status and available action",
            expression: `await render(<SupportQueue initialTickets={[
  { id: 1, title: "First", status: "open", owner: null },
]} />);
await click(getByRole("button", { name: "Resolve" }));
return text().includes("Status: resolved") && getByRole("button", { name: "Reopen" }) !== null;`,
          },
          {
            name: "Updates do not affect a different ticket",
            expression: `await render(<SupportQueue initialTickets={[
  { id: 1, title: "First", status: "open", owner: null },
  { id: 2, title: "Second", status: "open", owner: null },
]} />);
await click(getAllByRole("button", { name: "Resolve" })[0]);
return text().includes("First Status: resolved") && text().includes("Second Status: open");`,
          },
        ],
      },
    ],
  },
  "react-data.checkpoint": {
    summary:
      "Synthesize effects, request states, derived filtering and summaries in an order dashboard.",
    xp: 240,
    blocks: [
      {
        kind: "callout",
        body: "This checkpoint supplies only the component name. Model the possible request states on paper before you write the effect.",
      },
      {
        kind: "text",
        body: "The loaded orders are source data. The active status filter, visible rows, count and paid revenue are different kinds of values: store the filter because a person changes it, but calculate the visible rows and summary from the latest data during render.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "The status filter changes. Should the app fetch the same orders again?",
        options: [
          "Yes, every visible change belongs in the effect dependencies",
          "No; filtering already-loaded data is a render calculation",
          "Yes, but only for the paid filter",
          "No; effects may never depend on state",
        ],
        answer: 1,
        explanation:
          "The filter changes how existing data is displayed, not the external resource being synchronized.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the cleanup guard that discards an obsolete response.",
        before: "return () => { ",
        after: " = true; };",
        answer: "ignore",
        explanation: "The promise callback checks this flag before committing a stale result.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Order dashboard",
        prompt:
          'From a blank editor, write `OrderDashboard({ loadOrders })`. Call `loadOrders()` on mount. Show "Loading orders…" while pending. On failure, show an alert reading "Couldn\'t load orders." and a "Try again" button. A successful empty response shows "No orders yet.". On success, provide "All", "Paid" and "Pending" filter buttons, text with the visible order count, and "Paid revenue: $150.00" calculated from all paid orders. List each visible customer and status. Retrying must really call the loader again, and obsolete responses must not update the screen.',
        language: "react",
        starter: `// Write OrderDashboard from the state diagram in the brief.

export default function App() {
  return <OrderDashboard loadOrders={async () => []} />;
}`,
        hint: "Use one request state object, plus `attempt` and `filter` state. Fetch in an effect on `[loadOrders, attempt]` with an ignore cleanup. Derive paid revenue and filtered orders during render.",
        solution: `function OrderDashboard({ loadOrders }) {
  const [request, setRequest] = useState({ status: "loading", orders: [] });
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let ignore = false;
    setRequest({ status: "loading", orders: [] });
    loadOrders()
      .then((orders) => {
        if (!ignore) setRequest({ status: "success", orders });
      })
      .catch(() => {
        if (!ignore) setRequest({ status: "error", orders: [] });
      });
    return () => {
      ignore = true;
    };
  }, [loadOrders, attempt]);

  if (request.status === "loading") return <p>Loading orders…</p>;
  if (request.status === "error") {
    return (
      <div>
        <p role="alert">Couldn't load orders.</p>
        <button onClick={() => setAttempt((value) => value + 1)}>Try again</button>
      </div>
    );
  }
  if (request.orders.length === 0) return <p>No orders yet.</p>;

  const visible =
    filter === "all"
      ? request.orders
      : request.orders.filter((order) => order.status === filter);
  const revenue = request.orders
    .filter((order) => order.status === "paid")
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <section>
      <h2>Orders</h2>
      <button onClick={() => setFilter("all")}>All</button>
      <button onClick={() => setFilter("paid")}>Paid</button>
      <button onClick={() => setFilter("pending")}>Pending</button>
      <p>{visible.length} {visible.length === 1 ? "order" : "orders"}</p>
      <p>Paid revenue: \${revenue.toFixed(2)}</p>
      {visible.length === 0 ? (
        <p>No matching orders.</p>
      ) : (
        <ul>
          {visible.map((order) => (
            <li key={order.id}>{order.customer} — {order.status}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function App() {
  return <OrderDashboard loadOrders={async () => []} />;
}`,
        tests: [
          {
            name: "Shows loading before the request settles",
            expression: `await render(<OrderDashboard loadOrders={() => new Promise(() => {})} />);
return text() === "Loading orders…";`,
          },
          {
            name: "Shows orders, count and paid revenue",
            expression: `const orders = [
  { id: 1, customer: "Ada", status: "paid", total: 100 },
  { id: 2, customer: "Sam", status: "pending", total: 90 },
  { id: 3, customer: "Lin", status: "paid", total: 50 },
];
await render(<OrderDashboard loadOrders={async () => orders} />);
await waitFor(() => getAllByRole("listitem").length === 3);
return text().includes("3 orders") && text().includes("Paid revenue: $150.00");`,
          },
          {
            name: "Filters paid and pending orders",
            expression: `const orders = [
  { id: 1, customer: "Ada", status: "paid", total: 100 },
  { id: 2, customer: "Sam", status: "pending", total: 90 },
];
await render(<OrderDashboard loadOrders={async () => orders} />);
await waitFor(() => getAllByRole("listitem").length === 2);
await click(getByRole("button", { name: "Paid" }));
const paid = text().includes("Ada") && !text().includes("Sam") && text().includes("1 order");
await click(getByRole("button", { name: "Pending" }));
return paid && text().includes("Sam") && !text().includes("Ada");`,
          },
          {
            name: "Shows a useful empty response",
            expression: `await render(<OrderDashboard loadOrders={async () => []} />);
await waitFor(() => text() === "No orders yet.");
return true;`,
          },
          {
            name: "Shows no-match state without changing the revenue summary",
            expression: `const orders = [{ id: 1, customer: "Ada", status: "paid", total: 12.5 }];
await render(<OrderDashboard loadOrders={async () => orders} />);
await waitFor(() => getAllByRole("listitem").length === 1);
await click(getByRole("button", { name: "Pending" }));
return text().includes("No matching orders.") && text().includes("Paid revenue: $12.50");`,
          },
          {
            name: "Error offers a working retry",
            expression: `let calls = 0;
const load = async () => {
  calls++;
  if (calls === 1) throw new Error("offline");
  return [{ id: 1, customer: "Ada", status: "paid", total: 10 }];
};
await render(<OrderDashboard loadOrders={load} />);
await waitFor(() => getByRole("alert"));
await click(getByRole("button", { name: "Try again" }));
await waitFor(() => getAllByRole("listitem").length === 1);
return calls === 2;`,
          },
          {
            name: "Drops a response after unmount",
            expression: `let resolve;
const pending = new Promise((done) => { resolve = done; });
function Wrapper() {
  const [show, setShow] = useState(true);
  return <div><button onClick={() => setShow(false)}>Leave</button>{show ? <OrderDashboard loadOrders={() => pending} /> : <p>Gone</p>}</div>;
}
await render(<Wrapper />);
await click(getByRole("button", { name: "Leave" }));
resolve([{ id: 1, customer: "Late", status: "paid", total: 10 }]);
await sleep(30);
return text().includes("Gone") && !text().includes("Late");`,
          },
        ],
      },
    ],
  },
  "react-quality.accessibility": {
    summary:
      "Build interactions from semantic controls, expose their state, and keep content relationships explicit.",
    xp: 170,
    blocks: [
      {
        kind: "text",
        body: "Accessibility starts with the correct element. A button already supports focus, Enter, Space and disabled state. A clickable div supplies none of those guarantees, so rebuilding them by hand creates more code and usually misses something.",
      },
      {
        kind: "text",
        body: "Semantic HTML sometimes needs a state relationship. A disclosure button uses `aria-expanded` to expose whether its panel is open and `aria-controls` to point at the panel. The panel can use `aria-labelledby` to point back to the button.",
      },
      {
        kind: "code",
        language: "jsx",
        code: `const id = useId();
<button
  id={id + "-button"}
  aria-expanded={open}
  aria-controls={id + "-panel"}
>
  Shipping details
</button>`,
      },
      {
        kind: "text",
        body: "Use `useId` for relationships that need unique DOM IDs. Hard-coded IDs collide when a component appears twice; random IDs change between renders and can break server rendering.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Why is a button better than a div with an onClick for a disclosure?",
        options: [
          "Buttons always look better",
          "Buttons already provide keyboard behavior, focus and an interactive role",
          "Divs cannot contain text",
          "React only allows click handlers on buttons",
        ],
        answer: 1,
        explanation: "Native semantics provide behavior and meaning before any ARIA is added.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the attribute that exposes whether controlled content is open.",
        before: "<button aria-",
        after: "={open}>Details</button>",
        answer: "expanded",
        explanation: "aria-expanded communicates the current collapsed or expanded state.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Accessible disclosures",
        prompt:
          'Replace the clickable div with `Disclosure({ title, children })`. Use a real button whose accessible name is the title. It toggles its own content, starts closed, exposes `aria-expanded`, and points to the panel with `aria-controls`. The visible panel has `role="region"` and `aria-labelledby` pointing back to the button. IDs must remain unique when two disclosures render.',
        language: "react",
        starter: `function Disclosure({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div onClick={() => setOpen(!open)}>{title}</div>
      <div hidden={!open}>{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <main>
      <Disclosure title="Shipping"><p>Ships in two days.</p></Disclosure>
      <Disclosure title="Returns"><p>Return within 30 days.</p></Disclosure>
    </main>
  );
}`,
        hint: "Create a base ID with `useId()`, derive button and panel IDs, render the panel only when open, and connect both directions with `aria-controls` and `aria-labelledby`.",
        solution: `function Disclosure({ title, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const buttonId = id + "-button";
  const panelId = id + "-panel";
  return (
    <section>
      <button
        id={buttonId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {title}
      </button>
      {open ? (
        <div id={panelId} role="region" aria-labelledby={buttonId}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

export default function App() {
  return (
    <main>
      <Disclosure title="Shipping"><p>Ships in two days.</p></Disclosure>
      <Disclosure title="Returns"><p>Return within 30 days.</p></Disclosure>
    </main>
  );
}`,
        tests: [
          {
            name: "Starts closed with state exposed",
            expression: `await render(<Disclosure title="Shipping"><p>Fast</p></Disclosure>);
const button = getByRole("button", { name: "Shipping" });
return button.getAttribute("aria-expanded") === "false" && queryByRole("region") === null;`,
          },
          {
            name: "Button opens and closes the panel",
            expression: `await render(<Disclosure title="Shipping"><p>Fast</p></Disclosure>);
const button = getByRole("button", { name: "Shipping" });
await click(button);
const opened = getByRole("region") !== null && text().includes("Fast");
await click(button);
return opened && queryByRole("region") === null;`,
          },
          {
            name: "Control and panel reference each other",
            expression: `await render(<Disclosure title="Shipping"><p>Fast</p></Disclosure>);
const button = getByRole("button", { name: "Shipping" });
await click(button);
const panel = getByRole("region");
return button.getAttribute("aria-controls") === panel.id && panel.getAttribute("aria-labelledby") === button.id;`,
          },
          {
            name: "Two instances have unique relationships",
            expression: `await render(<App />);
const buttons = getAllByRole("button");
await click(buttons[0]);
await click(buttons[1]);
const regions = getAllByRole("region");
return buttons[0].id !== buttons[1].id && regions[0].id !== regions[1].id;`,
          },
          {
            name: "Each disclosure owns independent state",
            expression: `await render(<App />);
await click(getByRole("button", { name: "Returns" }));
return text().includes("Return within 30 days.") && !text().includes("Ships in two days.");`,
          },
        ],
      },
    ],
  },
  "react-quality.testing": {
    summary:
      "Turn a behavior contract into tests that survive refactors and describe the interface a person uses.",
    xp: 180,
    blocks: [
      {
        kind: "text",
        body: "A valuable component test describes observable behavior: what is on screen, what a person does, and what changes. It should not care whether the component uses one state value, a reducer, or a custom hook.",
      },
      {
        kind: "code",
        language: "jsx",
        code: `await render(<QuantityPicker stock={2} onChange={record} />);
await click(getByRole("button", { name: "Increase quantity" }));
expect(record).toHaveBeenCalledWith(2);`,
      },
      {
        kind: "text",
        body: "Query controls by role, accessible name or label. Those queries match how assistive technology understands the interface, so a test failure can reveal a real usability problem. A selector such as `.blue-button:nth-child(2)` only proves the markup has not moved.",
      },
      {
        kind: "text",
        body: "Test boundaries and meaningful states, not every line. For a quantity picker, zero, maximum stock, and the transitions immediately beside them carry more information than repeating the same middle-value click ten times.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which test is most resilient to an internal refactor?",
        options: [
          "Read the component's private count state",
          'Click the button named "Increase quantity" and verify the displayed quantity and callback',
          "Check that the second child is a button",
          "Snapshot every generated class name",
        ],
        answer: 1,
        explanation:
          "It checks the public behavior while allowing the implementation and markup structure to change.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the preferred query for a labelled increment control.",
        before: 'getByRole("button", { ',
        after: ': "Increase quantity" })',
        answer: "name",
        explanation: "The role and accessible name identify the control as a person encounters it.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Build from a behavior contract",
        prompt:
          'Write `QuantityPicker({ value, stock, onChange })` from its public behavior. Show "Quantity: 2". A button named "Decrease quantity" requests `onChange(value - 1)` and is disabled at 0. A button named "Increase quantity" requests `onChange(value + 1)` and is disabled at `stock`. Show "Maximum available" at the upper boundary and announce the current quantity with `role="status"`. Do not keep a second copy of `value` in state. `App` should own the value and render the picker with stock 3.',
        language: "react",
        starter: `// The tests are the contract. Write QuantityPicker and App.
`,
        hint: "This is a controlled component: render the value prop and call onChange with the requested next value. App owns the one useState.",
        solution: `function QuantityPicker({ value, stock, onChange }) {
  return (
    <section>
      <p role="status">Quantity: {value}</p>
      <button
        aria-label="Decrease quantity"
        disabled={value === 0}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <button
        aria-label="Increase quantity"
        disabled={value === stock}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
      {value === stock ? <p>Maximum available</p> : null}
    </section>
  );
}

export default function App() {
  const [quantity, setQuantity] = useState(0);
  return <QuantityPicker value={quantity} stock={3} onChange={setQuantity} />;
}`,
        tests: [
          {
            name: "Displays the controlled value",
            expression: `await render(<QuantityPicker value={2} stock={5} onChange={() => {}} />);
return getByRole("status").textContent === "Quantity: 2";`,
          },
          {
            name: "Increase requests the next value",
            expression: `const values = [];
await render(<QuantityPicker value={2} stock={5} onChange={(value) => values.push(value)} />);
await click(getByRole("button", { name: "Increase quantity" }));
return values.length === 1 && values[0] === 3;`,
          },
          {
            name: "Decrease requests the previous value",
            expression: `const values = [];
await render(<QuantityPicker value={2} stock={5} onChange={(value) => values.push(value)} />);
await click(getByRole("button", { name: "Decrease quantity" }));
return values.length === 1 && values[0] === 1;`,
          },
          {
            name: "Zero disables only decrease",
            expression: `await render(<QuantityPicker value={0} stock={3} onChange={() => {}} />);
return getByRole("button", { name: "Decrease quantity" }).disabled &&
  !getByRole("button", { name: "Increase quantity" }).disabled;`,
          },
          {
            name: "Maximum disables increase and explains why",
            expression: `await render(<QuantityPicker value={3} stock={3} onChange={() => {}} />);
return getByRole("button", { name: "Increase quantity" }).disabled &&
  text().includes("Maximum available");`,
          },
          {
            name: "App owns one value through repeated interactions",
            expression: `await render(<App />);
const increase = getByRole("button", { name: "Increase quantity" });
await click(increase);
await click(increase);
await click(increase);
const atMax = text().includes("Quantity: 3");
await click(getByRole("button", { name: "Decrease quantity" }));
return atMax && text().includes("Quantity: 2") && !text().includes("Maximum available");`,
          },
        ],
      },
    ],
  },
  "react-project.support": {
    summary:
      "Build a complete support queue with asynchronous data, derived views, validated creation and immutable transitions.",
    xp: 350,
    blocks: [
      {
        kind: "callout",
        body: "Capstone: the editor contains only sample services. Break the brief into request, filter, form and ticket-row behaviors, then make one thin vertical slice work before adding another.",
      },
      {
        kind: "text",
        body: "This project deliberately combines the course instead of naming the hook to use. Decide component boundaries, keep a single source of truth, derive counts and filtered rows, model request states, and expose every control by a useful accessible name.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "After resolving a ticket, where should the open-ticket count come from?",
        options: [
          "A second state value decremented in the click handler",
          "The latest tickets array, filtered during render",
          "A variable outside the component",
          "A new request after every click",
        ],
        answer: 1,
        explanation: "A derived count cannot drift away from the records it summarizes.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "What prevents two tickets being created by a rapid double-click?",
        options: [
          "Clear the input immediately",
          "Disable the submit button while the save promise is pending",
          "Put the submit handler in an effect",
          "Use an array index as the new ticket ID",
        ],
        answer: 1,
        explanation:
          "Pending is a visible application state. Disabling the action prevents a duplicate request and explains why it cannot run.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Support queue",
        prompt:
          'From the brief, write `SupportDesk({ loadTickets, saveTicket })`. Load tickets on mount with loading, error plus working retry, and success states. In success, show "N open tickets", a search input labelled "Search tickets", and All/Open/Resolved filters. Search title case-insensitively and show "No matching tickets." when appropriate. Each ticket shows title and status with a Resolve/Reopen action that updates immutably. Add a controlled "Ticket title" field and "Create ticket" submit button. Blank submissions show an alert. While `saveTicket({ title })` is pending, disable the button and label it "Creating…"; append the returned ticket and clear the field on success; show "Couldn\'t create ticket." on failure. Ignore a load response after unmount.',
        language: "react",
        starter: `const sampleLoad = async () => [
  { id: 1, title: "Cannot sign in", status: "open" },
  { id: 2, title: "Change delivery address", status: "resolved" },
];
const sampleSave = async ({ title }) => ({ id: Date.now(), title, status: "open" });

// Build SupportDesk from the brief.

export default function App() {
  return <SupportDesk loadTickets={sampleLoad} saveTicket={sampleSave} />;
}`,
        hint: "Start with one load-state object and an effect with cleanup. Once success renders, add filter state and derive visible tickets/open count. Add the controlled form last, with its own idle/creating/error status.",
        solution: `function SupportDesk({ loadTickets, saveTicket }) {
  const [request, setRequest] = useState({ status: "loading", tickets: [] });
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [title, setTitle] = useState("");
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let ignore = false;
    setRequest({ status: "loading", tickets: [] });
    loadTickets()
      .then((tickets) => {
        if (!ignore) setRequest({ status: "success", tickets });
      })
      .catch(() => {
        if (!ignore) setRequest({ status: "error", tickets: [] });
      });
    return () => {
      ignore = true;
    };
  }, [loadTickets, attempt]);

  function changeStatus(id, status) {
    setRequest((current) => ({
      ...current,
      tickets: current.tickets.map((ticket) =>
        ticket.id === id ? { ...ticket, status } : ticket,
      ),
    }));
  }

  async function createTicket(event) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setFormError("Enter a ticket title.");
      return;
    }
    if (submitStatus === "creating") return;
    setFormError("");
    setSubmitStatus("creating");
    try {
      const ticket = await saveTicket({ title: cleanTitle });
      setRequest((current) => ({
        ...current,
        tickets: [...current.tickets, ticket],
      }));
      setTitle("");
      setSubmitStatus("idle");
    } catch {
      setSubmitStatus("error");
      setFormError("Couldn't create ticket.");
    }
  }

  if (request.status === "loading") return <p>Loading tickets…</p>;
  if (request.status === "error") {
    return (
      <div>
        <p role="alert">Couldn't load tickets.</p>
        <button onClick={() => setAttempt((value) => value + 1)}>Try again</button>
      </div>
    );
  }

  const normalisedQuery = query.trim().toLowerCase();
  const openCount = request.tickets.filter((ticket) => ticket.status === "open").length;
  const visible = request.tickets.filter(
    (ticket) =>
      (filter === "all" || ticket.status === filter) &&
      ticket.title.toLowerCase().includes(normalisedQuery),
  );

  return (
    <main>
      <h2>Support queue</h2>
      <p>{openCount} open {openCount === 1 ? "ticket" : "tickets"}</p>

      <label htmlFor="ticket-search">Search tickets</label>
      <input
        id="ticket-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div>
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("open")}>Open</button>
        <button onClick={() => setFilter("resolved")}>Resolved</button>
      </div>

      {visible.length === 0 ? (
        <p>{request.tickets.length === 0 ? "No tickets yet." : "No matching tickets."}</p>
      ) : (
        <ul>
          {visible.map((ticket) => (
            <li key={ticket.id}>
              <h3>{ticket.title}</h3>
              <p>Status: {ticket.status}</p>
              {ticket.status === "open" ? (
                <button onClick={() => changeStatus(ticket.id, "resolved")}>Resolve</button>
              ) : (
                <button onClick={() => changeStatus(ticket.id, "open")}>Reopen</button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={createTicket}>
        <label htmlFor="ticket-title">Ticket title</label>
        <input
          id="ticket-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        {formError ? <p role="alert">{formError}</p> : null}
        <button type="submit" disabled={submitStatus === "creating"}>
          {submitStatus === "creating" ? "Creating…" : "Create ticket"}
        </button>
      </form>
    </main>
  );
}

const sampleLoad = async () => [
  { id: 1, title: "Cannot sign in", status: "open" },
  { id: 2, title: "Change delivery address", status: "resolved" },
];
const sampleSave = async ({ title }) => ({ id: Date.now(), title, status: "open" });

export default function App() {
  return <SupportDesk loadTickets={sampleLoad} saveTicket={sampleSave} />;
}`,
        tests: [
          {
            name: "Shows loading while tickets are pending",
            expression: `await render(<SupportDesk loadTickets={() => new Promise(() => {})} saveTicket={async () => {}} />);
return text() === "Loading tickets…";`,
          },
          {
            name: "Loads the queue and derives the open count",
            expression: `const tickets = [
  { id: 1, title: "First", status: "open" },
  { id: 2, title: "Second", status: "resolved" },
  { id: 3, title: "Third", status: "open" },
];
await render(<SupportDesk loadTickets={async () => tickets} saveTicket={async () => {}} />);
await waitFor(() => getAllByRole("listitem").length === 3);
return text().includes("2 open tickets");`,
          },
          {
            name: "Search and status filters compose",
            expression: `const tickets = [
  { id: 1, title: "Login problem", status: "open" },
  { id: 2, title: "Login history", status: "resolved" },
  { id: 3, title: "Address", status: "open" },
];
await render(<SupportDesk loadTickets={async () => tickets} saveTicket={async () => {}} />);
await waitFor(() => getAllByRole("listitem").length === 3);
await fill(getByLabelText("Search tickets"), "LOGIN");
await click(getByRole("button", { name: "Open" }));
return getAllByRole("listitem").length === 1 && text().includes("Login problem") && !text().includes("Login history");`,
          },
          {
            name: "Resolve and reopen update the record and count",
            expression: `await render(<SupportDesk
  loadTickets={async () => [{ id: 1, title: "First", status: "open" }]}
  saveTicket={async () => {}}
/>);
await waitFor(() => getByRole("button", { name: "Resolve" }));
await click(getByRole("button", { name: "Resolve" }));
const resolved = text().includes("0 open tickets") && text().includes("Status: resolved");
await click(getByRole("button", { name: "Reopen" }));
return resolved && text().includes("1 open ticket") && text().includes("Status: open");`,
          },
          {
            name: "Explains empty and no-match results",
            expression: `await render(<SupportDesk
  loadTickets={async () => [{ id: 1, title: "First", status: "open" }]}
  saveTicket={async () => {}}
/>);
await waitFor(() => getAllByRole("listitem").length === 1);
await fill(getByLabelText("Search tickets"), "missing");
return text().includes("No matching tickets.");`,
          },
          {
            name: "Rejects a blank title without saving",
            expression: `let calls = 0;
await render(<SupportDesk loadTickets={async () => []} saveTicket={async () => { calls++; }} />);
await waitFor(() => getByRole("button", { name: "Create ticket" }));
await click(getByRole("button", { name: "Create ticket" }));
return calls === 0 && getByRole("alert").textContent === "Enter a ticket title.";`,
          },
          {
            name: "Creates once, disables while pending and clears the field",
            expression: `let calls = 0;
const save = ({ title }) => {
  calls++;
  return new Promise((resolve) => setTimeout(() => resolve({ id: 7, title, status: "open" }), 100));
};
await render(<SupportDesk loadTickets={async () => []} saveTicket={save} />);
await waitFor(() => getByRole("button", { name: "Create ticket" }));
await fill(getByLabelText("Ticket title"), "New issue");
await click(getByRole("button", { name: "Create ticket" }));
const busy = getByRole("button", { name: "Creating…" });
const disabled = busy.disabled;
await click(busy);
await waitFor(() => getAllByRole("listitem").length === 1);
return disabled && calls === 1 && getByLabelText("Ticket title").value === "" &&
  text().includes("New issue") && text().includes("1 open ticket");`,
          },
          {
            name: "Reports a save failure and keeps the title",
            expression: `await render(<SupportDesk
  loadTickets={async () => []}
  saveTicket={async () => { throw new Error("offline"); }}
/>);
await waitFor(() => getByRole("button", { name: "Create ticket" }));
await fill(getByLabelText("Ticket title"), "Keep me");
await click(getByRole("button", { name: "Create ticket" }));
await waitFor(() => getByRole("alert"));
return getByRole("alert").textContent === "Couldn't create ticket." &&
  getByLabelText("Ticket title").value === "Keep me";`,
          },
          {
            name: "Load error offers a working retry",
            expression: `let calls = 0;
const load = async () => {
  calls++;
  if (calls === 1) throw new Error("offline");
  return [{ id: 1, title: "Recovered", status: "open" }];
};
await render(<SupportDesk loadTickets={load} saveTicket={async () => {}} />);
await waitFor(() => getByRole("alert"));
await click(getByRole("button", { name: "Try again" }));
await waitFor(() => getAllByRole("listitem").length === 1);
return calls === 2 && text().includes("Recovered");`,
          },
          {
            name: "React renders an untrusted title as text",
            expression: `const title = "<img src=x onerror=alert(1)>";
const root = await render(<SupportDesk
  loadTickets={async () => [{ id: 1, title, status: "open" }]}
  saveTicket={async () => {}}
/>);
await waitFor(() => getAllByRole("listitem").length === 1);
return root.querySelector("img") === null && text().includes(title);`,
          },
        ],
      },
    ],
  },
};
