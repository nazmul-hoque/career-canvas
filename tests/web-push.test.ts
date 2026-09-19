import { describe, expect, test } from "bun:test";

import {
  base64UrlDecode,
  base64UrlEncode,
  encryptPushPayload,
  vapidAuthorization,
} from "../src/lib/web-push.server";

// RFC 8291 §5 and Appendix A, copied from the RFC text (whitespace removed).
const RFC = {
  plaintext: "When I grow up, I want to be a watermelon",
  asPublic:
    "BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8",
  asPrivate: "yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw",
  uaPublic:
    "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4",
  salt: "DGv6ra1nlYgDCS1FRnbzlw",
  authSecret: "BTBZMqHH6r4Tts7J_aSIgg",
  header:
    "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8",
  ciphertext: "8pfeW0KbunFT06SuDKoJH9Ql87S1QUrdirN6GcG7sFz1y1sqLgVi1VhjVkHsUoEsbI_0LpXMuGvnzQ",
};

describe("base64url", () => {
  test("round-trips arbitrary bytes without padding", () => {
    const bytes = new Uint8Array([0, 255, 62, 63, 250, 1, 2]);
    const encoded = base64UrlEncode(bytes);
    expect(encoded).not.toMatch(/[+/=]/);
    expect([...base64UrlDecode(encoded)]).toEqual([...bytes]);
  });
});

describe("encryptPushPayload", () => {
  test("reproduces the RFC 8291 worked example byte for byte", async () => {
    const body = await encryptPushPayload({
      plaintext: new TextEncoder().encode(RFC.plaintext),
      subscription: { p256dh: RFC.uaPublic, auth: RFC.authSecret },
      salt: base64UrlDecode(RFC.salt),
      senderKeys: {
        publicKey: base64UrlDecode(RFC.asPublic),
        privateKey: base64UrlDecode(RFC.asPrivate),
      },
    });

    const header = base64UrlDecode(RFC.header);
    expect(header.length).toBe(86);
    expect(base64UrlEncode(body.slice(0, 86))).toBe(RFC.header);
    expect(base64UrlEncode(body.slice(86))).toBe(RFC.ciphertext);
  });

  test("uses a fresh salt and sender key for every message", async () => {
    const args = {
      plaintext: new TextEncoder().encode("same message"),
      subscription: { p256dh: RFC.uaPublic, auth: RFC.authSecret },
    };
    const a = await encryptPushPayload(args);
    const b = await encryptPushPayload(args);
    expect(base64UrlEncode(a)).not.toBe(base64UrlEncode(b));
    expect(a.length).toBe(b.length);
  });
});

describe("vapidAuthorization", () => {
  test("signs an ES256 JWT for the push service origin that the public key verifies", async () => {
    const now = Date.UTC(2026, 8, 17, 12);
    const header = await vapidAuthorization(
      "https://fcm.googleapis.com/fcm/send/abc123",
      { publicKey: RFC.asPublic, privateKey: RFC.asPrivate, subject: "mailto:ops@example.com" },
      now,
    );

    const match = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(header);
    expect(match).not.toBeNull();
    const [, jwtHeader, claims, signature, k] = match!;
    expect(k).toBe(RFC.asPublic);

    const decoded = JSON.parse(new TextDecoder().decode(base64UrlDecode(claims!)));
    expect(decoded.aud).toBe("https://fcm.googleapis.com");
    expect(decoded.sub).toBe("mailto:ops@example.com");
    expect(decoded.exp - now / 1000).toBeLessThanOrEqual(24 * 60 * 60);

    const key = await crypto.subtle.importKey(
      "raw",
      base64UrlDecode(RFC.asPublic),
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      base64UrlDecode(signature!),
      new TextEncoder().encode(`${jwtHeader}.${claims}`),
    );
    expect(valid).toBe(true);
  });
});
