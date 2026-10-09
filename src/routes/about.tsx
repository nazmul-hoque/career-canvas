import { createFileRoute, Link } from "@tanstack/react-router";
import { ContactLink, LegalPage, List, P, Section } from "@/components/common/LegalPage";
import { careerPaths, courses } from "@/content/curriculum";
import { liveLessonCount } from "@/content/lessons";
import { COMPANY } from "@/lib/company";
import { seoHead, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    seoHead({
      path: "/about",
      title: "About Ascent",
      description: `Who makes Ascent, how it teaches, and how to reach us. Ascent is built by ${COMPANY.name} in ${COMPANY.region}.`,
      schema: [
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "Ascent",
          url: SITE_URL,
          email: COMPANY.email,
          parentOrganization: { "@type": "Organization", name: COMPANY.name, url: COMPANY.url },
        },
      ],
    }),
  component: About,
});

const linkClass = "font-semibold text-brand hover:underline";

function About() {
  // Counted, not typed: a number on this page should never drift from the catalog.
  const lessons = courses.reduce((sum, course) => sum + liveLessonCount(course), 0);

  return (
    <LegalPage
      eyebrow="About"
      title="Practice-first learning for people changing what they do for a living."
      intro={
        <p>
          Ascent teaches coding, data, design, product and AI by having you do the work: write the
          code, answer the question, make the call. It currently has {lessons} lessons across{" "}
          {courses.length} courses, grouped into {careerPaths.length} career paths.
        </p>
      }
    >
      <Section title="Who makes it">
        <P>
          Ascent is built and run by{" "}
          <a href={COMPANY.url} className={linkClass} rel="noopener">
            {COMPANY.name}
          </a>
          , a software company in {COMPANY.region}.
        </P>
      </Section>

      <Section title="How we teach">
        <List>
          <li>
            <strong>Every lesson asks something of you.</strong> Code lessons end in a challenge
            that runs in your browser. Other lessons ask questions with real right and wrong
            answers. A few lessons, where the work happens in your own tools, are marked as
            self-assessed and don't count towards a certificate.
          </li>
          <li>
            <strong>Grading happens on our servers.</strong> Your XP comes from answers we've
            checked, so the leaderboard and your streak mean something.
          </li>
          <li>
            <strong>We don't pad the roadmap.</strong> A lesson that hasn't been written yet shows
            as coming soon. It earns nothing and doesn't count towards your progress.
          </li>
          <li>
            <strong>Certificates can be checked.</strong> Each one is signed, and anyone can confirm
            it's genuine on our{" "}
            <Link to="/verify" className={linkClass}>
              verification page
            </Link>
            .
          </li>
          <li>
            <strong>What you learn comes back.</strong> Questions from lessons you've finished
            return for review on a widening schedule, so they stick.
          </li>
        </List>
      </Section>

      <Section title="Contact">
        <P>
          Questions, feedback, a mistake in a lesson, or a problem with your account: email{" "}
          <ContactLink />.
        </P>
        <P>
          See also our{" "}
          <Link to="/terms" className={linkClass}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className={linkClass}>
            Privacy Policy
          </Link>
          .
        </P>
      </Section>
    </LegalPage>
  );
}
