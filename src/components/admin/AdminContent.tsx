import { Link } from "@tanstack/react-router";
import { QueryError } from "@/components/common/QueryError";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { careerPaths, courseLessons, courses, type Course } from "@/content/curriculum";
import { isCoursePublished, isLessonAssessed, liveLessons } from "@/content/lessons";
import { useAdminCourseUsage } from "@/hooks/useAdmin";
import { formatCount } from "./format";

/**
 * Read-only on purpose. Lessons are TypeScript in src/content/ because their
 * answer keys must never reach the browser; editing them here would mean
 * moving them into the database. This view shows what is written and what is used.
 */
export function AdminContent() {
  const usage = useAdminCourseUsage();
  const totalLessons = courses.reduce((n, c) => n + courseLessons(c).length, 0);
  const liveTotal = courses.reduce((n, c) => n + liveLessons(c).length, 0);

  return (
    <div className="space-y-6">
      <div className="card-surface space-y-1 p-5 text-sm">
        <p>
          <span className="font-semibold">
            {formatCount(liveTotal)} of {formatCount(totalLessons)} lessons are written
          </span>{" "}
          across {courses.length} courses and {careerPaths.length} paths.
        </p>
        <p className="text-chalk">
          Course content is edited in <code>src/content/</code> and ships with a deploy. This page
          shows what's written and how much it's used. It doesn't change anything.
        </p>
      </div>

      {usage.isError ? (
        <QueryError
          title="Couldn't load course usage"
          retry={usage.refetch}
          busy={usage.isFetching}
        />
      ) : null}

      <div className="card-surface overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Level</TableHead>
              <TableHead className="text-right">Written</TableHead>
              <TableHead className="text-right">Graded</TableHead>
              <TableHead className="text-right">Completions</TableHead>
              <TableHead className="text-right">Learners</TableHead>
              <TableHead>Paths</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                usage={usage.data?.[course.id]}
                loading={usage.isLoading}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-chalk">
        Written: lessons with an authored body out of every slot on the roadmap. Graded: written
        lessons that check the learner's answer rather than taking their word for it.
      </p>
    </div>
  );
}

function CourseRow({
  course,
  usage,
  loading,
}: {
  course: Course;
  usage: { completions: number; learners: number } | undefined;
  loading: boolean;
}) {
  const all = courseLessons(course).length;
  const live = liveLessons(course);
  const graded = live.filter((l) => isLessonAssessed(l.id)).length;
  const paths = careerPaths.filter((p) => p.courseIds.includes(course.id));
  const pending = loading ? "…" : "0";

  return (
    <TableRow>
      <TableCell>
        <Link
          to="/courses/$courseId"
          params={{ courseId: course.id }}
          className="font-semibold hover:text-brand"
        >
          {course.title}
        </Link>
        <span className="block text-xs text-chalk">{course.id}</span>
      </TableCell>
      <TableCell className="whitespace-nowrap">{course.level}</TableCell>
      <TableCell className="whitespace-nowrap text-right tabular-nums">
        {live.length} / {all}
        {isCoursePublished(course) ? null : (
          <Badge variant="outline" className="ml-2">
            {live.length === 0 ? "Unwritten" : "In progress"}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">{graded}</TableCell>
      <TableCell className="text-right tabular-nums">
        {usage ? formatCount(usage.completions) : pending}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {usage ? formatCount(usage.learners) : pending}
      </TableCell>
      <TableCell className="text-xs text-chalk">
        {paths.map((p) => p.name).join(", ") || "—"}
      </TableCell>
    </TableRow>
  );
}
