import type { Metadata } from 'next';
import { SITE } from '@/lib/copy';
import { LegalPage, LegalSection } from '@/components/ui/LegalPage';

export const metadata: Metadata = { title: 'Privacy' };

const UPDATED = '2026-08-23';

/** Visible placeholders until the real providers are set. */
const THIRD_PARTIES = {
  gateway: process.env.LEGAL_GATEWAY_NAME || '[Razorpay/Cashfree]',
  hosting: process.env.LEGAL_HOSTING_NAME || '[hosting provider]',
  media: process.env.LEGAL_MEDIA_NAME || '[Cloudflare R2]',
};
const CONTACT = process.env.GRIEVANCE_EMAIL || '[grievance email]';

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated={UPDATED}
      intro={`${SITE.name} is built to know as little about you as it can. No account, no name, no phone number. This page lists exactly what we keep and why, as required by the Digital Personal Data Protection Act, 2023.`}
    >
      <LegalSection heading="What we collect">
        <p>
          <strong>A device ID</strong> — a random number stored in a cookie for one year, so your links page works
          without a login.
        </p>
        <p>
          <strong>Your city</strong>, roughly, from your IP address when you pay or write. We store the city, not the
          IP. It appears next to your link number (“#4,372 · Gurgaon”).
        </p>
        <p>
          <strong>Payment references</strong> from the payment gateway: order ID, payment ID, amount, status. The
          gateway handles your UPI details; we never see your bank or UPI PIN. We may keep a one-way hash of your UPI
          ID to stop abuse — never the ID itself.
        </p>
        <p>
          <strong>What you write</strong> — the text, and any voice note or photo you attach — and who read it (by link
          number and city, not by identity).
        </p>
        <p>
          <strong>A push subscription</strong>, only if you turn on “Tell me when it’s read”. You can turn it off in
          your browser at any time.
        </p>
        <p>
          <strong>Basic usage events</strong> (page viewed, paid, wrote, shared) tied to the device ID, to keep the
          product working and to count how the chain moves.
        </p>
      </LegalSection>

      <LegalSection heading="What we don't collect">
        <p>No name, email, phone number, contacts, precise location, or advertising identifiers. We don’t sell data and we don’t run third-party ads.</p>
      </LegalSection>

      <LegalSection heading="Who sees what">
        <p>
          The person (or people) the chain reveals your link to see your text and any media. Your text — never your
          media — becomes public on the chain’s unsealed page after the chain moves the stated number of links past
          yours. Everyone sees link numbers, cities and read counts. Nobody sees your device ID.
        </p>
        <p>
          Service providers that process data for us: the payment gateway ({THIRD_PARTIES.gateway}), hosting (
          {THIRD_PARTIES.hosting}), media storage ({THIRD_PARTIES.media}), and the push-notification service of your
          browser. They process it only to provide the service.
        </p>
      </LegalSection>

      <LegalSection heading="How long">
        <p>
          Links stay as long as the chain exists. Removed links are kept for up to 180 days for lawful requests, then
          deleted. Payment records are kept as long as tax and payment rules require. Devices inactive for two years
          are deleted.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          You can ask us what we hold against your device ID, ask us to correct or delete it, and withdraw consent for
          push notifications. Because we don’t know who you are, requests must come from the device or include your
          payment ID. Write to the <a href="/grievance">grievance contact</a>; we answer within the time the law
          requires.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies">
        <p>
          One cookie: the device ID. No tracking cookies. Clearing it disconnects your links page from your links; the
          links themselves remain in the chain. There are no accounts and no password resets — keep your link page.
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>The site is not for anyone under 18. We don’t knowingly collect data from children.</p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Data requests and questions: <a href="/grievance">{CONTACT}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
