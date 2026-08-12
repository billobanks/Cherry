import { Check } from "lucide-react";
import type { PlanDefinition } from "@/lib/subscription";

export function PlanCard({
  plan,
  isCurrentPlan,
  highlight,
  action,
}: {
  plan: PlanDefinition;
  isCurrentPlan: boolean;
  highlight?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border px-5 py-6 ${
        highlight ? "border-primary bg-card shadow-sm" : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-medium">{plan.name}</h2>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{plan.priceLabel}</p>
        </div>
        {isCurrentPlan ? (
          <span className="mt-1 shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
            Current plan
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.tagline}</p>

      <ul className="mt-5 flex flex-col gap-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-[15px] text-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
