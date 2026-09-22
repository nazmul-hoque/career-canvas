import { claudeCourse } from "./claude-course";
import { chatgptCourse } from "./chatgpt-course";
import { DEFAULT_HOURS_PER_WEEK } from "./gamification";
import { projectById } from "./projects";

export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

export interface LessonMeta {
  id: string;
  title: string;
  minutes: number;
  type: "concept" | "practice" | "challenge" | "project";
}

export interface ModuleMeta {
  id: string;
  title: string;
  summary: string;
  lessons: LessonMeta[];
}

export interface Course {
  id: string;
  title: string;
  skill: string;
  level: SkillLevel;
  recommended: boolean;
  /**
   * What the course calls its units and their groups. Independent fields
   * because they are independent facts: the operator courses teach lessons,
   * and they group them into levels rather than modules.
   */
  unitLabel?: "lessons" | "tasks";
  sectionLabel?: "modules" | "levels";
  summary: string;
  description: string;
  skills: string[];
  careers: string[];
  modules: ModuleMeta[];
}

export interface CareerPath {
  id: string;
  name: string;
  tagline: string;
  overview: string;
  difficulty: SkillLevel;
  skills: string[];
  courseIds: string[];
  projectIds: string[];
  popular?: boolean;
}

const m = (
  id: string,
  title: string,
  summary: string,
  lessons: [string, string, number, LessonMeta["type"]][],
): ModuleMeta => ({
  id,
  title,
  summary,
  lessons: lessons.map(([lid, ltitle, minutes, type]) => ({
    id: `${id}.${lid}`,
    title: ltitle,
    minutes,
    type,
  })),
});

