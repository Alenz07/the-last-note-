import Link from 'next/link';
import { getPaymentTotals, getRecentPayments } from '@/lib/admin/queries';
import { formatCount } from '@/lib/format';
import { getServices } from '@/lib/services';
import { runSweepAction } from '../../actions';
import { Card, fmtDate, Pill, SmallButton, Table, Td } from '../ui';

export default async function PaymentsPage() {
  const s = await getServices();
  const [rows, totals] = await Promise.all([getRecentPayments(s.db, 150), getPaymentTotals(s.db, 30)]);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-2xl">Payments</h1>
        <form action={runSweepAction}>
          <SmallButton type="submit">Reconcile stuck orders now</SmallButton>
        </form>
      </div>
      <p className="text-sm text-ink-muted">
        Last 30 days: {formatCount(totals.captured)} captured (₹{formatCount(Math.round(totals.paise / 100))}) · {formatCount(totals.created)} still “created” ·{' '}
        {formatCount(totals.failed)} failed. Anything “created” older than 15 min is re-checked with the gateway every 5 minutes; “captured” always
        has a link. Refunds are manual from the gateway dashboard.
      </p>
      <Card>
        <Table head={['When', 'Chain', 'Order', 'Payment', 'Status', 'Amount', 'Link', 'City']}>
          {rows.map((p) => (
            <tr key={p.id}>
              <Td className="whitespace-nowrap">{fmtDate(p.createdAt)}</Td>
              <Td>{p.chainSlug}</Td>
              <Td className="break-all text-xs">{p.gatewayOrderId}</Td>
              <Td className="break-all text-xs">{p.gatewayPaymentId ?? '—'}</Td>
              <Td>
                <Pill tone={p.status === 'captured' ? 'ok' : p.status === 'created' ? 'warn' : p.status === 'failed' ? 'muted' : 'bad'}>{p.status}</Pill>
              </Td>
              <Td className="num">₹{p.amountPaise / 100}</Td>
              <Td>
                {p.linkId ? (
                  <Link className="text-accent" href={`/admin/links/${p.linkId}`}>
                    #{p.position}
                  </Link>
                ) : (
                  '—'
                )}
              </Td>
              <Td>{p.city ?? '—'}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
