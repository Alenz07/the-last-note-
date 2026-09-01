import Link from 'next/link';
import { getOpenReports } from '@/lib/admin/queries';
import { getServices } from '@/lib/services';
import { removeLinkAction, restoreLinkAction } from '../../actions';
import { Card, fmtDate, Pill, SmallButton } from '../ui';

export default async function ReportsPage() {
  const s = await getServices();
  const open = await getOpenReports(s.db);
  return (
    <div className="grid gap-4">
      <h1 className="display text-2xl">Reports · {open.length} open</h1>
      {open.length === 0 ? <p className="text-ink-muted">Nothing to review.</p> : null}
      {open.map((r) => (
        <Card key={r.link.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Link href={`/admin/links/${r.link.id}`} className="font-medium text-accent">
                  {r.chain.title} #{r.link.position}
                </Link>
                <Pill tone={r.link.hidden ? 'warn' : 'muted'}>{r.link.hidden ? 'hidden' : 'visible'}</Pill>
                <Pill>{r.link.status}</Pill>
                {r.deviceBanned ? <Pill tone="bad">device banned</Pill> : null}
                {r.link.voiceKey ? <Pill>voice</Pill> : null}
                {r.link.imageKey ? <Pill>photo</Pill> : null}
                <span className="text-ink-faint">{r.link.city ?? '—'} · {fmtDate(r.link.submittedAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-ink">{r.link.body}</p>
              <ul className="mt-2 flex flex-wrap gap-2 text-xs text-ink-muted">
                {r.reports.map((x) => (
                  <li key={x.id} className="rounded-full border border-line px-2 py-0.5">
                    {x.reason} · {fmtDate(x.createdAt)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <form action={restoreLinkAction}>
                <input type="hidden" name="linkId" value={r.link.id} />
                <input type="hidden" name="resolution" value="dismissed" />
                <SmallButton type="submit">Dismiss · keep</SmallButton>
              </form>
              <form action={removeLinkAction}>
                <input type="hidden" name="linkId" value={r.link.id} />
                <input type="hidden" name="resolution" value="removed" />
                <SmallButton type="submit" tone="danger">
                  Remove
                </SmallButton>
              </form>
              <form action={removeLinkAction}>
                <input type="hidden" name="linkId" value={r.link.id} />
                <input type="hidden" name="deviceId" value={r.link.deviceId} />
                <input type="hidden" name="banDevice" value="true" />
                <input type="hidden" name="resolution" value="removed + device banned" />
                <SmallButton type="submit" tone="danger">
                  Remove + ban device
                </SmallButton>
              </form>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
