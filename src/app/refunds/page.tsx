import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/ui/LegalPage';

export const metadata: Metadata = { title: 'Refunds' };

const UPDATED = '2026-08-23';

export default function RefundsPage() {
  return (
    <LegalPage
      title="Refund policy"
      updated={UPDATED}
      intro="₹5 buys one reveal and one slot. The reveal is delivered the moment you pay, so there is nothing to return. Refunds are only for the case where you paid and we didn't deliver."
    >
      <LegalSection heading="When we refund">
        <p>
          <strong>You paid and got nothing.</strong> Money left your account, but no reveal was issued within 24 hours
          and <a href="/find">Lost a link?</a> can’t find your slot from the payment ID. We refund the full amount.
        </p>
        <p>
          <strong>You were charged twice for one slot.</strong> We refund the duplicate.
        </p>
      </LegalSection>

      <LegalSection heading="When we don't">
        <p>
          You read the reveal and didn’t like it. You didn’t write in the time window — the reveal was still delivered.
          You wrote and then changed your mind. You were banned for breaking the content policy.
        </p>
      </LegalSection>

      <LegalSection heading="How">
        <p>
          Write to the <a href="/grievance">grievance contact</a> with your payment ID and the approximate time. We
          check the payment gateway’s record and, if it qualifies, refund to the same UPI account within 5–7 working
          days. Failed payments that never captured are reversed by your bank automatically, usually within a few days.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
