/** Only same-origin app destinations, never an auth loop or a protocol-relative URL. */
export function safeReturnTo(value: unknown): string {
  // Control characters are exactly what this is screening for: a newline or
  // NUL smuggled into the destination is how a redirect gets split.
  // eslint-disable-next-line no-control-regex
  const unsafe = /[\\\s\u0000-\u001f]/;
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    unsafe.test(value) ||
    value.startsWith("//")
  )
    return "/dashboard";
  try {
    const url = new URL(value, "https://ascent.invalid");
    if (
      url.origin !== "https://ascent.invalid" ||
      /^\/(auth|reset-password|onboarding)(\/|$)/.test(url.pathname)
    )
      return "/dashboard";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/dashboard";
  }
}

/**
 * Did this page load land here from an auth callback?
 *
 * The flag survives a round trip through the URL, and the URL is parsed by
 * TanStack Router's default `JSON.parse` search parser — so `?complete=1`
 * arrives as the number `1`, not the string `"1"`. A check that accepted only
 * `true` and `"1"` therefore read every real callback as false, coerced it back
 * into the URL as `complete=false`, and left a signed-in learner sitting on the
 * login page. Accept every shape the flag can arrive in, including the `"1"`
 * still sitting in already-delivered confirmation emails.
 */
export function isAuthCallback(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}