export const courses: Course[] = [
  claudeCourse,
  chatgptCourse,
  {
    id: "html-css",
    title: "HTML & CSS Foundations",
    skill: "HTML & CSS",
    level: "Beginner",
    recommended: true,
    summary: "Structure and style real pages from the very first lesson.",
    description:
      "Start where every interface starts. Learn one layer at a time, prove it in low-scaffold checkpoints, then ship an accessible responsive page that holds up on a phone and a 27-inch monitor.",
    skills: [
      "Semantic HTML",
      "CSS selectors",
      "Flexbox",
      "CSS Grid",
      "Responsive design",
      "Accessible interaction",
    ],
    careers: ["frontend", "fullstack", "uxui"],
    modules: [
      m(
        "html-basics",
        "Markup that means something",
        "Tags, structure, and why semantics matter.",
        [
          ["intro", "How a browser reads your page", 15, "practice"],
          ["tags", "Semantic tags in practice", 16, "practice"],
          ["forms", "Forms and inputs", 18, "challenge"],
          ["checkpoint", "Checkpoint: accessible event page", 25, "challenge"],
        ],
      ),
      m("css-core", "Styling fundamentals", "The cascade, the box model, and modern units.", [
        ["selectors", "Write and target CSS rules", 16, "practice"],
        ["cascade", "The cascade without the mystery", 18, "challenge"],
        ["boxmodel", "Box model and spacing", 16, "practice"],
        ["units", "rem, em, and fluid units", 16, "challenge"],
        ["accessibility", "Focus, contrast and motion", 20, "practice"],
        ["checkpoint", "Checkpoint: accessible product card", 25, "challenge"],
      ]),
      m("layout", "Layout systems", "Flexbox and grid, side by side.", [
        ["flexbox", "Flexbox basics", 18, "practice"],
        ["grid", "Grid vs flex", 18, "challenge"],
        ["responsive", "Responsive layouts", 18, "challenge"],
        ["media", "Media queries", 18, "challenge"],
      ]),
      m("html-project", "Independent project", "Combine every layer in one real page.", [
        ["trail-guide", "Capstone: responsive trail guide", 45, "challenge"],
      ]),
    ],
  },
  {
    id: "javascript",
    title: "JavaScript From Zero",
    skill: "JavaScript",
    level: "Beginner",
    recommended: true,
    summary: "Write real logic: values, functions, arrays, objects, and the DOM.",
    description:
      "The language of the web, taught by writing it. Learn each layer in tested exercises, prove it in low-scaffold checkpoints, then build an asynchronous browser interface from a fresh brief.",
    skills: [
      "Variables & types",
      "Functions",
      "Arrays & objects",
      "DOM",
      "Debugging",
      "Async basics",
      "Browser workflow",
    ],
    careers: ["frontend", "fullstack", "ai"],
    modules: [
      m("js-basics", "Values and logic", "The building blocks you will use every day.", [
        ["values", "Variables, types and truthiness", 15, "practice"],
        ["functions", "Functions and return values", 16, "practice"],
        ["conditionals", "Conditionals and guard clauses", 16, "challenge"],
        ["checkpoint", "Checkpoint: checkout calculator", 22, "challenge"],
      ]),
      m("js-data", "Working with data", "Arrays and objects, the workhorses of JS.", [
        ["arrays", "Arrays and iteration", 18, "practice"],
        ["objects", "Objects and destructuring", 18, "practice"],
        ["transform", "map, filter, reduce", 20, "challenge"],
        ["checkpoint", "Checkpoint: order summary", 25, "challenge"],
      ]),
      m("js-debug", "Debugging like a professional", "Read the error, form a theory, test it.", [
        ["errors", "Reading stack traces", 16, "challenge"],
        ["fixit", "Debug the cart total", 20, "challenge"],
      ]),
      m("js-browser", "Inside the browser", "Load scripts deliberately and debug the real page.", [
        ["run", "Run JavaScript in a browser", 18, "practice"],
      ]),
      m("js-dom", "The DOM", "Make the page respond to people.", [
        ["select", "Selecting and updating elements", 18, "practice"],
        ["events", "Events and state", 22, "challenge"],
        ["checkpoint", "Checkpoint: packing list", 30, "challenge"],
      ]),
      m("js-async", "Asynchronous code", "Promises, async/await and waiting well.", [
        ["async", "Promises and async/await", 20, "challenge"],
      ]),
      m("js-project", "Independent project", "Combine state, the DOM and asynchronous work.", [
        ["catalog", "Capstone: product search", 45, "challenge"],
      ]),
    ],
  },
  {
    id: "react",
    title: "React in Practice",
    skill: "React",
    level: "Intermediate",
    recommended: true,
    summary: "Components, state and data fetching, built the way teams actually build.",
    description:
      "Move from page-level thinking to component thinking. Practise each layer, prove it in low-scaffold checkpoints, then ship an accessible asynchronous support interface from a fresh brief.",
    skills: [
      "Components",
      "Props & state",
      "Hooks",
      "Lists & keys",
      "Data fetching",
      "Composition",
      "Reducers",
      "Accessibility",
      "Component testing",
    ],
    careers: ["frontend", "fullstack"],
    modules: [
      m("react-core", "Thinking in components", "Split a screen into parts that compose.", [
        ["first", "Your first component", 18, "practice"],
        ["props", "Props and composition", 18, "practice"],
        ["state", "State and re-renders", 22, "challenge"],
        ["checkpoint", "Checkpoint: inventory explorer", 30, "challenge"],
      ]),
      m("react-hooks", "Hooks", "Effects, custom hooks and explicit state transitions.", [
        ["effect", "useEffect without the footguns", 22, "challenge"],
        ["custom", "Writing a custom hook", 22, "challenge"],
        ["reducer", "State transitions with useReducer", 26, "challenge"],
      ]),
      m("react-data", "Data on screen", "Lists, forms, loading, empty and error states.", [
        ["lists", "Rendering lists and keys", 20, "practice"],
        ["forms", "Forms that behave", 26, "challenge"],
        ["fetch", "Fetching and loading states", 26, "challenge"],
        ["checkpoint", "Checkpoint: order dashboard", 32, "challenge"],
      ]),
      m(
        "react-quality",
        "Interfaces people can trust",
        "Accessibility and tests as design tools.",
        [
          ["accessibility", "Accessible interaction", 22, "practice"],
          ["testing", "Test behavior, not implementation", 22, "challenge"],
        ],
      ),
      m(
        "react-project",
        "Independent project",
        "Combine components, data and state under pressure.",
        [["support", "Capstone: support queue", 55, "challenge"]],
      ),
    ],
  },
  {
    id: "typescript",
    title: "TypeScript for Real Projects",
    skill: "TypeScript",
    level: "Intermediate",
    recommended: false,
    summary: "Types that catch bugs before your users do.",
    description:
      "Turn familiar JavaScript into dependable application code. Model valid states, preserve types through reusable helpers, validate external data and build an independent typed release planner. Includes two checkpoints and a local compiler workflow.",
    skills: [
      "Types & interfaces",
      "Unions",
      "Generics",
      "Runtime validation",
      "Typing React props",
      "Strict compiler checks",
    ],
    careers: ["frontend", "fullstack"],
    modules: [
      m("ts-core", "Types you will actually write", "Inference, missing values and valid states.", [
        ["annotate", "Annotations and inference", 18, "concept"],
        ["nullable", "Missing values without assertions", 22, "practice"],
        ["unions", "Unions and narrowing", 24, "challenge"],
        ["checkpoint", "Checkpoint: shipment decisions", 30, "challenge"],
      ]),
      m(
        "ts-apps",
        "Reusable application contracts",
        "Generics, derived types and component APIs.",
        [
          ["generics", "Generics without the headache", 26, "challenge"],
          ["utilities", "Derive types and safe updates", 24, "practice"],
          ["props", "Typing component props", 24, "practice"],
        ],
      ),
      m("ts-boundaries", "Data you can trust", "Validate unknown input and model async outcomes.", [
        ["unknown", "Validate before you trust", 28, "practice"],
        ["async", "Typed async results", 28, "practice"],
        ["checkpoint", "Checkpoint: account importer", 35, "challenge"],
      ]),
      m(
        "ts-quality",
        "Compiler and behavior checks",
        "Use both kinds of evidence before shipping.",
        [["contracts", "Strict checks and type regression tests", 26, "practice"]],
      ),
      m(
        "ts-project",
        "Independent project",
        "Combine validation, state models and typed transformations.",
        [["release", "Capstone: release planner", 45, "challenge"]],
      ),
    ],
  },
  {
    id: "python",
    title: "Python Essentials",
    skill: "Python",
    level: "Beginner",
    recommended: true,
    summary: "From your first print to functions, local files and a useful automation.",
    description:
      "Python by writing Python. Learn one idea, use it immediately, then prove it in low-scaffold checkpoints and a practical file-processing project.",
    skills: [
      "Syntax",
      "Collections",
      "Functions",
      "Loops",
      "Terminal workflow",
      "Files",
      "Error handling",
    ],
    careers: ["python", "data", "ai"],
    modules: [
      m("py-basics", "First steps", "Values, functions and control flow.", [
        ["hello", "Your first Python program", 12, "concept"],
        ["types", "Numbers, strings and f-strings", 15, "practice"],
        ["functions", "Functions, parameters and return", 14, "practice"],
        ["flow", "if, elif and else", 15, "challenge"],
        ["checkpoint", "Checkpoint: fare calculator", 18, "challenge"],
      ]),
      m("py-collections", "Collections", "Lists, loops, dictionaries and comprehensions.", [
        ["lists", "Lists without surprises", 16, "practice"],
        ["loops", "Loops and accumulators", 18, "practice"],
        ["dicts", "Dictionaries", 16, "practice"],
        ["comprehensions", "List comprehensions", 16, "challenge"],
        ["checkpoint", "Checkpoint: order summary", 22, "challenge"],
      ]),
      m("py-tools", "Work on your computer", "Run scripts and work with reliable paths.", [
        ["local", "Run Python outside this course", 18, "practice"],
      ]),
      m("py-functions", "Functions and structure", "Reusable, testable code.", [
        ["define", "Designing reliable functions", 18, "practice"],
        ["errors", "Errors and tracebacks", 16, "concept"],
        ["automate", "Guided lab: sales report", 30, "challenge"],
      ]),
      m("py-project", "Independent project", "Prove you can transfer the patterns.", [
        ["inventory", "Capstone: inventory report", 35, "challenge"],
      ]),
    ],
  },
  {
    id: "sql",
    title: "SQL Foundations",
    skill: "SQL",
    level: "Beginner",
    recommended: true,
    summary: "Ask a database real questions and get trustworthy answers.",
    description:
      "SELECT to GROUP BY, run for real against one small shop's orders the whole way through.",
    skills: ["SELECT", "CASE and COALESCE", "Joins", "Subqueries", "Aggregation"],
    careers: ["data", "fullstack", "python"],
    modules: [
      m("sql-core", "Querying", "Filter, shape and join rows.", [
        ["select", "SELECT and WHERE", 12, "practice"],
        ["shaping", "Shaping results: DISTINCT, LIMIT, LIKE, CASE", 14, "challenge"],
        ["joins", "Joining tables", 13, "challenge"],
        ["subqueries", "Subqueries: IN, EXISTS, or a join?", 15, "challenge"],
      ]),
      // Its lesson was `sql-analysis.groupby` until the course split; the
      // 20260922120000 migration renamed the stored rows to match.
      m("sql-summary", "Summarising", "Count, sum and average per group.", [
        ["groupby", "GROUP BY and HAVING", 12, "practice"],
      ]),
    ],
  },
  {
    // Split out of `sql` rather than appended to it: window functions sat at the
    // end of a course labelled Beginner, and the catalog card shows only the label.
    id: "sql-analysis",
    title: "SQL for Analysis",
    skill: "SQL",
    level: "Intermediate",
    recommended: false,
    summary: "Multi-step queries whose numbers you can defend.",
    description:
      "CTEs, the join that quietly double-counts and window functions on the shop, then dates and period-over-period change on two years of store sales.",
    skills: [
      "CTEs",
      "Grain and double-counting",
      "Window functions",
      "Dates",
      "Period-over-period",
    ],
    careers: ["data", "fullstack", "python"],
    modules: [
      m("sql-analysis", "Analysis", "Build in steps, check the grain, then window.", [
        ["ctes", "CTEs and numbers you can trust", 14, "challenge"],
        ["windows", "Window functions", 15, "challenge"],
      ]),
      m("sql-time", "Over time", "Bucket dates, fill the gaps, compare periods fairly.", [
        ["dates", "Dates, calendars and missing days", 15, "challenge"],
        ["lag", "LAG and period-over-period change", 16, "challenge"],
      ]),
    ],
  },
  {
    id: "git",
    title: "Git & GitHub",
    skill: "Git",
    level: "Beginner",
    recommended: false,
    summary: "Version control that keeps you calm on a bad day.",
    description:
      "From your first repository to commits, branches, pull requests and getting out of trouble.",
    skills: [
      "Repositories",
      "Reading history",
      "Remotes",
      "Commits",
      "Branching",
      "Merging",
      "Pull requests",
      "Undoing mistakes",
    ],
    careers: ["frontend", "fullstack", "python", "data"],
    modules: [
      m("git-start", "Git from zero", "What version control is, and your first repository.", [
        ["why", "Why version control", 8, "concept"],
        ["first-repo", "Your first repository", 10, "practice"],
        ["history", "Reading history: status, diff and log", 10, "practice"],
        ["remotes", "Remotes: clone, push and pull", 11, "practice"],
      ]),
      m("git-core", "Everyday git", "The commands you run daily.", [
        ["commits", "Commits that tell a story", 9, "concept"],
        ["branches", "Branching and merging", 12, "practice"],
        ["prs", "Pull requests and review", 11, "practice"],
      ]),
    ],
  },
  {
    id: "node",
    title: "Node.js & APIs",
    skill: "Node.js",
    level: "Intermediate",
    recommended: false,
    summary: "Build the server side of the products you already design.",
    description: "HTTP, routing, validation, persistence and the security basics that matter.",
    skills: ["HTTP", "Routing", "Validation", "Auth", "Databases"],
    careers: ["fullstack"],
    modules: [
      m("node-core", "Server fundamentals", "Requests, responses and routing.", [
        ["http", "How an HTTP request travels", 10, "concept"],
        ["routes", "Building routes", 14, "challenge"],
      ]),
      m("node-data", "Data and auth", "Persistence and protecting endpoints.", [
        ["db", "Talking to a database", 14, "practice"],
        ["auth", "Sessions and tokens", 13, "concept"],
      ]),
    ],
  },
  {
    id: "data-analytics",
    title: "Data Analytics Toolkit",
    skill: "Data Analytics",
    level: "Intermediate",
    recommended: true,
    summary: "Turn messy tables into decisions people act on.",
    description:
      "Cleaning, exploring, reasoning about and presenting data with pandas, on one messy export the whole way through.",
    skills: ["Data cleaning", "EDA", "Statistics", "Visualisation", "Dashboards", "Storytelling"],
    careers: ["data"],
    modules: [
      m("da-clean", "Clean and explore", "Get the data trustworthy first.", [
        ["clean", "Cleaning real-world data", 14, "challenge"],
        ["eda", "Exploratory analysis", 14, "challenge"],
      ]),
      m("da-reason", "Reason with numbers", "The statistics that change a conclusion.", [
        ["stats", "Averages, spread and outliers", 13, "challenge"],
        ["compare", "Comparisons that hold up", 14, "challenge"],
      ]),
      m("da-tell", "Communicate", "Charts and dashboards that answer a question.", [
        ["charts", "Shaping data for a chart", 12, "challenge"],
        ["dashboard", "Designing a dashboard", 15, "challenge"],
      ]),
    ],
  },
  {
    id: "excel",
    title: "Excel for Analysts",
    skill: "Excel",
    level: "Beginner",
    recommended: false,
    summary: "Pivot tables, lookups and models that do not break.",
    description:
      "The spreadsheet skills hiring managers still test for, with formulas you write and check against real data.",
    skills: ["Formulas", "References", "Conditional sums", "Lookups", "Pivot tables", "Charts"],
    careers: ["data", "product"],
    modules: [
      m("xl-core", "Formulas that hold up", "Formulas, references, conditions and lookups.", [
        ["formulas", "Formulas worth knowing", 12, "practice"],
        ["refs", "References and models that don't break", 13, "challenge"],
        ["conditional", "SUMIFS, COUNTIFS and friends", 13, "challenge"],
        ["lookups", "Lookups: XLOOKUP, and why VLOOKUP bites", 14, "challenge"],
      ]),
      m("xl-analysis", "Analysis and presentation", "Summarise the data, then show it honestly.", [
        ["pivots", "Pivot tables", 14, "challenge"],
        ["charts", "Charts that tell the truth", 10, "concept"],
      ]),
    ],
  },
  {
    id: "figma",
    title: "Figma for Product Teams",
    skill: "Figma",
    level: "Beginner",
    recommended: false,
    summary: "Design files that engineers can actually build from.",
    description:
      "Learn the parts of Figma a product team argues about: layouts that survive real content, components nobody has to detach, variables that theme a whole file, and a handoff that answers the questions engineers would otherwise ask in Slack.",
    skills: ["Auto layout", "Components", "Variables", "Prototyping", "Handoff"],
    careers: ["uxui", "product"],
    modules: [
      m("fig-core", "Layout that survives real content", "Frames, constraints and auto layout.", [
        ["frames", "Frames, groups and constraints", 16, "practice"],
        ["autolayout", "Auto layout that behaves", 20, "practice"],
        ["checkpoint", "Checkpoint: a card that holds any content", 22, "practice"],
      ]),
      m(
        "fig-system",
        "Build it once, change it everywhere",
        "Components, properties and variables.",
        [
          ["components", "Components and variants", 20, "practice"],
          ["properties", "Component properties and slots", 18, "practice"],
          ["variables", "Variables, modes and themes", 20, "practice"],
        ],
      ),
      m("fig-proto", "Prototypes that answer questions", "Test a flow before anyone builds it.", [
        ["prototype", "Prototype a real flow", 18, "practice"],
        ["testing", "Test it with five people", 16, "concept"],
      ]),
      m("fig-handoff", "Handoff engineers can build from", "The file is a spec, not a picture.", [
        ["devmode", "Dev Mode, specs and every state", 22, "practice"],
        ["capstone", "Capstone: hand off a feature", 40, "project"],
      ]),
    ],
  },
  {
    id: "ux-design",
    title: "UX Design Fundamentals",
    skill: "UX Design",
    level: "Beginner",
    recommended: false,
    summary: "Research, flows and interfaces grounded in evidence.",
    description:
      "From problem framing to usability testing, with a portfolio case study at the end.",
    skills: ["Research", "Flows", "Wireframes", "Usability testing", "Case studies"],
    careers: ["uxui", "product"],
    modules: [
      m("ux-core", "Understand the problem", "Research without a lab.", [
        ["interviews", "Interviews that reveal something", 18, "concept"],
        ["flows", "Mapping user flows", 18, "practice"],
      ]),
      m("ux-test", "Test and iterate", "Evidence over opinion.", [
        ["usability", "Running a usability test", 20, "practice"],
      ]),
    ],
  },
  {
    id: "genai",
    title: "Generative AI Engineering",
    skill: "Generative AI",
    level: "Intermediate",
    recommended: true,
    summary: "Prompts, retrieval and tool calling, with the checks that keep them safe.",
    description:
      "The engineering around the model call: prompts written as specs, replies you validate before acting, retrieval that grounds answers in your documents, a tool-calling loop with its limits in code, and evals that catch regressions.",
    skills: ["Prompting", "Embeddings", "RAG", "Tool calling", "Evaluation"],
    careers: ["ai", "fullstack", "python"],
    modules: [
      // Timed against the challenge, not the prose. Each of these six lessons is
      // ~300 words to read and then a parser, a ranker or an agent loop to write
      // from an empty function — html-css-weight work that used to carry
      // sql-weight minutes, so a learner budgeting their evening was told half.
      m("ai-prompt", "Prompting as engineering", "Specs, not incantations.", [
        ["api", "Talking to a model API", 25, "challenge"],
        ["prompts", "Writing a prompt spec", 20, "practice"],
        ["structured", "Structured outputs", 22, "challenge"],
      ]),
      m("ai-rag", "Grounding answers", "Embeddings and retrieval.", [
        ["embeddings", "Embeddings explained", 20, "practice"],
        ["rag", "Build a retrieval step", 25, "challenge"],
      ]),
      m("ai-ship", "Shipping it", "Tools, agents and evaluation.", [
        ["tools", "Tool calling and the agent loop", 28, "challenge"],
        ["evals", "Evaluate before you ship", 24, "challenge"],
      ]),
    ],
  },
  {
    id: "ml",
    title: "Machine Learning Basics",
    skill: "Machine Learning",
    level: "Intermediate",
    recommended: false,
    summary: "Models, features and honest evaluation.",
    description: "Supervised learning end to end, with the maths kept to what you need.",
    skills: ["Features", "Training", "Evaluation", "Overfitting", "Deployment"],
    careers: ["ai", "data"],
    modules: [
      m("ml-core", "Supervised learning", "Fit, evaluate, improve.", [
        ["fit", "Training your first model", 15, "practice"],
        ["evaluate", "Metrics that do not lie", 14, "challenge"],
      ]),
      m("ml-honest", "Honest evaluation", "Held-out data, leakage and overfitting.", [
        ["split", "Train, validation and test sets", 14, "challenge"],
        ["overfitting", "Overfitting and how to spot it", 15, "challenge"],
      ]),
      m("ml-ship", "Features and deployment", "From raw columns to a model in production.", [
        ["features", "Features that carry signal", 14, "challenge"],
        ["deploy", "From notebook to production", 14, "challenge"],
      ]),
    ],
  },
  {
    id: "product",
    title: "Product Management Craft",
    skill: "Product Management",
    level: "Intermediate",
    recommended: false,
    summary: "Discovery, prioritisation and shipping with a team.",
    description: "Write specs people read, prioritise honestly and measure what shipped.",
    skills: ["Discovery", "Specs", "Prioritisation", "Metrics", "Stakeholders"],
    careers: ["product"],
    modules: [
      m("pm-core", "From problem to spec", "Decide what is worth building.", [
        ["discovery", "Discovery in two weeks", 18, "concept"],
        ["spec", "Writing a one-page spec", 18, "practice"],
      ]),
      m("pm-ship", "Ship and measure", "Launch, learn, iterate.", [
        ["metrics", "Choosing a success metric", 20, "practice"],
      ]),
    ],
  },
];

