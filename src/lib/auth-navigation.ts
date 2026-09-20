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
