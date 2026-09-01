import type { ChainSummary, Tint } from '@/lib/chain/types';
import { TINTS } from '@/lib/chain/types';
import { saveChainAction } from '../../actions';

/** Create/edit a chain. Every theme is a row — this form is the whole "new chain" pipeline. */
export function ChainForm({ chain }: { chain?: ChainSummary }) {
  const c = chain;
  return (
    <form action={saveChainAction} className="grid max-w-2xl gap-4">
      {c ? <input type="hidden" name="id" value={c.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Slug (URL)">
          <input className="field" name="slug" defaultValue={c?.slug ?? ''} placeholder="confess" required pattern="[a-z0-9-]+" />
        </Field>
        <Field label="Title">
          <input className="field" name="title" defaultValue={c?.title ?? ''} placeholder="Confess" required />
        </Field>
      </div>
      <Field label="Tagline (landing tile)">
        <input className="field" name="tagline" defaultValue={c?.tagline ?? ''} placeholder="Say the thing you haven't said." />
      </Field>
      <Field label="Prompt (shown in the composer)">
        <textarea className="field" name="prompt" defaultValue={c?.prompt ?? ''} rows={2} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Tint">
          <select className="field" name="tint" defaultValue={c?.tint ?? 'wine'}>
            {TINTS.map((t: Tint) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Price (₹)">
          <input className="field" type="number" name="priceRupees" min={1} max={500} defaultValue={c ? c.pricePaise / 100 : 5} />
        </Field>
        <Field label="Status">
          <select className="field" name="status" defaultValue={c?.status ?? 'live'}>
            <option value="live">live</option>
            <option value="paused">paused</option>
            <option value="ended">ended</option>
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Reveal mode">
          <select className="field" name="revealMode" defaultValue={c?.revealMode ?? 'referrer'}>
            <option value="referrer">referrer (share link reveals that link)</option>
            <option value="latest">latest (always the last N)</option>
          </select>
        </Field>
        <Field label="Reveal count">
          <input className="field" type="number" name="revealCount" min={1} max={10} defaultValue={c?.revealCount ?? 1} />
        </Field>
        <Field label="Unseal text after N more links">
          <input className="field" type="number" name="unsealAfter" min={1} defaultValue={c?.unsealAfter ?? 50} />
        </Field>
        <Field label="Write window (min)">
          <input className="field" type="number" name="windowMinutes" min={1} max={1440} defaultValue={c?.windowMinutes ?? 10} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="allowVoice" defaultChecked={c?.allowVoice ?? true} /> Allow voice notes
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="allowImage" defaultChecked={c?.allowImage ?? true} /> Allow photos
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="allowContact" defaultChecked={c?.allowContact ?? true} /> Allow optional contact
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="unsealMedia" defaultChecked={false} /> Unseal media too (not recommended)
        </label>
        <label className="flex items-center gap-2">
          Sort <input className="field !w-20 !py-1" type="number" name="sort" defaultValue={0} />
        </label>
      </div>
      <button type="submit" className="btn btn-primary !w-auto">
        {c ? 'Save chain' : 'Create chain'}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
