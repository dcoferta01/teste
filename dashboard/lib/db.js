// Banco de dados: Postgres (produção, via DATABASE_URL) ou PGlite local (desenvolvimento).
const SCHEMA = `
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  visitor_id TEXT NOT NULL,
  session_id TEXT,
  type TEXT NOT NULL,
  value TEXT,
  page_version TEXT,
  path TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  country TEXT,
  device TEXT
);
CREATE INDEX IF NOT EXISTS events_ts_idx ON events (ts);
CREATE INDEX IF NOT EXISTS events_visitor_idx ON events (visitor_id);

CREATE TABLE IF NOT EXISTS campaigns (
  campaign_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT,
  daily_budget NUMERIC,
  bid_strategy TEXT,
  created_date TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budget_history (
  campaign_id TEXT NOT NULL,
  date TEXT NOT NULL,
  daily_budget NUMERIC,
  PRIMARY KEY (campaign_id, date)
);

CREATE TABLE IF NOT EXISTS ad_daily (
  date TEXT NOT NULL,
  ad_id TEXT NOT NULL,
  ad_name TEXT,
  ad_status TEXT,
  adset_id TEXT,
  campaign_id TEXT NOT NULL,
  spend NUMERIC DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  PRIMARY KEY (date, ad_id)
);

CREATE TABLE IF NOT EXISTS sales (
  transaction_id TEXT PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT,
  product TEXT,
  value NUMERIC,
  currency TEXT,
  is_bump BOOLEAN DEFAULT false,
  sck TEXT,
  src TEXT,
  raw JSONB
);

CREATE TABLE IF NOT EXISTS page_changes (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  version TEXT NOT NULL,
  description TEXT,
  hypothesis TEXT,
  author TEXT
);

CREATE TABLE IF NOT EXISTS tasks_done (
  date TEXT NOT NULL,
  task_key TEXT NOT NULL,
  PRIMARY KEY (date, task_key)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;

const g = globalThis;

async function createClient() {
  if (process.env.DATABASE_URL) {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 3,
    });
    return {
      query: async (text, params = []) => (await pool.query(text, params)).rows,
      exec: async (text) => { await pool.query(text); },
    };
  }
  if (process.env.VERCEL) {
    throw new Error('DATABASE_URL não configurada. Conecte um banco Postgres no projeto da Vercel.');
  }
  const { PGlite } = await import('@electric-sql/pglite');
  const dir = process.env.PGLITE_DIR || './.data/pglite';
  if (dir !== 'memory') {
    const fs = await import('node:fs');
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new PGlite(dir === 'memory' ? undefined : dir);
  return {
    query: async (text, params = []) => (await db.query(text, params)).rows,
    exec: async (text) => { await db.exec(text); },
  };
}

export async function getDb() {
  if (!g.__dbPromise) {
    g.__dbPromise = (async () => {
      const client = await createClient();
      await client.exec(SCHEMA);
      return client;
    })().catch((err) => {
      g.__dbPromise = undefined;
      throw err;
    });
  }
  return g.__dbPromise;
}

export async function q(text, params) {
  const db = await getDb();
  return db.query(text, params);
}
