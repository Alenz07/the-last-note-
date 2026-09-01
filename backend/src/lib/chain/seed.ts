import { eq, sql } from 'drizzle-orm';
import type { Db } from '@/db';
import { chains, devices, links, payments } from '@/db/schema';
import { newId, randomToken } from '../crypto';
import type { ChainInput } from './core';

/**
 * The three launch chains + enough demo links that the site never looks empty.
 * Runs automatically on an empty DB outside production (SEED_ON_EMPTY).
 */
export const DEFAULT_CHAINS: ChainInput[] = [
  {
    slug: 'confess',
    title: 'Confess',
    tagline: 'Say the thing you haven’t said.',
    prompt: 'Confess something you have never told anyone. No names. No one will know it was you.',
    tint: 'wine',
    pricePaise: 500,
    unsealAfter: 50,
    unsealMedia: false,
    revealCount: 1,
    revealMode: 'referrer',
    windowMinutes: 10,
    allowVoice: true,
    allowImage: true,
    allowContact: true,
    status: 'live',
    sort: 1,
  },
  {
    slug: 'advice',
    title: 'Advice to a stranger',
    tagline: 'One line you wish someone had told you.',
    prompt: 'Give one piece of advice to a stranger who needs it today. Say it like you mean it.',
    tint: 'teal',
    pricePaise: 500,
    unsealAfter: 50,
    unsealMedia: false,
    revealCount: 1,
    revealMode: 'referrer',
    windowMinutes: 10,
    allowVoice: true,
    allowImage: true,
    allowContact: true,
    status: 'live',
    sort: 2,
  },
  {
    slug: 'story',
    title: 'Story building',
    tagline: 'One line at a time. Nobody knows the ending.',
    prompt: 'Continue the story. One line. Leave it somewhere the next stranger can pick it up.',
    tint: 'indigo',
    pricePaise: 500,
    unsealAfter: 50,
    unsealMedia: false,
    revealCount: 3,
    revealMode: 'latest',
    windowMinutes: 10,
    allowVoice: true,
    allowImage: false,
    allowContact: true,
    status: 'live',
    sort: 3,
  },
];

const CITIES = ['Gurgaon', 'Delhi', 'Mumbai', 'Pune', 'Jaipur', 'Lucknow', 'Indore', 'Bengaluru', 'Kolkata', 'Hyderabad', 'Chandigarh', 'Noida'];

const DEMO: Record<string, string[]> = {
  confess: [
    'I still have the train ticket from the day I should have said yes. Seven years. It is in my wallet right now.',
    'Main roz office ke liye nikalta hoon, par 3 mahine se job nahi hai. Ghar pe kisi ko nahi pata.',
    'I read my sister’s diary when I was 14 and I have been kind to her ever since because of what was in it. She thinks I changed on my own.',
    'Shaadi se ek raat pehle main bhaagne ka plan bana chuki thi. Phir mummy ne chai banayi. Bas.',
    'I am the reason the office plant died. I watered it with cold coffee for a month to see if anyone would notice.',
    'Mujhe apne best friend ki success se jalan hoti hai. Har baar. Aur phir main usse sabse pehle congratulate karta hoon.',
    'I never learnt to swim. I have been to Goa eleven times. I sit on the sand and tell people I am tired.',
    'Papa ko laga tha maine IIT clear kiya. Nahi kiya. Woh 2019 me chale gaye yeh maante hue ki maine kiya.',
    'I like my wife more than I love her. I think that is the better of the two and I have never said it out loud.',
    'Maine apni engagement ring online bechi thi kyunki rent dena tha. Ussne kabhi nahi poocha. Main kabhi nahi bataunga.',
    'Every time someone says “you are so strong” I want to scream. I am not strong. I am just out of options.',
    'I prayed for the first time in 12 years last Tuesday. Nothing happened. I am doing it again tonight anyway.',
  ],
  advice: [
    'Jo cheez tum teen saal se “agle mahine” karne wale ho, woh aaj shuru karo. Chhota sa. Abhi.',
    'Nobody is thinking about you as much as you think they are. This is the most freeing thing you will ever learn.',
    'Call your mother. Not because of guilt. Because one day the phone will ring and it will not be her.',
    'Rent a slightly smaller house than you can afford. Everything else in your life gets easier.',
    'Agar kisi ne tumhe do baar text nahi kiya, teesri baar mat karo. Yeh rejection nahi hai. Yeh jawab hai.',
    'Write the email. Delete half of it. Send it. You were never going to say it better by waiting.',
    'The person you are jealous of is also tired. Stop competing with the photo.',
    'Jab tak tum khud ko maaf nahi karoge, kisi aur ka “it’s okay” kaam nahi karega.',
    'Learn to cook five things well. You will eat better, spend less and people will like coming over.',
    'If you are 25 and confused, good. The ones who are not confused at 25 are lying or boring.',
    'Apni salary ka 10% aisi jagah rakho jahan se nikalna mushkil ho. Baaki sab baad me.',
    'Say no to the wedding. Go to the funeral. You will never regret that order.',
  ],
  story: [
    'The last bus out of Rohtak left at 11:40 and Meera was on it with a bag that was not hers.',
    'Inside the bag: one shoe, a wedding card with her own name on it, and a phone that would not stop buzzing.',
    'She did not answer. She watched the road instead, because the conductor had called her “beta” in a way that meant he knew.',
    'Somewhere near Bahadurgarh the phone stopped. Then a message came through, just one line: “Check the shoe.”',
    'Folded into the toe was a key, the old brass kind, and a slip of paper that said only: Flat 3B. Don’t ring the bell.',
    'Meera laughed, loud enough that a sleeping man two rows ahead turned around. She had lived in Flat 3B for four years.',
    'At Kashmere Gate she did not take an auto. She walked, because whoever packed the bag expected her to hurry.',
    'The building was dark except for 3B. Her own window. A lamp she had never owned was on.',
    'She did not ring the bell. She put the key in, and it turned like it had been waiting.',
    'On the table sat two cups of chai, still steaming, and the second shoe.',
    'From the kitchen a voice she had not heard since she was nine said, “You took the last bus. Good. Sit.”',
    'Meera sat. The chai was exactly how her grandmother used to make it, and her grandmother had been dead for twenty years.',
  ],
};

