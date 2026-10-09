import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { courseById } from "@/content/curriculum";

// People trim a lesson URL back to its course. There is no page here — the
// course page lives at /courses/$courseId — so send them there rather than 404.
export const Route = createFileRoute("/learn/$courseId/")({
  loader: ({ params }) => {
    if (!courseById(params.courseId)) throw notFound();
    throw redirect({
      to: "/courses/$courseId",
      params: { courseId: params.courseId },
      statusCode: 301,
    });
  },
});
