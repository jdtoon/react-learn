import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section className="mx-auto grid max-w-[44rem] gap-4 px-4 py-14 sm:px-8 sm:py-20">
      <title>Page not found | React Field Guide</title>
      <p className="eyebrow">Error 404</p>
      <h1>Page not found</h1>
      <p className="lede">
        Nothing lives at this address. The link may be wrong or the page may have moved.
      </p>
      <div>
        <Link
          to="/"
          className="inline-flex h-10 items-center rounded-lg border border-accent bg-accent px-4 text-sm font-semibold text-accent-fg hover:opacity-90"
        >
          Back to the field guide
        </Link>
      </div>
    </section>
  );
}
