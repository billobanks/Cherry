export function ComingUpCard({ content }: { content: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-border px-5 py-5">
      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">Coming up</span>
      <p className="mt-2 text-[15px] leading-relaxed text-foreground">{content}</p>
    </section>
  );
}
