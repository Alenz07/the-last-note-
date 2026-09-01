import { notFound } from 'next/navigation';
import { getAllChains } from '@/lib/chain/queries';
import { ChainForm } from '../chain-form';

export default async function EditChain({ params }: PageProps<'/admin/chains/[id]'>) {
  const { id } = await params;
  const chain = (await getAllChains()).find((c) => c.id === id);
  if (!chain) notFound();
  return (
    <div>
      <h1 className="display mb-4 text-2xl">
        Edit · {chain.title} <span className="text-ink-muted">/c/{chain.slug}</span>
      </h1>
      <ChainForm chain={chain} />
    </div>
  );
}
