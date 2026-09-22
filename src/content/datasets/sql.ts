import { SHOP_SCHEMA, SHOP_SQL } from "./shop";
import { PAYMENTS_SCHEMA, PAYMENTS_SQL } from "./payments";
import { STORES_SCHEMA, STORES_SQL } from "./stores";

/**
 * The databases a SQL challenge can run against. A challenge names one with
 * `dataset`, defaulting to the shop; the runner loads it fresh on each run and
 * the challenge panel shows its schema.
 */
export const SQL_DATASETS = {
  shop: { sql: SHOP_SQL, schema: SHOP_SCHEMA },
  stores: { sql: STORES_SQL, schema: STORES_SCHEMA },
  // The shop plus its card provider's export, so payments reconcile against orders.
  payments: { sql: SHOP_SQL + PAYMENTS_SQL, schema: `${SHOP_SCHEMA}\n${PAYMENTS_SCHEMA}` },
} as const;

export type SqlDataset = keyof typeof SQL_DATASETS;

export const sqlDataset = (name: SqlDataset | undefined) => SQL_DATASETS[name ?? "shop"];
