import { Link } from 'react-router';

export function ErrorPage() {
  return (
    <section className="mx-auto grid max-w-[44rem] gap-4 px-4 py-14 sm:px-8 sm:py-20">
      <title>Something went wrong | React Field Guide</title>
      <p className="eyebrow">Error</p>
      <h1>Something went wrong</h1>
      <p className="lede">
        This page failed to load. A newer version may have been published while this tab was open.
        Reloading usually fixes it.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex h-10 items-center rounded-lg border border-accent bg-accent px-4 text-sm font-semibold text-accent-fg hover:opacity-90"
        >
          Reload the page
        </button>
        <Link
          to="/"
          className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-sm font-medium hover:border-accent"
        >
          Back to the field guide
        </Link>
      </div>
    </section>
  );
}
