export function WhyHelpfulCard({ text }: { text: string }) {
  return (
    <section className="rounded-2xl bg-secondary/60 px-5 py-5">
      <h2 className="font-heading text-lg font-medium">Why These Foods May Be Helpful</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-foreground">{text}</p>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        General wellness information only — not medical advice, and not a claim that any food
        treats or prevents a condition.
      </p>
    </section>
  );
}
