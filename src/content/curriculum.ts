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
  summary: string;
  description: string;
  skills: string[];
  careers: string[];
  instructor: { name: string; role: string; initials: string };
  modules: ModuleMeta[];
}

export interface CareerPath {
  id: string;
  name: string;
  tagline: string;
  overview: string;
  difficulty: SkillLevel;
  weeks: number;
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
  {
    id: "html-css",
    title: "HTML & CSS Foundations",
    skill: "HTML & CSS",
    level: "Beginner",
    recommended: true,
    summary: "Structure and style real pages from the very first lesson.",
    description:
      "Start where every interface starts. You will write semantic markup, build layouts with flexbox and grid, and ship a responsive page that holds up on a phone and a 27-inch monitor.",
    skills: ["Semantic HTML", "Flexbox", "CSS Grid", "Responsive design", "Accessibility basics"],
    careers: ["frontend", "fullstack", "uxui"],
    instructor: { name: "Mara Oyelaran", role: "Design Engineer, ex-Figma", initials: "MO" },
    modules: [
      m(
        "html-basics",
        "Markup that means something",
        "Tags, structure, and why semantics matter.",
        [
          ["intro", "How a browser reads your page", 10, "practice"],
          ["tags", "Semantic tags in practice", 12, "practice"],
          ["forms", "Forms and inputs", 13, "challenge"],
        ],
      ),
      m("css-core", "Styling fundamentals", "The cascade, the box model, and modern units.", [
        ["cascade", "The cascade without the mystery", 12, "challenge"],
        ["boxmodel", "Box model and spacing", 12, "practice"],
        ["units", "rem, em, and fluid units", 11, "challenge"],
      ]),
      m("layout", "Layout systems", "Flexbox and grid, side by side.", [
        ["flexbox", "Flexbox basics", 13, "practice"],
        ["grid", "Grid vs flex", 13, "challenge"],
        ["responsive", "Responsive layouts", 14, "challenge"],
        ["media", "Media queries", 12, "challenge"],
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
      "The language of the web, taught by writing it. Every concept lands in a code editor with tests, hints and an AI mentor watching your back.",
    skills: [
      "Variables & types",
      "Functions",
      "Arrays & objects",
      "DOM",
      "Debugging",
      "Async basics",
    ],
    careers: ["frontend", "fullstack", "ai"],
    instructor: { name: "Diego Salas", role: "Staff Engineer, ex-Shopify", initials: "DS" },
    modules: [
      m("js-basics", "Values and logic", "The building blocks you will use every day.", [
        ["values", "Variables, types and truthiness", 10, "concept"],
        ["functions", "Functions and return values", 12, "practice"],
        ["conditionals", "Conditionals and guard clauses", 10, "challenge"],
      ]),
      m("js-data", "Working with data", "Arrays and objects, the workhorses of JS.", [
        ["arrays", "Arrays and iteration", 13, "practice"],
        ["objects", "Objects and destructuring", 12, "practice"],
        ["transform", "map, filter, reduce", 15, "challenge"],
      ]),
      m("js-debug", "Debugging like a professional", "Read the error, form a theory, test it.", [
        ["errors", "Reading stack traces", 9, "concept"],
        ["fixit", "Debug the cart total", 14, "challenge"],
      ]),
      m("js-dom", "The DOM", "Make the page respond to people.", [
        ["select", "Selecting and updating elements", 11, "practice"],
        ["events", "Events and state", 13, "challenge"],
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
      "Move from page-level thinking to component thinking. You will build a dashboard, a form-heavy flow and a data view with loading and error states.",
    skills: [
      "Components",
      "Props & state",
      "Hooks",
      "Lists & keys",
      "Data fetching",
      "Composition",
    ],
    careers: ["frontend", "fullstack"],
    instructor: { name: "Priya Raghunathan", role: "Frontend Lead, ex-Linear", initials: "PR" },
    modules: [
      m("react-core", "Thinking in components", "Split a screen into parts that compose.", [
        ["first", "Your first component", 12, "practice"],
        ["props", "Props and composition", 12, "practice"],
        ["state", "State and re-renders", 15, "challenge"],
      ]),
      m("react-hooks", "Hooks", "Effects, refs and custom hooks.", [
        ["effect", "useEffect without the footguns", 14, "challenge"],
        ["custom", "Writing a custom hook", 14, "challenge"],
      ]),
      m("react-data", "Data on screen", "Lists, forms, loading, empty and error states.", [
        ["lists", "Rendering lists and keys", 12, "practice"],
        ["forms", "Forms that behave", 15, "challenge"],
        ["fetch", "Fetching and loading states", 16, "challenge"],
      ]),
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
      "Add types to JavaScript you already understand. Interfaces, unions, generics and the handful of patterns that cover 90% of app code.",
    skills: ["Types & interfaces", "Unions", "Generics", "Narrowing", "Typing React props"],
    careers: ["frontend", "fullstack"],
    instructor: { name: "Diego Salas", role: "Staff Engineer, ex-Shopify", initials: "DS" },
    modules: [
      m("ts-core", "Types you will actually write", "Annotations, inference and unions.", [
        ["annotate", "Annotations and inference", 10, "concept"],
        ["unions", "Unions and narrowing", 12, "challenge"],
      ]),
      m("ts-apps", "Types in an app", "Props, API payloads and generics.", [
        ["props", "Typing component props", 11, "practice"],
        ["generics", "Generics without the headache", 14, "challenge"],
      ]),
    ],
  },
  {
    id: "python",
    title: "Python Essentials",
    skill: "Python",
    level: "Beginner",
    recommended: true,
    summary: "From your first print to functions, files and small automations.",
    description:
      "Python by writing Python. Short explanations, then immediate practice: loops, collections, functions and a script that does something useful.",
    skills: ["Syntax", "Collections", "Functions", "Loops", "Files", "Error handling"],
    careers: ["python", "data", "ai"],
    instructor: { name: "Ingrid Solheim", role: "Data Engineer, ex-Spotify", initials: "IS" },
    modules: [
      m("py-basics", "First steps", "Values, printing and control flow.", [
        ["hello", "Your first Python program", 8, "concept"],
        ["types", "Numbers, strings and f-strings", 10, "practice"],
        ["flow", "if, elif and else", 11, "challenge"],
      ]),
      m("py-collections", "Collections", "Lists, dicts and comprehensions.", [
        ["lists", "Lists and loops", 12, "practice"],
        ["dicts", "Dictionaries", 12, "practice"],
        ["comprehensions", "List comprehensions", 13, "challenge"],
      ]),
      m("py-functions", "Functions and structure", "Reusable, testable code.", [
        ["define", "Defining functions", 11, "practice"],
        ["errors", "Errors and tracebacks", 10, "concept"],
        ["automate", "Automate a boring task", 16, "challenge"],
      ]),
    ],
  },
  {
    id: "sql",
    title: "SQL for Analysis",
    skill: "SQL",
    level: "Beginner",
    recommended: true,
    summary: "Ask a database real questions and get trustworthy answers.",
    description:
      "SELECT to window functions, run for real against one small shop's orders the whole way through.",
    skills: ["SELECT", "Joins", "Aggregation", "CTEs", "Window functions"],
    careers: ["data", "fullstack", "python"],
    instructor: { name: "Ingrid Solheim", role: "Data Engineer, ex-Spotify", initials: "IS" },
    modules: [
      m("sql-core", "Querying", "Filter, sort and join rows.", [
        ["select", "SELECT and WHERE", 12, "practice"],
        ["joins", "Joining tables", 13, "challenge"],
      ]),
      m("sql-analysis", "Analysis", "Group, check and window.", [
        ["groupby", "GROUP BY and HAVING", 12, "practice"],
        ["ctes", "CTEs and numbers you can trust", 14, "challenge"],
        ["windows", "Window functions", 15, "challenge"],
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
    instructor: { name: "Tomas Beck", role: "Platform Engineer", initials: "TB" },
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
    instructor: { name: "Tomas Beck", role: "Platform Engineer", initials: "TB" },
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
    instructor: { name: "Ingrid Solheim", role: "Data Engineer, ex-Spotify", initials: "IS" },
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
    instructor: { name: "Nora Whitfield", role: "Analytics Manager", initials: "NW" },
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
    description: "Auto layout, components, variables and handoff.",
    skills: ["Auto layout", "Components", "Variables", "Prototyping", "Handoff"],
    careers: ["uxui", "product"],
    instructor: { name: "Mara Oyelaran", role: "Design Engineer, ex-Figma", initials: "MO" },
    modules: [
      m("fig-core", "Build a design system", "Reusable, responsive pieces.", [
        ["autolayout", "Auto layout that behaves", 12, "practice"],
        ["components", "Components and variants", 13, "challenge"],
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
    instructor: { name: "Mara Oyelaran", role: "Design Engineer, ex-Figma", initials: "MO" },
    modules: [
      m("ux-core", "Understand the problem", "Research without a lab.", [
        ["interviews", "Interviews that reveal something", 12, "concept"],
        ["flows", "Mapping user flows", 13, "practice"],
      ]),
      m("ux-test", "Test and iterate", "Evidence over opinion.", [
        ["usability", "Running a usability test", 14, "challenge"],
      ]),
    ],
  },
  {
    id: "genai",
    title: "Generative AI Engineering",
    skill: "Generative AI",
    level: "Intermediate",
    recommended: true,
    summary: "Prompts, retrieval and agents, built into real products.",
    description:
      "Work with LLM APIs, ground answers in your own data and ship a chat feature that behaves.",
    skills: ["Prompting", "Embeddings", "RAG", "Tool calling", "Evaluation"],
    careers: ["ai", "fullstack", "python"],
    instructor: { name: "Kenji Aoyama", role: "AI Engineer", initials: "KA" },
    modules: [
      m("ai-prompt", "Prompting as engineering", "Specs, not incantations.", [
        ["prompts", "Writing a prompt spec", 12, "practice"],
        ["structured", "Structured outputs", 13, "challenge"],
      ]),
      m("ai-rag", "Grounding answers", "Embeddings and retrieval.", [
        ["embeddings", "Embeddings explained", 12, "practice"],
        ["rag", "Build a retrieval step", 16, "challenge"],
      ]),
      m("ai-ship", "Shipping it", "Tools, agents and evaluation.", [
        ["tools", "Tool calling and the agent loop", 16, "challenge"],
        ["evals", "Evaluate before you ship", 14, "challenge"],
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
    instructor: { name: "Kenji Aoyama", role: "AI Engineer", initials: "KA" },
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
    instructor: { name: "Nora Whitfield", role: "Analytics Manager", initials: "NW" },
    modules: [
      m("pm-core", "From problem to spec", "Decide what is worth building.", [
        ["discovery", "Discovery in two weeks", 12, "concept"],
        ["spec", "Writing a one-page spec", 13, "practice"],
      ]),
      m("pm-ship", "Ship and measure", "Launch, learn, iterate.", [
        ["metrics", "Choosing a success metric", 12, "challenge"],
      ]),
    ],
  },
];

export const careerPaths: CareerPath[] = [
  {
    id: "frontend",
    name: "Frontend Developer",
    tagline: "HTML · CSS · JS · React",
    overview:
      "Build the interfaces people touch. You will move from your first HTML tag to a React app with real data, shipping four portfolio pieces along the way.",
    difficulty: "Beginner",
    weeks: 24,
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
    weeks: 30,
    skills: ["JavaScript", "React", "Node.js", "SQL", "Auth", "Deployment"],
    courseIds: ["javascript", "react", "node", "sql", "git"],
    projectIds: ["ecommerce-site", "dashboard-ui", "ai-chatbot"],
  },
  {
    id: "python",
    name: "Python Developer",
    tagline: "Python · APIs · Automation",
    overview:
      "Learn the language that runs scripts, servers and models — then use it to automate real work.",
    difficulty: "Beginner",
    weeks: 18,
    skills: ["Python", "Collections", "APIs", "Automation", "SQL", "Testing"],
    courseIds: ["python", "sql", "git", "genai"],
    projectIds: ["weather-app", "data-dashboard", "ai-chatbot"],
    popular: true,
  },
  {
    id: "data",
    name: "Data Analyst",
    tagline: "SQL · Python · Visualisation",
    overview: "Answer business questions with data people trust, and present them clearly.",
    difficulty: "Intermediate",
    weeks: 20,
    skills: ["SQL", "Excel", "Python", "Statistics", "Dashboards", "Storytelling"],
    courseIds: ["sql", "excel", "python", "data-analytics"],
    projectIds: ["data-dashboard", "dashboard-ui"],
  },
  {
    id: "uxui",
    name: "UX/UI Designer",
    tagline: "Research · Figma · Systems",
    overview: "Design interfaces grounded in research and build a case-study portfolio.",
    difficulty: "Beginner",
    weeks: 18,
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
    weeks: 16,
    skills: ["Discovery", "Prioritisation", "Specs", "Analytics", "Stakeholders"],
    courseIds: ["product", "excel", "ux-design"],
    projectIds: ["mobile-app-design", "data-dashboard"],
  },
  {
    id: "ai",
    name: "AI / GenAI Developer",
    tagline: "LLMs · Prompts · Agents",
    overview:
      "Build features on top of language models: prompting, retrieval, tools and evaluation.",
    difficulty: "Intermediate",
    weeks: 16,
    skills: ["Python", "Prompting", "Embeddings", "RAG", "Evaluation", "APIs"],
    courseIds: ["python", "genai", "ml"],
    projectIds: ["ai-chatbot", "data-dashboard"],
  },
];

export const courseById = (id: string) => courses.find((c) => c.id === id);
export const pathById = (id: string) => careerPaths.find((p) => p.id === id);

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

export const pathCourses = (path: CareerPath) =>
  path.courseIds.map(courseById).filter((c): c is Course => Boolean(c));

export const pathLessonCount = (path: CareerPath) =>
  pathCourses(path).reduce((sum, c) => sum + courseLessonCount(c), 0);
