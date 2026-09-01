import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLinkDetail } from '@/lib/admin/queries';
import { getServices } from '@/lib/services';
import { removeLinkAction, restoreLinkAction, setBanAction } from '../../../actions';
import { Card, fmtDate, Pill, SmallButton, Table, Td } from '../../ui';

export default async function LinkDetail({ params }: PageProps<'/admin/links/[id]'>) {
  const { id } = await params;
  const s = await getServices();
  const d = await getLinkDetail(s.db, id);
  if (!d) notFound();
  const [voiceUrl, imageUrl] = await Promise.all([
    d.link.voiceKey ? s.storage.url(d.link.voiceKey, 600) : null,
    d.link.imageKey ? s.storage.url(d.link.imageKey, 600) : null,
  ]);
  const back = `/admin/links/${id}`;

  return (
    <div className="grid gap-4">
      <h1 className="display text-2xl">
        {d.chain.title} #{d.link.position}{' '}
        <Link href={`/c/${d.chain.slug}/${d.link.position}`} className="text-base text-accent">
          public ↗
        </Link>
      </h1>

      <Card title="Link">
        <div className="flex flex-wrap gap-2 text-sm">
          <Pill>{d.link.status}</Pill>
          <Pill tone={d.link.hidden ? 'warn' : 'muted'}>{d.link.hidden ? 'hidden' : 'visible'}</Pill>
          <Pill>read {d.link.readCount}</Pill>
          <Pill>{d.link.reportCount} reports</Pill>
          <span className="text-ink-faint">
            {d.link.city ?? '—'} · paid {fmtDate(d.link.createdAt)} · sealed {fmtDate(d.link.submittedAt)} · deadline {fmtDate(d.link.deadlineAt)}
          </span>
        </div>
        <p className="mt-3 whitespace-pre-wrap">{d.link.body ?? <em className="text-ink-faint">(no text)</em>}</p>
        {d.link.contact ? (
          <p className="mt-2 text-sm text-ink-muted">
            contact shared: <span className="text-ink">{d.link.contact}</span>
          </p>
        ) : null}
        {voiceUrl ? <audio className="mt-3" controls preload="none" src={voiceUrl} /> : null}
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="mt-3 max-h-80 rounded-xl" />
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {d.link.status !== 'removed' ? (
            <form action={removeLinkAction}>
              <input type="hidden" name="linkId" value={d.link.id} />
              <input type="hidden" name="resolution" value="removed from detail page" />
              <SmallButton type="submit" tone="danger">
                Remove link
              </SmallButton>
            </form>
          ) : null}
          {d.link.hidden && d.link.status === 'submitted' ? (
            <form action={restoreLinkAction}>
              <input type="hidden" name="linkId" value={d.link.id} />
              <input type="hidden" name="resolution" value="restored" />
              <SmallButton type="submit">Unhide · dismiss reports</SmallButton>
            </form>
          ) : null}
          <form action={setBanAction}>
            <input type="hidden" name="deviceId" value={d.device.id} />
            <input type="hidden" name="banned" value={d.device.banned ? 'false' : 'true'} />
            <input type="hidden" name="back" value={back} />
            <SmallButton type="submit" tone={d.device.banned ? 'ghost' : 'danger'}>
              {d.device.banned ? 'Unban device' : 'Ban device'}
            </SmallButton>
          </form>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Payment">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-ink-faint">gateway</dt>
            <dd>{d.payment.gateway}</dd>
            <dt className="text-ink-faint">order</dt>
            <dd className="break-all">{d.payment.gatewayOrderId}</dd>
            <dt className="text-ink-faint">payment</dt>
            <dd className="break-all">{d.payment.gatewayPaymentId ?? '—'}</dd>
            <dt className="text-ink-faint">status</dt>
            <dd>{d.payment.status}</dd>
            <dt className="text-ink-faint">amount</dt>
            <dd>₹{d.payment.amountPaise / 100}</dd>
            <dt className="text-ink-faint">captured</dt>
            <dd>{fmtDate(d.payment.capturedAt)}</dd>
            <dt className="text-ink-faint">referral</dt>
            <dd>{d.payment.refPosition ? `#${d.payment.refPosition}` : '—'}</dd>
          </dl>
        </Card>
        <Card title="Device">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-ink-faint">id</dt>
            <dd className="break-all">{d.device.id}</dd>
            <dt className="text-ink-faint">banned</dt>
            <dd>{d.device.banned ? `yes · ${d.device.banReason ?? ''}` : 'no'}</dd>
            <dt className="text-ink-faint">first seen</dt>
            <dd>{fmtDate(d.device.firstSeen)}</dd>
            <dt className="text-ink-faint">payer hash</dt>
            <dd className="break-all">{d.device.payerHash ? d.device.payerHash.slice(0, 16) + '…' : '—'}</dd>
            <dt className="text-ink-faint">push</dt>
            <dd>{d.device.pushSubscription ? 'subscribed' : '—'}</dd>
          </dl>
          {d.otherLinks.length > 1 ? (
            <div className="mt-3">
              <div className="mb-1 text-xs uppercase tracking-wider text-ink-faint">Other links from this device</div>
              <ul className="flex flex-wrap gap-2 text-sm">
                {d.otherLinks
                  .filter((l) => l.id !== d.link.id)
                  .map((l) => (
                    <li key={l.id}>
                      <Link href={`/admin/links/${l.id}`} className="text-accent">
                        {l.chainSlug} #{l.position}
                      </Link>{' '}
                      <span className="text-ink-faint">({l.status})</span>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </Card>
      </div>

      {d.reports.length ? (
        <Card title="Reports">
          <Table head={['When', 'Reason', 'Device', 'Resolved']}>
            {d.reports.map((r) => (
              <tr key={r.id}>
                <Td>{fmtDate(r.createdAt)}</Td>
                <Td>{r.reason}</Td>
                <Td className="break-all text-xs">{r.deviceId}</Td>
                <Td>{r.resolvedAt ? `${fmtDate(r.resolvedAt)} · ${r.resolution ?? ''}` : <Pill tone="warn">open</Pill>}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : null}
    </div>
  );
}
