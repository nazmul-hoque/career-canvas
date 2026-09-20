export interface SeedPost {
  id: string;
  author: string;
  initials: string;
  level: number;
  topic: string;
  title: string;
  body: string;
  likes: number;
  comments: { author: string; initials: string; body: string; ago: string }[];
  ago: string;
  trending?: boolean;
}

export const seedPosts: SeedPost[] = [
  {
    id: "seed-1",
    author: "Amara Nwosu",
    initials: "AN",
    level: 12,
    topic: "javascript",
    title: "reduce finally clicked after the cart challenge",
    body: "I kept forgetting to return the accumulator. The debugging lesson made me read the arrow body instead of rewriting the whole function. Three weeks of confusion gone in ten minutes.",
    likes: 142,
    ago: "2h",
    trending: true,
    comments: [
      {
        author: "Diego Salas",
        initials: "DS",
        body: "That is the whole skill: read the evidence before you edit.",
        ago: "1h",
      },
      {
        author: "Tomas Beck",
        initials: "TB",
        body: "Same. The implicit vs explicit return thing catches everyone once.",
        ago: "40m",
      },
    ],
  },
  {
    id: "seed-2",
    author: "Lukas Brenner",
    initials: "LB",
    level: 8,
    topic: "career",
    title: "Two interviews from the landing page project",
    body: "I put the landing page and the dashboard in my portfolio and wrote two paragraphs about the decisions behind each. Both recruiters mentioned the write-up, not the code.",
    likes: 98,
    ago: "5h",
    trending: true,
    comments: [
      {
        author: "Priya Raghunathan",
        initials: "PR",
        body: "Reasoning beats screenshots every time. Congrats.",
        ago: "3h",
      },
    ],
  },
  {
    id: "seed-3",
    author: "Sofia Marchetti",
    initials: "SM",
    level: 6,
    topic: "python",
    title: "Comprehension or loop — when do you pick which?",
    body: "My comprehensions keep growing three clauses long. Is there a rule you use for when to go back to a plain for loop?",
    likes: 54,
    ago: "9h",
    comments: [
      {
        author: "Ingrid Solheim",
        initials: "IS",
        body: "If you cannot read it out loud in one breath, use a loop.",
        ago: "7h",
      },
      {
        author: "Kenji Aoyama",
        initials: "KA",
        body: "Also: any side effect at all means loop, not comprehension.",
        ago: "6h",
      },
    ],
  },
  {
    id: "seed-4",
    author: "Noah Fitzgerald",
    initials: "NF",
    level: 15,
    topic: "react",
    title: "My useEffect ran twice and I panicked for an hour",
    body: "Strict mode in development mounts twice on purpose. Nothing was broken. Posting so the next person searches this and saves the hour.",
    likes: 211,
    ago: "1d",
    trending: true,
    comments: [
      { author: "Amara Nwosu", initials: "AN", body: "Thank you. Genuinely.", ago: "20h" },
    ],
  },
  {
    id: "seed-5",
    author: "Yara Haddad",
    initials: "YH",
    level: 10,
    topic: "design",
    title: "Auto layout changed how I hand off files",
    body: "Engineers stopped asking me what happens at 768px because the file just shows them. Worth the afternoon it takes to learn properly.",
    likes: 76,
    ago: "1d",
    comments: [],
  },
];

export interface LeaderboardEntry {
  name: string;
  initials: string;
  xp: number;
  level: number;
  streak: number;
  path: string;
}

export const leaderboardSeed: LeaderboardEntry[] = [
  {
    name: "Noah Fitzgerald",
    initials: "NF",
    xp: 18420,
    level: 15,
    streak: 64,
    path: "Frontend Developer",
  },
  {
    name: "Amara Nwosu",
    initials: "AN",
    xp: 14980,
    level: 12,
    streak: 41,
    path: "Full-stack Developer",
  },
  { name: "Yara Haddad", initials: "YH", xp: 12310, level: 10, streak: 28, path: "UX/UI Designer" },
  {
    name: "Mateo Rivas",
    initials: "MR",
    xp: 10870,
    level: 10,
    streak: 19,
    path: "Python Developer",
  },
  { name: "Lukas Brenner", initials: "LB", xp: 8640, level: 8, streak: 12, path: "Data Analyst" },
  {
    name: "Sofia Marchetti",
    initials: "SM",
    xp: 6120,
    level: 6,
    streak: 9,
    path: "Python Developer",
  },
  {
    name: "Hana Kobayashi",
    initials: "HK",
    xp: 4980,
    level: 6,
    streak: 22,
    path: "AI / GenAI Developer",
  },
  { name: "Ravi Desai", initials: "RD", xp: 3760, level: 5, streak: 7, path: "Frontend Developer" },
];

export const topics = [
  { id: "general", label: "General" },
  { id: "javascript", label: "JavaScript" },
  { id: "react", label: "React" },
  { id: "python", label: "Python" },
  { id: "design", label: "Design" },
  { id: "career", label: "Career" },
];
