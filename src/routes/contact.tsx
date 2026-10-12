import { createFileRoute, Link } from "@tanstack/react-router";
import { ContactLink, LegalPage, List, P, Section } from "@/components/common/LegalPage";
import { COMPANY, REFUND_DAYS } from "@/lib/company";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () =>
    seoHead({
      path: "/contact",
      title: "Contact | Ascent",
      description: `How to reach the team behind Ascent, ${COMPANY.name}: support, billing, privacy requests and feedback.`,
    }),
  component: Contact,
});

const linkClass = "font-semibold text-brand hover:underline";

function Contact() {
  return (
    <LegalPage
      eyebrow="Contact"
      title="Get in touch"
      intro={
        <p>
          Ascent is run by {COMPANY.name} in {COMPANY.region}. One address reaches us for
          everything: <ContactLink />.
        </p>
      }
    >
      <Section title="What to include">
        <List>
          <li>
            <strong>Account, billing or privacy requests:</strong> write from the email address on
            your account, so we can confirm it's you.
          </li>
          <li>
            <strong>A mistake in a lesson:</strong> the lesson's link and what looks wrong.
          </li>
          <li>
            <strong>Something broken:</strong> what you did, what happened, and your browser.
          </li>
        </List>
      </Section>

      <Section title="You might not need to email">
        <List>
          <li>
            <strong>Refunds</strong> are available within {REFUND_DAYS} days of any payment, no
            questions asked; see the{" "}
            <Link to="/terms" className={linkClass}>
              Terms of Service
            </Link>
            .
          </li>
          <li>
            <strong>Deleting your account</strong> is on your{" "}
            <Link to="/profile" className={linkClass}>
              profile page
            </Link>
            , and the{" "}
            <Link to="/privacy" className={linkClass}>
              Privacy Policy
            </Link>{" "}
            explains what it removes.
          </li>
          <li>
            <strong>Checking a certificate</strong> is on the{" "}
            <Link to="/verify" className={linkClass}>
              verification page
            </Link>
            .
          </li>
        </List>
      </Section>

      <Section title="About us">
        <P>
          More about who makes Ascent and how it teaches is on the{" "}
          <Link to="/about" className={linkClass}>
            About page
          </Link>
          .
        </P>
      </Section>
    </LegalPage>
  );
}
