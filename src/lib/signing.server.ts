/**
 * HMAC-SHA256 helpers for anything the server hands out and later has to trust
 * back: certificate signatures, unsubscribe links.
 *
 * Web Crypto rather than node:crypto — this runs on the Cloudflare worker
 * target. Server-only: it reads the signing secret. Import with
 * `await import(...)` inside a handler.
 */

function secret(): string {
  const key = process.env["CERTIFICATE_SIGNING_SECRET"] || process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!key) {
    // Falling back to a random per-process key would make every signature
    // unverifiable after a restart, which is worse than refusing.
    throw new Error(
      "No signing secret: set CERTIFICATE_SIGNING_SECRET (or SUPABASE_SERVICE_ROLE_KEY) in .env.",
    );
  }
  return key;
}

const encoder = new TextEncoder();

async function hmac(payload: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", key, encoder.encode(payload));
}

/** Uppercase base32-ish, no ambiguous characters — this ends up printed on paper. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export async function signToken(payload: string, length = 12): Promise<string> {
  const bytes = new Uint8Array(await hmac(payload));
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

/** Constant-time: a verifier that leaks position tells an attacker where to guess. */
export async function verifyToken(payload: string, token: string): Promise<boolean> {
  const expected = await signToken(payload, token.length);
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

/** The exact string a certificate's signature covers. Never change it casually. */
export const certificatePayload = (input: {
  certificateId: string;
  userId: string;
  pathId: string;
  issuedAt: string;
}) => `certificate:${input.certificateId}:${input.userId}:${input.pathId}:${input.issuedAt}`;

export const unsubscribePayload = (userId: string) => `unsubscribe:${userId}`;
