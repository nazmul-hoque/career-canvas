/**
 * Who runs Ascent, and the few legal facts more than one page states. The
 * Terms, Privacy Policy, footer, sign-up and checkout all read these, so a
 * refund window or minimum age can't say one thing in the Terms and another
 * where someone actually pays or signs up.
 */
export const COMPANY = {
  name: "Equawire Inc.",
  url: "https://equawire.com",
  region: "Ontario, Canada",
  email: "hello@equawire.com",
} as const;

/** When the Terms and Privacy Policy last changed. Update with any edit to either. */
export const LEGAL_UPDATED = "9 October 2026";

/** Full refund, no questions, within this many days of a purchase or renewal. */
export const REFUND_DAYS = 14;

/** Youngest age that may hold an account. */
export const MINIMUM_AGE = 16;
