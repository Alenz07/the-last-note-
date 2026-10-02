import type { ReactNode } from 'react';

/** Tiny admin primitives. Function over form. */
export function Card({ title, children, aside }: { title?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      {title ? (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">{title}</h2>
          {aside}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-ink-faint">
            {head.map((h) => (
              <th key={h} className="pb-2 pr-4 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`py-2 pr-4 align-top ${className}`}>{children}</td>;
}

export function Pill({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'ok' | 'warn' | 'bad' }) {
  const cls = {
    muted: 'border-line text-ink-muted',
    ok: 'border-tint-moss/60 text-ink',
    warn: 'border-accent/50 text-accent',
    bad: 'border-danger/50 text-danger',
  }[tone];
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${cls}`}>{children}</span>;
}

export function SmallButton({ children, tone = 'ghost', ...rest }: { children: ReactNode; tone?: 'ghost' | 'danger' | 'primary' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = tone === 'danger' ? 'btn-danger' : tone === 'primary' ? 'btn-primary' : 'btn-ghost';
  return (
    <button {...rest} className={`btn ${cls} !min-h-9 !w-auto !px-3 !py-1.5 !text-sm`}>
      {children}
    </button>
  );
}

/**
 * The container runs on UTC, and en-IN alone only changes the formatting, not
 * the clock — which produced Indian-looking timestamps five and a half hours
 * out. The zone is named explicitly so it stays right wherever this runs.
 */
export const fmtDate = (d: Date | string | null | undefined) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
      })
    : '—';
