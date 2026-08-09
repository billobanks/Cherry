import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
        Cherry
      </span>
      <h1 className="max-w-sm font-heading text-4xl font-medium text-balance">
        A calm place to understand your cycle.
      </h1>
      <p className="max-w-sm text-muted-foreground">
        The marketing site lives here later. For now, the onboarding flow is
        the thing to try.
      </p>
      <Link
        href="/onboarding"
        className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
      >
        Start onboarding
      </Link>
    </div>
  );
}
