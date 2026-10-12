import { ATTESTED_XP } from "./gamification";
import type { LessonBody } from "./lessons";

/**
 * Figma for Product Teams.
 *
 * The work happens in Figma, which this platform cannot see — so the temptation
 * is to mark the whole course `attested` and hand out XP for a checkbox. Most of
 * it is not attested, because most of Figma is precise: hug and fill resize by
 * rules, a variant swap keeps an override only when the layer names match, a
 * mode applies at the frame it is set on. Those are facts a question can check,
 * and a learner who has them is measurably better at the tool.
 *
 * Only the capstone is `attested`: it is one long piece of work in the learner's
 * own file with nothing here to mark. It pays ATTESTED_XP and certifies nothing,
 * which is the honest description of a lesson whose evidence we never see.
 */
export const figmaLessonBodies: Record<string, LessonBody> = {
  "fig-core.frames": {
    summary:
      "Why a frame is not a group, and how constraints decide what moves when a frame changes size.",
    xp: 100,
    blocks: [
      {
        kind: "text",
        body: "A **group** has no size of its own. Its bounds are whatever its children happen to occupy, so it shrinks and grows as they do. A **frame** has its own width and height, and its children live inside that box. That single difference is why almost everything in Figma (auto layout, padding, corner radius, clipping, constraints, components) belongs to frames and not to groups.",
      },
      {
        kind: "text",
        body: "The practical rule: if a thing is a *container*, like a screen, a card, a button or a list row, make it a frame. Use a group only to drag a few shapes around together, like the parts of an icon. If you ever find yourself unable to add padding to something, it's a group.",
      },
      {
        kind: "text",
        body: "**Constraints** describe what a child does when its parent frame is resized. Each child has one horizontal and one vertical constraint. Horizontally: `Left`, `Right`, `Left and right`, `Center`, `Scale`. Vertically the same idea with `Top` and `Bottom`. `Left and right` is the one people forget. It pins both edges, so the child stretches with the frame instead of sitting still.",
      },
      {
        kind: "code",
        language: "text",
        caption: "A 400pt-wide card, dragged out to 600pt",
        code: `Avatar      Left,  Top            → stays at x:16, same size
Title       Left and right, Top   → stretches from 400 to 600
Close (×)   Right, Top            → stays 16pt from the right edge
Background  Left and right, Top and bottom → fills the card`,
      },
      {
        kind: "callout",
        body: "Constraints only do anything when the parent frame's size actually changes: when you drag its handles, when it's an instance being resized, or when it's a child of an auto layout frame being stretched. On a screen nobody ever resizes, they're inert.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "You've built a card and want 24pt of breathing room inside its edges, but the padding fields aren't there. What's most likely wrong?",
        options: [
          "The card needs to be a component first",
          "Padding only appears after you add a fill",
          "You need to turn on Clip content",
          "The card is a group, and groups have no padding",
        ],
        answer: 3,
        explanation:
          "Padding is a frame property, and a group has no box of its own to pad. Select it and press ⌘⌥G (Ctrl+Alt+G) to wrap it in a frame, or Frame selection from the right-click menu.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "A close button sits 16pt from the right edge of a dialog. The dialog gets wider and the button drifts into the middle. Which constraint was it on?",
        options: ["Right", "Left", "Left and right", "Center"],
        answer: 1,
        explanation:
          "On `Left`, the button holds its distance from the *left* edge, so widening the frame leaves it behind. `Right` keeps its 16pt gap from the right edge no matter how wide the dialog gets.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the horizontal constraint that pins a child to both edges so it stretches with its parent.",
        before: "Horizontal constraint: ",
        after: "",
        answer: "left and right",
        accept: ["left & right", "left-and-right"],
        explanation:
          "`Left and right` holds both gaps constant, so the child's width changes with the frame's. It's how a title bar or a divider spans a resizable card.",
      },
      {
        kind: "callout",
        body: "**Do it in Figma:** draw a 400×200 frame, put a rectangle, a title and a small circle in it, and give each one a different constraint. Now drag the frame's right handle out to 700 and watch which pieces move, stretch or stay. Undo, change the constraints, do it again.",
      },
    ],
  },

  "fig-core.autolayout": {
    summary:
      "Hug, fill and fixed: the three resizing modes that decide whether a layout survives real content.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "Auto layout turns a frame into a row or a column that arranges its own children: a direction, a gap between items, padding inside the edges, and an alignment. If you know flexbox, it is flexbox, with the same trade-offs and the same failure modes.",
      },
      {
        kind: "text",
        body: "The part that decides whether your file holds up is **resizing**. Every child of an auto layout frame has a resizing mode on each axis, and there are only three:\n\n- **Fixed:** this many points, whatever happens.\n- **Hug contents:** shrink to exactly fit what's inside. Only frames and text can hug.\n- **Fill container:** take whatever space is left in the parent. Only offered when the parent is an auto layout frame.",
      },
      {
        kind: "code",
        language: "text",
        caption: "A list row that behaves: horizontal auto layout, 12pt gap, 16pt padding",
        code: `Row              Fill  × Hug     ← full width, height follows content
  Avatar         Fixed × Fixed   40×40, never squashed
  Text column    Fill  × Hug     ← takes the leftover width
    Name         Fill  × Hug     wraps instead of overflowing
    Subtitle     Fill  × Hug
  Chevron        Fixed × Fixed   16×16`,
      },
      {
        kind: "text",
        body: "**Nearly every broken layout is one of these three.** A name that overflows its card is a text layer left on Hug. It grows on one line forever, so set it to Fill and it wraps. An icon that squashes when the label gets long is on Fill, competing for space; set it Fixed. A card that clips its own content is Fixed height; set it to Hug vertically and it grows as the content does.",
      },
      {
        kind: "text",
        body: "Three more controls worth knowing. **Min and max width** let something fill *within limits*, which is how you stop a line of text stretching to 1400pt on a wide screen. **Absolute position** (the crosshair icon) takes a child out of the flow entirely so it can float, like a badge on an avatar. And setting the gap to **Auto** switches the frame to space-between, pushing the first and last child to the edges.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A product card looks right with “Mug”, but “Hand-thrown stoneware mug, 400ml” spills past the card's edge. What fixes it?",
        options: [
          "Set the card to Clip content",
          "Reduce the text layer's font size",
          "Set the text layer's horizontal resizing to Fill container",
          "Give the card a fixed width",
        ],
        answer: 2,
        explanation:
          "The text is hugging, so it grows on one line forever. On Fill it takes the width the card offers and wraps inside it. Clip content would hide the overflow rather than fix it, and the long name would silently lose its ending.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "You select a layer and “Fill container” is greyed out. What does that tell you?",
        options: [
          "The layer is a group",
          "The layer is locked",
          "The layer already has a fixed width",
          "Its parent is not an auto layout frame, so there is no container to fill",
        ],
        answer: 3,
        explanation:
          "Fill is a statement about space the parent is distributing, so it only exists inside an auto layout frame. Add auto layout to the parent and the option appears.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Name the resizing mode that makes a frame shrink to exactly fit its children.",
        before: "Vertical resizing: ",
        after: " contents",
        answer: "hug",
        explanation:
          "Hug is how a card grows with its own content instead of clipping it or leaving a gap. Fixed pins the size, Fill takes the parent's leftover space.",
      },
      {
        kind: "callout",
        body: "**Do it in Figma:** build the list row above: avatar, two lines of text, chevron. Then paste a 60-character name into it. If anything overflows, squashes or clips, one of the three modes is wrong. Fix it without changing the font size.",
      },
    ],
  },

  "fig-core.checkpoint": {
    summary:
      "Apply frames, constraints and the three resizing modes to a card that has to survive real data.",
    xp: 140,
    blocks: [
      {
        kind: "text",
        body: "A checkpoint, so nothing new here. It's just the rules from the last two lessons applied to a spec you have not seen. Read the brief, decide what each layer needs, then answer.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Brief: a notification card, used in a sidebar that the user can drag wider",
        code: `Card
  ├─ Icon          24×24, always exactly this size
  ├─ Body (column)
  │    ├─ Title    one to nine words, must wrap, never truncate
  │    └─ Time     "2 min ago", always one short line
  └─ Dismiss (×)   24×24, must stay at the top-right corner

The card is full width in the sidebar.
Its height depends on how long the title turns out to be.`,
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What should the card's own resizing be, horizontally × vertically?",
        options: ["Fill × Hug", "Fill × Fill", "Hug × Hug", "Fixed × Fixed"],
        answer: 0,
        explanation:
          "Full width in the sidebar is Fill horizontally. “Height depends on the title” is Hug vertically. The card grows as its content does, which is the whole reason the title is allowed to wrap.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "The title truncates to one line when the sidebar is narrow. Which single change fixes it?",
        options: [
          "Set the Body column to Hug horizontally",
          "Set the Title to Fill container horizontally",
          "Turn off Clip content on the card",
          "Give the Title a fixed width",
        ],
        answer: 1,
        explanation:
          "A title that must wrap has to be told how wide it is allowed to be, and Fill says “as wide as the column gives me”. Hug would let it run on one line and push the card apart instead.",
      },
      {
        kind: "mcq",
        id: "q3",
        question:
          "The icon is set to Fill container horizontally. What goes wrong when the title gets long?",
        options: [
          "The icon stays 24pt and the title wraps",
          "The icon disappears",
          "The icon and title split the width, so the icon stretches and distorts",
          "Nothing, because Fill has no effect on a 24pt layer",
        ],
        answer: 2,
        explanation:
          "Two Fill children share the available width between them. Anything with a deliberate size, like icons, avatars and chevrons, should be Fixed, so the one flexible element gets all the leftover space.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "The dismiss button must stay in the top-right corner as the card widens. Give its horizontal constraint (this card is a plain frame, not auto layout).",
        before: "Horizontal constraint: ",
        after: "",
        answer: "right",
        explanation:
          "`Right` holds the gap to the right edge constant. Inside an auto layout row you would get the same result differently, by making the middle column Fill so it absorbs all the extra width.",
      },
      {
        kind: "callout",
        body: "**Do it in Figma:** build the card to the brief, then test it honestly. Drag it from 240pt to 600pt wide, and swap the title for a nine-word one and back to two words. It passes when nothing overflows, clips, distorts or leaves a strange gap at any width.",
      },
    ],
  },

  "fig-system.components": {
    summary:
      "Main components, instances, overrides and variants, and why a swap sometimes loses your text.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "A **main component** is the definition. An **instance** is a copy that keeps a link back to it: change the main, and every instance everywhere updates. That link is the entire value, and the most common mistake in a Figma file is quietly breaking it.",
      },
      {
        kind: "text",
        body: "On an instance you can change some things without breaking anything. These are **overrides**: text content, fills and strokes, visibility of a layer, and swapping a nested instance. What you cannot do is add or delete layers. For that, Figma offers **Detach instance**, which turns the copy into ordinary layers and severs the link for good. A detached instance will never receive another update. Treat detaching as a last resort, and if you find yourself doing it often, the component is missing a property.",
      },
      {
        kind: "text",
        body: "**Variants** collect related components into one **component set**. Instead of `Button/Primary/Large`, `Button/Primary/Small`, `Button/Ghost/Large` scattered across the canvas, you get one component with properties (`Type: Primary | Ghost`, `Size: Large | Small`) and a dropdown on every instance. Figma builds the properties from the slash-separated names when you combine them, which is why naming matters before you combine, not after.",
      },
      {
        kind: "code",
        language: "text",
        caption: "One component set, four variants, two properties",
        code: `Button (component set)
  Type=Primary, Size=Large
  Type=Primary, Size=Small
  Type=Ghost,   Size=Large
  Type=Ghost,   Size=Small

On an instance the designer sees two dropdowns, not sixteen components.`,
      },
      {
        kind: "callout",
        body: "**The override rule that bites everyone:** when you switch an instance from one variant to another, Figma carries overrides across by matching **layer names**. If the label is called `Label` in one variant and `Text` in the other, your carefully typed text resets to the default. Keep layer names identical across every variant in a set.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A designer needs one more line of text inside a card instance, so they detach it. What have they given up?",
        options: [
          "Nothing, detaching is reversible later",
          "All future updates to that card. The copy no longer follows the main component",
          "Only the ability to change its colour",
          "The card's auto layout settings",
        ],
        answer: 1,
        explanation:
          "Detaching is permanent for that copy. The better fix is a property on the main component, such as a boolean that shows an optional second line, so every instance can opt in without leaving the system.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "You switch a button instance from Primary to Ghost and the label snaps back to “Button”, losing “Save changes”. What is the cause?",
        options: [
          "The text layer has different names in the two variants, so the override could not be matched",
          "Ghost variants cannot hold text overrides",
          "The instance needed to be detached first",
          "Text overrides never survive a variant swap",
        ],
        answer: 0,
        explanation:
          "Overrides travel by layer name. Rename the text layer to the same thing in every variant (`Label` in all of them) and the swap keeps what the designer typed.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the action that turns an instance into plain layers and cuts its link for good.",
        before: "Right-click an instance → ",
        after: " instance",
        answer: "detach",
        explanation:
          "Detach is the one-way door. If a component needs detaching to be useful, it usually needs a boolean, text or instance-swap property instead.",
      },
      {
        kind: "callout",
        body: "**Do it in Figma:** build a button, make Primary and Ghost versions, name the text layer differently in each on purpose, combine them as variants, then type a label on an instance and switch variants. Watch it reset. Rename both layers to `Label` and try again.",
      },
    ],
  },

  "fig-system.properties": {
    summary:
      "Boolean, text, instance-swap and variant properties: the cure for a component set with forty variants.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "Variants describe what a component *is*: primary or ghost, large or small. **Component properties** describe what a particular instance *shows*. Confusing the two is how a button ends up with forty variants, one for every combination of leading icon, trailing icon and badge.",
      },
      {
        kind: "text",
        body: "There are four kinds:\n\n- **Boolean:** show or hide a layer. One checkbox replaces the “with icon / without icon” variant split.\n- **Text:** expose a text layer's content in the properties panel, so it's editable without hunting through the layer tree.\n- **Instance swap:** let the instance choose which component sits in a slot. This is how you build a card that accepts any icon, or a list that accepts any row.\n- **Variant:** the dropdowns from the last lesson, for genuinely different states.",
      },
      {
        kind: "code",
        language: "text",
        caption: "The same button, before and after properties",
        code: `Before: 24 variants
  Type × Size × HasLeadingIcon × HasTrailingIcon

After: 4 variants + 3 properties
  Type=Primary|Ghost, Size=Large|Small
  ⊕ Leading icon   boolean
  ⊕ Trailing icon  boolean
  ⊕ Label          text`,
      },
      {
        kind: "text",
        body: "**Instance swap is the one worth learning properly.** Give a slot a default instance, expose it as a swap property, and point its **preferred values** at the component set it should offer. The designer using it gets a short, correct menu instead of a search across every component in the file. Nested instances can also be exposed, so a card's inner button shows its own properties on the card's panel without anyone selecting into it.",
      },
      {
        kind: "callout",
        body: "A rough test for whether something should be a variant or a property: if the two options would ever appear in the same design side by side, and the difference is *what's in it* rather than *what it is*, make it a property. States (hover, disabled, selected) are variants. Optional pieces are booleans. Interchangeable pieces are swaps.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "A card component needs to accept any of twelve icons. Which property type fits?",
        options: [
          "A variant property with twelve values",
          "Twelve boolean properties, one per icon",
          "A text property containing the icon name",
          "An instance swap property with the icon set as its preferred values",
        ],
        answer: 3,
        explanation:
          "Instance swap is exactly this: a slot whose occupant the instance chooses. Twelve variants would multiply against every other variant in the set, and twelve booleans would let a designer switch on two icons at once.",
      },
      {
        kind: "mcq",
        id: "q2",
        question: "Which of these genuinely belongs as a variant rather than a component property?",
        options: [
          "Whether the button shows a trailing chevron",
          "The button's label text",
          "Whether the button is in its disabled state",
          "Which icon sits in the leading slot",
        ],
        answer: 2,
        explanation:
          "Disabled is a different *state* of the button, with its own colours and no hover, so that's a variant. The other three are all “what's in this particular instance”: a boolean, a text property and a swap.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the property type that shows or hides a layer, so “with icon” stops being a separate variant.",
        before: "Property type: ",
        after: "",
        answer: "boolean",
        explanation:
          "A boolean property binds to a layer's visibility. Two booleans replace a four-way variant split, and they don't multiply against your real states.",
      },
      {
        kind: "callout",
        body: "**Do it in Figma:** take a button with leading and trailing icons, and delete every variant that exists only because an icon is present or absent. Replace them with two boolean properties and one instance swap. Count the variants before and after.",
      },
    ],
  },

  "fig-system.variables": {
    summary:
      "Collections, modes and aliases: how one file themes itself instead of being restyled by hand.",
    xp: 140,
    blocks: [
      {
        kind: "text",
        body: "A **variable** is a named value you can reuse and re-point: `color/bg/surface`, `space/200`, `radius/card`. Change the variable and everything bound to it changes. That much is what colour styles already did. What variables add is **modes**.",
      },
      {
        kind: "text",
        body: "Variables live in **collections**, and a collection can have several modes, such as `Light` and `Dark`, or `Desktop` and `Mobile`. Every variable in the collection holds one value *per mode*. You then set a mode on a frame, and everything inside it resolves through that mode. One set of screens, themed by a dropdown, with no duplicate pages to keep in sync.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Two collections: raw values, then meaning",
        code: `Primitives (one mode)
  slate/900   #0B1220
  slate/50    #F8FAFC
  blue/500    #3B82F6

Semantic (modes: Light, Dark)
  bg/surface      Light → slate/50    Dark → slate/900
  text/primary    Light → slate/900   Dark → slate/50
  action/default  Light → blue/500    Dark → blue/500

Layers bind to the semantic names, never to slate/900 directly.`,
      },
      {
        kind: "text",
        body: "That two-layer arrangement is **aliasing**: a semantic variable points at a primitive rather than holding a hex value. It's worth the extra step because it gives you somewhere to say *why* a colour is what it is. `bg/surface` survives a rebrand; `slate/50` sprinkled across two hundred layers does not.",
      },
      {
        kind: "text",
        body: "Two more things to know. Variables come in four types (**Color, Number, String and Boolean**), so spacing, corner radius, and even a text string can be a variable, not just colour. And **scoping** limits where a variable is offered: scope `space/200` to padding and gap and it stops appearing in the colour picker, which is how you keep the list usable at a few hundred variables.",
      },
      {
        kind: "callout",
        body: "**Variables are not a replacement for styles.** A type style bundles family, size, weight, line height and letter spacing into one named thing, and effect styles do the same for shadows. Use styles for those bundles and variables for single values that need to change by mode. Most mature files use both.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "Your dark-mode screens are correct except one card, which stays light. What is the most likely cause?",
        options: [
          "The card's fill is bound to a primitive like slate/50 instead of a semantic variable with modes",
          "Dark mode has to be applied to every layer individually",
          "The card is a component instance, and instances ignore modes",
          "The collection is missing a Light mode",
        ],
        answer: 0,
        explanation:
          "A primitive has the same value in every mode, so it can't change. Rebind the fill to `bg/surface`, which resolves differently per mode. The same symptom appears when a nested frame has an explicit mode set that overrides the one above it.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "Why point `text/primary` at `slate/900` rather than typing the hex value into it?",
        options: [
          "Aliases render faster",
          "Hex values cannot be used in variables",
          "One change to the primitive updates every semantic variable built on it, and the semantic name records the intent",
          "Figma requires two collections",
        ],
        answer: 2,
        explanation:
          "The alias layer is where a rebrand happens: repoint `slate/900` once instead of editing every semantic variable. It also means a reader can tell `text/primary` from `border/subtle` when both happen to be the same grey today.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the per-collection setting that lets one variable hold a different value for Light and Dark.",
        before: "Collection ",
        after: "",
        answer: "modes",
        accept: ["mode"],
        explanation:
          "A mode is a column of values in the collection. Applying a mode to a frame makes everything inside it resolve through that column.",
      },
      {
        kind: "callout",
        body: "**Do it in Figma:** make a Primitives collection with three greys, a Semantic collection with Light and Dark modes aliasing them, and bind one screen's background and text to the semantic names. Switch the frame's mode. Anything that doesn't flip is bound to the wrong layer.",
      },
    ],
  },

  "fig-proto.prototype": {
    summary:
      "Flows, triggers and Smart Animate: building something testable without asking an engineer first.",
    xp: 120,
    blocks: [
      {
        kind: "text",
        body: "A prototype exists to answer a question: can someone find the filter, do they understand what “archive” will do, does this three-step form feel long. Build the smallest thing that answers it. A prototype that covers every screen is a second product to maintain, and it will be out of date by Thursday.",
      },
      {
        kind: "text",
        body: "Connections have a **trigger** and an **action**. Triggers include `On click`, `On drag`, `While hovering`, `While pressing`, `After delay` and key presses. Actions include `Navigate to`, `Open overlay`, `Swap with`, `Back`, `Close overlay`, `Scroll to`, `Open link` and `Set variable`. A **flow** is a named starting point, so one file can hold “Sign up” and “Checkout” as separate runs rather than one tangle.",
      },
      {
        kind: "text",
        body: "**Smart Animate** is the one with a rule worth memorising: it matches layers between the two frames **by name**, then tweens the differences in position, size, opacity and rotation. Same name, smooth movement. Renamed or restructured, and it cross-fades instead. When a transition looks wrong, the layer names are almost always the reason.",
      },
      {
        kind: "code",
        language: "text",
        caption: "A three-connection prototype that answers one question",
        code: `Flow: "Archive a conversation"

Inbox        On click  "Archive" → Open overlay: Confirm
Confirm      On click  "Cancel"  → Close overlay
Confirm      On click  "Archive" → Navigate to: Inbox (archived)

Everything else on the Inbox screen is deliberately dead.`,
      },
      {
        kind: "callout",
        body: "Overlays are for things that sit on top and can be dismissed, like dialogs, sheets and menus. Use `Close overlay` rather than navigating back to the underlying screen, or the scroll position underneath resets and testers notice.",
      },
      {
        kind: "text",
        body: "For anything stateful (a toggle that stays on, a counter, a form that remembers an answer), set a variable on click and use **conditional** actions to branch on it. This is also how you avoid duplicating a screen for every combination of selected filters.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "A card should glide from the list into place on the detail screen, but it cross-fades instead. What do you check first?",
        options: [
          "That both frames are the same size",
          "That the layer has the same name in both frames",
          "That the transition duration is long enough",
          "That the card is a component instance",
        ],
        answer: 1,
        explanation:
          "Smart Animate pairs layers by name. Different names mean no pair, so there is nothing to tween and Figma falls back to a dissolve. Matching the names usually fixes it outright.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "A confirmation dialog is opened as an overlay. Which action returns to the screen underneath with its scroll position intact?",
        options: [
          "Navigate to the underlying frame",
          "Back",
          "Swap with the underlying frame",
          "Close overlay",
        ],
        answer: 3,
        explanation:
          "`Close overlay` removes the layer on top and leaves the screen beneath exactly as it was. Navigating to that frame loads it afresh, which resets scroll and any state, and testers read that as a bug.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the prototype feature that tweens matching layers between two frames rather than cross-fading them.",
        before: "Transition: ",
        after: "",
        answer: "smart animate",
        accept: ["smart-animate"],
        explanation:
          "It matches by layer name, then animates the differences in position, size, opacity and rotation.",
      },
      {
        kind: "callout",
        body: "**Do it in Figma:** build the three-connection archive flow above and hand it to someone without saying a word about it. Note every place they click that does nothing. That list is the real finding, not your transitions.",
      },
    ],
  },

  "fig-proto.testing": {
    summary: "Why five people is usually enough, and how to ask without telling them the answer.",
    xp: 110,
    blocks: [
      {
        kind: "text",
        body: "The reason small tests work is that usability problems are not evenly distributed. The first few participants hit the obvious ones, and each extra person finds fewer that are new. Nielsen Norman Group's long-standing rule of thumb is that around five users surface the large majority of problems in a given design, and that running two small rounds beats one big one, because you get to fix things in between. It is a planning heuristic, not a law: a product with genuinely different user groups needs a handful from each.",
      },
      {
        kind: "text",
        body: "**Give tasks, not opinions.** “What do you think of this screen?” produces politeness. “You've been charged twice this month. Sort it out.” produces behaviour. Write the task as the situation the person is in, never as the steps they should take. The moment you say “go to Settings” you have tested nothing.",
      },
      {
        kind: "code",
        language: "text",
        caption: "The same intent, written three ways",
        code: `Leading:  "Tap the Billing tab and cancel your plan."
Vague:    "Have a look around the settings."
Good:     "You've decided to stop paying for this.
           Show me what you'd do."`,
      },
      {
        kind: "text",
        body: "**Then say almost nothing.** Silence is the instrument. When someone pauses, count to five before you speak; most people resume and narrate the exact confusion you needed to hear. When they ask “should I click this?”, hand it back: “What would you do if I weren't here?” Answering the question ends the test.",
      },
      {
        kind: "callout",
        body: "Record where people hesitate, what they say just before they get stuck, and the words they use for things. That vocabulary is free interface copy. What someone predicts they'd do later, or how much they liked it, is the least reliable thing in the session.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which task description will tell you the most about your navigation?",
        options: [
          "“A mug arrived broken. Get a replacement.”",
          "“Open the Orders page and find order 1182.”",
          "“Do you find this menu easy to understand?”",
          "“Click anywhere you think looks interesting.”",
        ],
        answer: 0,
        explanation:
          "It gives a goal and no route, so how they get there is the finding. The first names the destination, the third asks for an opinion, and the fourth gives them nothing to succeed or fail at.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "A participant stops and says “Hmm, I'm not sure what this does.” What's the best response?",
        options: [
          "Explain what the control does and let them continue",
          "Say nothing for a few seconds, then ask what they expected it to do",
          "Ask whether they'd like to skip to the next task",
          "Note it as a failure and move on",
        ],
        answer: 1,
        explanation:
          "The pause is the data. Explaining ends the test and replaces their understanding with yours; asking what they expected tells you what the control should have been called.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Complete the rule of thumb for how many participants surface the large majority of usability problems in one round.",
        before: "About ",
        after: " participants per round",
        answer: "5",
        accept: ["five"],
        explanation:
          "Five per round, twice, beats ten in one go. The second round tests the fixes rather than re-finding the same problems.",
      },
      {
        kind: "callout",
        body: "**Do it for real:** write three task descriptions for your own prototype, check each one names a situation and never a control, and run them past one person today. Count how many times you were tempted to help.",
      },
    ],
  },

  "fig-handoff.devmode": {
    summary:
      "Mark work ready, annotate what the file cannot show, and cover the states nobody designs.",
    xp: 150,
    blocks: [
      {
        kind: "text",
        body: "Handoff fails in a predictable way. The file has one beautiful screen with plausible data, and every question an engineer actually has (what happens with no results, what the error says, how wide before it wraps, which token this grey is) has to be asked in Slack and answered from memory.",
      },
      {
        kind: "text",
        body: "**Dev Mode** is the engineer's view of the file: measurements between any two layers, the resolved values of a selection, assets to export, and a diff of what changed since they last looked. Two habits make it worth having. Mark sections **Ready for dev**, so it's unambiguous which frames are real and which are Tuesday's experiment. And use **annotations** to pin the things the canvas cannot express: behaviour, constraints, the rule behind the layout.",
      },
      {
        kind: "callout",
        body: "Dev Mode's generated CSS is a reading aid, not a spec. It describes the rectangles you drew, not the component in the codebase, and it will happily emit a hard-coded hex and a magic pixel value. Where you've bound variables, those surface as named tokens, which is the part worth copying.",
      },
      {
        kind: "text",
        body: "**Then design the states.** For almost any surface that loads data, there are five beyond the happy path, and they are where the bugs live:\n\n- **Empty:** nothing here yet, and what to do about it.\n- **Loading:** what fills the space while waiting.\n- **Error:** what failed, and what the person can do next.\n- **Extremes:** one character, ninety characters, 1,240 items.\n- **Permissions:** what someone who can't edit this sees.",
      },
      {
        kind: "code",
        language: "text",
        caption: "An annotation that prevents a Slack thread",
        code: `Orders table · annotation

Sort: default is newest first. Sorting is server-side,
so the empty state below applies while a sort is loading.

Row height is fixed at 56 even when the customer name wraps:
the name truncates with an ellipsis at one line. Full name
is in the row's tooltip.`,
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "Dev Mode shows `background: #F8FAFC` for a card you know is bound to `bg/surface`. What should the engineer build with?",
        options: [
          "The hex value, since that's what Dev Mode generated",
          "Either. They resolve to the same colour",
          "The `bg/surface` token, because the hex is only its value in the current mode",
          "The hex, with a comment naming the token",
        ],
        answer: 2,
        explanation:
          "The hex is that token's value in *this* mode. Hard-code it and the card stops responding to the theme, and the dark-mode bug arrives weeks later, in one component nobody remembers touching.",
      },
      {
        kind: "mcq",
        id: "q2",
        question:
          "Which of these does an annotation earn its place for, rather than the canvas showing it already?",
        options: [
          "That the list keeps its scroll position when a row is deleted",
          "The gap between two cards",
          "The heading's font size",
          "The button's corner radius",
        ],
        answer: 0,
        explanation:
          "The first, second and fourth are measurable from the file. Behaviour over time (what persists, what animates, what happens after an action) is invisible on a canvas, and it's exactly what gets guessed wrong.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt:
          "Name the state a data-backed screen needs for a user who has not created anything yet.",
        before: "The ",
        after: " state",
        answer: "empty",
        explanation:
          "The empty state is the first thing every new user sees and the last thing anyone designs. It should say what goes here and give them the one action that starts it.",
      },
      {
        kind: "callout",
        body: "**Do it in Figma:** take a screen you've already designed, mark it Ready for dev, and add the five states beside it. Then add one annotation describing something that happens *over time* rather than something you could measure with the ruler.",
      },
    ],
  },

  "fig-handoff.capstone": {
    summary:
      "Take one feature from brief to a handoff an engineer could build from without asking you a question.",
    xp: ATTESTED_XP,
    attested: true,
    blocks: [
      {
        kind: "text",
        body: "One feature, start to finish, in your own Figma file. Pick something small and real: a saved-searches panel, a bulk-actions bar, an invite-teammates dialog. Small enough to finish, real enough that the states matter.",
      },
      {
        kind: "code",
        language: "text",
        caption: "What finished looks like",
        code: `1  Layout      Auto layout throughout. Every card and row survives
               a 60-character string and a 240→600pt width change.

2  System      Components with properties, not a variant per
               combination. No detached instances.

3  Variables   Colours bound to semantic variables with Light and
               Dark modes. Both modes checked on every frame.

4  Prototype   One named flow that answers one question.

5  States      Empty, loading, error, extremes, permissions.

6  Handoff     Marked Ready for dev, with at least two annotations
               covering behaviour the canvas cannot show.`,
      },
      {
        kind: "callout",
        body: "**This one is self-reported.** The work lives in your Figma file, which this platform never sees, so nothing here is marked and it earns a small fixed amount of XP and no certificate. That is the honest description of work we cannot check. The value is the file you end up with, and the evidence is a link you can send someone.",
      },
      {
        kind: "text",
        body: "**Keep this as evidence:** a share link to the file, and a short note naming the one question your prototype was built to answer and what the answer turned out to be. That note is the difference between a portfolio piece and a screenshot.",
      },
      {
        kind: "text",
        body: "**The test for whether it's done:** hand the link to someone who was not in any of your conversations about it, and ask them to tell you what happens when the list is empty and what the grey border is called. If they can answer both from the file, you're finished.",
      },
    ],
  },
};
