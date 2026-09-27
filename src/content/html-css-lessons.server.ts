import type { LessonBody } from "./lessons";

/**
 * Lessons added after the HTML/CSS learning-design audit. The checkpoints use
 * deliberately sparse starters so course completion demonstrates transfer,
 * not only the ability to edit a nearly finished example.
 */
export const htmlCssLessonBodies: Record<string, LessonBody> = {
  "html-basics.checkpoint": {
    summary:
      "Build a complete, semantic event page from a blank editor and make its sign-up form usable by everyone.",
    xp: 190,
    blocks: [
      {
        kind: "callout",
        body: "This is a mastery checkpoint. Start from the content requirements, not from copied markup. Use the hint only after you have built and run a first version.",
      },
      {
        kind: "text",
        body: "Plan the document as a tree before typing tags: page metadata in `head`; site-wide identity and navigation in `header`; this page's content in one `main`; and secondary legal information in `footer`. Within `main`, headings should form an outline that still makes sense without any styling.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which is the best first step when turning a brief into semantic HTML?",
        options: [
          "Draw the document outline and identify landmarks, headings, controls and their labels",
          "Choose colours and fonts",
          "Wrap every line in a div",
          "Add ARIA roles to every element",
        ],
        answer: 0,
        explanation:
          "Native structure comes first. Once landmarks and relationships are correct, styling can change without losing meaning.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Complete the attribute that connects this visible label to the field whose id is email.",
        before: "<label ",
        after: '="email">Email</label>',
        answer: "for",
        explanation: "A label's for value matches the field's id.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Accessible community hike page",
        prompt:
          "From a blank editor, build a complete HTML page for “Saturday Community Hike”. Include the doctype, English language, UTF-8, mobile viewport and a useful title. Use a header with a nav list containing “Route” and “Register” links, one main with one h1, an event image with meaningful alt text, h2 sections titled “Route” and “Register”, and a footer. The register section needs a form with visible labels for required `name` and required `email` fields, correct names and email type, a difficulty radio group inside a fieldset with a legend, and a submit button reading “Save my place”.",
        language: "web",
        starter: `<!-- Build the complete document from the brief. -->
`,
        hint: "Sketch `html > head + body`, then `header + main + footer`. Inside main, put the h1 before the two h2 sections. Build and label the ordinary fields before adding the fieldset of radios.",
        solution: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Saturday Community Hike — Trailhead</title>
  </head>
  <body>
    <header>
      <p>Trailhead</p>
      <nav aria-label="Main navigation">
        <ul>
          <li><a href="#route">Route</a></li>
          <li><a href="#register">Register</a></li>
        </ul>
      </nav>
    </header>
    <main>
      <h1>Saturday Community Hike</h1>
      <img src="hike.jpg" alt="Hikers following a forest trail beside a lake">
      <section id="route">
        <h2>Route</h2>
        <p>An eight-kilometre loop with one steep section.</p>
      </section>
      <section id="register">
        <h2>Register</h2>
        <form action="/hikes/register" method="post">
          <label for="name">Name</label>
          <input id="name" name="name" autocomplete="name" required>
          <label for="email">Email</label>
          <input id="email" name="email" type="email" autocomplete="email" required>
          <fieldset>
            <legend>Preferred difficulty</legend>
            <label><input type="radio" name="difficulty" value="steady" checked> Steady</label>
            <label><input type="radio" name="difficulty" value="challenging"> Challenging</label>
          </fieldset>
          <button type="submit">Save my place</button>
        </form>
      </section>
    </main>
    <footer><p>Trailhead Outdoor Club</p></footer>
  </body>
</html>`,
        tests: [
          {
            name: "Declares language, encoding, viewport and title",
            expression:
              '/^en/i.test($("html")?.getAttribute("lang") || "") && !!$("meta[charset]") && /width=device-width/.test($(\'meta[name="viewport"]\')?.getAttribute("content") || "") && text("title").length > 8',
          },
          {
            name: "Uses the required landmarks and one h1",
            expression:
              '!!$("header") && !!$("header nav") && $$("main").length === 1 && $$("main h1").length === 1 && !!$("footer")',
          },
          {
            name: "Navigation is a list with working page links",
            expression:
              '$$("nav ul li a").length === 2 && $$("nav a").every((a) => /^#/.test(a.getAttribute("href") || ""))',
          },
          {
            name: "Route and Register are real headed sections",
            expression:
              '$$("main section h2").length === 2 && $$("main section h2").some((h) => text(h) === "Route") && $$("main section h2").some((h) => text(h) === "Register")',
          },
          {
            name: "The event image has meaningful alternative text",
            expression: '($("main img")?.getAttribute("alt") || "").trim().length >= 12',
          },
          {
            name: "Name and email are labelled, named and required",
            expression:
              '(() => { const fields = [$(\'input[name="name"][required]\'), $(\'input[name="email"][type="email"][required]\')]; return fields.every((field) => field && labelOf(field)); })()',
          },
          {
            name: "Difficulty is one labelled radio group",
            expression:
              '(() => { const radios = $$(\'input[type="radio"][name="difficulty"]\'); return radios.length >= 2 && radios.every((radio) => labelOf(radio) && radio.closest("fieldset")?.querySelector("legend")); })()',
          },
          {
            name: "The form has the requested submit button",
            expression:
              "$$('form button[type=\"submit\"]').some((button) => /save my place/i.test(text(button)))",
          },
        ],
      },
    ],
  },

  "css-core.selectors": {
    summary:
      "Connect CSS to a page, write a rule, and target classes, descendants and interaction states without overspecifying.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: 'A CSS rule has a **selector** choosing elements and a declaration block saying what changes: `.notice { color: #17324d; }`. Each declaration is a property-value pair. Put practice CSS in a `<style>` element; in a real project, link an external file from the head with `<link rel="stylesheet" href="styles.css">` so pages can share it.',
      },
      {
        kind: "code",
        language: "css",
        caption: "Prefer reusable classes over location-dependent selectors",
        code: `.notice { padding: 1rem; }       /* any element with class="notice" */
.notice strong { color: #8a2b06; } /* strong anywhere inside a notice */
.notice > h2 { margin-top: 0; }    /* h2 that is a direct child */
.notice a:hover { text-decoration-thickness: 0.2em; }
.notice a:focus-visible { outline: 0.2rem solid currentColor; }`,
      },
      {
        kind: "text",
        body: "Element selectors (`p`) affect every matching element; class selectors (`.summary`) express a reusable role; id selectors (`#checkout`) are so strong that they make later overrides difficult. Use classes for components and keep selectors short. A space means *inside*, while `>` means *direct child*.",
      },
      {
        kind: "text",
        body: "Pseudo-classes describe state. `:hover` means a pointing device is over an element; `:focus-visible` means keyboard focus needs a visible indicator; `:checked`, `:disabled` and `:required` describe form state. Never put essential information behind hover alone—touchscreens and keyboards do not have the same hover interaction.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which selector targets links anywhere inside an element with class notice?",
        options: ["`notice a`", "`.notice > *`", "`.notice a`", "`#notice.a`"],
        answer: 2,
        explanation: "The dot selects a class, and the space means a descendant at any depth.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the reusable class selector for an element whose class is card.",
        before: "",
        after: "card { padding: 1rem; }",
        answer: ".",
        explanation: "A class selector begins with a dot.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Target the notice, not the whole page",
        prompt:
          "Style only the `.notice`: give it a pale background, `1rem` padding and a border. Make its `strong` text dark red without changing other strong text. Keep its link underlined, make the underline thicker on hover, and add a visible outline on `:focus-visible`. Use class-based selectors—no ids, inline styles or `!important`.",
        language: "web",
        starter: `<style>
  /* Write focused, reusable rules here. */
</style>

<main>
  <p><strong>Ordinary text</strong> outside the notice.</p>
  <aside class="notice">
    <p><strong>Weather warning:</strong> the ridge is exposed.</p>
    <a href="/conditions">Check current conditions</a>
  </aside>
</main>`,
        hint: "Start with `.notice`, then use `.notice strong`, `.notice a`, `.notice a:hover` and `.notice a:focus-visible`. State rules come after the ordinary link rule.",
        solution: `<style>
  .notice {
    background: #fff4d6;
    padding: 1rem;
    border: 0.1rem solid #a65b00;
  }
  .notice strong { color: #8a1c0e; }
  .notice a { text-decoration: underline; }
  .notice a:hover { text-decoration-thickness: 0.2em; }
  .notice a:focus-visible { outline: 0.2rem solid currentColor; outline-offset: 0.2rem; }
</style>

<main>
  <p><strong>Ordinary text</strong> outside the notice.</p>
  <aside class="notice">
    <p><strong>Weather warning:</strong> the ridge is exposed.</p>
    <a href="/conditions">Check current conditions</a>
  </aside>
</main>`,
        tests: [
          {
            name: "Styles the notice as a distinct box",
            expression:
              'style(".notice", "background") !== null && style(".notice", "padding-top") === "1rem" && style(".notice", "border") !== null',
          },
          {
            name: "Targets strong text only inside the notice",
            expression:
              'style(".notice strong", "color") !== null && style("main > p strong", "color") === null',
          },
          {
            name: "Keeps the link visibly underlined",
            expression: 'style(".notice a", "text-decoration") === "underline"',
          },
          {
            name: "Includes hover and keyboard-focus state rules",
            expression:
              "/\\.notice\\s+a:hover\\s*\\{/.test(source) && /\\.notice\\s+a:focus-visible\\s*\\{/.test(source) && /outline\\s*:/.test(source)",
          },
          {
            name: "Avoids ids, inline styles and important",
            expression:
              '!/<[^>]+style\\s*=/.test(source) && !/!\\s*important/i.test(source) && !/#[-_a-z]/i.test(source.replace(/#[0-9a-f]{3,8}\\b/gi, ""))',
          },
        ],
      },
    ],
  },

  "css-core.accessibility": {
    summary:
      "Keep keyboard focus visible, make controls readable and forgiving, and respect reduced-motion preferences.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: "A keyboard user moves through links and controls with Tab. The visible focus indicator is their cursor. Never write `outline: none` unless you replace it with something at least as obvious. `:focus-visible` normally shows the custom ring for keyboard navigation without adding it to every pointer click.",
      },
      {
        kind: "code",
        language: "css",
        code: `.action:focus-visible {
  outline: 0.2rem solid #ffbf47;
  outline-offset: 0.2rem;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}`,
      },
      {
        kind: "text",
        body: "Text needs enough contrast against its background, including placeholder text and disabled states. A practical target is at least 4.5:1 for ordinary text and 3:1 for large text or meaningful interface boundaries. Do not use colour as the only signal: an error should have an icon or message as well as a red border.",
      },
      {
        kind: "text",
        body: "Controls also need room. Aim for a target around 44 by 44 CSS pixels, but size it with relative units so it follows text. `min-height: 2.75rem`, comfortable padding and space between neighbouring actions prevent missed taps. Links in paragraphs should remain visibly distinguishable instead of relying on colour alone.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Why is `button:focus { outline: none }` dangerous?",
        options: [
          "It makes the button slower",
          "It disables mouse clicks",
          "Outline is required for every design",
          "It removes the keyboard user's visible indication of where they are",
        ],
        answer: 3,
        explanation:
          "Removing focus without an equally visible replacement makes keyboard navigation effectively invisible.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the preference used to reduce non-essential animation.",
        before: "@media (",
        after: ": reduce) { ... }",
        answer: "prefers-reduced-motion",
        explanation: "The operating-system preference reaches CSS through prefers-reduced-motion.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Repair inaccessible actions",
        prompt:
          "Make `.action` readable with white text on `#174ea6`, keep links underlined, and give both actions a minimum height of at least `2.75rem` with relative-unit padding. Remove the focus suppression and add an obvious `.action:focus-visible` outline plus offset. Keep the hover effect, but add a `prefers-reduced-motion: reduce` query that effectively disables the transition and `.promo` animation.",
        language: "web",
        starter: `<style>
  .action {
    color: #777;
    background: #888;
    padding: 4px 8px;
    border: 0;
    outline: none;
    text-decoration: none;
    transition: transform 400ms;
  }
  .action:hover { transform: scale(1.08); }
  .promo { animation: pulse 800ms infinite alternate; }
  @keyframes pulse { to { transform: scale(1.05); } }
</style>

<p class="promo">Weekend trail clinic</p>
<a class="action" href="/book">Book a place</a>
<button class="action" type="button">Save for later</button>`,
        hint: "Fix the ordinary `.action` rule first. Then add `.action:focus-visible`. Finish with `@media (prefers-reduced-motion: reduce)` and set transition and animation durations close to zero inside it.",
        solution: `<style>
  .action {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    color: #fff;
    background: #174ea6;
    padding: 0.65em 1.1em;
    border: 0;
    text-decoration: underline;
    text-underline-offset: 0.15em;
    transition: transform 400ms;
  }
  .action:hover { transform: scale(1.08); }
  .action:focus-visible {
    outline: 0.2rem solid #ffbf47;
    outline-offset: 0.2rem;
  }
  .promo { animation: pulse 800ms infinite alternate; }
  @keyframes pulse { to { transform: scale(1.05); } }
  @media (prefers-reduced-motion: reduce) {
    .action { transition-duration: 0.01ms; }
    .promo { animation-duration: 0.01ms; animation-iteration-count: 1; }
  }
</style>

<p class="promo">Weekend trail clinic</p>
<a class="action" href="/book">Book a place</a>
<button class="action" type="button">Save for later</button>`,
        tests: [
          {
            name: "Uses the requested high-contrast colours",
            expression:
              'style(".action", "color") === "#fff" && style(".action", "background") === "#174ea6"',
          },
          {
            name: "Actions are comfortably sized in relative units",
            expression:
              '(() => { const h = style(".action", "min-height") || ""; return /rem$/.test(h) && parseFloat(h) >= 2.75 && /em$/.test(style(".action", "padding-left") || ""); })()',
          },
          {
            name: "Links remain underlined",
            expression: 'style("a.action", "text-decoration") === "underline"',
          },
          {
            name: "Keyboard focus has a visible ring and offset",
            expression:
              "/\\.action:focus-visible\\s*\\{[^}]*outline\\s*:[^;}]+;?[^}]*outline-offset\\s*:/s.test(source) && !/outline\\s*:\\s*none/i.test(source)",
          },
          {
            name: "Reduced-motion preference disables both effects",
            expression:
              "media().some((query) => /prefers-reduced-motion\\s*:\\s*reduce/.test(query)) && /prefers-reduced-motion[\\s\\S]*transition-duration\\s*:\\s*0\\.0?1ms/i.test(source) && /prefers-reduced-motion[\\s\\S]*animation-duration\\s*:\\s*0\\.0?1ms/i.test(source)",
          },
        ],
      },
    ],
  },

  "css-core.checkpoint": {
    summary:
      "Turn unstyled semantic markup into a readable, resilient and keyboard-friendly component without a CSS recipe.",
    xp: 200,
    blocks: [
      {
        kind: "callout",
        body: "Checkpoint rules: make a visual plan, write the CSS from the brief, and inspect both the Preview and failed test names before opening the hint.",
      },
      {
        kind: "text",
        body: "A component should own its internal spacing and states without depending on where it happens to be placed. Prefer a class selector, `border-box`, relative units, a readable line length and an explicit focus style. The result should still work if its text becomes longer or the root font size changes.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which measurement is the best default for a card's readable text width?",
        options: ["A fixed 900px width", "A max-width in ch", "100vw", "An absolute position"],
        answer: 1,
        explanation:
          "ch limits approximate line length while still allowing the card to shrink on a narrow screen.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Complete the global sizing declaration that includes padding and borders inside declared widths.",
        before: "*, *::before, *::after { box-sizing: ",
        after: "; }",
        answer: "border-box",
        explanation: "border-box makes component sizing predictable.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Style a resilient product card",
        prompt:
          "Write the CSS for the supplied markup. Apply a global `border-box` reset. Give `body` rem-based text, at least `1.5` line-height, no default margin, and a light background. Centre `.product-card` with a max-width from 40ch to 65ch, rem padding, border and rounded corners—no fixed width. Keep the image inside the card. Make `.buy` an inline-flex action with relative-unit padding, at least `2.75rem` minimum height, dark-blue background and white text. Add a visible `.buy:focus-visible` outline. Use no ids, inline styles or `!important`.",
        language: "web",
        starter: `<style>
  /* Write the component styles from the brief. */
</style>

<main>
  <article class="product-card">
    <img src="shell.jpg" alt="Orange rain shell jacket with its hood raised">
    <p class="eyebrow">New for autumn</p>
    <h1>Rain Shell Jacket</h1>
    <p>Fully taped seams, a recycled face fabric and enough room for a warm layer.</p>
    <a class="buy" href="/rain-shell">View jacket</a>
  </article>
</main>`,
        hint: "Work from outside in: reset, body, card, image, action, focus state. Use `margin-inline: auto` to centre the card and `max-width` rather than width.",
        solution: `<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 2rem 1rem;
    font-size: 1rem;
    line-height: 1.6;
    color: #17202a;
    background: #f4f7f5;
  }
  .product-card {
    max-width: 55ch;
    margin-inline: auto;
    padding: 1.5rem;
    border: 0.1rem solid #b7c4bc;
    border-radius: 0.75rem;
    background: #fff;
  }
  .product-card img { max-width: 100%; height: auto; }
  .eyebrow { font-size: 0.875rem; }
  .buy {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    padding: 0.65em 1.1em;
    color: #fff;
    background: #174a72;
  }
  .buy:focus-visible { outline: 0.2rem solid #d97706; outline-offset: 0.2rem; }
</style>

<main>
  <article class="product-card">
    <img src="shell.jpg" alt="Orange rain shell jacket with its hood raised">
    <p class="eyebrow">New for autumn</p>
    <h1>Rain Shell Jacket</h1>
    <p>Fully taped seams, a recycled face fabric and enough room for a warm layer.</p>
    <a class="buy" href="/rain-shell">View jacket</a>
  </article>
</main>`,
        tests: [
          {
            name: "Uses border-box everywhere",
            expression:
              'style("body", "box-sizing") === "border-box" && style(".product-card", "box-sizing") === "border-box"',
          },
          {
            name: "Body typography and page spacing use resilient values",
            expression:
              '/rem$/.test(style("body", "font-size") || "") && parseFloat(style("body", "line-height") || "0") >= 1.5 && ["0", null].includes(style("body", "margin"))',
          },
          {
            name: "The card has a readable fluid width and internal spacing",
            expression:
              '(() => { const width = style(".product-card", "max-width") || ""; return /ch$/.test(width) && parseFloat(width) >= 40 && parseFloat(width) <= 65 && style(".product-card", "width") === null && /rem$/.test(style(".product-card", "padding-left") || "") && style(".product-card", "border") !== null; })()',
          },
          {
            name: "The image cannot overflow",
            expression: 'style(".product-card img", "max-width") === "100%"',
          },
          {
            name: "The action is large and legible",
            expression:
              'style(".buy", "display") === "inline-flex" && parseFloat(style(".buy", "min-height") || "0") >= 2.75 && style(".buy", "color") === "#fff" && style(".buy", "background") !== null',
          },
          {
            name: "Keyboard focus is explicitly visible",
            expression:
              "/\\.buy:focus-visible\\s*\\{[^}]*outline\\s*:/s.test(source) && !/outline\\s*:\\s*none/i.test(source)",
          },
          {
            name: "Avoids brittle overrides",
            expression:
              '!/<[^>]+style\\s*=/.test(source) && !/!\\s*important/i.test(source) && !/#[-_a-z]/i.test(source.replace(/#[0-9a-f]{3,8}\\b/gi, ""))',
          },
        ],
      },
    ],
  },

  "html-project.trail-guide": {
    summary:
      "Build and style a complete trail-guide page from a brief, then prove it works at phone and desktop widths.",
    xp: 280,
    blocks: [
      {
        kind: "callout",
        body: "This capstone begins with an empty document. It is the course's evidence of independent competence: plan the HTML outline, build the unstyled page, then add CSS from the outside in. Do not begin with the media query.",
      },
      {
        kind: "text",
        body: "A reliable build order is: meaningful content and controls; base typography and box sizing; intrinsic layouts that wrap or auto-fit; interaction states; then one breakpoint only where the content needs it. Check the phone preview after every layer instead of shrinking a desktop page at the end.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "When should you add the capstone's media query?",
        options: [
          "Before writing the HTML",
          "At standard iPhone and iPad pixel widths",
          "After the semantic page and intrinsic layouts work, at the width where the content needs a different arrangement",
          "Only after adding fixed widths everywhere",
        ],
        answer: 2,
        explanation:
          "Start fluid and let content choose the breakpoint; the query should solve a demonstrated layout need.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Complete the grid function that creates as many columns as fit without a breakpoint.",
        before: "grid-template-columns: repeat(auto-fit, ",
        after: ");",
        answer: "minmax(14rem, 1fr)",
        accept: ["minmax(12rem, 1fr)", "minmax(15rem, 1fr)", "minmax(16rem, 1fr)"],
        explanation: "auto-fit with minmax creates an intrinsic responsive grid.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Responsive trail guide",
        prompt:
          "From a blank editor, build “Pine Ridge Trail Guide”. Include a complete document; header with list-based nav; one main and h1; an introduction; at least three semantic trail cards with headings and meaningfully described images; a “Plan your walk” aside; and a labelled required email form with submit button in the footer. Style with global border-box, rem-based body text, readable line-height and no page overflow. Use flex for the wrapping header, an auto-fit/minmax grid for trail cards, responsive images, visible `:focus-visible` styles, and no pixel font sizes. The main `.guide-layout` should be one column by default and become content plus a 14rem-or-wider sidebar in one `min-width` breakpoint written in rem/em. Include a reduced-motion query.",
        language: "web",
        starter: `<!-- Independent capstone: build the complete document and styles from the brief. -->
`,
        hint: "Make a checklist from the brief. Build the semantic HTML first. For CSS: reset → body → header → cards grid → images/actions → focus → wide-screen guide layout → reduced motion. Run after each layer.",
        solution: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pine Ridge Trail Guide</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      body {
        margin: 0;
        font-size: 1rem;
        line-height: 1.6;
        color: #17251d;
        background: #f5f7f4;
      }
      a { color: #174f38; text-underline-offset: 0.15em; }
      a:focus-visible, button:focus-visible, input:focus-visible {
        outline: 0.2rem solid #d97706;
        outline-offset: 0.2rem;
      }
      .site-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem;
        background: #e4eee7;
      }
      .site-header nav ul {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .guide-layout {
        display: grid;
        gap: 2rem;
        width: min(100% - 2rem, 75rem);
        margin-inline: auto;
        padding-block: 2rem;
      }
      .intro { max-width: 65ch; }
      .trails {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
        gap: 1rem;
      }
      .trail-card {
        padding: 1rem;
        border: 0.1rem solid #b8c9bd;
        border-radius: 0.75rem;
        background: #fff;
      }
      img { display: block; max-width: 100%; height: auto; }
      aside { padding: 1rem; background: #e8f0e5; }
      footer { padding: 2rem 1rem; background: #173d2c; color: #fff; }
      footer form { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: end; }
      footer label { display: grid; gap: 0.25rem; }
      footer input, footer button { min-height: 2.75rem; padding: 0.65em 1em; font: inherit; }
      @media (min-width: 52rem) {
        .guide-layout { grid-template-columns: minmax(0, 2fr) minmax(14rem, 1fr); }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    </style>
  </head>
  <body>
    <header class="site-header">
      <strong>Pine Ridge</strong>
      <nav aria-label="Main navigation">
        <ul><li><a href="#trails">Trails</a></li><li><a href="#plan">Plan</a></li></ul>
      </nav>
    </header>
    <main class="guide-layout">
      <div>
        <div class="intro">
          <h1>Pine Ridge Trail Guide</h1>
          <p>Choose a route that matches your time, confidence and the day's conditions.</p>
        </div>
        <section id="trails" aria-labelledby="trails-heading">
          <h2 id="trails-heading">Choose a trail</h2>
          <div class="trails">
            <article class="trail-card"><img src="lake.jpg" alt="Boardwalk crossing a calm mountain lake"><h3>Lake Loop</h3><p>Easy · 4 km</p></article>
            <article class="trail-card"><img src="ridge.jpg" alt="Rocky ridge trail above the tree line"><h3>Ridge Path</h3><p>Hard · 9 km</p></article>
            <article class="trail-card"><img src="forest.jpg" alt="Wide forest trail beneath tall pine trees"><h3>Pine Walk</h3><p>Moderate · 6 km</p></article>
          </div>
        </section>
      </div>
      <aside id="plan">
        <h2>Plan your walk</h2>
        <p>Check weather, daylight and closures before leaving.</p>
      </aside>
    </main>
    <footer>
      <form action="/trail-updates" method="post">
        <label for="updates-email">Trail updates <input id="updates-email" name="email" type="email" autocomplete="email" required></label>
        <button type="submit">Get updates</button>
      </form>
    </footer>
  </body>
</html>`,
        tests: [
          {
            name: "Has a complete mobile-ready document",
            expression:
              '/^en/i.test($("html")?.getAttribute("lang") || "") && !!$("meta[charset]") && /width=device-width/.test($(\'meta[name="viewport"]\')?.getAttribute("content") || "") && /pine ridge/i.test(text("title"))',
          },
          {
            name: "Uses meaningful landmarks, navigation and heading structure",
            expression:
              '!!$("header nav ul li a") && $$("main").length === 1 && $$("main h1").length === 1 && $$("main h2").length >= 2 && !!$("main aside") && !!$("footer")',
          },
          {
            name: "Includes three semantic trail cards with useful images",
            expression:
              '$$(".trails article").length >= 3 && $$(".trails article h3").length >= 3 && $$(".trails img").length >= 3 && $$(".trails img").every((image) => (image.getAttribute("alt") || "").trim().length >= 10)',
          },
          {
            name: "Footer email form is labelled and usable",
            expression:
              '(() => { const email = $(\'footer input[type="email"][name="email"][required]\'); return !!email && !!labelOf(email) && !!$(\'footer button[type="submit"]\'); })()',
          },
          {
            name: "Uses resilient global sizing and typography",
            expression:
              'style("body", "box-sizing") === "border-box" && /rem$/.test(style("body", "font-size") || "") && parseFloat(style("body", "line-height") || "0") >= 1.5 && declared("font-size").every((value) => !/px/.test(value))',
          },
          {
            name: "Header wraps with flex and trail cards auto-fit with grid",
            expression:
              'style(".site-header", "display") === "flex" && style(".site-header", "flex-wrap") === "wrap" && style(".trails", "display") === "grid" && /^repeat\\(\\s*auto-(fit|fill)\\s*,\\s*minmax\\(/.test(style(".trails", "grid-template-columns") || "")',
          },
          {
            name: "Images and text remain contained",
            expression:
              'style("img", "max-width") === "100%" && /ch$/.test(style(".intro", "max-width") || "")',
          },
          {
            name: "Guide is one column on phones and content plus sidebar when wide",
            expression:
              'style(".guide-layout", "display", 375) === "grid" && [null, "none", "1fr"].includes(style(".guide-layout", "grid-template-columns", 375)) && /2fr/.test(style(".guide-layout", "grid-template-columns", 1024) || "")',
          },
          {
            name: "Uses a content-driven mobile-first width query",
            expression:
              "media().filter((query) => /width/.test(query)).length === 1 && media().filter((query) => /width/.test(query)).every((query) => /min-width\\s*:\\s*[\\d.]+r?em/.test(query))",
          },
          {
            name: "Keyboard focus and reduced motion are covered",
            expression:
              "/:focus-visible\\s*[,\\{]/.test(source) && /outline\\s*:/.test(source) && media().some((query) => /prefers-reduced-motion\\s*:\\s*reduce/.test(query))",
          },
        ],
      },
    ],
  },
};
