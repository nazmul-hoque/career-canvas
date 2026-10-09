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
          "Only in the browser form",
          "After inserting it, so the database has a copy for debugging",
          "Only when another endpoint reads it later",
          "At the request boundary, before calling the database or domain operation",
        ],
        answer: 3,
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
          "Placeholders encrypt the entire database",
          "The driver sends the value separately, so it cannot become SQL syntax",
          "Parameterized queries make authorization unnecessary",
          "The database skips validation for parameterized values",
        ],
        answer: 1,
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
          "Check authorization for that invoice and return 403 or a policy-appropriate 404 when access is denied",
          "Return it because authentication already succeeded",
          "Trust the customer id supplied by the browser",
          "Move the authorization check into the invoice page's JavaScript",
        ],
        answer: 0,
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

  "node-core.middleware": {
    summary:
      "Build the request pipeline as small functions that wrap each other, with one boundary that turns every failure into a safe response.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: "Most of what a server does for every request has nothing to do with any one route: give the request an id, log it, check the session, parse the body, time it, and catch whatever goes wrong. Writing that into each handler means writing it forty times and forgetting it once. **Middleware** is the pattern that pulls it out: a function that receives the request and a `next` function, and decides whether to call the rest of the pipeline.",
      },
      {
        kind: "code",
        language: "javascript",
        caption: "A middleware can act before, after, or instead of the handler",
        code: `async function timing(request, next) {
  const started = Date.now();
  const response = await next(); // everything after this one in the pipeline
  console.log(request.id, response.status, Date.now() - started + "ms");
  return response;
}

async function requireUser(request, next) {
  if (!request.user) return json(401, { error: "Sign in first" }); // short-circuit
  return next();
}`,
      },
      {
        kind: "text",
        body: "Because each middleware wraps everything after it, **order is behaviour**. The pipeline runs like nested function calls: the first middleware's code before `next()` runs first, and its code after `next()` runs last. Put authentication before the handler and it protects the handler; put it after and it protects nothing. Express, Koa, Fastify's hooks and Hono all differ in syntax, but every one of them is this idea.",
      },
      {
        kind: "text",
        body: "The outermost layer should be an **error boundary**: one place that catches anything thrown below it and turns it into a response. Two kinds of error reach it. *Expected* errors, such as a missing order or a forbidden action, carry a status and a message written for the client, so throw them as a small `HttpError` class. *Unexpected* errors, such as a dropped database connection or a bug, carry messages written for you, full of hostnames, SQL and stack frames. Those become a plain `500` with the request id, and the details go to your logs instead of the client.",
      },
      {
        kind: "callout",
        body: "**`return await next()`, not `return next()`, inside a `try`.** Without the `await`, the function hands back the promise before it has failed, the `try` block has already finished, and the rejection sails straight past your `catch`. This one keyword is the most common reason an error boundary silently doesn't work.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "An error boundary does `try { return next(); } catch { … }`, and a handler's database call rejects. What happens?",
        options: [
          "The boundary catches it, because the handler ran inside the try",
          "Node retries the handler once before giving up",
          "The handler's promise is returned before it rejects, so the catch never runs and the error escapes the boundary",
          "The rejection becomes a 404, because no route produced a response",
        ],
        answer: 2,
        explanation:
          "A try/catch only sees rejections it awaits. `return next()` returns the pending promise immediately and the try block exits; the rejection happens later, outside it. `return await next()` keeps the function inside the try until the promise settles.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "You have three middlewares: an error boundary, request logging and authentication. Which order makes sense?",
        options: [
          "Authentication, logging, error boundary, so unauthenticated requests cost nothing",
          "Error boundary, logging, authentication, so failures anywhere, including in logging or auth, become a clean response",
          "Logging, authentication, error boundary, so the boundary sits closest to the handler",
          "Order doesn't matter as long as each one calls next()",
        ],
        answer: 1,
        explanation:
          "The boundary only catches what runs inside it, so it goes outermost. Logging next sees every request, including the ones authentication rejects, which are exactly the ones you'll want in the logs.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Compose a pipeline with an error boundary",
        prompt:
          'Write `compose(middlewares, handler)`, which returns a function taking a request and running `middlewares[0]`, whose `next()` runs `middlewares[1]`, and so on until the last `next()` calls `handler`. A middleware that doesn\'t call `next()` answers on its own. Then write `errorBoundary`: an `HttpError` becomes a response with its status and message; any other error becomes a `500` with `{ error: "Internal error", requestId }` taken from `request.id`, and never its message.',
        language: "javascript",
        starter: `class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(status, body) {
  return { status, headers: { "content-type": "application/json" }, body };
}

function compose(middlewares, handler) {
  // Run middlewares[0]; its next() runs middlewares[1]; ... the last next() runs handler.
  return (request) => handler(request);
}

async function errorBoundary(request, next) {
  // Turn anything thrown below into a response. Never send an unexpected error's message.
  return next();
}`,
        hint: "Write a helper `run(i)` that calls `handler(request)` when `i === middlewares.length` and otherwise `middlewares[i](request, () => run(i + 1))`. Make it `async` so a synchronous throw becomes a rejection. In the boundary, `return await next()` inside `try`, then check `error instanceof HttpError` in `catch`.",
        solution: `class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(status, body) {
  return { status, headers: { "content-type": "application/json" }, body };
}

function compose(middlewares, handler) {
  return (request) => {
    const run = async (i) =>
      i === middlewares.length ? handler(request) : middlewares[i](request, () => run(i + 1));
    return run(0);
  };
}

async function errorBoundary(request, next) {
  try {
    return await next();
  } catch (error) {
    if (error instanceof HttpError) return json(error.status, { error: error.message });
    return json(500, { error: "Internal error", requestId: request.id });
  }
}`,
        tests: [
          {
            name: "Runs middleware in order, wrapped around the handler",
            expression: `await (async () => { const trace = []; const mw = (name) => async (req, next) => { trace.push(name + ">"); const res = await next(); trace.push("<" + name); return res; }; const app = compose([mw("a"), mw("b")], async () => { trace.push("handler"); return json(200, {}); }); const res = await app({ id: "r1" }); return res.status === 200 && trace.join(" ") === "a> b> handler <b <a"; })()`,
          },
          {
            name: "A middleware can answer without reaching the handler",
            expression: `await (async () => { let called = false; const deny = async () => json(401, { error: "Sign in" }); const app = compose([deny], async () => { called = true; return json(200, {}); }); const res = await app({ id: "r2" }); return res.status === 401 && !called; })()`,
          },
          {
            name: "An HttpError keeps its status and message",
            expression: `await (async () => { const app = compose([errorBoundary], async () => { throw new HttpError(404, "No such order"); }); const res = await app({ id: "r3" }); return res.status === 404 && res.body.error === "No such order"; })()`,
          },
          {
            name: "An unexpected error becomes a 500 that leaks nothing",
            expression: `await (async () => { const app = compose([errorBoundary], async () => { throw new Error("connect ECONNREFUSED 10.0.0.5:5432"); }); const res = await app({ id: "r4" }); return res.status === 500 && res.body.requestId === "r4" && !JSON.stringify(res.body).includes("ECONNREFUSED"); })()`,
          },
          {
            name: "Errors from later middleware are caught too",
            expression: `await (async () => { const broken = async () => { throw new Error("boom"); }; const app = compose([errorBoundary, broken], async () => json(200, {})); return (await app({ id: "r5" })).status === 500; })()`,
          },
        ],
      },
    ],
  },

  "node-core.config": {
    summary:
      "Read configuration from the environment, check all of it at startup, and keep secrets out of code, logs and error messages.",
    xp: 140,
    blocks: [
      {
        kind: "text",
        body: "The same code runs on your laptop, in CI and in production. What differs is **configuration**: the database URL, the port, API keys, which email provider to use. Keep it out of the code and read it from the environment, so deploying to a new place means setting variables rather than editing files. Locally, a git-ignored `.env` file fills the environment; next to it, a committed `.env.example` lists every variable's *name* with no real values, so a new teammate knows what to set.",
      },
      {
        kind: "text",
        body: '**Every environment variable is a string, or missing.** `PORT=3000` arrives as `"3000"`, and `FEATURE_BETA=false` arrives as `"false"`, which is truthy, so `if (process.env.FEATURE_BETA)` turns the feature *on*. Parse each value deliberately: numbers with `Number()` and a range check, booleans by comparing to `"true"`, lists by splitting.',
      },
      {
        kind: "code",
        language: "javascript",
        caption: "Load once, at startup, and fail before listening",
        code: `const config = loadConfig(process.env); // throws with every problem at once

const server = createServer(app(config));
server.listen(config.port);`,
      },
      {
        kind: "text",
        body: "**Fail fast, and fail completely.** Check every value at startup, before the server accepts a request. A missing secret discovered at 3am by the first user who triggers a password reset is far worse than a deploy that refuses to start. And report *all* the problems in one error: fixing one variable per failed deploy is how a five-minute fix becomes an hour.",
      },
      {
        kind: "callout",
        body: '**A secret must never appear in an error message, a log line or the client bundle.** Say which variable is wrong and why ("SESSION_SECRET must be at least 32 characters"), never what it contains. And check your framework\'s rule for which variables reach the browser: in Vite anything prefixed `VITE_` is compiled into public JavaScript, where anyone can read it.',
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "The environment has `SEND_EMAILS=false`. The code says `if (process.env.SEND_EMAILS) sendWelcome(user)`. What happens?",
        options: [
          'Emails are sent, because the string "false" is truthy',
          'No emails are sent, because Node converts "false" to a boolean',
          "Node throws, because the value isn't a boolean",
          "It depends on whether the variable came from a .env file",
        ],
        answer: 0,
        explanation:
          'Environment values are always strings, and every non-empty string is truthy in JavaScript. Compare explicitly: `process.env.SEND_EMAILS === "true"`, and do it once, in the config loader.',
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the committed file that lists every configuration variable's name without its real value.",
        before: "",
        after: "",
        answer: ".env.example",
        accept: ["env.example", ".env.sample", ".env.template"],
        explanation:
          "It documents what the app needs without publishing secrets. The real `.env` stays git-ignored.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Load configuration that fails fast and keeps secrets",
        prompt:
          'Write `loadConfig(env)`. It needs `DATABASE_URL` (required) and `SESSION_SECRET` (required, at least 32 characters). `PORT` defaults to 3000 and must be a whole number from 1 to 65535. `NODE_ENV` defaults to `"development"` and must be `development`, `test` or `production`. Return `{ databaseUrl, sessionSecret, port, env }` as a frozen object. If anything is wrong, throw **one** `Error` whose message names **every** bad variable, and never contains a secret\'s value.',
        language: "javascript",
        starter: `function loadConfig(env) {
  return {
    databaseUrl: env.DATABASE_URL,
    sessionSecret: env.SESSION_SECRET,
    port: env.PORT || 3000,
    env: env.NODE_ENV || "development",
  };
}`,
        hint: 'Collect problems in an array and throw once at the end with `problems.join("; ")`. Parse the port with `Number(env.PORT ?? "3000")` and check `Number.isInteger`. Describe a short secret by its length rule, not its contents. Finish with `Object.freeze`.',
        solution: `function loadConfig(env) {
  const problems = [];

  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) problems.push("DATABASE_URL is required");

  const sessionSecret = env.SESSION_SECRET;
  if (!sessionSecret) problems.push("SESSION_SECRET is required");
  else if (sessionSecret.length < 32) problems.push("SESSION_SECRET must be at least 32 characters");

  const port = Number(env.PORT ?? "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    problems.push("PORT must be a whole number from 1 to 65535");
  }

  const mode = env.NODE_ENV ?? "development";
  if (!["development", "test", "production"].includes(mode)) {
    problems.push("NODE_ENV must be development, test or production");
  }

  if (problems.length > 0) throw new Error("Invalid configuration: " + problems.join("; "));
  return Object.freeze({ databaseUrl, sessionSecret, port, env: mode });
}`,
        tests: [
          {
            name: "Parses a valid environment, with the port as a number",
            expression: `(() => { const c = loadConfig({ DATABASE_URL: "postgres://db/app", SESSION_SECRET: "x".repeat(40), PORT: "8080", NODE_ENV: "production" }); return c.port === 8080 && c.env === "production" && c.databaseUrl === "postgres://db/app"; })()`,
          },
          {
            name: "Applies defaults for PORT and NODE_ENV",
            expression: `(() => { const c = loadConfig({ DATABASE_URL: "postgres://db/app", SESSION_SECRET: "x".repeat(32) }); return c.port === 3000 && c.env === "development"; })()`,
          },
          {
            name: "Reports every problem in one error",
            expression: `(() => { try { loadConfig({ PORT: "eighty", NODE_ENV: "staging" }); return false; } catch (e) { return ["DATABASE_URL", "SESSION_SECRET", "PORT", "NODE_ENV"].every((name) => e.message.includes(name)); } })()`,
          },
          {
            name: "A short secret is rejected without being echoed",
            expression: `(() => { try { loadConfig({ DATABASE_URL: "postgres://db/app", SESSION_SECRET: "hunter2-is-short" }); return false; } catch (e) { return e.message.includes("SESSION_SECRET") && !e.message.includes("hunter2"); } })()`,
          },
          {
            name: "Rejects out-of-range and fractional ports",
            expression: `["0", "70000", "80.5"].every((PORT) => { try { loadConfig({ DATABASE_URL: "x", SESSION_SECRET: "x".repeat(32), PORT }); return false; } catch (e) { return e.message.includes("PORT"); } })`,
          },
          {
            name: "The config can't be changed after loading",
            expression: `Object.isFrozen(loadConfig({ DATABASE_URL: "x", SESSION_SECRET: "x".repeat(32) }))`,
          },
        ],
      },
    ],
  },

  "node-data.pagination": {
    summary:
      "Return long lists a page at a time with a keyset cursor, so pages stay fast and nothing repeats when new rows arrive.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: "An endpoint that returns *every* order works in development, where there are twelve. In production there are two million, and the response takes eight seconds and a gigabyte of memory. Every list endpoint needs a page size with a maximum the server enforces, because a client asking for `?limit=1000000` is either a bug or an attack.",
      },
      {
        kind: "text",
        body: "The obvious approach is **offset pagination**: `LIMIT 20 OFFSET 40` for page three. It has two problems. The database still reads and discards the first 40 rows, so page 5,000 is slow. Worse, the pages *shift* when data changes: if a new order arrives while someone is on page one, everything moves down a place, and the first item of page two is the last item they already saw. Deletions do the opposite and silently skip one.",
      },
      {
        kind: "text",
        body: '**Keyset (cursor) pagination** fixes both. Instead of "skip 40 rows", the client says "give me the rows after this one". The server sorts by a column plus a unique tie-breaker, usually `created_at` then `id`, because two orders can share a timestamp. Then it filters to rows that sort after the last one sent. An index on those two columns makes every page equally fast, and new rows at the top can\'t push old ones into the next page.',
      },
      {
        kind: "code",
        language: "sql",
        caption: "The next page, newest first, after the last row the client saw",
        code: `select id, created_at, total
from orders
where (created_at, id) < ($1, $2)   -- the cursor: last row's created_at and id
order by created_at desc, id desc
limit 21;                           -- one more than the page size`,
      },
      {
        kind: "text",
        body: "Two details make it work. Ask for **one more row than the page size**: if it comes back, there is a next page, and you don't need a separate `COUNT(*)`, which is slow on big tables. And make the cursor **opaque**, an encoded string the client passes back without reading, so you can change what's inside it later without breaking anyone.",
      },
      {
        kind: "callout",
        body: "The trade-off: a cursor can't jump straight to page 37. For feeds, activity logs and infinite scroll, nobody needs to. For an admin table where people really do jump around, offset over a filtered, bounded set is still fine.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A user reads page one of a newest-first feed (offset 0, limit 20). Three new posts arrive. They load page two (offset 20). What do they see?",
        options: [
          "Exactly the next 20 posts, because offsets are stable",
          "An error, because the data changed between requests",
          "Three posts they already saw on page one, because everything shifted down three places",
          "Three posts are skipped, because the offset jumped past them",
        ],
        answer: 2,
        explanation:
          "Inserts at the top push every row down. Rows 18 to 20 of the old order are now 21 to 23, so they appear again. A keyset cursor asks for rows after a specific row, so inserts above it change nothing.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Why does the cursor include `id` as well as `created_at`?",
        options: [
          "Two rows can share a timestamp, and without a unique tie-breaker one of them could be skipped or repeated at a page boundary",
          "Because ids are faster to compare than dates",
          "So the client can read the id out of the cursor",
          "It doesn't need to; `created_at` alone is unique enough",
        ],
        answer: 0,
        explanation:
          'If ten orders share a timestamp and a page ends in the middle of them, "after this timestamp" skips the rest and "at or after" repeats some. Sorting and filtering on (created_at, id) gives every row a unique position.',
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Replace offset paging with a keyset cursor",
        prompt:
          "`listOrders(orders, { limit, cursor })` returns `{ items, nextCursor }`, newest first, with `id` (descending) breaking ties between equal `createdAt` values. It currently uses an offset, which repeats rows when a new order arrives between pages. Make the cursor encode the last item's `createdAt` and `id` (use the helpers), return only orders that sort after it, and clamp `limit` to at most 100. `nextCursor` is `null` on the last page.",
        language: "javascript",
        starter: `const encodeCursor = (order) => btoa(JSON.stringify([order.createdAt, order.id]));
const decodeCursor = (cursor) => JSON.parse(atob(cursor));
const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);

function listOrders(orders, { limit = 20, cursor = null } = {}) {
  const offset = cursor ? Number(cursor) : 0;
  const rows = [...orders].sort(newestFirst);
  const items = rows.slice(offset, offset + limit);
  return { items, nextCursor: offset + limit < rows.length ? String(offset + limit) : null };
}`,
        hint: "Decode the cursor into `[createdAt, id]` and keep orders where `o.createdAt < createdAt`, or the timestamps are equal and `o.id < id`. Take `size + 1` rows: if you got the extra one, encode the last item you're returning as `nextCursor`. Clamp with `Math.min(limit, 100)`.",
        solution: `const encodeCursor = (order) => btoa(JSON.stringify([order.createdAt, order.id]));
const decodeCursor = (cursor) => JSON.parse(atob(cursor));
const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);

function listOrders(orders, { limit = 20, cursor = null } = {}) {
  const size = Math.min(Math.max(Math.trunc(limit) || 20, 1), 100);
  let rows = [...orders].sort(newestFirst);
  if (cursor) {
    const [createdAt, id] = decodeCursor(cursor);
    rows = rows.filter(
      (o) => o.createdAt < createdAt || (o.createdAt === createdAt && o.id < id),
    );
  }
  const page = rows.slice(0, size + 1);
  const items = page.slice(0, size);
  const nextCursor = page.length > size ? encodeCursor(items[items.length - 1]) : null;
  return { items, nextCursor };
}`,
        tests: [
          {
            name: "Walking every page returns each order once, newest first",
            expression: `(() => { const orders = Array.from({ length: 45 }, (_, i) => ({ id: "o" + String(i).padStart(3, "0"), createdAt: "2026-10-0" + (1 + (i % 5)) + "T09:00:00Z" })); const seen = []; let cursor = null; let pages = 0; do { const page = listOrders(orders, { limit: 10, cursor }); seen.push(...page.items.map((o) => o.id)); cursor = page.nextCursor; pages++; } while (cursor && pages < 10); const expected = [...orders].sort(newestFirst).map((o) => o.id); return pages === 5 && JSON.stringify(seen) === JSON.stringify(expected); })()`,
          },
          {
            name: "A new order between pages doesn't repeat one",
            expression: `(() => { const orders = Array.from({ length: 30 }, (_, i) => ({ id: "o" + String(i).padStart(3, "0"), createdAt: "2026-10-01T09:" + String(i).padStart(2, "0") + ":00Z" })); const first = listOrders(orders, { limit: 10 }); orders.push({ id: "o999", createdAt: "2026-10-02T00:00:00Z" }); const second = listOrders(orders, { limit: 10, cursor: first.nextCursor }); const ids = new Set(first.items.map((o) => o.id)); return second.items.length === 10 && second.items.every((o) => !ids.has(o.id)); })()`,
          },
          {
            name: "The page size is capped at 100",
            expression: `listOrders(Array.from({ length: 250 }, (_, i) => ({ id: "o" + String(i).padStart(3, "0"), createdAt: "2026-10-01T00:00:00Z" })), { limit: 1000 }).items.length === 100`,
          },
          {
            name: "The last page has no next cursor",
            expression: `(() => { const orders = [1, 2, 3].map((i) => ({ id: "o" + i, createdAt: "2026-10-0" + i + "T00:00:00Z" })); const page = listOrders(orders, { limit: 3 }); return page.items.length === 3 && page.nextCursor === null; })()`,
          },
        ],
      },
    ],
  },

  "node-data.idempotency": {
    summary:
      "Make a retried request safe to repeat with an idempotency key, so a flaky network never charges anyone twice.",
    xp: 160,
    blocks: [
      {
        kind: "text",
        body: "A client sends `POST /payments`. The server charges the card, and then the connection drops before the response arrives. From the client's side, the request failed. Should it retry? If it does, and the server simply runs the request again, the customer pays twice. If it doesn't, and the first attempt really did fail, the order is never paid. **The client cannot tell these apart.** Timeouts, mobile networks and impatient double-clicks make this an everyday event, not an edge case.",
      },
      {
        kind: "text",
        body: "An operation is **idempotent** when doing it twice has the same effect as doing it once. `GET`, `PUT` and `DELETE` are defined that way: setting a value to 5 twice leaves it at 5. `POST` usually isn't: creating twice creates two. The standard fix is an **idempotency key**: the client generates a unique value (a UUID) for each *intended* operation and sends it in a header, reusing the same key on every retry of that operation.",
      },
      {
        kind: "code",
        language: "text",
        caption: "What the server does with the key",
        code: `Idempotency-Key: 7f3c…   (same key on every retry)

new key                  → record "in progress", do the work, store the response
seen, finished, same body → return the stored response; do nothing again
seen, still in progress   → 409: the first attempt hasn't finished yet
seen, different body      → 422: this key already means something else
the work failed           → forget the key, so a retry can try again`,
      },
      {
        kind: "text",
        body: "Two of those rows are where implementations go wrong. **In progress:** two copies of a request can arrive at the same moment, for example a double-click. If the server only records the key *after* the work finishes, both copies see an unknown key and both charge. Record the key *before* starting, and atomically: in a database, that's a unique constraint on the key column, so the second insert fails rather than racing. **Different body:** a buggy client that reuses one key for two different payments must get an error, not the first payment's receipt.",
      },
      {
        kind: "callout",
        body: "Payment APIs such as Stripe's accept an `Idempotency-Key` header for exactly this reason, and keep keys for a limited time (about a day) rather than forever. When you call one, generate the key once per operation and reuse it on retries. A new key per attempt defeats the whole mechanism.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A mobile app generates a fresh idempotency key every time it sends a payment request, including retries. What protection does it get?",
        options: [
          "Full protection, since every request carries a key",
          "None, because the server sees each retry as a new operation",
          "Protection against double-clicks but not against timeouts",
          "Protection only if the server stores keys for longer",
        ],
        answer: 1,
        explanation:
          "The key identifies the *intended operation*. If each retry has a new key, the server has no way to know they are the same payment, so it charges each one.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "The server records a key only after the charge succeeds. Two identical requests arrive within a millisecond. What happens?",
        options: [
          "The second request waits for the first automatically",
          "The second gets a 409 because the key exists",
          "The database rejects the second charge",
          "Both see an unknown key and both charge the card",
        ],
        answer: 3,
        explanation:
          'Between "check the key" and "record the key" there\'s a gap, and concurrent requests fall into it. Record the key first, with a uniqueness guarantee, so exactly one request owns the work and the other sees it in progress.',
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Charge once, however many times the request arrives",
        prompt:
          'Write `createPayment(request, { store, charge })`. `request.headers["idempotency-key"]` holds the key and `request.body` the payment. `store` is a `Map` you own; `charge(body)` is async and really charges. Without a key, return 400. For a new key, record it as in progress **before** charging, charge, store and return a 201 with `{ payment }`. Same key and body when finished: return the stored response without charging. Same key while in progress: 409. Same key with a different body: 422. If `charge` throws, forget the key and rethrow, so a retry can succeed.',
        language: "javascript",
        starter: `function json(status, body) {
  return { status, headers: { "content-type": "application/json" }, body };
}

async function createPayment(request, { store, charge }) {
  const payment = await charge(request.body);
  return json(201, { payment });
}`,
        hint: "Store `{ fingerprint, response }` per key, with `fingerprint = JSON.stringify(request.body)` and `response: null` while in progress. Call `store.set` before the first `await`: everything before an `await` runs without interruption, which is what makes the in-progress check work. Wrap the charge in `try`/`catch` and `store.delete(key)` in the catch.",
        solution: `function json(status, body) {
  return { status, headers: { "content-type": "application/json" }, body };
}

async function createPayment(request, { store, charge }) {
  const key = request.headers["idempotency-key"];
  if (!key) return json(400, { error: "An Idempotency-Key header is required" });

  const fingerprint = JSON.stringify(request.body);
  const seen = store.get(key);
  if (seen) {
    if (seen.fingerprint !== fingerprint) {
      return json(422, { error: "This key was already used for a different request" });
    }
    if (!seen.response) return json(409, { error: "The first request is still in progress" });
    return seen.response;
  }

  store.set(key, { fingerprint, response: null });
  try {
    const payment = await charge(request.body);
    const response = json(201, { payment });
    store.set(key, { fingerprint, response });
    return response;
  } catch (error) {
    store.delete(key);
    throw error;
  }
}`,
        tests: [
          {
            name: "A retry returns the first response and charges once",
            expression: `await (async () => { let charges = 0; const deps = { store: new Map(), charge: async (b) => ({ id: "pay_" + ++charges, amount: b.amount }) }; const req = { headers: { "idempotency-key": "k1" }, body: { amount: 500 } }; const a = await createPayment(req, deps); const b = await createPayment(req, deps); return a.status === 201 && b.status === 201 && b.body.payment.id === "pay_1" && charges === 1; })()`,
          },
          {
            name: "A missing key is a 400",
            expression: `await (async () => { let charges = 0; const res = await createPayment({ headers: {}, body: { amount: 1 } }, { store: new Map(), charge: async () => ++charges }); return res.status === 400 && charges === 0; })()`,
          },
          {
            name: "Reusing a key for a different payment is a 422",
            expression: `await (async () => { let charges = 0; const deps = { store: new Map(), charge: async () => ({ id: "pay_" + ++charges }) }; await createPayment({ headers: { "idempotency-key": "k2" }, body: { amount: 500 } }, deps); const res = await createPayment({ headers: { "idempotency-key": "k2" }, body: { amount: 900 } }, deps); return res.status === 422 && charges === 1; })()`,
          },
          {
            name: "Two simultaneous copies charge once; the other gets 409",
            expression: `await (async () => { let charges = 0; const deps = { store: new Map(), charge: async () => { await new Promise((r) => setTimeout(r, 5)); return { id: "pay_" + ++charges }; } }; const req = { headers: { "idempotency-key": "k3" }, body: { amount: 500 } }; const [a, b] = await Promise.all([createPayment(req, deps), createPayment(req, deps)]); return charges === 1 && [a.status, b.status].sort().join() === "201,409"; })()`,
          },
          {
            name: "A failed charge can be retried with the same key",
            expression: `await (async () => { let attempts = 0; const deps = { store: new Map(), charge: async () => { attempts++; if (attempts === 1) throw new Error("card network timeout"); return { id: "pay_ok" }; } }; const req = { headers: { "idempotency-key": "k4" }, body: { amount: 500 } }; try { await createPayment(req, deps); return false; } catch {} const res = await createPayment(req, deps); return res.status === 201 && attempts === 2; })()`,
          },
        ],
      },
    ],
  },

  "node-ops.ratelimit": {
    summary:
      "Limit how fast one caller can hit an endpoint with a token bucket, and tell them when to come back with a 429.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: "Any endpoint that does real work can be called faster than you can afford. Some callers are attackers trying passwords; most are a client stuck in a retry loop, a script someone forgot, or a page that re-fetches on every keystroke. **Rate limiting** caps how many requests one caller gets in a period. It matters most on endpoints that are expensive (search, AI calls, exports) or sensitive (login, password reset, sending email or SMS).",
      },
      {
        kind: "text",
        body: "The simplest limiter counts requests per fixed window: 100 per minute, reset on the minute. It has a known flaw: a caller can send 100 at 12:00:59 and 100 more at 12:01:00, which is 200 in two seconds. A **token bucket** smooths this. Each caller has a bucket holding up to `capacity` tokens, refilled at a steady rate. Each request spends one token; with none left, it's refused. The capacity allows a short burst, the refill rate sets the long-run speed, and an idle caller can never bank more than one full bucket.",
      },
      {
        kind: "code",
        language: "text",
        caption: "capacity 3, refill 1 token per second",
        code: `t=0.0s  tokens 3 → request ✓ 2 → ✓ 1 → ✓ 0 → ✗ (retry after 1s)
t=1.5s  tokens 1.5   → request ✓ 0.5 → ✗ (retry after 1s)
t=60s   tokens 3     (capped; an idle minute doesn't bank 60)`,
      },
      {
        kind: "text",
        body: "A refused request gets **`429 Too Many Requests`** with a **`Retry-After`** header saying how many seconds to wait. Well-behaved clients wait that long instead of hammering you. Decide what one caller *is*: the user id when they're signed in, the IP address when they're not. Remember that a whole office or mobile network can share one IP, so anonymous limits need to be generous.",
      },
      {
        kind: "callout",
        body: "**A limiter in one process's memory only works with one process.** Run three server instances behind a load balancer and each one has its own buckets, so every caller gets three times the limit. Production limiters keep their counters in a shared store such as Redis, or at the edge in your CDN or API gateway.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A fixed-window limiter allows 100 requests per minute. What's the most one client can send in about two seconds?",
        options: [
          "100, the limit",
          "About 3, since 100 per minute averages under 2 per second",
          "Unlimited, because windows don't track bursts",
          "About 200: the last moments of one window and the first of the next",
        ],
        answer: 3,
        explanation:
          "The counter resets at the window boundary, so a full window's allowance at 12:00:59 and another at 12:01:00 are both allowed. A token bucket refills gradually, which removes the spike.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Which response header tells a rate-limited client how long to wait?",
        before: "",
        after: ": 30",
        answer: "Retry-After",
        accept: ["retry-after"],
        explanation:
          "Retry-After is sent with 429 (and 503) responses. Clients that respect it back off for exactly as long as needed.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Build a token bucket limiter",
        prompt:
          "Write `createLimiter({ capacity, refillPerSecond, now })`, returning `check(key)`. Each key gets its own bucket, starting full. Refill it by `refillPerSecond` for every second since that key was last checked (fractions count), never beyond `capacity`. With at least one token, spend it and return `{ allowed: true, retryAfterSeconds: 0 }`. Otherwise return `{ allowed: false, retryAfterSeconds }`: the whole number of seconds until one token is available, rounded up. `now()` returns the time in milliseconds; the tests control it.",
        language: "javascript",
        starter: `function createLimiter({ capacity, refillPerSecond, now = Date.now }) {
  let used = 0;
  return function check(key) {
    used += 1;
    return { allowed: used <= capacity, retryAfterSeconds: 0 };
  };
}`,
        hint: "Keep a `Map` from key to `{ tokens, at }`. On each check: `tokens = Math.min(capacity, saved.tokens + ((now() - saved.at) / 1000) * refillPerSecond)`. Save the new `{ tokens, at }` whether or not you spend one. The wait is `Math.ceil((1 - tokens) / refillPerSecond)`.",
        solution: `function createLimiter({ capacity, refillPerSecond, now = Date.now }) {
  const buckets = new Map();
  return function check(key) {
    const t = now();
    const saved = buckets.get(key) ?? { tokens: capacity, at: t };
    const tokens = Math.min(capacity, saved.tokens + ((t - saved.at) / 1000) * refillPerSecond);
    if (tokens >= 1) {
      buckets.set(key, { tokens: tokens - 1, at: t });
      return { allowed: true, retryAfterSeconds: 0 };
    }
    buckets.set(key, { tokens, at: t });
    return { allowed: false, retryAfterSeconds: Math.ceil((1 - tokens) / refillPerSecond) };
  };
}`,
        tests: [
          {
            name: "Allows a burst up to capacity, then refuses",
            expression: `(() => { let t = 0; const check = createLimiter({ capacity: 3, refillPerSecond: 1, now: () => t }); const results = [1, 2, 3, 4].map(() => check("u1").allowed); return results.join() === "true,true,true,false"; })()`,
          },
          {
            name: "Says how long to wait, rounded up",
            expression: `(() => { let t = 0; const check = createLimiter({ capacity: 2, refillPerSecond: 0.5, now: () => t }); check("u1"); check("u1"); const r = check("u1"); return r.allowed === false && r.retryAfterSeconds === 2; })()`,
          },
          {
            name: "Refills gradually, counting fractions of a second",
            expression: `(() => { let t = 0; const check = createLimiter({ capacity: 3, refillPerSecond: 1, now: () => t }); check("u1"); check("u1"); check("u1"); t = 1500; const a = check("u1").allowed; const b = check("u1").allowed; return a === true && b === false; })()`,
          },
          {
            name: "Each caller has their own bucket",
            expression: `(() => { let t = 0; const check = createLimiter({ capacity: 1, refillPerSecond: 1, now: () => t }); return check("alice").allowed && check("bob").allowed && !check("alice").allowed; })()`,
          },
          {
            name: "An idle caller can't bank more than one full bucket",
            expression: `(() => { let t = 0; const check = createLimiter({ capacity: 3, refillPerSecond: 1, now: () => t }); check("u1"); t = 600000; const allowed = [1, 2, 3, 4].map(() => check("u1").allowed); return allowed.join() === "true,true,true,false"; })()`,
          },
        ],
      },
    ],
  },

  "node-ops.logging": {
    summary:
      "Write logs as structured, one-line events with a request id, and redact secrets before they're ever written.",
    xp: 140,
    blocks: [
      {
        kind: "text",
        body: 'A log line is a message to someone debugging production at the worst possible moment, possibly you. `console.log("here", user)` doesn\'t help them. What helps: **one event per line, as JSON**, with the same fields every time: a timestamp, a level, a short fixed message, and the details as named fields. Log tools can then filter (`level=error`), group (`message="payment failed"`) and count, instead of someone grepping prose.',
      },
      {
        kind: "code",
        language: "json",
        caption: "One event, one line, fields rather than sentences",
        code: `{"time":"2026-10-09T09:14:02.118Z","level":"error","message":"payment failed","requestId":"r-8f2c","userId":"u_381","provider":"stripe","status":402,"durationMs":812}`,
      },
      {
        kind: "text",
        body: '**Give every request an id** and put it on every line that request writes, and in the `500` response the user sees. Then a support ticket that says "error r-8f2c" leads straight to the full story. Keep the message fixed ("payment failed") and put the variable parts in fields. A message like `"payment of 500 failed for u_381"` is unique on every line, so you can never count how often it happens.',
      },
      {
        kind: "text",
        body: "Use levels honestly. **error**: something failed and someone may need to act. **warn**: unexpected, but handled. **info**: normal events worth keeping, such as a request finished or a job ran. **debug**: detail you switch on while investigating. An app that logs every request at `error` has trained everyone to ignore errors.",
      },
      {
        kind: "callout",
        body: '**Logs are copied everywhere**: to log services, to laptops, into support tickets. Anything written there should be assumed public inside your company and kept for months. Never log passwords, tokens, session cookies, API keys or full card numbers. Redact by field name *in the logger*, so one careless `log("login", { body })` can\'t leak the password inside it.',
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "Which log line will be most useful when you need to count how often payments fail?",
        options: [
          "`Payment of £50 for order 1182 failed!!`",
          '`{"level":"error","message":"payment failed","orderId":1182,"amount":5000}`',
          "`ERROR: something went wrong in payments`",
          '`{"level":"info","message":"payment"}`',
        ],
        answer: 1,
        explanation:
          "A fixed message with the variable parts in fields can be filtered and counted. The first is unique per order, the third has no detail, and the fourth is the wrong level with no outcome.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "A logger that can't leak a secret",
        prompt:
          'Write `redact(value)`, which returns a deep copy of `value` with any property whose name contains `password`, `token`, `secret`, `authorization` or `cookie` (in any letter case) replaced by `"[redacted]"`, at any depth, including inside arrays. It must not change the original. Then write `logLine(level, message, fields, time)`, which returns a single-line JSON string of `{ time, level, message, ...redact(fields) }`.',
        language: "javascript",
        starter: `function redact(value) {
  return value;
}

function logLine(level, message, fields, time) {
  return JSON.stringify({ time, level, message, ...fields }, null, 2);
}`,
        hint: "Recurse: arrays map `redact` over their items; plain objects build a new object from `Object.entries`, testing each key with a case-insensitive regular expression such as `/password|token|secret|authorization|cookie/i`; anything else is returned as it is. `JSON.stringify` without the spacing arguments writes one line.",
        solution: `const SENSITIVE = /password|token|secret|authorization|cookie/i;

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, inner]) => [
        key,
        SENSITIVE.test(key) ? "[redacted]" : redact(inner),
      ]),
    );
  }
  return value;
}

function logLine(level, message, fields, time) {
  return JSON.stringify({ time, level, message, ...redact(fields) });
}`,
        tests: [
          {
            name: "Redacts sensitive fields at the top level",
            expression: `JSON.stringify(redact({ email: "a@b.co", password: "hunter2" })) === JSON.stringify({ email: "a@b.co", password: "[redacted]" })`,
          },
          {
            name: "Redacts nested fields and fields inside arrays, in any case",
            expression: `(() => { const out = redact({ request: { headers: { Authorization: "Bearer abc", "x-request-id": "r1" } }, sessions: [{ refreshToken: "t1", device: "ios" }] }); return out.request.headers.Authorization === "[redacted]" && out.request.headers["x-request-id"] === "r1" && out.sessions[0].refreshToken === "[redacted]" && out.sessions[0].device === "ios"; })()`,
          },
          {
            name: "Leaves the original object untouched",
            expression: `(() => { const input = { user: { password: "hunter2" } }; redact(input); return input.user.password === "hunter2"; })()`,
          },
          {
            name: "Writes one line of JSON with the standard fields first",
            expression: `(() => { const line = logLine("error", "login failed", { userId: "u1", password: "hunter2" }, "2026-10-09T09:00:00Z"); const parsed = JSON.parse(line); return !line.includes("\\n") && !line.includes("hunter2") && parsed.level === "error" && parsed.message === "login failed" && parsed.userId === "u1" && Object.keys(parsed)[0] === "time"; })()`,
          },
        ],
      },
    ],
  },

  "node-ops.capstone": {
    summary:
      "Build a room-booking API end to end: authentication, validation, ownership, and conflicts that return the right status.",
    xp: 260,
    blocks: [
      {
        kind: "text",
        body: "This capstone puts the course together in one small API: meeting-room bookings. It's deliberately ordinary. Nearly every real backend is a set of resources with owners, rules about what's valid, and conflicts when two people want the same thing. The work is in getting every status code right, because each one is a promise to the client about what went wrong and whether retrying could help.",
      },
      {
        kind: "code",
        language: "text",
        caption: "The contract",
        code: `GET    /bookings?room=atlas   200  that room's bookings, earliest first
POST   /bookings              201  { booking }       signed in, valid, no clash
                              400  invalid input
                              401  not signed in
                              409  overlaps an existing booking in that room
DELETE /bookings/:id          204  no body           owner or admin
                              401  not signed in
                              403  someone else's booking
                              404  no such booking`,
      },
      {
        kind: "text",
        body: "**Overlap** is the rule people get wrong. Two bookings in the same room clash when each one starts before the other ends: `a.start < b.end && b.start < a.end`. That single condition covers every case, including one booking inside another. And it lets back-to-back bookings through: a meeting ending at 10:00 doesn't clash with one starting at 10:00.",
      },
      {
        kind: "text",
        body: "Check in the order a client can act on: **authentication first** (401: who are you?), then **input** (400: what you sent is wrong), then **existence** (404), **permission** (403) and **conflicts** (409: valid, but not possible right now). A 400 for an overlap would tell the client its request was malformed, when it's fine and the room is just taken.",
      },
      {
        kind: "callout",
        body: "In a real database, check-then-insert has the same race you met in the idempotency lesson: two requests can both see a free room. PostgreSQL can enforce no-overlap itself with an exclusion constraint on a time range. Here, the in-memory array is the database and the check is enough.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "A room is booked 09:00–10:00. Which new booking should be accepted?",
        options: ["09:30–10:30", "08:00–11:00", "10:00–11:00", "09:15–09:45"],
        answer: 2,
        explanation:
          "10:00–11:00 starts exactly when the other ends, so `new.start < existing.end` is false and there's no clash. The other three each start before the existing booking ends and end after it starts.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Capstone: the bookings API",
        prompt:
          'Implement `handle(request)` to the contract above. A request is `{ method, path, query?, body?, user? }`, where `user` is `{ id, role }` when signed in. A new booking\'s body is `{ room, start, end }`: `room` a non-empty string, `start` and `end` ISO date strings that parse (`Date.parse`), `end` after `start`, and at most 4 hours long. Created bookings get an id `"b" + nextId++`, an `owner` of the user\'s id, and are pushed onto `bookings`. Admins (`role: "admin"`) may delete anyone\'s booking. Use `json` for every response; a 204 has a `null` body.',
        language: "javascript",
        starter: `const bookings = [
  { id: "b1", room: "atlas", start: "2026-10-12T09:00:00Z", end: "2026-10-12T10:00:00Z", owner: "u1" },
];
let nextId = 2;

function json(status, body) {
  return { status, headers: { "content-type": "application/json" }, body };
}

function handle(request) {
  return json(501, { error: "Not implemented" });
}`,
        hint: 'Split the work into a function per route. For POST: check `request.user`, then validate with `Date.parse` and `Number.isNaN`, then look for a booking in the same room where `start < other.end && other.start < end` (compare the parsed numbers). For DELETE: read the id from `request.path.split("/")[2]`, then 401, 404, 403 in that order. Return copies of the list, sorted by start.',
        solution: `const bookings = [
  { id: "b1", room: "atlas", start: "2026-10-12T09:00:00Z", end: "2026-10-12T10:00:00Z", owner: "u1" },
];
let nextId = 2;

const MAX_HOURS = 4;

function json(status, body) {
  return { status, headers: { "content-type": "application/json" }, body };
}

function list(request) {
  const room = request.query?.room;
  const found = bookings
    .filter((b) => !room || b.room === room)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    .map((b) => ({ ...b }));
  return json(200, { bookings: found });
}

function create(request) {
  if (!request.user) return json(401, { error: "Sign in to book a room" });
  const { room, start, end } = request.body ?? {};
  const from = Date.parse(start);
  const to = Date.parse(end);
  if (typeof room !== "string" || room.trim() === "" || Number.isNaN(from) || Number.isNaN(to)) {
    return json(400, { error: "room, start and end are required" });
  }
  if (to <= from) return json(400, { error: "end must be after start" });
  if (to - from > MAX_HOURS * 3600000) {
    return json(400, { error: "Bookings can be at most " + MAX_HOURS + " hours" });
  }
  const clash = bookings.find(
    (b) => b.room === room && from < Date.parse(b.end) && Date.parse(b.start) < to,
  );
  if (clash) return json(409, { error: "That room is already booked then" });

  const booking = { id: "b" + nextId++, room, start, end, owner: request.user.id };
  bookings.push(booking);
  return json(201, { booking: { ...booking } });
}

function remove(request, id) {
  if (!request.user) return json(401, { error: "Sign in first" });
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) return json(404, { error: "No such booking" });
  const booking = bookings[index];
  if (booking.owner !== request.user.id && request.user.role !== "admin") {
    return json(403, { error: "That isn't your booking" });
  }
  bookings.splice(index, 1);
  return json(204, null);
}

function handle(request) {
  const parts = request.path.split("/").filter(Boolean);
  if (parts[0] !== "bookings" || parts.length > 2) return json(404, { error: "Not found" });
  if (parts.length === 1 && request.method === "GET") return list(request);
  if (parts.length === 1 && request.method === "POST") return create(request);
  if (parts.length === 2 && request.method === "DELETE") return remove(request, parts[1]);
  return json(404, { error: "Not found" });
}`,
        tests: [
          {
            name: "Lists one room's bookings, earliest first",
            expression: `(() => { const alice = { id: "u2", role: "member" }; handle({ method: "POST", path: "/bookings", user: alice, body: { room: "atlas", start: "2026-10-12T07:00:00Z", end: "2026-10-12T08:00:00Z" } }); handle({ method: "POST", path: "/bookings", user: alice, body: { room: "zenith", start: "2026-10-12T07:00:00Z", end: "2026-10-12T08:00:00Z" } }); const res = handle({ method: "GET", path: "/bookings", query: { room: "atlas" } }); const starts = res.body.bookings.map((b) => b.start); return res.status === 200 && res.body.bookings.every((b) => b.room === "atlas") && starts.length >= 2 && starts.every((s, i) => i === 0 || Date.parse(starts[i - 1]) <= Date.parse(s)); })()`,
          },
          {
            name: "Creates a booking for the signed-in user",
            expression: `(() => { const res = handle({ method: "POST", path: "/bookings", user: { id: "u3", role: "member" }, body: { room: "orbit", start: "2026-10-13T09:00:00Z", end: "2026-10-13T10:30:00Z" } }); return res.status === 201 && res.body.booking.owner === "u3" && typeof res.body.booking.id === "string"; })()`,
          },
          {
            name: "Requires sign-in before anything else",
            expression: `handle({ method: "POST", path: "/bookings", body: {} }).status === 401 && handle({ method: "DELETE", path: "/bookings/b1" }).status === 401`,
          },
          {
            name: "Rejects missing, backwards and over-long bookings with 400",
            expression: `(() => { const user = { id: "u4", role: "member" }; const bad = [{}, { room: "orbit", start: "soon", end: "later" }, { room: "orbit", start: "2026-10-14T10:00:00Z", end: "2026-10-14T09:00:00Z" }, { room: "orbit", start: "2026-10-14T08:00:00Z", end: "2026-10-14T13:00:00Z" }]; return bad.every((body) => handle({ method: "POST", path: "/bookings", user, body }).status === 400); })()`,
          },
          {
            name: "An overlap is a 409, but back-to-back is fine",
            expression: `(() => { const user = { id: "u5", role: "member" }; const clash = handle({ method: "POST", path: "/bookings", user, body: { room: "atlas", start: "2026-10-12T09:30:00Z", end: "2026-10-12T10:30:00Z" } }); const inside = handle({ method: "POST", path: "/bookings", user, body: { room: "atlas", start: "2026-10-12T09:15:00Z", end: "2026-10-12T09:45:00Z" } }); const after = handle({ method: "POST", path: "/bookings", user, body: { room: "atlas", start: "2026-10-12T10:00:00Z", end: "2026-10-12T11:00:00Z" } }); return clash.status === 409 && inside.status === 409 && after.status === 201; })()`,
          },
          {
            name: "Only the owner or an admin can delete; unknown ids are 404",
            expression: `(() => { const created = handle({ method: "POST", path: "/bookings", user: { id: "u6", role: "member" }, body: { room: "nova", start: "2026-10-15T09:00:00Z", end: "2026-10-15T10:00:00Z" } }).body.booking; const stranger = handle({ method: "DELETE", path: "/bookings/" + created.id, user: { id: "u7", role: "member" } }); const missing = handle({ method: "DELETE", path: "/bookings/b404", user: { id: "u6", role: "member" } }); const admin = handle({ method: "DELETE", path: "/bookings/" + created.id, user: { id: "boss", role: "admin" } }); const gone = handle({ method: "GET", path: "/bookings", query: { room: "nova" } }).body.bookings.length; return stranger.status === 403 && missing.status === 404 && admin.status === 204 && admin.body === null && gone === 0; })()`,
          },
        ],
      },
    ],
  },
};
