/**
 * What the community page shows around the real posts.
 *
 * Example posts exist so an empty community doesn't look abandoned. They are
 * labelled, read-only, and they step aside once real learners are talking —
 * after that they only dilute the feed and make it look busier than it is.
 */

/** Real posts needed before the examples disappear. */
export const EXAMPLES_UNTIL_REAL_POSTS = 5;

/**
 * `realPosts` is undefined while the count is loading: examples stay hidden
 * rather than flashing in and back out. A failed count shows them, so the page
 * falls back to the seed instead of sitting on a skeleton.
 */
export function showExamples(realPosts: number | undefined, countFailed: boolean): boolean {
  if (countFailed) return true;
  if (realPosts === undefined) return false;
  return realPosts < EXAMPLES_UNTIL_REAL_POSTS;
}

export const TRENDING_WINDOW_DAYS = 14;

export interface TrendingCandidate {
  id: string;
  likes: number;
  replies: number;
  createdAt: string;
}

/**
 * Real posts from the last fortnight, by likes plus replies. A post nobody has
 * reacted to isn't trending however new it is, so zero-score posts are left out
 * and the list may be shorter than `limit`, or empty. Ties go to the newer post.
 */
export function rankTrending<T extends TrendingCandidate>(
  posts: T[],
  now: Date = new Date(),
  limit = 3,
): T[] {
  const since = now.getTime() - TRENDING_WINDOW_DAYS * 86_400_000;
  const score = (p: T) => p.likes + p.replies;
  return posts
    .filter((p) => Date.parse(p.createdAt) >= since && score(p) > 0)
    .sort((a, b) => score(b) - score(a) || Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);
}
