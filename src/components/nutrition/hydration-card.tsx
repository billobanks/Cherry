import { Droplet } from "lucide-react";

export function HydrationCard({ guidance, tip }: { guidance: string; tip: string }) {
  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <div className="flex items-center gap-2">
        <Droplet className="h-4.5 w-4.5 text-primary" aria-hidden />
        <h2 className="font-heading text-lg font-medium">Hydration</h2>
      </div>
      <p className="mt-2 text-[15px] leading-relaxed text-foreground">{guidance}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tip}</p>
    </section>
  );
}
