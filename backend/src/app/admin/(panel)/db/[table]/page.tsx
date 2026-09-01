import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cell, tableRows } from '@/lib/admin/browse';
import { formatCount } from '@/lib/format';
import { getServices } from '@/lib/services';
import { Card } from '../../ui';

export default async function DbTable({ params, searchParams }: PageProps<'/admin/db/[table]'>) {
  const { table } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const s = await getServices();
  const data = await tableRows(s.db, table, page, 50);
  if (!data) notFound();
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="display text-2xl">
          <Link href="/admin/db" className="text-ink-muted">
            db /
          </Link>{' '}
          {table}
        </h1>
        <p className="text-sm text-ink-muted num">
          {formatCount(data.total)} rows · page {data.page} of {pages}
          {data.page > 1 ? (
            <>
              {' '}
              · <Link className="text-accent" href={`/admin/db/${table}?page=${data.page - 1}`}>newer</Link>
            </>
          ) : null}
          {data.page < pages ? (
            <>
              {' '}
              · <Link className="text-accent" href={`/admin/db/${table}?page=${data.page + 1}`}>older</Link>
            </>
          ) : null}
        </p>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-ink-faint">
                {data.columns.map((c) => (
                  <th key={c.name} className="whitespace-nowrap pb-2 pr-4 font-medium" title={c.type}>
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-mono">
              {data.rows.map((r, i) => (
                <tr key={i} className="align-top">
                  {data.columns.map((c) => {
                    const v = cell(r[c.name]);
                    return (
                      <td key={c.name} className="max-w-[22rem] truncate py-1.5 pr-4" title={v}>
                        {v === '' ? <span className="text-ink-faint">∅</span> : v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
