import type { LessonBody } from "./lessons";

/** Authored Node.js course lessons. Answer keys stay server-side. */
export const nodeLessonBodies: Record<string, LessonBody> = {
  "node-core.http": {
    summary:
      "Follow an HTTP request from socket to handler to response, and choose methods, status codes, headers and bodies deliberately.",
    xp: 100,
    blocks: [
      {
        kind: "text",
        body: "A server spends most of its life waiting. A client opens a connection and sends an HTTP request: a method, target path, headers and sometimes a body. Node parses the protocol and gives your handler a request object plus a response object. Your code reads only what it needs, validates it, does work, then finishes exactly one response.",
      },
      {
        kind: "code",
        language: "javascript",
        caption: "A complete server using Node's built-in HTTP module",
        code: `import { createServer } from "node:http";

const server = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  response.writeHead(404, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000);`,
      },
      {
        kind: "text",
        body: "The method describes intent. **GET** reads without changing server state, **POST** submits or creates, **PUT** replaces, **PATCH** changes part of a resource, and **DELETE** removes. The status says what happened: `200` success with a body, `201` created, `204` success without a body, `400` malformed input, `401` not authenticated, `403` authenticated but not allowed, `404` not found, and `500` an unexpected server failure.",
      },
      {
        kind: "text",
        body: "Headers are metadata. `content-type` tells the receiver how to interpret the body; `authorization` or a cookie may carry credentials; caching and CORS headers change browser behaviour. Node's low-level HTTP API exposes request bodies as streams, so production code must cap body size, handle invalid JSON and stop reading when a client disconnects. Frameworks hide some plumbing, but not the responsibility.",
      },
      {
        kind: "callout",
        body: "Everything in a request is untrusted: path parameters, query strings, headers and JSON. Authentication tells you who sent it; validation tells you whether the data is acceptable. You usually need both.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "A valid request creates a new order. Which response is the best fit?",
        options: [
          "`201 Created` with the created order or its location",
          "`200 OK` with no indication anything was created",
          "`204 No Content` with a JSON body",
          "`302 Found` because the order now exists",
        ],
        answer: 0,
        explanation:
          "201 states that a resource was created. A Location header can point to it, and the response may include its representation.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "What is the difference between `401` and `403`?",
        options: [
          "401 means the resource is missing; 403 means the route is missing",
          "401 means valid JSON was required; 403 means JSON was malformed",
          "401 means authentication is absent or invalid; 403 means the identity lacks permission",
          "There is no practical difference",
        ],
        answer: 2,
        explanation:
          "A 401 response asks for valid authentication. A 403 response says the known caller is not permitted to perform the action.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Name the response header that tells a client a body contains JSON.",
        before: "",
        after: ": application/json",
        answer: "Content-Type",
        accept: ["content-type"],
        explanation:
          "HTTP header names are case-insensitive; Node commonly exposes them in lowercase.",
      },
    ],
  },

  "node-core.routes": {
    summary:
      "Turn method-and-path pairs into predictable handlers with validation, consistent JSON and truthful errors.",
    xp: 140,
    blocks: [
      {
        kind: "text",
        body: "A router matches a request's method and path, extracts parameters, and calls one handler. Keep the transport layer thin: parse the request, validate at the boundary, call domain logic, then translate the result into HTTP. When database rules and response formatting are tangled into every route, both testing and error handling become painful.",
      },
      {
        kind: "code",
        language: "javascript",
        caption: "The same resource uses different methods for different intent",
        code: `GET    /api/products       // list
GET    /api/products/p-17  // read one
POST   /api/products       // create
PATCH  /api/products/p-17  // update part
DELETE /api/products/p-17  // remove`,
      },
      {
        kind: "text",
        body: "Validate shape, type, range and business rules before doing work. Return a stable error object such as `{ error: { code, message, fields } }`; do not leak stack traces, SQL or secrets. A central error boundary can log the private details with a request id and send a safe `500` response once.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Where should a route validate an incoming product price?",
        options: [
          "At the request boundary, before calling the database or domain operation",
          "Only in the browser form",
          "After inserting it, so the database has a copy for debugging",
          "Only when another endpoint reads it later",
        ],
        answer: 0,
        explanation:
          "Client validation improves usability but is not a security boundary. The server validates before performing a side effect.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Route a small products API",
        prompt:
          "Complete `route(request)`. Support `GET /health`, `GET /api/products`, and `POST /api/products`. A product needs a non-empty string `name` and a finite non-negative number `price`; invalid input returns 400. Unknown method/path pairs return 404. Every response must use the existing `json` helper. This exercise tests the transport logic in isolation; a real Node server would adapt `IncomingMessage` and `ServerResponse` to it.",
        language: "javascript",
        starter: `const products = [{ id: "p1", name: "Notebook", price: 6 }];

function json(status, body) {
  return { status, headers: { "content-type": "application/json" }, body };
}

function route(request) {
  // request is { method, path, body? }
  return json(501, { error: "Not implemented" });
}`,
        hint: "Check exact method-and-path pairs. Validate with `typeof`, `.trim()`, `Number.isFinite`, and `price >= 0`. Create an id from the next array position, push the product, and return 201.",
        solution: `const products = [{ id: "p1", name: "Notebook", price: 6 }];

function json(status, body) {
  return { status, headers: { "content-type": "application/json" }, body };
}

function route(request) {
  if (request.method === "GET" && request.path === "/health") {
    return json(200, { ok: true });
  }

  if (request.method === "GET" && request.path === "/api/products") {
    return json(200, { products: [...products] });
  }

  if (request.method === "POST" && request.path === "/api/products") {
    const name = request.body?.name;
    const price = request.body?.price;
    if (
      typeof name !== "string" ||
      name.trim() === "" ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return json(400, { error: "name and a non-negative price are required" });
    }
    const product = { id: \`p\${products.length + 1}\`, name: name.trim(), price };
    products.push(product);
    return json(201, { product });
  }

  return json(404, { error: "Not found" });
}`,
        tests: [
          {
            name: "Health route reports success as JSON",
            expression:
              'JSON.stringify(route({ method: "GET", path: "/health" })) === JSON.stringify({ status: 200, headers: { "content-type": "application/json" }, body: { ok: true } })',
          },
          {
            name: "Lists products without exposing the storage array",
            expression: `(() => { const r = route({ method: "GET", path: "/api/products" }); const before = r.body.products.length; r.body.products.push({}); return r.status === 200 && before >= 1 && route({ method: "GET", path: "/api/products" }).body.products.length === before; })()`,
          },
          {
            name: "Creates and normalises a valid product",
            expression: `(() => { const r = route({ method: "POST", path: "/api/products", body: { name: "  Pen  ", price: 2.5 } }); return r.status === 201 && r.body.product.name === "Pen" && r.body.product.price === 2.5 && r.body.product.id; })()`,
          },
          {
            name: "Rejects missing, negative and non-finite values",
            expression: `[{}, { name: "", price: 1 }, { name: "Pen", price: -1 }, { name: "Pen", price: Infinity }].every((body) => route({ method: "POST", path: "/api/products", body }).status === 400)`,
          },
          {
            name: "Unknown routes return 404",
            expression:
              'route({ method: "DELETE", path: "/health" }).status === 404 && route({ method: "GET", path: "/missing" }).status === 404',
          },
        ],
      },
    ],
  },

  "node-data.db": {
    summary:
      "Use a database through parameterized queries, transactions, migrations and a small persistence boundary.",
    xp: 135,
    blocks: [
      {
        kind: "text",
        body: "A database is shared durable state, not a JavaScript object with a network cable. Several requests can read and write at once; processes restart; queries fail. Put persistence behind a small repository or query layer so route handlers ask for operations such as `findProduct` or `createOrder` instead of assembling SQL everywhere.",
      },
      {
        kind: "code",
        language: "javascript",
        caption: "Parameters keep values separate from SQL syntax",
        code: `const result = await db.query(
  "select id, name, price from products where id = $1",
  [productId],
);

return result.rows[0] ?? null;`,
      },
      {
        kind: "text",
        body: "Never build SQL by joining user input into a query string. Placeholders (`$1`, `?`, or named parameters depending on the driver) let the database treat the value as data, which prevents SQL injection and handles quoting. Select only columns you need, add indexes for measured query patterns, cap list sizes, and watch for N+1 loops that send one query per row.",
      },
      {
        kind: "text",
        body: "A **transaction** makes a group of statements succeed or fail together. Begin, perform every dependent write, commit only when all succeed, and roll back on any error. Schema changes belong in versioned migrations that can run consistently in development, tests and deployment; do not edit production tables by hand and hope other environments catch up.",
      },
      {
        kind: "callout",
        body: "A query passing in development is not enough. Test the not-found path, constraint failures, concurrent updates and rollback. Log query identity and duration—not passwords, tokens or full sensitive records.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "Why is `WHERE email = $1` with `[email]` safer than interpolating the email into SQL?",
        options: [
          "The driver sends the value separately, so it cannot become SQL syntax",
          "Placeholders encrypt the entire database",
          "Parameterized queries make authorization unnecessary",
          "The database skips validation for parameterized values",
        ],
        answer: 0,
        explanation:
          "Parameterization separates code from data. It prevents a crafted value from changing the query structure, but does not replace validation or authorization.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Write a safe product repository",
        prompt:
          "Implement `findProduct(db, id)` and `createProduct(db, input)`. Use the exact parameterized SQL shown in the tests, never interpolate values. `findProduct` returns the first row or null. `createProduct` validates a trimmed name and finite non-negative price before querying, then returns the inserted row. The supplied `db` is a test double with an async `query(text, values)` method.",
        language: "javascript",
        starter: `async function findProduct(db, id) {
  // Query by id and return one row or null.
}

async function createProduct(db, input) {
  // Validate, insert with placeholders, and return the row.
}`,
        hint: "Await `db.query(text, values)`. Use `$1` and `$2` in SQL. Check the same name/price rules as an API boundary, then pass `[name.trim(), price]` as values.",
        solution: `async function findProduct(db, id) {
  const result = await db.query(
    "select id, name, price from products where id = $1",
    [id],
  );
  return result.rows[0] ?? null;
}

async function createProduct(db, input) {
  const name = input?.name;
  const price = input?.price;
  if (
    typeof name !== "string" ||
    name.trim() === "" ||
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    throw new Error("Invalid product");
  }
  const result = await db.query(
    "insert into products (name, price) values ($1, $2) returning id, name, price",
    [name.trim(), price],
  );
  return result.rows[0];
}`,
        tests: [
          {
            name: "Finds by id with a parameterized query",
            expression: `await (async () => { const calls = []; const db = { query: async (...args) => (calls.push(args), { rows: [{ id: "p1", name: "Pen", price: 2 }] }) }; const row = await findProduct(db, "p1"); return row.id === "p1" && calls[0][0] === "select id, name, price from products where id = $1" && JSON.stringify(calls[0][1]) === '["p1"]'; })()`,
          },
          {
            name: "Returns null when a product is absent",
            expression: `await (async () => { const db = { query: async () => ({ rows: [] }) }; return await findProduct(db, "missing") === null; })()`,
          },
          {
            name: "Inserts trimmed values through placeholders",
            expression: `await (async () => { const calls = []; const db = { query: async (...args) => (calls.push(args), { rows: [{ id: "p2", name: "Book", price: 9 }] }) }; const row = await createProduct(db, { name: " Book ", price: 9 }); return row.id === "p2" && calls[0][0] === "insert into products (name, price) values ($1, $2) returning id, name, price" && JSON.stringify(calls[0][1]) === '["Book",9]'; })()`,
          },
          {
            name: "Rejects invalid products before querying",
            expression: `await (async () => { let calls = 0; const db = { query: async () => (calls++, { rows: [] }) }; for (const input of [{}, { name: "", price: 1 }, { name: "Pen", price: -1 }]) { try { await createProduct(db, input); return false; } catch {} } return calls === 0; })()`,
          },
        ],
      },
    ],
  },

  "node-data.auth": {
    summary:
      "Separate authentication from authorization and handle sessions, tokens and passwords as high-value security material.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "**Authentication** establishes who a caller is. **Authorization** decides whether that identity may perform this action on this resource. Logging in successfully does not make someone an administrator, and owning one document does not grant access to every document. Enforce authorization on the server for every protected operation.",
      },
      {
        kind: "code",
        language: "javascript",
        caption: "Authenticate, then authorize the resource",
        code: `const user = await requireSession(request); // 401 if absent or invalid
const project = await projects.find(projectId); // 404 if absent

if (project.ownerId !== user.id && user.role !== "admin") {
  return json(403, { error: "Forbidden" });
}

return json(200, { project });`,
      },
      {
        kind: "text",
        body: "A server-side session usually gives the browser a random opaque id and stores session state on the server. A signed token carries claims the server can verify without a session lookup. Tokens are not automatically encrypted, revocable or safe in any storage location. Whichever design you choose, use HTTPS, short useful lifetimes, rotation where appropriate, revocation/logout, and fresh identifiers after login or privilege changes.",
      },
      {
        kind: "text",
        body: "For browser apps, a cookie with `HttpOnly`, `Secure` and an appropriate `SameSite` setting keeps the session id away from ordinary page JavaScript and constrains when it is sent. Cookie authentication also needs a CSRF strategy. Avoid storing session identifiers in local storage: any script running in the page can read them. Never write access tokens, cookie values or password reset links to application logs.",
      },
      {
        kind: "text",
        body: "Never store plaintext passwords or encrypt them for later recovery. Use a well-reviewed password-hashing library with a modern password hashing algorithm and per-password salts; tune its cost for your environment. Rate-limit login and recovery, avoid revealing whether an account exists, require re-authentication for sensitive changes, and use a maintained identity provider when the product does not need custom authentication.",
      },
      {
        kind: "callout",
        body: "Do not invent token formats, password hashing or cryptography. Authentication is infrastructure with sharp failure modes; use maintained libraries and your platform's secure defaults, then threat-model the whole flow.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A valid session user requests another customer's private invoice. What must happen?",
        options: [
          "Return it because authentication already succeeded",
          "Check authorization for that invoice and return 403 or a policy-appropriate 404 when access is denied",
          "Trust the customer id supplied by the browser",
          "Move the authorization check into the invoice page's JavaScript",
        ],
        answer: 1,
        explanation:
          "Authentication identifies the caller; resource-level authorization still decides whether that caller may read this particular invoice.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Which is the safer default for a browser session identifier?",
        options: [
          "A URL query parameter so it is easy to debug",
          "Local storage so every script can reuse it",
          "An HttpOnly, Secure cookie with an appropriate SameSite policy",
          "A global JavaScript variable",
        ],
        answer: 2,
        explanation:
          "HttpOnly prevents ordinary page JavaScript from reading the cookie, Secure restricts it to HTTPS, and SameSite helps control cross-site sending. The server still needs appropriate CSRF and session controls.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Which HTTP status means the caller is known but not permitted to perform the action?",
        before: "HTTP ",
        after: " Forbidden",
        answer: "403",
        explanation:
          "401 concerns missing or invalid authentication; 403 concerns insufficient permission.",
      },
    ],
  },
};
