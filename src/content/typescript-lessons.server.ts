import type { LessonBody } from "./lessons";

/** Authored TypeScript course lessons. Answer keys stay server-side. */
export const typescriptLessonBodies: Record<string, LessonBody> = {
  "ts-core.nullable": {
    summary:
      "Make absence explicit and handle missing lookups without hiding valid zero or empty values.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "With strictNullChecks, a value that might be absent must be handled before use. An optional property is read as its declared type plus undefined. Array.find can return undefined even when every array element is valid. Treat these as ordinary branches of your program, not compiler annoyances.",
      },
      {
        kind: "code",
        language: "typescript",
        caption: "Check the lookup before reading fields",
        code: `type Member = { id: string; credits?: number };
function availableCredits(members: readonly Member[], id: string): number | undefined {
  const member = members.find(item => item.id === id);
  if (member === undefined) return undefined;
  return member.credits ?? 0;
}`,
      },
      {
        kind: "text",
        body: "The result distinguishes a missing member from an existing member with zero credits. Optional chaining stops a property read when the receiver is null or undefined; it does not establish that data exists. The ?? operator defaults only null and undefined. In contrast, || also replaces zero, false and empty strings. Choose defaults from the product rule, not just to remove an error.",
      },
      {
        kind: "callout",
        body: "The non-null assertion `value!` disappears at runtime. It cannot make a failed lookup succeed. With noUncheckedIndexedAccess, arbitrary array and dictionary reads also include undefined. An early return usually communicates the missing case more clearly than an assertion.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "A valid quantity can be zero. Which default preserves it?",
        options: ["quantity || 1", "quantity ?? 1", "quantity!", "quantity as number"],
        answer: 1,
        explanation: "Nullish coalescing replaces only null and undefined, so zero remains zero.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Express the possibility that a lookup found no label.",
        before: "function label(): string | ",
        after: " { return undefined; }",
        answer: "undefined",
        explanation:
          "The return contract forces callers to consider absence when strict null checking is enabled.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Resolve a saved preference",
        language: "typescript",
        prompt:
          "Implement preferenceLabel(users, id). A user has id: string, name: string and optional nickname: string. Return undefined when no user matches; otherwise return nickname when present, including an empty string, or name when absent. Accept a readonly array and do not mutate it. Define the User type yourself.",
        starter: `// Define User.
function preferenceLabel(users: readonly User[], id: string): string | undefined {
  return undefined;
}`,
        hint: "Find the user, handle undefined, then use ?? between nickname and name.",
        solution: `type User = { id: string; name: string; nickname?: string };
function preferenceLabel(users: readonly User[], id: string): string | undefined {
  const user = users.find(item => item.id === id);
  if (user === undefined) return undefined;
  return user.nickname ?? user.name;
}`,
        tests: [
          {
            name: "Handles an empty collection",
            expression: 'preferenceLabel([], "a") === undefined',
          },
          {
            name: "Handles an unknown id",
            expression: 'preferenceLabel([{ id: "a", name: "Ada" }], "b") === undefined',
          },
          {
            name: "Defaults an absent nickname",
            expression: 'preferenceLabel([{ id: "a", name: "Ada" }], "a") === "Ada"',
          },
          {
            name: "Returns a supplied nickname",
            expression: 'preferenceLabel([{ id: "a", name: "Ada", nickname: "A" }], "a") === "A"',
          },
          {
            name: "Preserves an empty nickname",
            expression: 'preferenceLabel([{ id: "a", name: "Ada", nickname: "" }], "a") === ""',
          },
          {
            name: "Reads frozen inputs",
            expression:
              'preferenceLabel(Object.freeze([Object.freeze({ id: "b", name: "Bo" })]), "b") === "Bo"',
          },
        ],
      },
    ],
  },
  "ts-core.checkpoint": {
    summary:
      "Design a shipment union from a brief and derive a decision without optional-property guessing.",
    xp: 220,
    blocks: [
      {
        kind: "callout",
        body: "Checkpoint: start from the brief, without copying the payment solution. First list the fields that exist in each state. Predict what the compiler should reject, then implement the behavior.",
      },
      {
        kind: "text",
        body: "An object with status plus several optional fields allows invalid combinations: delivered with no recipient, or queued with a tracking number. A union ties each state's fields together. Keep the discriminant and data on the same object so a status check gives the compiler evidence about the other fields. After every branch returns, a never assignment makes future states visible to the compiler.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which model prevents a delivered shipment without a recipient?",
        options: [
          "One object with all fields optional",
          "A union whose delivered member requires recipient",
          "A type assertion at every call",
          "A status typed as string",
        ],
        answer: 1,
        explanation: "Each union member specifies the data required for that valid state.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Narrow the shipment using its shared discriminant.",
        before: "switch (shipment.",
        after: ") { /* cases */ }",
        answer: "status",
        explanation:
          "Every member uses a literal status, letting the switch select a specific member.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Shipment decision checkpoint",
        language: "typescript",
        prompt:
          "Write Shipment and shipmentAction(shipment): string from scratch. Every shipment has id: string. queued has no extra data and returns 'Prepare ID'; shipped requires tracking: string and returns 'Track TRACKING'; delivered requires recipient: string and returns 'Received by RECIPIENT'; cancelled requires reason: string and returns 'Cancelled: REASON'. Use a discriminated union and exhaustive never check. Do not mutate the shipment.",
        starter: "// Define Shipment and write shipmentAction from the brief.\n",
        hint: "Use a union of four object shapes with literal status values. Return in every switch case and assign the remaining value to never.",
        solution: `type Shipment =
  | { id: string; status: "queued" }
  | { id: string; status: "shipped"; tracking: string }
  | { id: string; status: "delivered"; recipient: string }
  | { id: string; status: "cancelled"; reason: string };
function shipmentAction(shipment: Shipment): string {
  switch (shipment.status) {
    case "queued": return "Prepare " + shipment.id;
    case "shipped": return "Track " + shipment.tracking;
    case "delivered": return "Received by " + shipment.recipient;
    case "cancelled": return "Cancelled: " + shipment.reason;
    default: {
      const exhaustive: never = shipment;
      return exhaustive;
    }
  }
}`,
        tests: [
          {
            name: "Prepares queued shipments",
            expression: 'shipmentAction({ id: "s9", status: "queued" }) === "Prepare s9"',
          },
          {
            name: "Uses the tracking value",
            expression:
              'shipmentAction({ id: "s1", status: "shipped", tracking: "TRACK-2" }) === "Track TRACK-2"',
          },
          {
            name: "Names the recipient",
            expression:
              'shipmentAction({ id: "s2", status: "delivered", recipient: "Lin" }) === "Received by Lin"',
          },
          {
            name: "Explains cancellation",
            expression:
              'shipmentAction({ id: "s3", status: "cancelled", reason: "No stock" }) === "Cancelled: No stock"',
          },
          {
            name: "Preserves input",
            expression:
              'shipmentAction(Object.freeze({ id: "s4", status: "queued" })) === "Prepare s4"',
          },
        ],
      },
    ],
  },
  "ts-apps.utilities": {
    summary:
      "Derive update contracts from a domain model and understand what utility types do at runtime.",
    xp: 160,
    blocks: [
      {
        kind: "text",
        body: "Repeated object shapes drift when one copy changes. Pick selects fields, Omit removes fields from a type, Partial makes fields optional, and Readonly prevents assignment through that reference. Indexed access such as Profile['id'] reuses a field's type. These operations describe contracts; none copies, deletes or freezes an object at runtime.",
      },
      {
        kind: "code",
        language: "typescript",
        caption: "Derive a narrowly scoped patch",
        code: `type Profile = { readonly id: string; name: string; bio: string; admin: boolean };
type ProfilePatch = Partial<Pick<Profile, "name" | "bio">>;
type ProfileId = Profile["id"];
const draft = { name: "Mina" } satisfies ProfilePatch;`,
      },
      {
        kind: "text",
        body: "satisfies checks compatibility while retaining the expression's useful inferred type; it does not validate runtime data. Partial is shallow: it does not recursively make nested fields optional. With exactOptionalPropertyTypes, an optional string property may be omitted but cannot explicitly be undefined unless the type includes undefined. A type also does not guarantee that an object has no additional fields: variables can carry more than a target shape requires. Copy permitted fields explicitly at an update boundary.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Does Omit<Profile, 'admin'> remove admin from an existing object?",
        options: [
          "Yes, during compilation",
          "Yes, when serialized",
          "No; runtime projection must select fields",
          "Only with strict enabled",
        ],
        answer: 2,
        explanation:
          "Utility types disappear at runtime. The actual object still has its original properties.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Make only name and bio optional for an edit form.",
        before: "type Patch = ",
        after: '<Pick<Profile, "name" | "bio">>;',
        answer: "Partial",
        explanation:
          "Pick chooses the editable fields; Partial permits a patch to supply either, both or neither.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Apply a permitted profile patch",
        language: "typescript",
        prompt:
          "Define ProfilePatch from Profile using Pick and Partial. Implement applyProfilePatch(profile, patch): Profile. Return a new object; update only name and bio when supplied (including empty strings). Keep id and admin from the original even when the runtime patch carries extra fields. Do not mutate either input. Assume supplied name/bio values are strings; external validation comes next.",
        starter: `type Profile = { readonly id: string; name: string; bio: string; admin: boolean };
// Derive ProfilePatch.
function applyProfilePatch(profile: Profile, patch: ProfilePatch): Profile {
  return profile;
}`,
        hint: "Spread the original, then explicitly set name and bio using nullish defaults. Do not spread the patch.",
        solution: `type Profile = { readonly id: string; name: string; bio: string; admin: boolean };
type ProfilePatch = Partial<Pick<Profile, "name" | "bio">>;
function applyProfilePatch(profile: Profile, patch: ProfilePatch): Profile {
  return { ...profile, name: patch.name ?? profile.name, bio: patch.bio ?? profile.bio };
}`,
        tests: [
          {
            name: "Updates only supplied fields",
            expression:
              '(() => { const p = applyProfilePatch({ id: "a", name: "Ada", bio: "Hi", admin: false }, { name: "Lin" }); return p.name === "Lin" && p.bio === "Hi"; })()',
          },
          {
            name: "Can clear both text fields",
            expression:
              '(() => { const p = applyProfilePatch({ id: "a", name: "Ada", bio: "Hi", admin: false }, { name: "", bio: "" }); return p.name === "" && p.bio === ""; })()',
          },
          {
            name: "Returns a fresh value for an empty patch",
            expression:
              '(() => { const p = { id: "a", name: "Ada", bio: "Hi", admin: false }; const next = applyProfilePatch(p, {}); return next !== p && JSON.stringify(next) === JSON.stringify(p); })()',
          },
          {
            name: "Ignores extra runtime fields",
            expression:
              '(() => { const p = applyProfilePatch({ id: "a", name: "Ada", bio: "Hi", admin: false }, { id: "b", admin: true, bio: "New" }); return p.id === "a" && p.admin === false && p.bio === "New"; })()',
          },
          {
            name: "Does not mutate either input",
            expression:
              '(() => { const p = Object.freeze({ id: "a", name: "Ada", bio: "Hi", admin: false }); const patch = Object.freeze({ bio: "New" }); return applyProfilePatch(p, patch).bio === "New" && p.bio === "Hi"; })()',
          },
        ],
      },
    ],
  },
  "ts-boundaries.unknown": {
    summary:
      "Validate untrusted values and build a small trusted object before passing it into application code.",
    xp: 180,
    blocks: [
      {
        kind: "text",
        body: "JSON, storage and network responses can violate your type declarations. Receive them as unknown. Check object-ness, null, arrays and each required field before constructing your domain value. A string containing digits is still a string; validation and coercion are different product decisions. This lesson rejects invalid values instead of silently converting them.",
      },
      {
        kind: "code",
        language: "typescript",
        caption: "A predicate needs real evidence",
        code: `function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readTitle(value: unknown): string | undefined {
  if (!isRecord(value) || typeof value.title !== "string") return undefined;
  return value.title.trim() || undefined;
}`,
      },
      {
        kind: "text",
        body: "A user-defined predicate is a promise to the checker. TypeScript checks that its implementation returns a boolean, but it does not prove the predicate tells the truth. Test it with hostile and malformed inputs. A parser returning a success/error union can be clearer because it creates the validated output and explains a failure. For larger schemas a validation library can centralize these checks; the boundary still needs runtime evidence.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What makes `JSON.parse(text) as Product` safe?",
        options: [
          "The assertion itself",
          "A matching interface name",
          "Nothing by itself; runtime validation is still needed",
          "Enabling strict",
        ],
        answer: 2,
        explanation:
          "An assertion supplies no runtime checks and cannot turn malformed data into a valid product.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Receive a value whose shape has not been proven yet.",
        before: "function parseProduct(value: ",
        after: ") { /* validate */ }",
        answer: "unknown",
        explanation:
          "Unknown requires narrowing before property access and prevents accidental unchecked propagation.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Parse a product safely",
        language: "typescript",
        prompt:
          "Implement parseProduct(value: unknown): Product | undefined. Accept only non-null, non-array objects with id and name that are nonblank strings, and price that is a finite nonnegative number. Return a fresh object with trimmed id/name and unchanged price; omit extra properties. Invalid values return undefined without throwing. Do not coerce numeric strings or mutate input.",
        starter: `type Product = { id: string; name: string; price: number };
function parseProduct(value: unknown): Product | undefined {
  return undefined;
}`,
        hint: "First guard object/null/array, then use the in operator and typeof for each field. Check Number.isFinite and trim before constructing the result.",
        solution: `type Product = { id: string; name: string; price: number };
function parseProduct(value: unknown): Product | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  if (!("id" in value) || typeof value.id !== "string" || !value.id.trim()) return undefined;
  if (!("name" in value) || typeof value.name !== "string" || !value.name.trim()) return undefined;
  if (!("price" in value) || typeof value.price !== "number" || !Number.isFinite(value.price) || value.price < 0) return undefined;
  return { id: value.id.trim(), name: value.name.trim(), price: value.price };
}`,
        tests: [
          {
            name: "Trims and projects valid values",
            expression:
              '(() => { const p = parseProduct({ id: " p1 ", name: " Lamp ", price: 12, secret: true }); return p?.id === "p1" && p.name === "Lamp" && p.price === 12 && Object.keys(p).length === 3; })()',
          },
          {
            name: "Accepts a free product",
            expression: 'parseProduct({ id: "a", name: "Free", price: 0 })?.price === 0',
          },
          {
            name: "Rejects non-records",
            expression:
              '[null, undefined, 7, "x", [], true].every(x => parseProduct(x) === undefined)',
          },
          {
            name: "Rejects absent and blank fields",
            expression:
              '[{}, { id: " ", name: "A", price: 1 }, { id: "a", name: "\t", price: 1 }, { id: "a", name: 4, price: 1 }].every(x => parseProduct(x) === undefined)',
          },
          {
            name: "Rejects invalid prices without coercion",
            expression:
              '[-1, NaN, Infinity, "3", null, undefined].every(price => parseProduct({ id: "a", name: "A", price }) === undefined)',
          },
          {
            name: "Copies frozen input",
            expression:
              '(() => { const x = Object.freeze({ id: "a", name: "A", price: 2 }); const p = parseProduct(x); return p !== x && p?.id === "a"; })()',
          },
        ],
      },
    ],
  },
  "ts-boundaries.async": {
    summary:
      "Describe asynchronous dependencies precisely and turn transport failures and invalid data into explicit results.",
    xp: 180,
    blocks: [
      {
        kind: "text",
        body: "An async function returns a Promise of its result type. Awaiting Promise<unknown> yields unknown, so you still validate the resolved value. A rejection can carry any JavaScript value, not only an Error. Under strict checking the catch variable is unknown; use instanceof Error before reading message.",
      },
      {
        kind: "code",
        language: "typescript",
        caption: "Inject transport so tests do not need a real network",
        code: `type Read = () => Promise<unknown>;
type CountResult = { ok: true; count: number } | { ok: false; error: string };
async function readCount(read: Read): Promise<CountResult> {
  try {
    const value = await read();
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return { ok: false, error: "Invalid count" };
    }
    return { ok: true, count: value };
  } catch (error: unknown) {
    return { ok: false, error: error instanceof Error ? error.message : "Read failed" };
  }
}`,
      },
      {
        kind: "text",
        body: "The injected function owns transport details. A fetch adapter should check response.ok before returning response.json(); HTTP error responses do not automatically reject fetch. The application helper owns validation and its domain result. Keep successful empty data distinct from failure. A resolved Result describes the completed operation; loading is separate UI state while that promise is pending.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What is the type of the value after awaiting Promise<unknown>?",
        options: ["any", "unknown", "Error", "A validated object"],
        answer: 1,
        explanation:
          "Await unwraps the promise but does not prove anything about the resolved payload.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Guard a catch value before reading its Error message.",
        before: "error ",
        after: " Error ? error.message : 'Request failed'",
        answer: "instanceof",
        explanation:
          "Thrown values may be strings or null. instanceof narrows actual Error objects.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Load notification labels",
        language: "typescript",
        prompt:
          "Implement loadLabels(read) with read: () => Promise<unknown>. Call read exactly once. A payload is valid only if it is an array entirely of nonblank strings; return { ok: true, labels } with each string trimmed, preserving order and duplicates. Empty arrays are valid. Invalid data returns { ok: false, error: 'Invalid labels' }. A thrown Error uses its message; other thrown values use 'Request failed'. Do not mutate the payload.",
        starter: `type LabelResult = { ok: true; labels: string[] } | { ok: false; error: string };
async function loadLabels(read: () => Promise<unknown>): Promise<LabelResult> {
  return { ok: false, error: "TODO" };
}`,
        hint: "Await read inside try. Validate every item before mapping. Catch unknown and narrow Error objects.",
        solution: `type LabelResult = { ok: true; labels: string[] } | { ok: false; error: string };
async function loadLabels(read: () => Promise<unknown>): Promise<LabelResult> {
  try {
    const value: unknown = await read();
    if (!Array.isArray(value)) return { ok: false, error: "Invalid labels" };
    const labels: string[] = [];
    for (const item of value) {
      if (typeof item !== "string" || !item.trim()) return { ok: false, error: "Invalid labels" };
      labels.push(item.trim());
    }
    return { ok: true, labels };
  } catch (error: unknown) {
    return { ok: false, error: error instanceof Error ? error.message : "Request failed" };
  }
}`,
        tests: [
          {
            name: "Trims while preserving order and duplicates",
            expression:
              'await (async () => { const r = await loadLabels(async () => [" B ", "A", "A"]); return r.ok === true && JSON.stringify(r.labels) === \'["B","A","A"]\'; })()',
          },
          {
            name: "Accepts an empty response",
            expression:
              "await (async () => { const r = await loadLabels(async () => []); return r.ok === true && Array.isArray(r.labels) && r.labels.length === 0; })()",
          },
          {
            name: "Rejects malformed and mixed payloads",
            expression:
              '(await Promise.all([null, {}, "A", ["A", 2], [" "]].map(value => loadLabels(async () => value)))).every(r => !r.ok && r.error === "Invalid labels")',
          },
          {
            name: "Preserves Error messages",
            expression:
              '(await loadLabels(async () => { throw new Error("Offline"); })).error === "Offline"',
          },
          {
            name: "Handles non-Error rejection",
            expression:
              '(await loadLabels(async () => { throw null; })).error === "Request failed"',
          },
          {
            name: "Calls transport once and preserves payload",
            expression:
              'await (async () => { let calls = 0; const input = Object.freeze([" A "]); const result = await loadLabels(async () => { calls++; return input; }); return calls === 1 && result.ok && result.labels[0] === "A" && input[0] === " A "; })()',
          },
        ],
      },
    ],
  },
  "ts-boundaries.checkpoint": {
    summary:
      "Combine validation, normalization and a typed result in an all-or-nothing account importer.",
    xp: 250,
    blocks: [
      {
        kind: "callout",
        body: "Checkpoint: design the result union and validation steps before writing code. You have no parser scaffold. Keep raw input unknown until checks justify constructing an Account.",
      },
      {
        kind: "text",
        body: "Batch boundaries need an explicit failure policy. This importer is all-or-nothing: malformed rows or duplicate normalized ids reject the entire batch. A partial-import product would need a different result containing accepted rows and per-row errors. Normalize ids before checking uniqueness so whitespace cannot bypass the rule. Keep the temporary collection local until the complete batch passes.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "When should duplicate ids be compared?",
        options: [
          "Before trimming only",
          "After normalization",
          "After saving the first row",
          "Only when TypeScript reports an error",
        ],
        answer: 1,
        explanation:
          "The unique key is the normalized id. Raw strings may look different yet refer to the same account.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "What should an all-or-nothing importer return for one invalid row?",
        options: [
          "The valid prefix",
          "Success with an empty array",
          "An explicit failure with no accounts field",
          "The input with a type assertion",
        ],
        answer: 2,
        explanation:
          "A failure member prevents callers from accidentally treating partially accepted data as a complete import.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Account import checkpoint",
        language: "typescript",
        prompt:
          "Write importAccounts(value: unknown). Success is { ok: true, accounts: Account[] }; failure is { ok: false, error: string }. Account has id: string and active: boolean. Require an array; otherwise error 'Expected account array'. Each row must be a non-null non-array object, id a nonblank string and active a boolean; otherwise 'Invalid account'. Trim ids and omit extra fields. Duplicate trimmed ids produce 'Duplicate account id'. Check rows in order, validating a row before checking its duplicate id; return the first error. Empty input succeeds. Never mutate input or return partial accounts on failure.",
        starter: "// Define Account, ImportResult and importAccounts from the brief.\n",
        hint: "Use a Set<string> for normalized ids and a local Account[] for accepted rows. Return the success member only after the loop completes.",
        solution: `type Account = { id: string; active: boolean };
type ImportResult = { ok: true; accounts: Account[] } | { ok: false; error: string };
function importAccounts(value: unknown): ImportResult {
  if (!Array.isArray(value)) return { ok: false, error: "Expected account array" };
  const accounts: Account[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const row: unknown = item;
    if (typeof row !== "object" || row === null || Array.isArray(row) ||
        !("id" in row) || typeof row.id !== "string" || !row.id.trim() ||
        !("active" in row) || typeof row.active !== "boolean") {
      return { ok: false, error: "Invalid account" };
    }
    const id = row.id.trim();
    if (seen.has(id)) return { ok: false, error: "Duplicate account id" };
    seen.add(id);
    accounts.push({ id, active: row.active });
  }
  return { ok: true, accounts };
}`,
        tests: [
          {
            name: "Normalizes records and keeps false",
            expression:
              '(() => { const r = importAccounts([{ id: " a ", active: false, secret: 1 }, { id: "b", active: true }]); return r.ok === true && r.accounts.length === 2 && r.accounts[0].id === "a" && r.accounts[0].active === false && r.accounts[1].id === "b" && r.accounts[1].active === true && r.accounts.every(a => Object.keys(a).length === 2); })()',
          },
          {
            name: "Empty batch succeeds",
            expression:
              "(() => { const r = importAccounts([]); return r.ok === true && Array.isArray(r.accounts) && r.accounts.length === 0; })()",
          },
          {
            name: "Requires an array",
            expression:
              '[null, {}, "[]"].every(x => importAccounts(x).error === "Expected account array")',
          },
          {
            name: "Rejects malformed rows",
            expression:
              '[null, [], {}, { id: " ", active: true }, { id: "a", active: "false" }].every(row => importAccounts([row]).error === "Invalid account")',
          },
          {
            name: "Checks normalized duplicate ids",
            expression:
              'importAccounts([{ id: "a", active: true }, { id: " a ", active: false }]).error === "Duplicate account id"',
          },
          {
            name: "Rejects entire batch and respects error order",
            expression:
              '(() => { const result = importAccounts([{ id: "a", active: true }, { id: "a", active: "yes" }]); return !result.ok && result.error === "Invalid account" && !("accounts" in result); })()',
          },
          {
            name: "Copies frozen input with special ids",
            expression:
              '(() => { const row = Object.freeze({ id: "__proto__", active: true }); const result = importAccounts(Object.freeze([row])); return result.ok && result.accounts[0] !== row && result.accounts[0].id === "__proto__"; })()',
          },
        ],
      },
    ],
  },
  "ts-quality.contracts": {
    summary:
      "Use strict compiler checks, negative type tests and runtime tests as complementary feedback.",
    xp: 180,
    blocks: [
      {
        kind: "text",
        body: "Runtime tests execute selected inputs. Compiler checks examine whether typed operations obey their declared contracts, without executing the program. A transpiler can remove types even when those contracts are wrong. Use both checks: a correctly typed function can still return the wrong calculation, and correct output on a few examples does not prove a useful generic signature.",
      },
      {
        kind: "code",
        language: "json",
        caption: "A small standalone practice tsconfig.json",
        code: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noEmit": true,
    "types": []
  },
  "include": ["practice.ts"]
}`,
      },
      {
        kind: "text",
        body: "In a new practice directory, run `npm init -y`, then `npm install --save-dev typescript`. Save this config as tsconfig.json, copy one exercise into practice.ts, and run `npx tsc -p tsconfig.json`. Keep each exercise in its own module with `export {}` if you split it into files. In an existing app, use its framework's module settings. strict enables strictNullChecks and noImplicitAny; the two additional flags above must be enabled separately.",
      },
      {
        kind: "code",
        language: "typescript",
        caption: "An intentional error checks that the public contract stays narrow",
        code: `function double(value: number): number { return value * 2; }
const amount: number = double(4);
// @ts-expect-error: text is not an accepted input
double("4");`,
      },
      {
        kind: "text",
        body: "If double accidentally accepts any, the expected-error directive becomes unused and the compiler reports it. Keep these negative tests in a type-check-only file; the directive does not stop code from executing. First read the earliest diagnostic, fix the incorrect assumption at its source, then rerun the checker. Do not blanket-suppress errors with any, assertions or ts-ignore. Readonly is shallow compile-time protection; use copying or freezing when runtime mutation matters.",
      },
      {
        kind: "callout",
        body: "Local lab: after solving the challenge, enable the config above. Verify a number assignment from selectField({ score: 5 }, 'score') passes. Add an @ts-expect-error call using a missing key, then temporarily loosen the signature to any and confirm the directive becomes unused. Restore the generic signature. Official references: [narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), [generics](https://www.typescriptlang.org/docs/handbook/2/generics.html), and [checked indexing](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html).",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "The browser challenge is green. What does that establish?",
        options: [
          "The TypeScript compiler found no errors",
          "The supplied runtime examples passed",
          "Every input is valid",
          "No future type regression is possible",
        ],
        answer: 1,
        explanation:
          "The browser transpiles TypeScript. Run the separate type checker to verify static contracts.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Make the compiler warn if the next line stops producing its intended error.",
        before: "// @ts-",
        after: ": missing keys must be rejected\nselectField({ score: 5 }, 'missing');",
        answer: "expect-error",
        explanation:
          "An unused expect-error directive is itself a compiler diagnostic, making it useful for negative contract tests.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Preserve the selected field's type",
        language: "typescript",
        prompt:
          "Implement selectField<T, K extends keyof T>(item: T, key: K): T[K]. Return the property without coercion, copying or mutation. Use keyof to restrict keys and indexed access for the return type. The browser checks behavior; complete the local lab above to verify a missing key is rejected and the exact field type is preserved.",
        starter: `function selectField<T, K extends keyof T>(item: T, key: K): T[K] {
  throw new Error("Implement selectField");
}`,
        hint: "The constraints already prove that key indexes item. Return that indexed value directly.",
        solution: `function selectField<T, K extends keyof T>(item: T, key: K): T[K] {
  return item[key];
}`,
        tests: [
          { name: "Reads a number", expression: 'selectField({ score: 5 }, "score") === 5' },
          {
            name: "Preserves falsy values",
            expression:
              'selectField({ active: false }, "active") === false && selectField({ name: "" }, "name") === "" && selectField({ score: 0 }, "score") === 0',
          },
          {
            name: "Preserves object identity",
            expression:
              '(() => { const nested = { id: "a" }; return selectField({ nested }, "nested") === nested; })()',
          },
          {
            name: "Returns optional undefined",
            expression: 'selectField({ label: undefined }, "label") === undefined',
          },
          {
            name: "Works with symbol keys and frozen input",
            expression:
              '(() => { const key = Symbol("key"); return selectField(Object.freeze({ [key]: 9 }), key) === 9; })()',
          },
        ],
      },
    ],
  },
  "ts-project.release": {
    summary:
      "Independently build a release planner that validates unknown tickets and produces a typed, immutable summary.",
    xp: 320,
    blocks: [
      {
        kind: "callout",
        body: "Independent capstone: use the brief as your specification. Sketch domain and result unions, write a validation checklist and predict edge cases before implementing. Reuse the ideas from earlier lessons without copying a complete solution. Run both browser tests and the local strict compiler workflow.",
      },
      {
        kind: "text",
        body: "A release planner receives external ticket data and reports what is ready to ship. Separate three concerns in your design: establishing trusted tickets, deciding how each status affects the release, and projecting the public summary. A parser can validate one ticket, while the planner owns duplicate ids and totals. This separation makes a new status an explicit domain change.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Where should unknown become Ticket?",
        options: [
          "At a type assertion after JSON.parse",
          "After checks establish every required field for the selected status",
          "When the variable is named ticket",
          "When the first runtime test passes",
        ],
        answer: 1,
        explanation: "Only runtime evidence justifies trusting the external data.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Why keep failure separate from a successful empty release?",
        options: [
          "To make every property optional",
          "So a network or validation failure cannot look like zero work",
          "To avoid validating arrays",
          "Because TypeScript cannot type empty arrays",
        ],
        answer: 1,
        explanation:
          "A success with no tickets is valid domain data. A failure means no reliable summary was produced.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Build the release planner",
        language: "typescript",
        prompt:
          "Write planRelease(input: unknown) and your types from scratch. Input must be an array. Each ticket is a non-null non-array object with a nonblank string id and literal status 'ready' or 'blocked'. Ready tickets require points: a nonnegative safe integer; blocked tickets require a nonblank string reason. Trim ids/reasons; ids must be unique after trimming. Reject malformed rows, duplicate ids, or a total exceeding Number.MAX_SAFE_INTEGER with exactly { ok: false, error: 'Invalid release' }; return no partial data. On success return { ok: true, readyIds: string[], blocked: { id: string, reason: string }[], totalPoints: number }. Preserve input order within each output collection; sum only ready points. Empty input succeeds with empty arrays and zero. Ignore fields irrelevant to a ticket's status and all extra fields. Do not mutate inputs. Model tickets and results as discriminated unions and use exhaustive handling for trusted ticket states.",
        starter: "// Design your domain types, validation and planRelease(input: unknown).\n",
        hint: "Validate each row into a Ticket union, then switch on status. A Set catches duplicate trimmed ids. Check Number.isSafeInteger on each points value and on the running total. Keep all output local until success.",
        solution: `type Ticket =
  | { id: string; status: "ready"; points: number }
  | { id: string; status: "blocked"; reason: string };
type ReleaseResult =
  | { ok: true; readyIds: string[]; blocked: { id: string; reason: string }[]; totalPoints: number }
  | { ok: false; error: "Invalid release" };

function parseTicket(value: unknown): Ticket | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value) ||
      !("id" in value) || typeof value.id !== "string" || !value.id.trim() ||
      !("status" in value)) return undefined;
  const id = value.id.trim();
  if (value.status === "ready" && "points" in value &&
      typeof value.points === "number" && Number.isSafeInteger(value.points) && value.points >= 0) {
    return { id, status: "ready", points: value.points };
  }
  if (value.status === "blocked" && "reason" in value &&
      typeof value.reason === "string" && value.reason.trim()) {
    return { id, status: "blocked", reason: value.reason.trim() };
  }
  return undefined;
}

