import { findLinkAction } from '../../actions';

export default async function FindLinkPage({ searchParams }: PageProps<'/admin/links'>) {
  const { notfound } = await searchParams;
  return (
    <div className="max-w-xl">
      <h1 className="display mb-4 text-2xl">Find a link</h1>
      <form action={findLinkAction} className="flex gap-2">
        <input className="field" name="q" placeholder="confess #42  ·  link uuid  ·  payment / order id" autoFocus />
        <button className="btn btn-primary !w-auto" type="submit">
          Find
        </button>
      </form>
      {notfound ? <p className="mt-3 text-sm text-danger">Nothing matched “{String(notfound)}”.</p> : null}
      <p className="mt-3 text-xs text-ink-faint">Formats: “confess 42”, “confess/42”, a link id, a gateway payment id or order id.</p>
    </div>
  );
}
