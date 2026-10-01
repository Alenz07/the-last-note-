import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/ui/LegalPage';

/**
 * Rendered per request, not prerendered: the legal details come from the
 * environment, and baking them in at build time means a code rebuild every
 * time an address or a grievance officer changes. Cloudflare caches these.
 */
export const dynamic = 'force-dynamic';


export const metadata: Metadata = { title: 'Grievance' };

const UPDATED = '2026-09-29';

/** Set GRIEVANCE_NAME / GRIEVANCE_EMAIL / GRIEVANCE_PHONE / GRIEVANCE_ADDRESS in the environment; placeholders stay visible until then. */
const OFFICER = process.env.GRIEVANCE_NAME || '[Name]';
const EMAIL = process.env.GRIEVANCE_EMAIL || '';
const PHONE = process.env.GRIEVANCE_PHONE || '';
const ADDRESS = process.env.GRIEVANCE_ADDRESS || '[postal address]';

export default function GrievancePage() {
  return (
    <LegalPage
      title="Grievance contact"
      updated={UPDATED}
      intro="Under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and the Consumer Protection (E-Commerce) Rules, 2020, here is who to write to and what to expect."
    >
      <LegalSection heading="Contact">
        <p>
          Grievance Officer: {OFFICER}
          <br />
          {EMAIL ? (
            <a href={`mailto:${EMAIL}`} className="text-ink">
              {EMAIL}
            </a>
          ) : (
            '[email]'
          )}
          <br />
          {PHONE ? (
            <>
              <a href={`tel:${PHONE.replace(/\s/g, '')}`} className="text-ink">
                {PHONE}
              </a>{' '}
              (WhatsApp)
              <br />
            </>
          ) : null}
          {ADDRESS}
        </p>
      </LegalSection>

      <LegalSection heading="What to include">
        <p>Your link number or payment ID (we have no accounts, so this is how we find you), what happened, and what you’d like us to do.</p>
      </LegalSection>

      <LegalSection heading="Timelines">
        <p>We acknowledge every complaint within 24 hours.</p>
        <p>Content complaints (a link that breaks the content policy) are acted on within 72 hours.</p>
        <p>Payment and refund complaints are resolved within 7 working days.</p>
        <p>Everything else, including data access and erasure requests under the DPDP Act, within 15 days.</p>
      </LegalSection>

      <LegalSection heading="Law enforcement">
        <p>
          Lawful requests from Indian authorities go to the same address. We keep removed content and payment
          references for 180 days for this purpose and respond as the law requires.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