export const careerPaths: CareerPath[] = [
  {
    id: "chatgpt-operator",
    name: "ChatGPT Operator",
    tagline: "Prompts · Research · Workflows · Autonomy",
    overview:
      "Go from your first ChatGPT prompt to repeatable workflows with verified sources, useful deliverables, clear permissions, and human review. The shorter operator path—it all happens in the ChatGPT app; take Claude Operator for the terminal and real permission boundaries.",
    difficulty: "Beginner",
    skills: [
      "Prompting",
      "Context",
      "Research",
      "Data analysis",
      "Workflows",
      "Safety",
      "Autonomy",
    ],
    courseIds: ["chatgpt-operator"],
    projectIds: [],
    popular: true,
  },
  {
    id: "claude-operator",
    name: "Claude Operator",
    tagline: "Prompts · Tools · Agents · Autonomy",
    overview:
      "Go from asking Claude useful questions to running bounded, observable AI workflows—with permissions, verification and human approval built in. The longer operator path: past prompting it adds the terminal, connected tools, subagents and permission rules.",
    difficulty: "Beginner",
    skills: ["Prompting", "Claude Code", "MCP", "Subagents", "Skills", "Safety", "Autonomy"],
    courseIds: ["claude-operator"],
    projectIds: [],
    popular: true,
  },
  {
    id: "frontend",
    name: "Frontend Developer",
    tagline: "HTML · CSS · JS · React",
    overview:
      "Build the interfaces people touch. You will move from your first HTML tag to a React app with real data, shipping four portfolio pieces along the way.",
    difficulty: "Beginner",
    skills: ["HTML", "CSS", "JavaScript", "React", "TypeScript", "Git", "Accessibility"],
    courseIds: ["html-css", "javascript", "react", "typescript", "git"],
    projectIds: ["landing-page", "dashboard-ui", "weather-app", "game-2048"],
    popular: true,
  },
  {
    id: "fullstack",
    name: "Full-stack Developer",
    tagline: "Frontend · APIs · Databases",
    overview: "Own a feature end to end: the screen, the endpoint and the table behind it.",
    difficulty: "Intermediate",
    skills: ["JavaScript", "React", "Node.js", "SQL", "Auth", "Deployment"],
    courseIds: ["javascript", "react", "node", "sql", "sql-analysis", "git"],
    projectIds: ["ecommerce-site", "dashboard-ui", "ai-chatbot"],
  },
  {
    id: "python",
    name: "Python Developer",
    tagline: "Python · Automation · Data",
    overview:
      "Learn the language that runs scripts, servers and models — then use it to automate real work.",
    difficulty: "Beginner",
    skills: ["Python", "Collections", "Automation", "SQL", "Testing"],
    courseIds: ["python", "sql", "sql-analysis", "git", "genai"],
    projectIds: ["weather-app", "data-dashboard", "ai-chatbot"],
    popular: true,
  },
  {
    id: "data",
    name: "Data Analyst",
    tagline: "SQL · Python · Visualisation",
    overview: "Answer business questions with data people trust, and present them clearly.",
    difficulty: "Intermediate",
    skills: ["SQL", "Excel", "Python", "Statistics", "Dashboards", "Storytelling"],
    courseIds: ["sql", "sql-analysis", "excel", "python", "data-analytics"],
    projectIds: ["data-dashboard", "dashboard-ui"],
  },
  {
    id: "uxui",
    name: "UX/UI Designer",
    tagline: "Research · Figma · Systems",
    overview: "Design interfaces grounded in research and build a case-study portfolio.",
    difficulty: "Beginner",
    skills: ["Research", "Figma", "Design systems", "Prototyping", "Usability testing"],
    courseIds: ["ux-design", "figma", "html-css"],
    projectIds: ["mobile-app-design", "landing-page"],
  },
  {
    id: "product",
    name: "Product Manager",
    tagline: "Discovery · Specs · Metrics",
    overview: "Decide what to build, write it down clearly and measure whether it worked.",
    difficulty: "Intermediate",
    skills: ["Discovery", "Prioritisation", "Specs", "Analytics", "Stakeholders", "Figma"],
    courseIds: ["product", "excel", "ux-design", "figma"],
    projectIds: ["mobile-app-design", "data-dashboard"],
  },
  {
    id: "ai",
    name: "AI / GenAI Developer",
    tagline: "LLMs · Prompts · Agents",
    overview:
      "Build features on top of language models: prompting, retrieval, tools and evaluation.",
    difficulty: "Intermediate",
    skills: ["Python", "Prompting", "Embeddings", "RAG", "Evaluation", "Tool calling"],
    courseIds: ["python", "genai", "ml"],
    projectIds: ["ai-chatbot", "data-dashboard"],
  },
];

