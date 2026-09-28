import type { Metadata } from 'next';
import { SITE } from '@/lib/copy';
import { LegalPage, LegalSection } from '@/components/ui/LegalPage';

/**
 * Rendered per request, not prerendered: the legal details come from the
 * environment, and baking them in at build time means a code rebuild every
 * time an address or a grievance officer changes. Cloudflare caches these.
 */
export const dynamic = 'force-dynamic';


export const metadata: Metadata = { title: 'Terms' };

const UPDATED = '2026-08-23';

/** Visible placeholders until the operator details are set. */
const PLACEHOLDER = {
  entity: process.env.LEGAL_ENTITY || '[Legal entity name]',
  address: process.env.LEGAL_ADDRESS || '[address]',
  email: process.env.GRIEVANCE_EMAIL || '[email]',
  city: process.env.LEGAL_CITY || '[City]',
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updated={UPDATED}
      intro={`${SITE.name} is a chain of short messages left by strangers. Paying ₹5 buys you one reveal and one slot. Using the site means you agree to the following.`}
    >
      <LegalSection heading="What you're buying">
        <p>
          Each payment is a platform fee for <strong>one reveal</strong> (reading the link or links the chain shows you)
          and <strong>one slot</strong> (a numbered position you may write into within the time window shown). That is
          the whole service. No money is ever paid out to users, and nothing on the site is a prize, reward, deposit or
          investment.
        </p>
        <p>
          If you don’t write within the window, your slot passes unwritten. The number stays yours; the fee is not
          refunded.
        </p>
      </LegalSection>

      <LegalSection heading="Who can use it">
        <p>You must be 18 or older. Don’t use the site if you are not, and don’t use it on behalf of someone who isn’t.</p>
      </LegalSection>

      <LegalSection heading="What you write">
        <p>
          Everything on the site is written by users, not by us. You own what you write and you give us a licence to
          store it, show it to the people the chain shows it to, and — for text only — publish it on the chain’s
          unsealed page once the chain has moved the stated number of links past yours. Voice notes and photos are never
          unsealed or published.
        </p>
        <p>
          You must follow the <a href="/content-policy">content policy</a>. We may remove links and ban devices that
          break it. Removed content is kept for up to 180 days to answer lawful requests, then deleted.
        </p>
      </LegalSection>

      <LegalSection heading="No accounts">
        <p>
          There is no login. Your links are tied to a cookie on your device and to secret links we show you. If you
          clear cookies or lose the link, we may be able to find your slot from your payment ID via{' '}
          <a href="/find">Lost a link?</a>, but we can’t promise it.
        </p>
      </LegalSection>

      <LegalSection heading="Refunds">
        <p>
          See the <a href="/refunds">refund policy</a>. In short: no refunds, except when you paid and we failed to give
          you your reveal and slot.
        </p>
      </LegalSection>

      <LegalSection heading="Our limits">
        <p>
          The site is provided as is. We don’t check what strangers write before you read it. We aren’t responsible for
          what users write, and our liability to you is limited to the fee you paid for the affected reveal.
        </p>
      </LegalSection>

      <LegalSection heading="Not a scheme">
        <p>
          ₹5 is a platform fee for the service above. No money is ever paid out to users. {SITE.name} is not a prize
          chit or money circulation scheme within the meaning of the Prize Chits and Money Circulation Schemes
          (Banning) Act, 1978.
        </p>
      </LegalSection>

      <LegalSection heading="Changes, law and operator">
        <p>
          We may change these terms; the date above tells you when. These terms are governed by the laws of India and
          the courts of {PLACEHOLDER.city}. Questions and complaints go to the{' '}
          <a href="/grievance">grievance contact</a>.
        </p>
        <p>
          Operated by {PLACEHOLDER.entity}, {PLACEHOLDER.address}, {PLACEHOLDER.email}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
