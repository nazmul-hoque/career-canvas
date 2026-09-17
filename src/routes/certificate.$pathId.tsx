import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Download, Share2, Award } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { pathById, pathCourses, pathLessonCount, courseLessons } from "@/content/curriculum";
import { useProfile, useProgress } from "@/hooks/useLearner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/certificate/$pathId")({
  loader: ({ params }) => {
    const path = pathById(params.pathId);
    if (!path) throw notFound();
    return { path };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Certificate unavailable — Ascent" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `${loaderData.path.name} certificate — Ascent` },
        { name: "description", content: `Verified certificate of completion for the ${loaderData.path.name} career path on Ascent.` },
        { property: "og:title", content: `${loaderData.path.name} certificate — Ascent` },
        { property: "og:description", content: `Verified certificate of completion for the ${loaderData.path.name} career path.` },
      ],
    };
  },
  notFoundComponent: Missing,
  errorComponent: Missing,
  component: Certificate,
});

function Missing() {
  return (
    <AppShell>
      <div className="card-surface p-10 text-center">
        <h1 className="font-display text-2xl font-bold">No certificate here</h1>
        <Button asChild className="mt-6">
          <Link to="/paths">Browse paths</Link>
        </Button>
      </div>
    </AppShell>
  );
}

function Certificate() {
  const { path } = Route.useLoaderData();
  const { data: profile } = useProfile();
  const { data: progress = [] } = useProgress();

  const done = new Set(progress.map((p) => p.lesson_id));
  const total = pathLessonCount(path);
  const completed = pathCourses(path).reduce(
    (sum, c) => sum + courseLessons(c).filter((l) => done.has(l.id)).length,
    0,
  );
  const eligible = total > 0 && completed >= total;
  const certId = `ASC-${path.id.toUpperCase().slice(0, 4)}-${(profile?.id ?? "guest").slice(0, 8).toUpperCase()}`;
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  if (!eligible) {
    return (
      <AppShell>
        <div className="card-surface mx-auto max-w-xl p-10 text-center">
          <Award className="mx-auto size-10 text-chalk" />
          <h1 className="mt-4 font-display text-2xl font-bold">Certificate locked</h1>
          <p className="mt-2 text-sm text-chalk">
            You've completed {completed} of {total} lessons in {path.name}. Finish the path and this page becomes your
            certificate.
          </p>
          <Button asChild className="mt-6">
            <Link to="/paths/$pathId" params={{ pathId: path.id }}>
              Back to the roadmap
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <div className="card-surface relative overflow-hidden p-8 sm:p-14">
          <div className="diagonals pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative text-center">
            <p className="eyebrow">Certificate of completion</p>
            <h1 className="mt-6 font-display text-2xl font-bold sm:text-4xl">{profile?.display_name ?? "Ascent learner"}</h1>
            <p className="mt-3 text-sm text-chalk">has completed the career path</p>
            <p className="mt-2 font-display text-xl font-bold text-brand sm:text-3xl">{path.name}</p>
            <p className="mt-4 text-sm text-chalk">
              {total} lessons · {pathCourses(path).length} courses · completed {date}
            </p>

            <div className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-1.5">
              {path.skills.map((s) => (
                <span key={s} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
                  {s}
                </span>
              ))}
            </div>

            <p className="mt-10 font-mono text-xs text-chalk">Certificate ID · {certId}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button onClick={() => window.print()}>
            <Download className="size-4" /> Download / print
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void navigator.clipboard?.writeText(window.location.href);
              toast.success("Link copied — share it anywhere");
            }}
          >
            <Share2 className="size-4" /> Share
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
