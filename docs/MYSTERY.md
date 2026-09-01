# Kadi — The Mystery Layer

The product is ₹5 for a reveal. The *marketing* is everything a stranger sees **before** paying.
This doc is the source of truth for how the site creates pull. Copy lives in `src/lib/copy.ts`; this explains *why*.
(Product facts it relies on: `docs/REQUIREMENTS.md` + `src/lib/chain/types.ts`.)

---

## 0. The one-line promise

> A stranger left something for you. ₹5 to read it. Then you leave yours.

Everything on the public surface serves that sentence. If an element doesn't deepen *"something is here and it's for me"*, cut it.

---

## 1. Principles

| # | Principle | What it means in the UI |
|---|-----------|-------------------------|
| P1 | **Show the shape, never the content.** | Redaction bars sized to the real word lengths (`SealedMeta.shape`, computed server-side; the body never leaves the server). Character count. City. Minutes ago. Voice-note seconds. "a photo". Never the first word, never a blur of real text (blur is reversible, bars aren't). |
| P2 | **Address the reader as the next link.** | "#4,371 left something for you." Second person, present tense. The visitor is already *in* the chain — they just haven't paid yet. "You'll be link #4,372." |
| P3 | **Scarcity that is true.** | Text unseals for everyone once the chain rolls 50 links past it — say *when*: "Text unseals for everyone at #4,421." Voice notes and photos are **never** unsealed: "Only the one who pays gets them." Read counts are real: "No one has read it yet." is the strongest line we have; "Read by 2 people." is the second. |
| P4 | **Numbers that move.** | Chain length, last city, seconds since last link. Live (3–5 s via `LiveStats`). A chain that ticks is alive; a static page is a brochure. |
| P5 | **Silence over hype.** | No exclamation marks. No emoji. Short lines, lots of dark space. One accent colour, only on the one button. The quieter the page, the louder the seal. |
| P6 | **The share card is the ad.** | Every share link is `/c/[slug]/[position]` — *your* link. The card shows your number, city, the shape of your words, and "₹5 to read it". Friends pay to read *you*, and you see the count go up. |
| P7 | **The loop is a message, not a page.** | Push: "Someone read your link." / "A stranger in Pune just read it · 3 so far." Written like a person, not a system. The status page says the same thing in the same words. |

---

## 2. Surfaces & hooks

### Landing `/`  (ISR 5 s)
- Headline (display face): **"A stranger left something for you."**
- Sub: "₹5 to read it. Then you leave yours for the next stranger."
- Chain tiles (`ChainTile`): title · tagline · `#4,371` · pulse dot + "last link 2 min ago · Indore". Whole tile is the link.
- Below: "Voice notes and photos are never unsealed. Only the one who pays gets them."
- Footer: "Nothing here is written by us." + legal links.

### Teaser `/c/[slug]` and share landing `/c/[slug]/[position]`  (ISR 5 s, one component: `teaser.tsx`)
- Eyebrow: chain title. Hero: **"#4,371 left something for you."** (story chains: "#4,369 to #4,371 …")
- `SealedTile`: number · city · ago → redaction bars → "143 characters · 19 second voice note" → "Read by 2 people." / "No one has read it yet."
  - Share landing adds the eyebrow **"They sent you here. It's still sealed."** and the button opens *that* link.
- Under the tile: "Text unseals for everyone at #4,421. Voice and photos never do."  (or "The text of this one is already public. The rest isn't.")
- `LiveStats` line. Sticky single button: **"Read it · ₹5"**; under it "You'll be link #4,372. Then you write yours."
- Fresh chain: hero "No one has written yet. You'd be first." + the chain prompt + "Leave the opening line · ₹5". Never a fake preview.
- Paused/ended: no button, one sentence.
- How it works, three lines. OG image = the same sealed tile as a card.

### Reveal `/c/[slug]/reveal?t=…`  (dynamic)
- Hero: **"You are link #4,373."**
- `RevealedTile`(s) with the one motion: `.unseal` (420 ms, staggered). Text, then private media.
- Then the slot: "Now leave yours. The next stranger is waiting." → `Composer` (10-min window, 280 chars). "Voice and photo stay between you and whoever reads it. Never unsealed."
- Already written / window closed: one line + "Your link".

### My link `/l/[token]`  (dynamic)
- Tile: eyebrow "You are link · Confess", `#4,372 · Gurgaon`, my text, then:
  - "Unread. We'll tell you when a stranger opens it." → "Read by 3 people · last from Pune · 2 min ago"
  - "Your text unseals for everyone at #4,422." → "Your text is unsealed. Voice and photo never will be."
- "Whoever opens your link pays ₹5 to read it. You'll know when they do." → `ShareActions` + `PushOptIn`.
- Share text: `I'm link #4,372 in Confess, a chain of strangers. What I wrote is sealed. ₹5 opens it. <url>`

### Unsealed `/c/[slug]/unsealed` (+ `/[page]`)  (ISR 60 s)
- "Unsealed" / "Text only, exactly as it was left. Voice and photos stay sealed forever."
- Quiet tiles: `#4,371 · Indore · read by 3` + text. Skipped/removed are one muted line each — the numbering never lies.

### OG image (`SealedCard`, both teaser routes, cached 60 s)
- Dark, tint glow top-left, all Instrument Serif. Wordmark · chain title / **"#4,371 left something for you."** / bars / "143 characters · Indore · 4 min ago · read by 2" · "kadi.in · ₹5 to read it".

---

## 3. Visual system  (`src/app/globals.css`)

- **Tokens**: `--color-bg #0b0b0f`, `--color-surface`, `--color-ink #f2efe8`, `--color-ink-muted`, `--color-ink-faint`, one accent `--color-accent #f2b544` (CTA only), per-chain `--color-tint-*` set via `.tint-wine|teal|indigo|amber|moss|slate` on a wrapper.
- **Type**: Instrument Serif for numbers and headlines — `.hero` (italic, the one sentence per page that speaks to you) and `.display` (upright: numbers, chain titles); system sans for everything else; `.num` = tabular numerals wherever a `#` appears. The OG card uses the same split: italic headline, upright everything else.
- **The tile** (`.tile`, `LinkTile`): the one primitive. Surface + tint glow from the top-left corner + hairline. Variants are content, not new components: `SealedTile`, `RevealedTile`, `ChainTile`, quiet rows.
- **Redaction** (`.redacted` / `.redacted-word`, `Redacted`): word-shaped bars, `0.9em` tall, ink at 14 %, 4 s shimmer (CSS only, off under reduced-motion).
- **Motion**: `.unseal` once on reveal, `.tick` on counter change, `.pulse-dot` beside "last link". Nothing else moves. Must feel fine on a ₹8k Android on 3G — teaser JS budget < 100 KB.
- **Layout**: `.page` max-width 28 rem, single column, sticky CTA with safe-area padding. Desktop is the same page centred.

---

## 4. Guardrails (so mystery doesn't become dark-pattern)

- Price always visible before pay. No "free" bait. Test mode shows a pill: "Test mode — no real money moves."
- Every scarcity claim is computed, not written: unseal position = `position + chain.unsealAfter`; read counts from the `reads` table; "never unsealed" for media is enforced by the engine (`unsealMedia=false`).
- The sealed preview is derived from the *actual* link you'll receive. Fresh chain → "You'd be first", never a fake shape.
- Counters are real Redis counters, not inflated. Skipped slots stay visible in the unsealed feed.
- No names, no accounts, no "secrets about named people" (content policy). Reveal/link pages are `noindex`; tokens never appear in share text.
