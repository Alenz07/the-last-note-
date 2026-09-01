import { config } from 'dotenv';
config({ path: ['.env.local', '.env'] });

/** Create the 3 launch chains (idempotent) and demo links for chains that have none. `--no-demo` skips demo links. */
async function main() {
  const { getDbHandle } = await import('../src/db');
  const { seedChains, seedDemoLinks } = await import('../src/lib/chain/seed');
  const h = await getDbHandle();
  const c = await seedChains(h.db);
  const l = process.argv.includes('--no-demo') ? 0 : await seedDemoLinks(h.db);
  console.log(`seed: ${c} new chains, ${l} demo links (${h.kind})`);
  await h.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
