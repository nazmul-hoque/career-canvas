import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Wordmark } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/verify/")({
  head: () => ({
    meta: [
      { title: "Verify a certificate | Ascent" },
      {
        name: "description",
        content:
          "Enter an Ascent certificate ID to check who it was awarded to, for which career path, and when.",
      },
      { property: "og:title", content: "Verify a certificate | Ascent" },
      {
        property: "og:description",
        content: "Check an Ascent certificate ID against the issuing record.",
      },
    ],
  }),
  component: VerifyLookup,
});

function VerifyLookup() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const trimmed = id.trim().toUpperCase();

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <Link to="/">
          <Wordmark />
        </Link>

        <div className="card-surface mt-10 p-8 sm:p-10">
          <div className="grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <ShieldCheck className="size-7" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Verify an Ascent certificate
          </h1>
          <p className="mt-2 text-sm text-chalk">
            Type the ID printed on the certificate. You'll see who holds it, which career path it
            covers and the date it was issued. No account needed.
          </p>

          <form
            className="mt-7 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (trimmed.length >= 6) {
                navigate({ to: "/verify/$certificateId", params: { certificateId: trimmed } });
              }
            }}
          >
            <Input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="ASC-FRON-A1B2C3D"
              aria-label="Certificate ID"
              className="flex-1 font-mono uppercase"
            />
            <Button type="submit" disabled={trimmed.length < 6}>
              Check
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
