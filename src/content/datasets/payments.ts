/**
 * The shop's payments, as its card provider exports them: one row per charge
 * or refund, loaded beside the shop's four tables for the data-quality lesson
 * (`dataset: "payments"`). The shop's own rows are untouched, so every number
 * the other SQL lessons quote still holds.
 *
 * Unlike the shop, this table is dirty on purpose, with one of each fault a
 * real export has:
 *
 * - payment 8 repeats payment 7 exactly: a webhook delivered twice;
 * - status is spelled three ways: 'succeeded', 'Succeeded' (104) and
 *   'succeeded ' with a trailing space (110);
 * - payment 10 has a day-first date, '19/02/2026 12:47', that sorts and
 *   filters as if it were in 2019;
 * - order 112 was charged 180.0 against a total of 197.0;
 * - payment 16 (order 113) has no amount;
 * - order 114 is paid but has no payment at all;
 * - payment 17 is for order 999, which doesn't exist.
 *
 * Refunded orders (103, 111) carry a charge and a negative refund; pending
 * order 107 has a failed attempt. Lessons quote these rows, so changing one
 * means re-checking `sql-quality.checks`.
 */
export const PAYMENTS_SCHEMA = "payments    (id, order_id, created_at, amount, status)";

export const PAYMENTS_SQL = `
CREATE TABLE payments (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  amount REAL,
  status TEXT NOT NULL
);
INSERT INTO payments VALUES
  (1, 101, '2026-01-04 10:12:00', 173.0, 'succeeded'),
  (2, 102, '2026-01-09 18:40:00', 180.0, 'succeeded'),
  (3, 103, '2026-01-15 09:05:00', 70.0, 'succeeded'),
  (4, 103, '2026-01-19 11:30:00', -70.0, 'refunded'),
  (5, 104, '2026-01-22 20:14:00', 195.0, 'Succeeded'),
  (6, 105, '2026-02-02 08:55:00', 95.0, 'succeeded'),
  (7, 106, '2026-02-06 13:20:00', 154.0, 'succeeded'),
  (8, 106, '2026-02-06 13:20:00', 154.0, 'succeeded'),
  (9, 107, '2026-02-11 16:02:00', 185.0, 'failed'),
  (10, 108, '19/02/2026 12:47', 60.0, 'succeeded'),
  (11, 109, '2026-02-25 07:31:00', 173.0, 'succeeded'),
  (12, 110, '2026-03-03 19:45:00', 77.0, 'succeeded '),
  (13, 111, '2026-03-08 10:10:00', 95.0, 'succeeded'),
  (14, 111, '2026-03-10 15:00:00', -95.0, 'refunded'),
  (15, 112, '2026-03-12 21:05:00', 180.0, 'succeeded'),
  (16, 113, '2026-03-18 12:00:00', NULL, 'succeeded'),
  (17, 999, '2026-03-20 14:22:00', 49.0, 'succeeded');
`;
