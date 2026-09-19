/**
 * Outbound email, behind the same kind of seam as the mentor and payments.
 *
 *   EMAIL_PROVIDER=mock    (default) nothing is sent; the message is logged so
 *                          the whole re-engagement job can be exercised locally
 *   EMAIL_PROVIDER=resend  real delivery through Resend's HTTP API
 *
 * Server-only: reads the API key. No SDK — one POST is cheaper than a
 * dependency, and this has to run on the worker target.
 */

export type EmailProviderName = "mock" | "resend";

export function emailProvider(): EmailProviderName {
  const choice = (process.env["EMAIL_PROVIDER"] || "mock").toLowerCase();
  if (choice === "resend") return "resend";
  if (choice === "mock" || choice === "") return "mock";
  throw new Error(`Unknown EMAIL_PROVIDER "${choice}". Use mock or resend.`);
}

/** Where the app lives, for links inside emails. */
export function appUrl(): string {
  return (process.env["APP_URL"] || "http://localhost:5173").replace(/\/$/, "");
}

export interface OutboundEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** RFC 8058: one-click unsubscribe, so inbox providers trust the sender. */
  unsubscribeUrl?: string;
}

export interface SendOutcome {
  delivered: boolean;
  provider: EmailProviderName;
  id: string | null;
  error: string | null;
}

export async function sendEmail(email: OutboundEmail): Promise<SendOutcome> {
  const provider = emailProvider();

  if (provider === "mock") {
    console.info(
      `[email:mock] to=${email.to} subject=${JSON.stringify(email.subject)}\n${email.text}`,
    );
    return { delivered: true, provider, id: null, error: null };
  }

  const key = process.env["RESEND_API_KEY"];
  if (!key) throw new Error("EMAIL_PROVIDER=resend but RESEND_API_KEY is not set.");
  const from = process.env["EMAIL_FROM"];
  if (!from) throw new Error("EMAIL_PROVIDER=resend but EMAIL_FROM is not set.");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(email.unsubscribeUrl
          ? {
              headers: {
                "List-Unsubscribe": `<${email.unsubscribeUrl}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              },
            }
          : {}),
      }),
    });

    if (!response.ok) {
      return {
        delivered: false,
        provider,
        id: null,
        error: `Resend returned ${response.status}: ${await response.text()}`,
      };
    }

    const body = (await response.json()) as { id?: string };
    return { delivered: true, provider, id: body.id ?? null, error: null };
  } catch (error) {
    // A failed send must never take the job down — the next run retries it.
    return {
      delivered: false,
      provider,
      id: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
