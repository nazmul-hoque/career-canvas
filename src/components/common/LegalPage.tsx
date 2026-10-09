import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { COMPANY } from "@/lib/company";

/** Long-form reading layout shared by Terms, Privacy and About. */
export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  updated?: string | undefined;
  children: ReactNode;
}) {
  return (
    <AppShell>
      <article className="mx-auto max-w-3xl">
        <header className="border-b border-border pb-8">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <div className="mt-4 text-[15px] leading-7 text-chalk">{intro}</div>
          {updated ? <p className="mt-4 text-xs text-chalk">Last updated {updated}</p> : null}
        </header>
        <div className="space-y-10 py-10">{children}</div>
      </article>
    </AppShell>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-7 text-foreground">{children}</p>;
}

export function List({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-foreground marker:text-chalk">
      {children}
    </ul>
  );
}

export function ContactLink() {
  return (
    <a href={`mailto:${COMPANY.email}`} className="font-semibold text-brand hover:underline">
      {COMPANY.email}
    </a>
  );
}