// Indexed once rather than scanned: these run per card on the catalog and per
// request on the lesson RPCs, over data that never changes after module eval.
const coursesById = new Map(courses.map((c) => [c.id, c]));
const pathsById = new Map(careerPaths.map((p) => [p.id, p]));

export const courseById = (id: string) => coursesById.get(id);
export const pathById = (id: string) => pathsById.get(id);

export const courseLessons = (course: Course): LessonMeta[] =>
  course.modules.flatMap((mod) => mod.lessons);

export const courseLessonCount = (course: Course) => courseLessons(course).length;

export const findLesson = (courseId: string, lessonId: string) => {
  const course = courseById(courseId);
  if (!course) return null;
  for (const mod of course.modules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) return { course, module: mod, lesson };
  }
  return null;
};

/**
 * Lessons that changed course or id, keyed `course/lesson` at the old address.
 * The lesson route redirects these so bookmarks, shared links and emailed
 * nudges keep working; stored rows were moved by migration instead.
 */
const movedLessons: Record<string, { courseId: string; lessonId: string }> = {
  // 20260922120000_split_sql_course
  "sql/sql-analysis.groupby": { courseId: "sql", lessonId: "sql-summary.groupby" },
  "sql/sql-analysis.ctes": { courseId: "sql-analysis", lessonId: "sql-analysis.ctes" },
  "sql/sql-analysis.windows": { courseId: "sql-analysis", lessonId: "sql-analysis.windows" },
};

