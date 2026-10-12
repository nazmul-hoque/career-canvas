import type { SkillLevel } from "./curriculum";

export interface PortfolioProject {
  id: string;
  title: string;
  tagline: string;
  brief: string;
  difficulty: SkillLevel;
  hours: number;
  skills: string[];
  requirements: string[];
  milestones: string[];
  careers: string[];
  accent: "brand" | "ember" | "ink";
}

export const projects: PortfolioProject[] = [
  {
    id: "landing-page",
    title: "Conversion-ready landing page",
    tagline: "A one-page site for a small business, with a contact form that checks its input",
    brief:
      "Design and build a one-page site for a small business: a hero that states the offer, three proof sections and a contact form that validates input.",
    difficulty: "Beginner",
    hours: 6,
    skills: ["HTML", "CSS", "Responsive design", "Accessibility"],
    requirements: [
      "Semantic landmarks (header, main, footer)",
      "Works from 360px to 1440px wide",
      "Contact form with inline validation messages",
      "Lighthouse accessibility score of 90 or above",
    ],
    milestones: ["Wireframe the sections", "Build the hero", "Add proof sections", "Ship the form"],
    careers: ["frontend", "uxui"],
    accent: "brand",
  },
  {
    id: "ecommerce-site",
    title: "E-commerce storefront",
    tagline: "A product grid, a cart that survives a refresh, and a checkout in steps",
    brief:
      "Build a storefront with a filterable product grid, a persistent cart and a multi-step checkout. Cart state must survive a refresh.",
    difficulty: "Intermediate",
    hours: 16,
    skills: ["React", "State management", "Forms", "APIs"],
    requirements: [
      "Product list with category and price filters",
      "Cart persists across reloads",
      "Checkout with address and payment steps",
      "Empty, loading and error states everywhere",
    ],
    milestones: ["Product grid", "Cart logic", "Checkout steps", "Polish states"],
    careers: ["frontend", "fullstack"],
    accent: "ember",
  },
  {
    id: "dashboard-ui",
    title: "Analytics dashboard",
    tagline: "Cards, a chart and a sortable table, all driven by one date filter",
    brief:
      "Build a dashboard with KPI cards, a time-series chart, a sortable table and a date-range filter that drives all of them.",
    difficulty: "Intermediate",
    hours: 14,
    skills: ["React", "Charts", "Data shaping", "Layout"],
    requirements: [
      "Four KPI cards with change indicators",
      "One chart reacting to the date filter",
      "Sortable, paginated table",
      "Skeleton loading states",
    ],
    milestones: ["Layout shell", "KPI cards", "Chart", "Table and filters"],
    careers: ["frontend", "data", "fullstack"],
    accent: "ink",
  },
  {
    id: "weather-app",
    title: "Weather app",
    tagline: "Search a city for its forecast, and cope when the network fails",
    brief:
      "Search any city and show current conditions plus a five-day outlook, handling the network failing gracefully.",
    difficulty: "Beginner",
    hours: 8,
    skills: ["APIs", "Async", "Error handling", "State"],
    requirements: [
      "City search with debounced input",
      "Current conditions and 5-day forecast",
      "Loading skeletons and a friendly error state",
      "Remembers the last searched city",
    ],
    milestones: ["Fetch and render", "Search", "Forecast", "Error handling"],
    careers: ["frontend", "python"],
    accent: "brand",
  },
  {
    id: "game-2048",
    title: "2048 game",
    tagline: "The tile-merging game, written from scratch",
    brief:
      "Implement the grid, the merge rules, keyboard controls, scoring and a game-over state from scratch.",
    difficulty: "Intermediate",
    hours: 12,
    skills: ["JavaScript", "Algorithms", "State", "Animation"],
    requirements: [
      "4x4 grid with correct merge rules",
      "Arrow key and swipe controls",
      "Score and best score",
      "Win and game-over states",
    ],
    milestones: ["Grid model", "Move and merge", "Controls", "Scoring and end states"],
    careers: ["frontend"],
    accent: "ember",
  },
  {
    id: "data-dashboard",
    title: "Data analytics report",
    tagline: "Clean a messy sales export and write a one-page recommendation",
    brief:
      "Clean a messy sales export, explore it, and produce a dashboard plus a one-page written recommendation.",
    difficulty: "Intermediate",
    hours: 15,
    skills: ["Python", "SQL", "Visualisation", "Storytelling"],
    requirements: [
      "Documented cleaning steps",
      "At least three charts that answer a stated question",
      "A written recommendation with a number attached",
      "Reproducible notebook or script",
    ],
    milestones: ["Clean", "Explore", "Visualise", "Write the recommendation"],
    careers: ["data", "python", "product"],
    accent: "ink",
  },
  {
    id: "mobile-app-design",
    title: "Mobile app design case study",
    tagline: "Design a habit tracker and write up why it works the way it does",
    brief:
      "Design a mobile habit-tracking app end to end and present it as a portfolio case study with your reasoning visible.",
    difficulty: "Beginner",
    hours: 12,
    skills: ["Research", "Figma", "Prototyping", "Case study writing"],
    requirements: [
      "Problem statement backed by three interviews",
      "User flow for the core task",
      "High-fidelity screens using a component library",
      "Clickable prototype",
    ],
    milestones: ["Research", "Flows", "Screens", "Prototype and write-up"],
    careers: ["uxui", "product"],
    accent: "brand",
  },
  {
    id: "ai-chatbot",
    title: "AI assistant with retrieval",
    tagline: "A chat that answers from a few documents, cites them, and says when it doesn't know",
    brief:
      "Build a chat interface that answers questions grounded in a small document set, with citations and a graceful 'I don't know'.",
    difficulty: "Advanced",
    hours: 18,
    skills: ["Prompting", "Embeddings", "RAG", "APIs", "Evaluation"],
    requirements: [
      "Document ingestion and chunking",
      "Retrieval step before generation",
      "Citations on every answer",
      "Evaluation set of 10 questions",
    ],
    milestones: ["Chat UI", "Ingestion", "Retrieval", "Evaluation"],
    careers: ["ai", "fullstack", "python"],
    accent: "ember",
  },
];

export const projectById = (id: string) => projects.find((p) => p.id === id);
