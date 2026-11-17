import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!process.env.SQL_HOST) {
    return null;
  }
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

function createMockDb() {
  const createChain = (): any => {
    const promise = Promise.resolve([]);
    return new Proxy(() => createChain(), {
      get(_target, prop) {
        if (prop === 'then') return promise.then.bind(promise);
        if (prop === 'catch') return promise.catch.bind(promise);
        if (prop === 'finally') return promise.finally.bind(promise);
        return () => createChain();
      },
      apply() {
        return createChain();
      },
    });
  };
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };
  return new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
    get(_target, prop) {
      if (prop === 'query') {
        return new Proxy({}, { get: () => noOp });
      }
      return () => createChain();
    },
  });
}

let db: ReturnType<typeof drizzle<typeof schema>>;
try {
  const pool = createPool();
  if (!pool) {
    console.warn('[AI Studio] SQL_HOST not set — using mock Drizzle database');
    db = createMockDb();
  } else {
    db = drizzle(pool, { schema });
  }
} catch {
  console.warn('[AI Studio] Database not connected — using mock');
  db = createMockDb();
}

export { db };