export const movedLesson = (courseId: string, lessonId: string) =>
  movedLessons[`${courseId}/${lessonId}`] ?? null;

export const movedLessonEntries = () => Object.entries(movedLessons);

export const pathCourses = (path: CareerPath) =>
  path.courseIds.map(courseById).filter((c): c is Course => Boolean(c));

/**
 * Every hour a path asks for: its lessons plus the portfolio projects it sets.
 * The projects are most of it — Frontend is 23 hours of lessons and 40 hours of
 * building — so a duration that counted only lessons would understate the
 * commitment by more than half.
 */
export function pathHours(path: CareerPath): number {
  const lessonMinutes = pathCourses(path)
    .flatMap((course) => course.modules)
    .flatMap((mod) => mod.lessons)
    .reduce((sum, lesson) => sum + lesson.minutes, 0);
  const projectHours = path.projectIds.reduce((sum, id) => sum + (projectById(id)?.hours ?? 0), 0);
  return lessonMinutes / 60 + projectHours;
}

/**
 * How long this path takes at the learner's own stated pace.
 *
 * Computed rather than authored: the hardcoded `weeks` this replaced had drifted
 * to describe no pace at all — Full-stack claimed 30 weeks for 63 hours while
 * Claude Operator claimed 12 for 37, a spread of seven times between two
 * numbers shown in the same typeface on the same card. A figure the catalog
 * can't derive is a figure that goes stale the first time a lesson is added,
 * and every one of them had.
 */
