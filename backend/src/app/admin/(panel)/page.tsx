import Link from 'next/link';
import { FUNNEL_STEPS, getFunnel, getOpenReports, getPaymentTotals } from '@/lib/admin/queries';
import { getAllChains } from '@/lib/chain/queries';
import { formatCount } from '@/lib/format';
import { getServices } from '@/lib/services';
import { runSweepAction, seedDemoAction } from '../actions';
import { Card, Pill, SmallButton, Table, Td } from './ui';

export default async function AdminHome() {
  const s = await getServices();
  const [chains, reports, totals] = await Promise.all([getAllChains(s), getOpenReports(s.db, 5), getPaymentTotals(s.db, 30)]);
  const funnels = await Promise.all(chains.map((c) => getFunnel(s.db, c.id, 7)));

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Revenue · 30d" value={`₹${formatCount(Math.round(totals.paise / 100))}`} />
        <Stat label="Paid links · 30d" value={formatCount(totals.captured)} />
        <Stat label="Stuck orders" value={formatCount(totals.created)} hint="created, not captured" />
        <Stat label="Open reports" value={formatCount(reports.length)} href="/admin/reports" />
      </div>

      <Card
        title="Chains"
        aside={
          <div className="flex gap-2">
            <form action={runSweepAction}>
              <SmallButton type="submit">Run sweep now</SmallButton>
            </form>
            <form action={seedDemoAction}>
              <SmallButton type="submit">Seed demo data</SmallButton>
            </form>
            <Link href="/admin/chains/new" className="btn btn-primary !min-h-9 !w-auto !px-3 !py-1.5 !text-sm">
              New chain
            </Link>
          </div>
        }
      >
        <Table head={['Chain', 'Status', 'Length', 'Submitted', 'Unsealed', 'Price', 'Reveal', 'Window', '']}>
          {chains.map((c) => (
            <tr key={c.id}>
              <Td>
                <div className="font-medium">{c.title}</div>
                <div className="text-xs text-ink-faint">/c/{c.slug}</div>
              </Td>
              <Td>
                <Pill tone={c.status === 'live' ? 'ok' : c.status === 'paused' ? 'warn' : 'muted'}>{c.status}</Pill>
              </Td>
              <Td className="num">{formatCount(c.stats.length)}</Td>
              <Td className="num">{formatCount(c.stats.submitted)}</Td>
              <Td className="num">{formatCount(c.stats.unsealedCount)}</Td>
              <Td className="num">₹{c.pricePaise / 100}</Td>
              <Td>
                {c.revealMode} · {c.revealCount}
              </Td>
              <Td>{c.windowMinutes} min</Td>
              <Td>
                <Link className="text-accent underline-offset-2 hover:underline" href={`/admin/chains/${c.id}`}>
                  Edit
                </Link>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Funnel · last 7 days (events)">
        <Table head={['Chain', ...FUNNEL_STEPS.map((s) => s.replace('_', ' '))]}>
          {chains.map((c, i) => (
            <tr key={c.id}>
              <Td className="font-medium">{c.title}</Td>
              {FUNNEL_STEPS.map((step) => (
                <Td key={step} className="num">
                  {formatCount(funnels[i][step] ?? 0)}
                </Td>
              ))}
            </tr>
          ))}
        </Table>
        <p className="mt-2 text-xs text-ink-faint">pay captured ÷ chain view = conversion. submitted ÷ captured = how many actually write.</p>
      </Card>

      {reports.length ? (
        <Card title="Latest reports" aside={<Link href="/admin/reports" className="text-sm text-accent">All reports →</Link>}>
          <ul className="grid gap-2 text-sm">
            {reports.map((r) => (
              <li key={r.link.id} className="flex items-start justify-between gap-3">
                <span className="line-clamp-1 text-ink-muted">
                  <span className="text-ink">
                    {r.chain.title} #{r.link.position}
                  </span>{' '}
                  — {r.link.body}
                </span>
                <Link href={`/admin/links/${r.link.id}`} className="shrink-0 text-accent">
                  {r.reports.length} reports →
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value, hint, href }: { label: string; value: string; hint?: string; href?: string }) {
  const inner = (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="text-xs uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="display mt-1 text-3xl num">{value}</div>
      {hint ? <div className="text-xs text-ink-faint">{hint}</div> : null}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
