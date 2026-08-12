export function BabyThisWeekCard({ content }: { content: string }) {
  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Baby this week</span>
      <p className="mt-2 text-[15px] leading-relaxed text-foreground">{content}</p>
    </section>
  );
}

export function BodyThisWeekCard({ content }: { content: string }) {
  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Your body this week</span>
      <p className="mt-2 text-[15px] leading-relaxed text-foreground">{content}</p>
    </section>
  );
}