export function pathWeeks(path: CareerPath, hoursPerWeek?: number | null): number {
  const pace = hoursPerWeek && hoursPerWeek > 0 ? hoursPerWeek : DEFAULT_HOURS_PER_WEEK;
  return Math.max(1, Math.ceil(pathHours(path) / pace));
}

export const pathLessonCount = (path: CareerPath) =>
  pathCourses(path).reduce((sum, c) => sum + courseLessonCount(c), 0);

/**
 * What a course calls the things inside it. One definition, so adding a label
 * (or renaming one) is a change here rather than a ternary hunt through every
 * route that prints a count. A path only speaks its courses' vocabulary when
 * they all agree — a mixed path falls back to lessons.
 */
export interface UnitWords {
  singular: string;
  plural: string;
  /** Sentence-initial, as in "Task 3 of 12". */
  singularTitle: string;
  /** What the course calls a group of them. */
  sections: string;
}

const UNITS: Record<"lessons" | "tasks", Omit<UnitWords, "sections">> = {
  lessons: { singular: "lesson", plural: "lessons", singularTitle: "Lesson" },
  tasks: { singular: "task", plural: "tasks", singularTitle: "Task" },
};

const LESSON_WORDS: UnitWords = { ...UNITS.lessons, sections: "modules" };

export const unitWords = (course: Course): UnitWords => ({
  ...UNITS[course.unitLabel ?? "lessons"],
  sections: course.sectionLabel ?? "modules",
});

/** A path only speaks its courses' vocabulary when they all agree on both. */
export const unitWordsForCourses = (list: Course[]): UnitWords => {
  const [first, ...rest] = list;
  if (!first) return LESSON_WORDS;
  const agree = rest.every(
    (c) => c.unitLabel === first.unitLabel && c.sectionLabel === first.sectionLabel,
  );
  return agree ? unitWords(first) : LESSON_WORDS;
};
