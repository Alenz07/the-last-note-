'use client';

import { useState } from 'react';
import { link as copy } from '@/lib/copy';
import { REPORT_REASONS, type ReportReason } from '@/lib/moderation';

const LABELS: Record<ReportReason, string> = {
  'contact-info': 'Phone number / handle / link',
  harassment: 'Harassment or threat',
  sexual: 'Sexual content',
  'names-a-person': 'Names or exposes a real person',
  spam: 'Spam',
  other: 'Something else',
};

export function ReportButton({ linkId, className = '' }: { linkId: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (done) return <p className={`text-xs text-ink-muted ${className}`}>{copy.reported}</p>;

  if (!open) {
    return (
      <button type="button" className={`text-xs text-ink-faint underline-offset-2 hover:underline ${className}`} onClick={() => setOpen(true)}>
        {copy.report}
      </button>
    );
  }

  return (
    <div className={`grid gap-1 ${className}`}>
      {REPORT_REASONS.map((r) => (
        <button
          key={r}
          type="button"
          disabled={busy}
          className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-left text-sm text-ink-muted hover:text-ink"
          onClick={async () => {
            setBusy(true);
            try {
              await fetch('/api/report', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ linkId, reason: r }),
              });
            } finally {
              setBusy(false);
              setDone(true);
            }
          }}
        >
          {LABELS[r]}
        </button>
      ))}
      <button type="button" className="text-xs text-ink-faint" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </div>
  );
}
