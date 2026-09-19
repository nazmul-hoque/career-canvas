import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Public certificate verification.
 *
 * Deliberately unauthenticated: the point of a credential is that someone who
 * is not the learner — a recruiter, an interviewer — can check it. It returns
 * only what a certificate already displays: the holder's display name, the
 * path, and the issue date.
 *
 * Two independent facts are reported, because they answer different questions:
 *
 *   onRecord   — a row exists in issued_certificates. Only the service role can
 *                write that table, so this alone is proof the platform issued it.
 *   signatureOk — the stored HMAC still matches. This is what catches a doctored
 *                printout or a forged ID, and it survives being read offline.
 */

const verifySchema = z.object({
  certificateId: z
    .string()
    .trim()
    .min(6)
    .max(64)
    .regex(/^[A-Za-z0-9-]+$/, "Certificate IDs are letters, numbers and dashes."),
});

export interface CertificateVerification {
  certificateId: string;
  onRecord: boolean;
  signatureOk: boolean;
  holderName: string | null;
  pathId: string | null;
  pathName: string | null;
  issuedAt: string | null;
}

export const verifyCertificateFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => verifySchema.parse(input))
  .handler(async ({ data }): Promise<CertificateVerification> => {
    const certificateId = data.certificateId.toUpperCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { pathById } = await import("@/content/curriculum");

    const { data: row } = await supabaseAdmin
      .from("issued_certificates")
      .select("user_id, path_id, certificate_id, issued_at, signature")
      .eq("certificate_id", certificateId)
      .maybeSingle();

    const empty: CertificateVerification = {
      certificateId,
      onRecord: false,
      signatureOk: false,
      holderName: null,
      pathId: null,
      pathName: null,
      issuedAt: null,
    };

    if (!row) return empty;

    const record = row as {
      user_id: string;
      path_id: string;
      certificate_id: string;
      issued_at: string;
      signature: string | null;
    };

    const { certificatePayload, verifyToken } = await import("@/lib/signing.server");
    let signatureOk = false;
    if (record.signature) {
      signatureOk = await verifyToken(
        certificatePayload({
          certificateId: record.certificate_id,
          userId: record.user_id,
          pathId: record.path_id,
          issuedAt: record.issued_at,
        }),
        record.signature,
      ).catch(() => false);
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("id", record.user_id)
      .maybeSingle();

    return {
      certificateId: record.certificate_id,
      onRecord: true,
      signatureOk,
      holderName: (profile as { display_name: string } | null)?.display_name ?? null,
      pathId: record.path_id,
      pathName: pathById(record.path_id)?.name ?? null,
      issuedAt: record.issued_at,
    };
  });
