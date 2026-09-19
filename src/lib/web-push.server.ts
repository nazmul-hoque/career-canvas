/**
 * Web Push, written against the specs rather than the `web-push` package.
 *
 * That package leans on node:crypto, and this app builds for a Cloudflare
 * worker, so the two pieces a push server needs are done here in Web Crypto:
 *
 *   RFC 8291  message encryption (aes128gcm) — the push service relays bytes it
 *             cannot read; only the subscribed browser holds the key
 *   RFC 8292  VAPID — a signed JWT that proves the push came from us
 *
 * The encryption is checked byte-for-byte against the RFC 8291 worked example
 * in tests/web-push.test.ts.
 *
 * Config (server-only except the public key, which the browser needs to subscribe):
 *   VAPID_PUBLIC_KEY / VITE_VAPID_PUBLIC_KEY   base64url, uncompressed P-256 point
 *   VAPID_PRIVATE_KEY                          base64url, the 32-byte private scalar
 *   VAPID_SUBJECT                              mailto: or https: contact for push services
 * Generate a pair with `bun run push:keys`.
 */

export interface PushSubscriptionKeys {
  endpoint: string;
  /** base64url, the browser's P-256 public key. */
  p256dh: string;
  /** base64url, the 16-byte auth secret. */
  auth: string;
}

export interface PushMessage {
  title: string;
  body: string;
  /** Opened when the notification is clicked. */
  url: string;
  /** Notifications with the same tag replace each other instead of stacking. */
  tag?: string | undefined;
}

export interface PushOutcome {
  delivered: boolean;
  /** The subscription is dead (unsubscribed, permission revoked) — delete it. */
  gone: boolean;
  status: number | null;
  error: string | null;
}

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

const encoder = new TextEncoder();

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  const clean = value.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(clean + "=".repeat((4 - (clean.length % 4)) % 4));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

async function hmac(key: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, data));
}

/** A private scalar plus its public point, as the JWK Web Crypto wants. */
function privateJwk(publicKey: Uint8Array, privateKey: Uint8Array): JsonWebKey {
  if (publicKey.length !== 65 || publicKey[0] !== 0x04) {
    throw new Error("VAPID public key must be an uncompressed P-256 point (65 bytes).");
  }
  return {
    kty: "EC",
    crv: "P-256",
    x: base64UrlEncode(publicKey.slice(1, 33)),
    y: base64UrlEncode(publicKey.slice(33, 65)),
    d: base64UrlEncode(privateKey),
    ext: true,
  };
}

/** Record size advertised in the header; one record is all a push message ever needs. */
const RECORD_SIZE = 4096;

/**
 * RFC 8291 §3.4 + RFC 8188. `salt` and `senderKeys` are injectable only so the
 * RFC's worked example can be reproduced; in production both are fresh per message.
 */
export async function encryptPushPayload(input: {
  plaintext: Uint8Array;
  subscription: Pick<PushSubscriptionKeys, "p256dh" | "auth">;
  salt?: Uint8Array | undefined;
  senderKeys?: { publicKey: Uint8Array; privateKey: Uint8Array } | undefined;
}): Promise<Uint8Array<ArrayBuffer>> {
  const uaPublic = base64UrlDecode(input.subscription.p256dh);
  const authSecret = base64UrlDecode(input.subscription.auth);
  const salt = input.salt ? new Uint8Array(input.salt) : crypto.getRandomValues(new Uint8Array(16));

  let asPublic: Uint8Array<ArrayBuffer>;
  let asPrivate: CryptoKey;
  if (input.senderKeys) {
    asPublic = new Uint8Array(input.senderKeys.publicKey);
    asPrivate = await crypto.subtle.importKey(
      "jwk",
      privateJwk(input.senderKeys.publicKey, input.senderKeys.privateKey),
      { name: "ECDH", namedCurve: "P-256" },
      false,
      ["deriveBits"],
    );
  } else {
    const pair = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
      "deriveBits",
    ])) as CryptoKeyPair;
    asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
    asPrivate = pair.privateKey;
  }

  const uaKey = await crypto.subtle.importKey(
    "raw",
    uaPublic,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asPrivate, 256),
  );

  const one = new Uint8Array([1]);
  const keyInfo = concat(encoder.encode("WebPush: info\0"), uaPublic, asPublic);
  const prkKey = await hmac(authSecret, ecdhSecret);
  const ikm = await hmac(prkKey, concat(keyInfo, one));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, concat(encoder.encode("Content-Encoding: aes128gcm\0"), one))).slice(
    0,
    16,
  );
  const nonce = (await hmac(prk, concat(encoder.encode("Content-Encoding: nonce\0"), one))).slice(
    0,
    12,
  );

  const header = new Uint8Array(21 + asPublic.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, RECORD_SIZE);
  header[20] = asPublic.length;
  header.set(asPublic, 21);

  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  // 0x02 marks the last (and only) record; no further padding.
  const padded = concat(input.plaintext, new Uint8Array([2]));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, padded),
  );

  return concat(header, ciphertext);
}

/** RFC 8292: `vapid t=<ES256 JWT>, k=<public key>`, scoped to the push service's origin. */
export async function vapidAuthorization(
  endpoint: string,
  config: VapidConfig,
  now = Date.now(),
): Promise<string> {
  const jwtHeader = base64UrlEncode(encoder.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = base64UrlEncode(
    encoder.encode(
      JSON.stringify({
        aud: new URL(endpoint).origin,
        // Push services reject anything over 24h; 12h leaves room for clock skew.
        exp: Math.floor(now / 1000) + 12 * 60 * 60,
        sub: config.subject,
      }),
    ),
  );
  const signingInput = `${jwtHeader}.${claims}`;

  const key = await crypto.subtle.importKey(
    "jwk",
    privateJwk(base64UrlDecode(config.publicKey), base64UrlDecode(config.privateKey)),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  // Web Crypto already returns the raw r||s form JWS expects, not DER.
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, encoder.encode(signingInput)),
  );

  return `vapid t=${signingInput}.${base64UrlEncode(signature)}, k=${config.publicKey}`;
}

/** null when push isn't set up — callers skip the channel rather than failing. */
export function vapidConfig(): VapidConfig | null {
  const publicKey = process.env["VAPID_PUBLIC_KEY"] || process.env["VITE_VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  if (!publicKey || !privateKey) return null;
  const subject = process.env["VAPID_SUBJECT"];
  if (!subject) {
    throw new Error("VAPID keys are set but VAPID_SUBJECT is not (use mailto:you@example.com).");
  }
  return { publicKey, privateKey, subject };
}

export async function sendPush(
  subscription: PushSubscriptionKeys,
  message: PushMessage,
  config: VapidConfig,
): Promise<PushOutcome> {
  try {
    const body = await encryptPushPayload({
      plaintext: encoder.encode(JSON.stringify(message)),
      subscription,
    });
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        authorization: await vapidAuthorization(subscription.endpoint, config),
        "content-encoding": "aes128gcm",
        "content-type": "application/octet-stream",
        // A streak reminder that arrives tomorrow is wrong, not late.
        ttl: String(12 * 60 * 60),
        urgency: "normal",
      },
      body,
    });

    if (response.ok) return { delivered: true, gone: false, status: response.status, error: null };
    return {
      delivered: false,
      gone: response.status === 404 || response.status === 410,
      status: response.status,
      error: `Push service returned ${response.status}: ${await response.text()}`,
    };
  } catch (error) {
    // Like email: a failed send never takes the job down.
    return {
      delivered: false,
      gone: false,
      status: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
