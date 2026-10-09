import { createFileRoute, Link } from "@tanstack/react-router";
import { ContactLink, LegalPage, List, P, Section } from "@/components/common/LegalPage";
import { COMPANY, LEGAL_UPDATED, MINIMUM_AGE, REFUND_DAYS } from "@/lib/company";
import { TRIAL_DAYS } from "@/lib/entitlements";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () =>
    seoHead({
      path: "/terms",
      title: "Terms of Service — Ascent",
      description:
        "The agreement for using Ascent: accounts, plans and refunds, acceptable use, your content, the AI mentor and certificates.",
    }),
  component: Terms,
});

const linkClass = "font-semibold text-brand hover:underline";

function Terms() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      updated={LEGAL_UPDATED}
      intro={
        <p>
          These terms are the agreement between you and {COMPANY.name} ("we", "us"), of{" "}
          {COMPANY.region}, for using Ascent. By creating an account or buying a plan, you accept
          them. Our{" "}
          <Link to="/privacy" className={linkClass}>
            Privacy Policy
          </Link>{" "}
          explains how we handle your data.
        </p>
      }
    >
      <Section title="Your account">
        <List>
          <li>You must be at least {MINIMUM_AGE} years old to create an account.</li>
          <li>
            Give accurate details, keep your password to yourself, and tell us if you think someone
            else has accessed your account.
          </li>
          <li>
            An account is for one person. Don't share it: your progress, streak and certificates are
            meant to describe your own work.
          </li>
          <li>You're responsible for what happens under your account.</li>
        </List>
      </Section>

      <Section title="Plans, trials and payment">
        <List>
          <li>
            <strong>Free</strong> gives you part of every course at no charge, with a limited number
            of AI mentor messages each month.
          </li>
          <li>
            <strong>Pro</strong> is a subscription, billed monthly or yearly. It renews
            automatically at the end of each period until you cancel. You can cancel at any time,
            and you keep Pro until the end of the period you've paid for.
          </li>
          <li>
            <strong>Lifetime</strong> is a one-time payment for Pro access for as long as Ascent
            operates. It isn't transferable.
          </li>
          <li>
            The <strong>{TRIAL_DAYS}-day Pro trial</strong> needs no card. When it ends, your
            account moves to Free unless you buy a plan.
          </li>
          <li>
            Prices are shown in US dollars on the{" "}
            <Link to="/pricing" className={linkClass}>
              pricing page
            </Link>{" "}
            and at checkout, and may include or add taxes depending on where you live. If we change
            a subscription's price, we'll tell you before your next renewal, and you can cancel
            before it applies.
          </li>
          <li>Payments are processed by Stripe. We don't store your card details.</li>
        </List>
      </Section>

      <Section title="Refunds">
        <P>
          If you're not happy, email <ContactLink /> within {REFUND_DAYS} days of a purchase or a
          renewal and we'll refund that payment in full, with no questions asked. After{" "}
          {REFUND_DAYS} days, payments aren't refundable, except where the law where you live says
          otherwise. A refunded plan ends when the refund is issued.
        </P>
      </Section>

      <Section title="Using Ascent fairly">
        <P>Please don't:</P>
        <List>
          <li>
            Use scripts, bots or other automation to complete lessons, earn XP or climb the
            leaderboard.
          </li>
          <li>Try to extract answer keys, reference solutions or other people's data.</li>
          <li>
            Attack, overload or probe the service, or get around its limits, plan restrictions or
            security.
          </li>
          <li>
            Post anything illegal, hateful, harassing, sexually explicit or deceptive, spam, or
            other people's personal information.
          </li>
          <li>Copy and redistribute course content, or resell access to it.</li>
        </List>
        <P>
          We may remove content, reset progress gained by breaking these rules, or suspend or close
          an account that does. Where it's reasonable, we'll tell you why and give you a chance to
          respond first.
        </P>
      </Section>

      <Section title="Your content">
        <P>
          You own what you create on Ascent: your code, posts, replies and projects. By posting or
          publishing something on Ascent, you give us permission to store it and show it on the
          service, for example to other learners in the community or on your public profile. This
          permission ends when you delete the content or your account, except for copies other
          people have already quoted in their replies. Only post things you have the right to share.
        </P>
      </Section>

      <Section title="The AI mentor">
        <P>
          The mentor's replies are generated by an AI model. They can be wrong, incomplete or out of
          date, so check anything important, and don't rely on them for legal, medical, financial or
          security decisions. Don't put passwords, API keys or other people's personal information
          into your messages. Monthly message limits depend on your plan.
        </P>
      </Section>

      <Section title="Certificates">
        <P>
          A certificate records that you completed the assessed lessons of a career path on Ascent,
          and anyone can check it's genuine on our verification page. It's not an accredited
          qualification, a degree or a licence. We may withdraw a certificate obtained by breaking
          these terms.
        </P>
      </Section>

      <Section title="Our content">
        <P>
          Courses, lessons, exercises, the Ascent name and the design of the site belong to{" "}
          {COMPANY.name} or the people we license them from. You may use them for your own learning.
          Code you write while completing exercises is yours.
        </P>
      </Section>

      <Section title="Changes to Ascent">
        <P>
          We're continually improving Ascent, so courses, features and plans will change. We may
          add, rewrite or retire lessons and courses. If we make a change that significantly reduces
          what a paid plan includes, we'll tell you in advance, and you can cancel and ask for a
          proportional refund of any period you've paid for and won't be able to use.
        </P>
      </Section>

      <Section title="Ending your account">
        <P>
          You can stop using Ascent at any time, and delete your account from your profile page or
          by emailing <ContactLink />. Deleting an account with a Pro subscription cancels the
          subscription immediately. We may suspend or close an account that seriously or repeatedly
          breaks these terms. If we close an account without such a reason, we'll refund any unused
          portion of a paid period.
        </P>
      </Section>

      <Section title="Disclaimers and liability">
        <P>
          We work hard to keep Ascent accurate and available, but it's provided "as is". We can't
          promise it will always be available, error-free, or that it will lead to any particular
          job, salary or result.
        </P>
        <P>
          To the extent the law allows, {COMPANY.name} isn't liable for indirect or consequential
          losses, such as lost profits or lost data, and our total liability to you for any claim is
          limited to the amount you paid us in the 12 months before the claim. Nothing in these
          terms limits liability that can't be limited by law, or takes away your rights as a
          consumer where you live.
        </P>
      </Section>

      <Section title="Law and disputes">
        <P>
          These terms are governed by the laws of the Province of Ontario and the federal laws of
          Canada that apply there. If there's a dispute, please contact us first so we can try to
          resolve it. Otherwise, disputes go to the courts of Ontario, unless the law where you live
          gives you the right to bring a claim there.
        </P>
      </Section>

      <Section title="Changes to these terms">
        <P>
          If we change these terms, we'll update the date at the top. For significant changes, we'll
          tell you by email or in the app before they take effect. If you keep using Ascent after
          that, the new terms apply; if you don't agree, you can cancel and close your account.
        </P>
      </Section>

      <Section title="Contact">
        <P>
          {COMPANY.name}, {COMPANY.region}. <ContactLink />
        </P>
      </Section>
    </LegalPage>
  );
}
