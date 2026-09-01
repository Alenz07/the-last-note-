import { config } from 'dotenv';
config({ path: ['.env.local', '.env'] });

/** Apply pending migrations (./drizzle) to DATABASE_URL, or the local PGlite if unset. */
async function main() {
  const { getDbHandle } = await import('../src/db');
  const h = await getDbHandle();
  console.log(`migrations applied (${h.kind})`);
  await h.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