function planRelease(input: unknown): ReleaseResult {
  const failure: ReleaseResult = { ok: false, error: "Invalid release" };
  if (!Array.isArray(input)) return failure;
  const seen = new Set<string>();
  const readyIds: string[] = [];
  const blocked: { id: string; reason: string }[] = [];
  let totalPoints = 0;
  for (const value of input) {
    const ticket = parseTicket(value);
    if (!ticket || seen.has(ticket.id)) return failure;
    seen.add(ticket.id);
    switch (ticket.status) {
      case "ready":
        totalPoints += ticket.points;
        if (!Number.isSafeInteger(totalPoints)) return failure;
        readyIds.push(ticket.id);
        break;
      case "blocked":
        blocked.push({ id: ticket.id, reason: ticket.reason });
        break;
      default: {
        const exhaustive: never = ticket;
        return exhaustive;
      }
    }
  }
  return { ok: true, readyIds, blocked, totalPoints };
}`,
        tests: [
          {
            name: "Plans mixed tickets in input order",
            expression:
              '(() => { const r = planRelease([{ id: " r2 ", status: "ready", points: 3 }, { id: " b2 ", status: "blocked", reason: " QA " }, { id: "r1", status: "ready", points: 2 }, { id: "b1", status: "blocked", reason: "Review" }]); return r.ok === true && r.totalPoints === 5 && JSON.stringify(r.readyIds) === \'["r2","r1"]\' && JSON.stringify(r.blocked.map(b => [b.id, b.reason])) === \'[["b2","QA"],["b1","Review"]]\'; })()',
          },
          {
            name: "Handles an empty release",
            expression:
              "(() => { const r = planRelease([]); return r.ok === true && r.totalPoints === 0 && Array.isArray(r.readyIds) && r.readyIds.length === 0 && Array.isArray(r.blocked) && r.blocked.length === 0; })()",
          },
          {
            name: "Allows zero and ignores irrelevant fields",
            expression:
              '(() => { const r = planRelease([{ id: "a", status: "ready", points: 0, reason: null }, { id: "b", status: "blocked", reason: "Wait", points: -1 }]); return r.ok === true && r.totalPoints === 0 && JSON.stringify(r.readyIds) === \'["a"]\' && r.blocked.length === 1 && r.blocked[0].id === "b" && r.blocked[0].reason === "Wait"; })()',
          },
          {
            name: "Rejects invalid containers and rows",
            expression:
              '[null, {}, "[]", [null], [[]], [{}], [{ id: " ", status: "ready", points: 1 }], [{ id: "a", status: "other" }]].every(x => { const r = planRelease(x); return r.ok === false && r.error === "Invalid release" && Object.keys(r).length === 2; })',
          },
          {
            name: "Rejects invalid ready points",
            expression:
              '[-1, 1.5, NaN, Infinity, "3", undefined, Number.MAX_SAFE_INTEGER + 1].every(points => !planRelease([{ id: "a", status: "ready", points }]).ok)',
          },
          {
            name: "Requires a blocked reason",
            expression:
              '[undefined, null, 2, "", "  "].every(reason => !planRelease([{ id: "a", status: "blocked", reason }]).ok)',
          },
          {
            name: "Rejects duplicate normalized ids across states",
            expression:
              '(() => { const r = planRelease([{ id: "a", status: "ready", points: 1 }, { id: " a ", status: "blocked", reason: "Wait" }]); return r.ok === false && r.error === "Invalid release" && Object.keys(r).length === 2; })()',
          },
          {
            name: "Rejects overflow but accepts the safe limit",
            expression:
              'planRelease([{ id: "a", status: "ready", points: Number.MAX_SAFE_INTEGER }]).ok && !planRelease([{ id: "a", status: "ready", points: Number.MAX_SAFE_INTEGER }, { id: "b", status: "ready", points: 1 }]).ok',
          },
          {
            name: "Returns no partial summary on a late failure",
            expression:
              '(() => { const r = planRelease([{ id: "a", status: "ready", points: 1 }, {}]); return r.ok === false && r.error === "Invalid release" && Object.keys(r).length === 2; })()',
          },
          {
            name: "Handles frozen input and special ids",
            expression:
              '(() => { const row = Object.freeze({ id: " __proto__ ", status: "blocked", reason: " Hold ", extra: true }); const result = planRelease(Object.freeze([row])); return result.ok === true && result.totalPoints === 0 && result.readyIds.length === 0 && result.blocked.length === 1 && result.blocked[0].id === "__proto__" && result.blocked[0].reason === "Hold" && Object.keys(result.blocked[0]).length === 2 && row.id === " __proto__ "; })()',
          },
        ],
      },
      {
        kind: "callout",
        body: "Before considering the project complete, use the local strict compiler config. Add an expected-error example for a ready Ticket without points and for reading totalPoints before narrowing ReleaseResult. Extend your runtime examples with an all-blocked release. Then explain why a type assertion cannot replace parseTicket and how you would add a third status without silently skipping it.",
      },
    ],
  },
  "ts-core.annotate": {
    summary:
      "Let TypeScript infer the obvious types, annotate important boundaries, and describe object shapes without duplicating information.",
    xp: 100,
    blocks: [
      {
        kind: "callout",
        body: "Prerequisites: JavaScript functions, objects, arrays and promises; React basics for the props lesson. Predict each recall answer, then solve the challenge before opening its hint. The exercise runner strips types and checks behavior; it does not run the type checker. For static feedback, copy your code into a local TypeScript project and run `tsc --noEmit` as taught in the compiler lesson. No imports or JSX are needed in these exercises.",
      },
      {
        kind: "text",
        body: "TypeScript is JavaScript plus a static type checker. The checker studies your code before it runs and points out operations that do not fit the types it knows. The types disappear from the JavaScript you ship, so they prevent mistakes during development rather than validating live user data at runtime.",
      },
      {
        kind: "code",
        language: "typescript",
        caption: "Inference handles local values; annotations document boundaries",
        code: `const taxRate = 0.13; // inferred as number

