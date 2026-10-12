import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { Wordmark } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { verifyCertificateFn } from "@/lib/certificates.functions";
import { formatCertificateDate } from "@/lib/certificates";

/**
 * Public, unauthenticated, server-rendered. A recruiter typing an ID from a CV
 * must get an answer without an account, and the answer must come from the
 * database rather than from anything the holder could have edited.
 */
export const Route = createFileRoute("/verify/$certificateId")({
  loader: ({ params }) =>
    verifyCertificateFn({ data: { certificateId: params.certificateId } }).catch(() => null),
  head: ({ params }) => ({
    meta: [
      { title: `Verify certificate ${params.certificateId} | Ascent` },
      {
        name: "description",
        content: `Check whether certificate ${params.certificateId} was issued by Ascent, who holds it, and when it was awarded.`,
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Certificate verification | Ascent" },
      {
        property: "og:description",
        content: "Check an Ascent certificate ID against the issuing record.",
      },
    ],
  }),
  component: Verify,
});

function Verify() {
  const result = Route.useLoaderData();
  const { certificateId } = Route.useParams();

  const valid = Boolean(result?.onRecord);
  const signature = result?.signatureOk ?? false;

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Link to="/">
          <Wordmark />
        </Link>

        <div className="card-surface mt-10 p-8 sm:p-10">
          <div
            className={
              valid
                ? "grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand"
                : "grid size-14 place-items-center rounded-2xl bg-secondary text-chalk"
            }
          >
            {valid ? (
              <BadgeCheck className="size-7" />
            ) : result === null ? (
              <ShieldAlert className="size-7" />
            ) : (
              <ShieldQuestion className="size-7" />
            )}
          </div>

          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {result === null
              ? "We couldn't check that right now"
              : valid
                ? "This certificate was issued by Ascent"
                : "No certificate with that ID"}
          </h1>

          <p className="mt-2 text-sm text-chalk">
            {result === null ? (
              <>
                The verification service didn't answer. That is a fault on our side, not a verdict
                on the certificate. Please try again in a moment.
              </>
            ) : valid ? (
              <>
                The issuing record is held by Ascent and can only be written by the platform itself.
                Here is what it says.
              </>
            ) : (
              <>
                Nothing has been issued under <span className="font-mono">{certificateId}</span>.
                Check for a typo (IDs look like <span className="font-mono">ASC-FRON-A1B2C3D</span>
                ), or ask the holder for the certificate link.
              </>
            )}
          </p>

          {valid && result ? (
            <dl className="mt-8 divide-y divide-border border-y border-border">
              <Row
                label="Certificate ID"
                value={<span className="font-mono">{result.certificateId}</span>}
              />
              <Row label="Awarded to" value={result.holderName ?? "—"} />
              <Row label="Career path" value={result.pathName ?? result.pathId ?? "—"} />
              <Row label="Issued" value={formatCertificateDate(result.issuedAt)} />
              <Row
                label="Signature"
                value={
                  signature ? (
                    <span className="font-semibold text-brand">Valid</span>
                  ) : (
                    <span className="font-semibold text-ember">Not confirmed</span>
                  )
                }
              />
            </dl>
          ) : null}

          {valid && !signature ? (
            <p className="mt-4 text-xs text-chalk">
              The issuing record is genuine, but its cryptographic signature could not be confirmed.
              This usually means the certificate predates signing or the signing key was rotated.
              The record above is still authoritative.
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/verify">Check another ID</Link>
            </Button>
            <Button asChild>
              <Link to="/">What is Ascent?</Link>
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-chalk">
          Certificates are only issued for career paths where every lesson has been written and
          completed. Ascent issues none for partially published roadmaps.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-chalk">{label}</dt>
      <dd className="text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
