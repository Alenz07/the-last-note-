import path from 'node:path';
import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { manual } from '@/lib/manual';
import { SITE } from '@/lib/site';

/**
 * The downloadable manual, in the site's own palette: warm charcoal, ivory
 * type, one antique-gold accent. Instrument Serif carries the headings (as it
 * does on the site); body copy stays in a plain sans for readability at 10pt.
 */

const C = {
  bg: '#090A0C',
  card: '#121114',
  line: '#26231D',
  gold: '#C9A15A',
  goldLine: '#6F5A3A',
  ink: '#F2EDE3',
  muted: '#A79D8A',
  faint: '#6B6353',
};

const fonts = path.join(process.cwd(), 'public', 'fonts');
Font.register({
  family: 'InstrumentSerif',
  fonts: [
    { src: path.join(fonts, 'InstrumentSerif-Regular.ttf'), fontStyle: 'normal' },
    { src: path.join(fonts, 'InstrumentSerif-Italic.ttf'), fontStyle: 'italic' },
  ],
});
// Long unbroken strings shouldn't be hyphenated mid-word.
Font.registerHyphenationCallback((word) => [word]);

const s = StyleSheet.create({
  page: { backgroundColor: C.bg, color: C.ink, paddingTop: 54, paddingBottom: 56, paddingHorizontal: 52, fontSize: 10, fontFamily: 'Helvetica', lineHeight: 1.55 },
  wordmark: { fontFamily: 'InstrumentSerif', fontSize: 11, letterSpacing: 3, color: C.ink, textTransform: 'uppercase' },

  // cover
  coverWrap: { flexGrow: 1, justifyContent: 'center' },
  coverRule: { width: 46, height: 1, backgroundColor: C.goldLine, marginVertical: 22 },
  coverTitle: { fontFamily: 'InstrumentSerif', fontSize: 46, color: C.ink, lineHeight: 1.1 },
  coverTagline: { fontFamily: 'InstrumentSerif', fontStyle: 'italic', fontSize: 17, color: C.gold, marginTop: 10 },
  coverIntro: { fontSize: 11, color: C.muted, marginTop: 26, maxWidth: 380, lineHeight: 1.7 },
  coverMeta: { fontSize: 8.5, color: C.faint, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 34 },

  // structure
  h1: { fontFamily: 'InstrumentSerif', fontSize: 26, color: C.ink },
  h1Rule: { width: 34, height: 1, backgroundColor: C.goldLine, marginTop: 10, marginBottom: 14 },
  lede: { fontSize: 10.5, color: C.muted, marginBottom: 22, lineHeight: 1.65 },
  h2: { fontSize: 8.5, color: C.gold, letterSpacing: 1.6, textTransform: 'uppercase', marginTop: 18, marginBottom: 10 },

  step: { flexDirection: 'row', marginBottom: 15 },
  stepN: { fontFamily: 'InstrumentSerif', fontSize: 19, color: C.gold, width: 26 },
  stepTitle: { fontSize: 11, color: C.ink, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  stepBody: { fontSize: 9.5, color: C.muted, lineHeight: 1.6 },

  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 7, padding: 13, marginBottom: 10 },
  q: { fontSize: 10.5, color: C.ink, fontFamily: 'Helvetica-Bold', marginBottom: 5 },
  a: { fontSize: 9.5, color: C.muted, lineHeight: 1.65 },

  bullet: { flexDirection: 'row', marginBottom: 6, paddingRight: 6 },
  dot: { color: C.gold, width: 12, fontSize: 9.5 },
  bulletText: { flex: 1, fontSize: 9.5, color: C.muted, lineHeight: 1.6 },

  legalTitle: { fontSize: 10.5, color: C.ink, fontFamily: 'Helvetica-Bold', marginBottom: 4, marginTop: 12 },
  legalBody: { fontSize: 9.5, color: C.muted, lineHeight: 1.6 },

  pill: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  pillItem: { fontSize: 8.5, color: C.gold, borderWidth: 1, borderColor: C.goldLine, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10, marginRight: 7, marginBottom: 7 },

  closing: { fontFamily: 'InstrumentSerif', fontStyle: 'italic', fontSize: 13, color: C.gold, marginTop: 26, lineHeight: 1.5 },

  footer: { position: 'absolute', bottom: 26, left: 52, right: 52, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.line, paddingTop: 9 },
  footerText: { fontSize: 7.5, color: C.faint, letterSpacing: 0.8 },
});

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{SITE.name.toUpperCase()}</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function Bullet({ children }: { children: string }) {
  return (
    <View style={s.bullet} wrap={false}>
      <Text style={s.dot}>—</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}

function Heading({ title, lede }: { title: string; lede?: string }) {
  return (
    <View>
      <Text style={s.h1}>{title}</Text>
      <View style={s.h1Rule} />
      {lede ? <Text style={s.lede}>{lede}</Text> : null}
    </View>
  );
}

export function ManualDocument() {
  return (
    <Document
      title={`${SITE.name} — ${manual.title}`}
      author={SITE.name}
      subject="How the chain works, and what happens in every edge case"
    >
      {/* ---------------------------------------------------------- cover */}
      <Page size="A4" style={s.page}>
        <Text style={s.wordmark}>{SITE.name}</Text>
        <View style={s.coverWrap}>
          <Text style={s.coverTitle}>{manual.title}</Text>
          <Text style={s.coverTagline}>{manual.subtitle}</Text>
          <View style={s.coverRule} />
          <Text style={s.coverIntro}>{manual.intro}</Text>
          <Text style={s.coverMeta}>{manual.version}</Text>
        </View>
        <Footer />
      </Page>

      {/* ------------------------------------------------ how it works + ₹5 */}
      <Page size="A4" style={s.page}>
        <Heading title={manual.howItWorks.heading} lede={manual.howItWorks.lede} />
        {manual.howItWorks.steps.map((st) => (
          <View key={st.n} style={s.step} wrap={false}>
            <Text style={s.stepN}>{st.n}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.stepTitle}>{st.title}</Text>
              <Text style={s.stepBody}>{st.body}</Text>
            </View>
          </View>
        ))}
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <Heading title={manual.whatYouGet.heading} lede={manual.whatYouGet.lede} />
        <Text style={s.h2}>What it includes</Text>
        {manual.whatYouGet.gets.map((g) => (
          <Bullet key={g}>{g}</Bullet>
        ))}
        <Text style={s.h2}>What it does not</Text>
        {manual.whatYouGet.notGets.map((g) => (
          <Bullet key={g}>{g}</Bullet>
        ))}

        <View style={{ marginTop: 26 }}>
          <Heading title={manual.rules.heading} lede={manual.rules.lede} />
          <Text style={s.h2}>Limits</Text>
          {manual.rules.limits.map((l) => (
            <Bullet key={l}>{l}</Bullet>
          ))}
        </View>
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <Heading title="What you may not write" />
        {manual.rules.banned.map((b) => (
          <Bullet key={b}>{b}</Bullet>
        ))}
        <Text style={s.h2}>How it is enforced</Text>
        <Text style={s.a}>{manual.rules.enforcement}</Text>
        <Footer />
      </Page>

      {/* ----------------------------------------------------- edge cases */}
      <Page size="A4" style={s.page}>
        <Heading title={manual.edgeCases.heading} lede={manual.edgeCases.lede} />
        {manual.edgeCases.groups.map((g) => (
          <View key={g.group}>
            <Text style={s.h2}>{g.group}</Text>
            {g.items.map((it) => (
              <View key={it.q} style={s.card} wrap={false}>
                <Text style={s.q}>{it.q}</Text>
                <Text style={s.a}>{it.a}</Text>
              </View>
            ))}
          </View>
        ))}
        <Footer />
      </Page>

      {/* --------------------------------------------------------- legal */}
      <Page size="A4" style={s.page}>
        <Heading title={manual.legal.heading} lede={manual.legal.lede} />
        {manual.legal.sections.map((sec) => (
          <View key={sec.title} wrap={false}>
            <Text style={s.legalTitle}>{sec.title}</Text>
            <Text style={s.legalBody}>{sec.body}</Text>
          </View>
        ))}

        <Text style={s.h2}>The full text lives on the site</Text>
        <View style={s.pill}>
          {manual.legal.pages.map((p) => (
            <Text key={p} style={s.pillItem}>
              {p}
            </Text>
          ))}
        </View>

        <Text style={s.closing}>{manual.legal.closing}</Text>
        <Footer />
      </Page>
    </Document>
  );
}