function total(price: number, quantity: number): number {
  return price * quantity * (1 + taxRate);
}

const amount = total(20, 2); // amount is inferred as number`,
      },
      {
        kind: "text",
        body: "**Use inference when the answer is obvious.** Writing `const count: number = 3` repeats what `3` already says. Add annotations at boundaries: function parameters, public return values, API data after validation, component props, and empty collections whose contents cannot be inferred. Hovering a value in a TypeScript-aware editor shows what the compiler inferred.",
      },
      {
        kind: "code",
        language: "typescript",
        caption: "An interface describes the shape an object must have",
        code: `interface User {
  readonly id: string;
  name: string;
  nickname?: string;
}

function displayName(user: User): string {
  return user.nickname ?? user.name;
}

displayName({ id: "u1", name: "Mina" }); // "Mina"`,
      },
      {
        kind: "callout",
        body: "`any` turns checking off and lets mistakes spread. When a value really is unknown—JSON, local storage, a message from another system—start with `unknown`, check what it is, and only then use it.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: 'What type does TypeScript infer for `const names = ["Ada", "Lin"]`?',
        options: ["`string[]`", "`any[]`", "`[string, string]`", "`unknown[]`"],
        answer: 0,
        explanation:
          "Both elements are strings, so the best common type is string and the array is inferred as string[]. It is not a fixed-length tuple unless you ask for one.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Where is an explicit annotation most useful?",
        options: [
          "Every local constant, including `const open: boolean = true`",
          "A function parameter that enters your code from another part of the app",
          "Only after TypeScript reports an error",
          "Nowhere—TypeScript can always infer intent",
        ],
        answer: 1,
        explanation:
          "Parameters and other boundaries do not carry a value TypeScript can inspect when the function is declared. Their annotations document and enforce the contract.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Annotate an empty array that will contain numbers.",
        before: "const scores: ",
        after: " = [];",
        answer: "number[]",
        accept: ["Array<number>"],
        explanation:
          "An empty array has no elements to infer from, so number[] (or Array<number>) states what may be added later.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Describe an invoice boundary",
        prompt:
          "Define Invoice with a readonly string id, numeric subtotal and optional numeric discount. Implement invoiceTotal(invoice: Invoice): number. Missing discount means zero; subtract it from subtotal and clamp the result to zero. Do not mutate the invoice. Values are already validated finite nonnegative numbers at this internal boundary.",
        language: "typescript",
        starter: `// Define Invoice above the function.
function invoiceTotal(invoice: Invoice): number {
  return -1;
}`,
        hint: "Use an optional property for discount and ?? for its default. Math.max clamps the amount.",
        solution: `interface Invoice {
  readonly id: string;
  subtotal: number;
  discount?: number;
}
function invoiceTotal(invoice: Invoice): number {
  return Math.max(0, invoice.subtotal - (invoice.discount ?? 0));
}`,
        tests: [
          {
            name: "Defaults a missing discount",
            expression: 'invoiceTotal({ id: "a", subtotal: 30 }) === 30',
          },
          {
            name: "Applies a discount",
            expression: 'invoiceTotal({ id: "b", subtotal: 30, discount: 8 }) === 22',
          },
          {
            name: "Preserves zero",
            expression: 'invoiceTotal({ id: "c", subtotal: 0, discount: 0 }) === 0',
          },
          {
            name: "Clamps over-discounted totals",
            expression: 'invoiceTotal({ id: "d", subtotal: 5, discount: 8 }) === 0',
          },
          {
            name: "Leaves input intact",
            expression:
              '(() => { const x = Object.freeze({ id: "e", subtotal: 12, discount: 2 }); return invoiceTotal(x) === 10 && x.discount === 2; })()',
          },
        ],
      },
    ],
  },

  "ts-core.unions": {
    summary:
      "Model values that can take several valid shapes, then narrow them before using shape-specific properties.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "A **union** says a value may be one of several types: `string | number`. You can only use operations that are safe for every member until a runtime check narrows the union. `typeof`, equality checks, `Array.isArray`, the `in` operator and discriminant fields are common narrowing tools.",
      },
      {
        kind: "code",
        language: "typescript",
        caption: "A runtime check narrows a union",
        code: `function formatId(id: string | number): string {
  if (typeof id === "number") {
    return id.toString().padStart(6, "0"); // id is number here
  }
  return id.toUpperCase(); // id is string here
}`,
      },
      {
        kind: "text",
        body: "For related object shapes, give every member the same literal **discriminant** such as `status` or `kind`. A `switch` on that field makes impossible combinations unrepresentable: a declined payment has a reason, a successful payment has a receipt, and neither needs a pile of optional properties.",
      },
      {
        kind: "code",
        language: "typescript",
        caption: "A discriminated union models real states",
        code: `type Result =
  | { status: "success"; value: string }
  | { status: "error"; message: string };

function read(result: Result): string {
  switch (result.status) {
    case "success": return result.value;
    case "error": return result.message;
  }
}`,
      },
      {
        kind: "callout",
        body: "A type assertion such as `value as string` does not check anything at runtime. Narrow with evidence whenever possible; use assertions only when you genuinely know something the compiler cannot see.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Why can't you call `.toUpperCase()` immediately on a `string | number`?",
        options: [
          "The value could be a number, which has no string method called `toUpperCase`",
          "Union types cannot be passed to functions",
          "TypeScript does not support string methods",
          "A union always becomes `any` at runtime",
        ],
        answer: 0,
        explanation:
          "Before narrowing, TypeScript permits only operations shared by every union member. A typeof check can prove which branch you have.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Render every payment state",
        prompt:
          "Complete `paymentMessage`. Narrow the discriminated union with `status`: success returns `Paid $AMOUNT · receipt RECEIPT`, declined returns `Declined · REASON`, and pending returns `Payment pending`. Keep the exhaustive `never` check so a future state cannot be silently forgotten. The editor runs transpiled TypeScript tests; in a real project, `tsc` or your IDE performs the compile-time check.",
        language: "typescript",
        starter: `type PaymentResult =
  | { status: "success"; amount: number; receipt: string }
  | { status: "declined"; reason: string }
  | { status: "pending" };

function paymentMessage(result: PaymentResult): string {
  // Narrow result by its status and return the requested message.
  return "TODO";
}`,
        hint: "Use a `switch (result.status)`. Each case exposes only the properties on that member. After all three cases, assign `result` to a `never` variable.",
        solution: `type PaymentResult =
  | { status: "success"; amount: number; receipt: string }
  | { status: "declined"; reason: string }
  | { status: "pending" };

function paymentMessage(result: PaymentResult): string {
  switch (result.status) {
    case "success":
      return \`Paid $\${result.amount} · receipt \${result.receipt}\`;
    case "declined":
      return \`Declined · \${result.reason}\`;
    case "pending":
      return "Payment pending";
    default: {
      const exhaustive: never = result;
      return exhaustive;
    }
  }
}`,
        tests: [
          {
            name: "Formats a successful payment",
            expression:
              'paymentMessage({ status: "success", amount: 48, receipt: "R-17" }) === "Paid $48 · receipt R-17"',
          },
          {
            name: "Explains a declined payment",
            expression:
              'paymentMessage({ status: "declined", reason: "Card expired" }) === "Declined · Card expired"',
          },
          {
            name: "Handles a pending payment",
            expression: 'paymentMessage({ status: "pending" }) === "Payment pending"',
          },
          {
            name: "Preserves zero amounts",
            expression:
              'paymentMessage({ status: "success", amount: 0, receipt: "FREE" }) === "Paid $0 · receipt FREE"',
          },
          {
            name: "Uses the supplied reason",
            expression:
              'paymentMessage({ status: "declined", reason: "Limit exceeded" }) === "Declined · Limit exceeded"',
          },
        ],
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the type that proves every union member has been handled.",
        before: "const exhaustive: ",
        after: " = result;",
        answer: "never",
        explanation:
          "After every member returns, no possible value remains. Adding a member makes this assignment fail in the type checker until you handle it.",
      },
    ],
  },

  "ts-apps.props": {
    summary:
      "Treat component props as a small public API: require what the component needs and make variability explicit.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: 'React props are ordinary function inputs, so give them a type that describes the component\'s contract. Required props have no `?`; optional props do. Prefer precise choices such as `tone: "success" | "warning"` over a free-form string when only a few values make sense.',
      },
      {
        kind: "code",
        language: "tsx",
        caption: "A small, explicit props contract",
        code: `type NoticeProps = {
  title: string;
  tone?: "info" | "warning";
  onDismiss?: () => void;
};

function Notice({ title, tone = "info", onDismiss }: NoticeProps) {
  return (
    <section data-tone={tone}>
      <strong>{title}</strong>
      {onDismiss ? <button onClick={onDismiss}>Dismiss</button> : null}
    </section>
  );
}`,
      },
      {
        kind: "text",
        body: "Type event callbacks by what the component promises, not by a vague `Function`. `onSelect: (id: string) => void` tells both sides exactly what travels through the callback. For rendered children, use `React.ReactNode`; for a callback that returns UI, type the callback itself. Derive related props from existing data types with indexed access or utility types instead of copying shapes that can drift.",
      },
      {
        kind: "code",
        language: "typescript",
        caption: "Derive a prop type from the source model",
        code: `interface Product {
  id: string;
  name: string;
  price: number;
  internalCost: number;
}

type ProductCardProps = {
  product: Pick<Product, "id" | "name" | "price">;
  onSelect: (id: Product["id"]) => void;
};`,
      },
      {
        kind: "callout",
        body: "Do not mark every prop optional just to silence errors. That pushes missing-data handling into the component and hides broken call sites. Make a prop optional only when the component has a real, tested behaviour without it.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which callback prop gives callers the clearest contract?",
        options: [
          "`onSave: Function`",
          "`onSave: any`",
          "`onSave: (draftId: string) => Promise<void>`",
          "`onSave?: object`",
        ],
        answer: 2,
        explanation:
          "The explicit function type says what argument the component supplies and that saving is asynchronous. Function and any discard that information.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "When should a prop be optional?",
        options: [
          "Whenever a call site currently forgets it",
          "When the component has a meaningful behaviour or default without it",
          "Whenever its value might be an empty string",
          "All props should be optional in reusable components",
        ],
        answer: 1,
        explanation:
          "Optional means absence is part of the supported contract. A missing required value should remain a type error rather than being hidden.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the callback type for a component that reports a selected product id.",
        before: "type Props = { onSelect: ",
        after: " };",
        answer: "(id: string) => void",
        accept: ["(productId: string) => void"],
        explanation:
          "The parameter name is documentation; its string type and void return are the contract TypeScript checks.",
      },
      {
        kind: "text",
        body: "Some props vary together. A selectable row can be `{ mode: 'select'; onSelect: (id: string) => void }` or `{ mode: 'read'; onSelect?: never }`. Narrow using `props.mode` before calling the callback. The interaction helper below uses the same contract as a React component, without requiring JSX. A void callback means its caller ignores the return value; it does not prevent an implementation from returning a value.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "A component interaction contract",
        prompt:
          "Define RowProps as a discriminated union: both modes have id: string; read mode forbids onSelect; select mode requires onSelect: (id: string) => void and permits disabled?: boolean. Implement activateRow(props): boolean. Only enabled select rows call onSelect once with their id and return true. Read or disabled rows return false. Test this interaction contract without JSX, then use the same union for a React component's props.",
        language: "typescript",
        starter: `// Define RowProps and implement the interaction.
function activateRow(props: RowProps): boolean {
  return false;
}`,
        hint: "Narrow mode first, then check disabled. Use onSelect?: never on the read member.",
        solution: `type RowProps =
  | { id: string; mode: "read"; onSelect?: never }
  | { id: string; mode: "select"; disabled?: boolean; onSelect: (id: string) => void };
function activateRow(props: RowProps): boolean {
  if (props.mode === "read" || props.disabled) return false;
  props.onSelect(props.id);
  return true;
}`,
        tests: [
          {
            name: "Read rows are inert",
            expression: 'activateRow({ id: "a", mode: "read" }) === false',
          },
          {
            name: "Reports the id exactly once",
            expression:
              '(() => { const ids = []; const result = activateRow({ id: "b", mode: "select", onSelect: id => ids.push(id) }); return result === true && JSON.stringify(ids) === \'["b"]\'; })()',
          },
          {
            name: "Disabled rows never call back",
            expression:
              'activateRow({ id: "c", mode: "select", disabled: true, onSelect: () => { throw new Error("disabled"); } }) === false',
          },
          {
            name: "Explicit false enables interaction",
            expression:
              '(() => { let calls = 0; return activateRow({ id: "d", mode: "select", disabled: false, onSelect: () => calls++ }) && calls === 1; })()',
          },
          {
            name: "Does not mutate props",
            expression:
              'activateRow(Object.freeze({ id: "e", mode: "select", onSelect: () => {} })) === true',
          },
        ],
      },
    ],
  },

  "ts-apps.generics": {
    summary:
      "Use generics to preserve relationships between inputs and outputs, adding constraints only for operations the implementation needs.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: "A generic type parameter is a placeholder chosen by the caller. It is useful when types are related: `first<T>(items: T[]): T | undefined` says the result is the same element type as the array. Replacing `T` with `any` loses that relationship; writing separate string and number versions duplicates the function.",
      },
      {
        kind: "code",
        language: "typescript",
        caption: "The caller's input determines T",
        code: `function first<T>(items: T[]): T | undefined {
  return items[0];
}

const name = first(["Ada", "Lin"]); // string | undefined
const score = first([8, 13]);        // number | undefined`,
      },
      {
        kind: "text",
        body: "Inside a generic function, TypeScript lets you use only members known to exist on every possible `T`. Add a constraint when the algorithm genuinely needs a capability: `T extends { id: string }` lets you read `item.id` while preserving every other field on the original item.",
      },
      {
        kind: "code",
        language: "typescript",
        caption: "A constraint states the minimum required shape",
        code: `function byId<T extends { id: string }>(items: readonly T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

const users = byId([{ id: "u1", name: "Ada" }]);
users.get("u1")?.name; // extra fields survive; missing keys are explicit`,
      },
      {
        kind: "callout",
        body: "A generic should express a relationship. If a type parameter appears only once, a normal concrete type or `unknown` is often clearer. Start with the simplest signature and introduce `T` when callers need information preserved.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "Why is `function first<T>(items: T[]): T | undefined` better than returning `any`?",
        options: [
          "It preserves the array's element type in the return value",
          "It makes the function run faster",
          "It guarantees the array is never empty",
          "It converts every element to the same runtime class",
        ],
        answer: 0,
        explanation:
          "Generics carry type information through the call. The undefined remains because an empty array has no first item.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Constrain T to objects with string ids without losing other fields.",
        before: "function identify<T ",
        after: " { id: string }>(item: T): string { return item.id; }",
        answer: "extends",
        explanation:
          "The constraint guarantees id while leaving the rest of T specific to each caller.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Keep API data type-safe",
        prompt:
          "Implement three reusable helpers. `unwrapOr` returns successful data or its fallback, including falsy data. `first` returns the first element without losing its type. `indexBy` returns an object keyed by string ids while preserving every item field. Last duplicate id wins; support arbitrary ids including __proto__. Do not mutate inputs. Enable noUncheckedIndexedAccess in production when reading arbitrary Record keys.",
        language: "typescript",
        starter: `type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function unwrapOr<T>(result: ApiResult<T>, fallback: T): T {
  return fallback;
}

function first<T>(items: T[]): T | undefined {
  return undefined;
}

function indexBy<T extends { id: string }>(items: T[]): Record<string, T> {
  return {};
}`,
        hint: "Narrow result with result.ok. Index the array for first. Object.fromEntries builds own properties safely even for special string keys.",
        solution: `type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function unwrapOr<T>(result: ApiResult<T>, fallback: T): T {
  return result.ok ? result.data : fallback;
}

function first<T>(items: T[]): T | undefined {
  return items[0];
}

function indexBy<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map(item => [item.id, item]));
}`,
        tests: [
          {
            name: "Returns successful API data",
            expression: 'unwrapOr({ ok: true, data: "saved" }, "draft") === "saved"',
          },
          {
            name: "Uses the fallback after an API failure",
            expression: 'unwrapOr({ ok: false, error: "offline" }, "draft") === "draft"',
          },
          {
            name: "Returns the first value, including a falsy zero",
            expression: "first([0, 1, 2]) === 0 && first([]) === undefined",
          },
          {
            name: "Indexes full objects by id",
            expression:
              'indexBy([{ id: "u1", name: "Ada" }, { id: "u2", name: "Lin" }]).u2.name === "Lin"',
          },
          {
            name: "Preserves falsy success",
            expression:
              "unwrapOr({ ok: true, data: 0 }, 9) === 0 && unwrapOr({ ok: true, data: false }, true) === false",
          },
          {
            name: "Last duplicate wins without mutation",
            expression:
              '(() => { const items = Object.freeze([Object.freeze({ id: "a", n: 1 }), Object.freeze({ id: "a", n: 2 })]); return indexBy(items).a === items[1]; })()',
          },
          {
            name: "Handles empty and special keys",
            expression:
              'Object.keys(indexBy([])).length === 0 && Object.hasOwn(indexBy([{ id: "__proto__", n: 3 }]), "__proto__") && indexBy([{ id: "__proto__", n: 3 }])["__proto__"].n === 3',
          },
        ],
      },
    ],
  },
};