export async function seedChains(db: Db): Promise<number> {
  let n = 0;
  for (const c of DEFAULT_CHAINS) {
    const inserted = await db.insert(chains).values(c).onConflictDoNothing({ target: chains.slug }).returning({ id: chains.id });
    n += inserted.length;
  }
  return n;
}

/** Demo links for a chain that has none yet. Safe to call repeatedly. */
export async function seedDemoLinks(db: Db, now: Date = new Date()): Promise<number> {
  let total = 0;
  for (const c of DEFAULT_CHAINS) {
    const [chain] = await db.select().from(chains).where(eq(chains.slug, c.slug)).limit(1);
    if (!chain) continue;
    const [{ count }] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(links).where(eq(links.chainId, chain.id));
    if (count > 0) continue;

    const bodies = DEMO[c.slug] ?? [];
    let prevId: string | null = null;
    for (let i = 0; i < bodies.length; i++) {
      const position = i + 1;
      const deviceId = newId();
      const city = CITIES[(i * 7 + position) % CITIES.length];
      const createdAt = new Date(now.getTime() - (bodies.length - i) * 97 * 60_000 - (i % 3) * 13_000);
      await db.insert(devices).values({ id: deviceId, city, firstSeen: createdAt, lastSeen: createdAt });
      const [p] = await db
        .insert(payments)
        .values({
          chainId: chain.id,
          deviceId,
          gateway: 'seed',
          gatewayOrderId: `seed_order_${chain.slug}_${position}`,
          gatewayPaymentId: `seed_pay_${chain.slug}_${position}`,
          amountPaise: chain.pricePaise,
          status: 'captured',
          city,
          createdAt,
          capturedAt: createdAt,
        })
        .returning();
      const [l]: { id: string }[] = await db
        .insert(links)
        .values({
          chainId: chain.id,
          position,
          status: 'submitted',
          body: bodies[i],
          city,
          deviceId,
          paymentId: p.id,
          revealToken: randomToken(32),
          revealedLinkIds: prevId ? [prevId] : [],
          readCount: i < bodies.length - 1 ? 1 : 0,
          deadlineAt: new Date(createdAt.getTime() + chain.windowMinutes * 60_000),
          submittedAt: new Date(createdAt.getTime() + 4 * 60_000),
          createdAt,
        })
        .returning({ id: links.id });
      await db.update(payments).set({ linkId: l.id }).where(eq(payments.id, p.id));
      prevId = l.id;
      total++;
    }
    await db.update(chains).set({ tail: bodies.length }).where(eq(chains.id, chain.id));
  }
  return total;
}

export async function seedIfEmpty(db: Db): Promise<{ chains: number; links: number }> {
  const [{ count }] = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(chains);
  if (count > 0) return { chains: 0, links: 0 };
  const c = await seedChains(db);
  const l = await seedDemoLinks(db);
  return { chains: c, links: l };
}
