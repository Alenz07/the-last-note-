import Link from 'next/link';
import { tableColumns, tableCounts, tableNames } from '@/lib/admin/browse';
import { formatCount } from '@/lib/format';
import { getServices } from '@/lib/services';
import { Card, Table, Td } from '../ui';

export default async function DbHome() {
  const s = await getServices();
  const counts = await tableCounts(s.db);
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="display text-2xl">Database</h1>
        <p className="text-sm text-ink-muted">
          Read-only view of every table. {s.db ? '' : ''}Driver: <code>{process.env.DATABASE_URL ? 'postgres' : 'pglite (embedded, .data/pg)'}</code>
        </p>
      </div>
      <Card>
        <Table head={['Table', 'Rows', 'Columns']}>
          {tableNames().map((t) => (
            <tr key={t}>
              <Td>
                <Link href={`/admin/db/${t}`} className="font-medium text-accent">
                  {t}
                </Link>
              </Td>
              <Td className="num">{formatCount(counts[t] ?? 0)}</Td>
              <Td className="text-xs text-ink-muted">{tableColumns(t).map((c) => c.name).join(', ')}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
