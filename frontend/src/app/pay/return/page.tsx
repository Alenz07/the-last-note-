import type { Metadata } from 'next';
import { Page, SiteHeader } from '@/components/Chrome';
import { ConfirmPayment } from './confirm';

/** Never cached: this page exists to resolve one specific payment. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Confirming payment',
  robots: { index: false, follow: false },
};

export default async function PayReturnPage({ searchParams }: PageProps<'/pay/return'>) {
  const sp = await searchParams;
  const raw = sp.order_id;
  const orderId = typeof raw === 'string' && raw.length >= 4 && raw.length <= 128 ? raw : null;

  return (
    <Page className="max-w-md">
      <SiteHeader />
      <div className="mt-16">
        <ConfirmPayment orderId={orderId} />
      </div>
    </Page>
  );
}
