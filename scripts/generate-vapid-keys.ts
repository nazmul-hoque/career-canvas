/**
 * Prints a fresh VAPID key pair for web push. Run once per deployment:
 *
 *   bun run push:keys
 *
 * Rotating the pair invalidates every existing browser subscription — learners
 * would have to turn push reminders on again — so keep the output somewhere safe.
 */
import { base64UrlEncode } from "../src/lib/web-push.server";

const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
  "sign",
  "verify",
])) as CryptoKeyPair;

const publicKey = base64UrlEncode(
  new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey)),
);
const { d } = await crypto.subtle.exportKey("jwk", pair.privateKey);

console.log(`VITE_VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${d}`);
console.log(`VAPID_SUBJECT=mailto:you@example.com`);
