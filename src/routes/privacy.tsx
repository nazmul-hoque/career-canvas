import { createFileRoute, Link } from "@tanstack/react-router";
import { ContactLink, LegalPage, List, P, Section } from "@/components/common/LegalPage";
import { COMPANY, LEGAL_UPDATED, MINIMUM_AGE } from "@/lib/company";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    seoHead({
      path: "/privacy",
      title: "Privacy Policy — Ascent",
      description:
        "What Ascent collects, why, who processes it for us, what is public, and how to see, correct or delete your data.",
    }),
  component: Privacy,
});

// Every service named here is one the code actually sends data to; check
// .env.example and src/lib/*.server.ts before adding or removing one.
function Privacy() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated={LEGAL_UPDATED}
      intro={
        <p>
          Ascent is run by {COMPANY.name}, based in {COMPANY.region}. This policy explains what we
          collect when you use Ascent, why, who helps us process it, and the choices you have. We
          don't sell your data and we don't show ads.
        </p>
      }
    >
      <Section title="What we collect">
        <List>
          <li>
            <strong>Account details:</strong> your email address and display name. If you sign in
            with Google, we receive your name and email from Google. Passwords are handled by our
            authentication provider and stored only as a secure hash.
          </li>
          <li>
            <strong>Onboarding answers:</strong> your goal, experience level, weekly hours and
            chosen career path, which we use to size your goals and suggest where to start.
          </li>
          <li>
            <strong>Learning activity:</strong> lessons you complete, the answers you submit to be
            graded, your XP, level, streak, achievements and review schedule, and certificates you
            earn.
          </li>
          <li>
            <strong>AI mentor conversations:</strong> the questions you ask and the lesson context
            sent with them, which can include the code in your editor and the error you're seeing.
            We keep the conversation so you can come back to it, and count messages to apply your
            plan's monthly allowance.
          </li>
          <li>
            <strong>Things you publish:</strong> community posts and replies, likes, and project
            submissions.
          </li>
          <li>
            <strong>Payment records:</strong> your plan, its renewal or trial dates, and a customer
            reference from our payment processor. We never see or store your full card number.
          </li>
          <li>
            <strong>Notification settings:</strong> whether you've opted in to reminder emails, and
            the push subscription your browser gives us if you turn on notifications.
          </li>
          <li>
            <strong>Usage events:</strong> which pages and features are used (for example, that a
            lesson was started), linked to your account when you're signed in, or to a random ID
            stored in your browser when you're not. We use these to understand what helps people
            learn. They're stored in our own database, not sent to an analytics company.
          </li>
          <li>
            <strong>Technical data:</strong> like any website, our servers and providers receive
            your IP address and browser details when you connect, and keep them in logs for security
            and troubleshooting.
          </li>
        </List>
        <P>
          Code you run in a lesson runs in your own browser. Unfinished answers and code drafts are
          saved in your browser's local storage, not on our servers, until you submit them.
        </P>
      </Section>

      <Section title="How we use it">
        <List>
          <li>
            To run your account and the courses: grading answers, awarding XP, keeping your streak
            and scheduling reviews.
          </li>
          <li>To answer your questions through the AI mentor.</li>
          <li>To issue certificates and let others check that one is genuine.</li>
          <li>
            To send reminder emails or push notifications, only if you've opted in. Every email has
            an unsubscribe link.
          </li>
          <li>To take payments and manage your plan.</li>
          <li>To keep the service secure, prevent abuse, and moderate the community.</li>
          <li>To improve Ascent, using usage events and aggregate statistics.</li>
        </List>
      </Section>

      <Section title="What other people can see">
        <P>Some of what you do on Ascent is visible to others by design:</P>
        <List>
          <li>
            Your display name, bio, career path, XP, level and streak appear on the leaderboard and
            on your public profile page.
          </li>
          <li>Community posts and replies, under your display name.</li>
          <li>Portfolio projects you choose to make public.</li>
          <li>
            The name on a certificate you've earned, to anyone who has its link or ID, on our public
            verification page.
          </li>
        </List>
        <P>
          Use a display name you're comfortable being public. Your email address is never shown to
          other learners.
        </P>
      </Section>

      <Section title="Who processes data for us">
        <P>
          We use these providers to run Ascent. Each receives only what it needs for its job, under
          its own privacy and security terms:
        </P>
        <List>
          <li>
            <strong>Supabase:</strong> our database and sign-in system. Your account, progress and
            everything listed above is stored there.
          </li>
          <li>
            <strong>Google (Gemini):</strong> generates the AI mentor's replies. Your question and
            the lesson context, including any code you're asking about, are sent to it. Please don't
            paste passwords, API keys or other people's personal information into the mentor.
          </li>
          <li>
            <strong>Google (Sign-in):</strong> only if you choose to sign in with Google.
          </li>
          <li>
            <strong>Stripe:</strong> processes payments and stores your card details.
          </li>
          <li>
            <strong>Resend:</strong> delivers our emails, including reminders and password resets.
          </li>
          <li>
            <strong>Your browser's push service</strong> (for example Google, Mozilla or Apple):
            delivers notifications if you turn them on. The message content is encrypted.
          </li>
          <li>
            <strong>jsDelivr:</strong> serves the Python runtime that lessons download into your
            browser, so it receives your IP address when that happens.
          </li>
          <li>
            <strong>Our hosting provider:</strong> serves the website and handles requests.
          </li>
        </List>
        <P>
          These providers may process data outside Canada, including in the United States, where it
          is subject to the laws of that country. We share data with others only if the law requires
          us to, or to protect people's safety or our legal rights.
        </P>
      </Section>

      <Section title="Cookies and browser storage">
        <P>
          We don't use advertising cookies or third-party trackers. We store a few things in your
          browser because the site needs them: your sign-in session, the random usage ID described
          above, and your unsaved lesson drafts. Clearing your browser's site data removes them and
          signs you out.
        </P>
      </Section>

      <Section title="How long we keep it">
        <P>
          We keep your account data for as long as you have an account. You can delete your account
          yourself from your profile page; that removes your profile, progress, certificates, mentor
          conversations and other personal data straight away, including your community posts and
          replies. If you'd rather, email us and we'll do it within 30 days. Payment and tax records
          are kept for as long as the law requires, by us or our payment processor. Copies in
          backups are overwritten on their normal cycle.
        </P>
      </Section>

      <Section title="Your choices and rights">
        <P>You can:</P>
        <List>
          <li>
            Change your display name and bio in your profile, and retake onboarding from your
            dashboard.
          </li>
          <li>
            Turn reminder emails and notifications off at any time, from your profile or the
            unsubscribe link in any email.
          </li>
          <li>Ask for a copy of the personal data we hold about you.</li>
          <li>Ask us to correct anything that's wrong.</li>
          <li>Delete your account and data, from your profile page or by asking us.</li>
          <li>Withdraw consent you've given, without affecting what we did before.</li>
        </List>
        <P>
          To make a request, email <ContactLink /> from the address on your account. We'll reply
          within 30 days. Depending on where you live, you may have further rights under local law,
          and we'll honour them. If you're not satisfied with how we handle your data, you can
          complain to the Office of the Privacy Commissioner of Canada or your local data protection
          authority.
        </P>
      </Section>

      <Section title="Security">
        <P>
          Data travels over encrypted connections. Access to each learner's data is restricted at
          the database level, so one account can't read another's. Grading and XP are calculated on
          our servers. Certificates carry a signature so forgeries can be detected. No system is
          perfectly secure; if a breach affects your data, we'll tell you and the relevant
          authorities as the law requires.
        </P>
      </Section>

      <Section title="Age">
        <P>
          Ascent is for people aged {MINIMUM_AGE} and over. We don't knowingly collect data from
          anyone younger. If you believe someone under {MINIMUM_AGE} has an account, contact us and
          we'll delete it.
        </P>
      </Section>

      <Section title="Changes to this policy">
        <P>
          If we change this policy, we'll update the date at the top. For significant changes, we'll
          also tell you by email or in the app before they take effect. See also our{" "}
          <Link to="/terms" className="font-semibold text-brand hover:underline">
            Terms of Service
          </Link>
          .
        </P>
      </Section>

      <Section title="Contact">
        <P>
          {COMPANY.name}, {COMPANY.region}. Questions about privacy, or anything else:{" "}
          <ContactLink />.
        </P>
      </Section>
    </LegalPage>
  );
}
