import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// same precedence as Next: .env.local wins over .env
config({ path: ['.env.local', '.env'] });

const url = process.env.DATABASE_URL;

// With DATABASE_URL → real Postgres. Without it → the embedded PGlite dir the app uses
// (note: PGlite is single-process — stop `pnpm dev` before `pnpm db:studio` in that mode).
export default defineConfig(
  url
    ? {
        dialect: 'postgresql',
        schema: './src/db/schema.ts',
        out: './drizzle',
        dbCredentials: { url },
        strict: true,
        verbose: true,
      }
    : {
        dialect: 'postgresql',
        driver: 'pglite',
        schema: './src/db/schema.ts',
        out: './drizzle',
        dbCredentials: { url: `${process.env.DATA_DIR || '.data'}/pg` },
        strict: true,
        verbose: true,
      },
);
