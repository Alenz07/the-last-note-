import type { Metadata } from 'next';
import { LIMITS } from '@/lib/env';
import { LegalPage, LegalSection } from '@/components/ui/LegalPage';

/**
 * Rendered per request, not prerendered: the legal details come from the
 * environment, and baking them in at build time means a code rebuild every
 * time an address or a grievance officer changes. Cloudflare caches these.
 */
export const dynamic = 'force-dynamic';


export const metadata: Metadata = { title: 'Content policy' };

const UPDATED = '2026-08-23';

export default function ContentPolicyPage() {
  return (
    <LegalPage
      title="Content policy"
      updated={UPDATED}
      intro="Write to a stranger the way you'd want a stranger to write to you. Short list, firmly enforced."
    >
      <LegalSection heading="What a link is">
        <p>
          Text up to {LIMITS.bodyMaxChars} characters, an optional voice note up to {LIMITS.voiceMaxSeconds} seconds,
          an optional photo. Voice and photos are never made public. Text unseals publicly once the chain has moved the
          stated number of links past yours (shown on every chain page).
        </p>
      </LegalSection>

      <LegalSection heading="Not allowed">
        <p>
          Phone numbers, links, email addresses, UPI IDs, social handles, or any other way to contact or pay someone — <em>inside the text</em>.
          The filter blocks these before they enter the chain. If you want the one person who reads your link to be able to reach you,
          use the optional contact field when you write: it is shown only to that reader, is never unsealed, and must be your own contact.
        </p>
        <p>Slurs, harassment, threats, or hate against a person or group. In English, Hindi, Hinglish or any other language.</p>
        <p>Sexual content involving minors, anywhere, in any form. Reported to the authorities.</p>
        <p>Claims or “secrets” about named or identifiable people. The chain is for your own words about your own life.</p>
        <p>Spam, ads, recruiting, schemes, or anything that treats the chain as a marketplace.</p>
        <p>Anything illegal under Indian law, including content listed in Rule 3(1)(b) of the IT Rules, 2021.</p>
      </LegalSection>

      <LegalSection heading="How it's enforced">
        <p>
          Automatic filters run before a link is sealed. Anyone who reads a link can report it. A link with{' '}
          {LIMITS.reportsToHide} reports is hidden automatically and reviewed within 72 hours. We remove links that
          break this policy and ban the devices — and the payment identities behind them — that posted them. We
          cooperate with lawful requests from Indian authorities.
        </p>
        <p>
          Removed links show as “removed” in the chain so the numbering never lies. The content is kept for up to 180
          days to answer lawful requests, then deleted.
        </p>
      </LegalSection>

      <LegalSection heading="Reports and appeals">
        <p>
          Use the report button on a link, or write to the <a href="/grievance">grievance contact</a>. We acknowledge
          within 24 hours and act within 72 hours for content complaints. If your link was removed and you think that
          was wrong, write to the same contact with your link number.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
