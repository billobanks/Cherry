import type { SubscriptionStatus } from "@/lib/subscription";

const STATUS_STYLES: Record<SubscriptionStatus, { label: string; className: string }> = {
  trialing: { label: "Trial", className: "bg-accent text-accent-foreground" },
  active: { label: "Active", className: "bg-moss-soft text-moss" },
  past_due: { label: "Payment past due", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  canceled: { label: "Canceled", className: "bg-secondary text-muted-foreground" },
  expired: { label: "Expired", className: "bg-secondary text-muted-foreground" },
};

export function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.className}`}>{style.label}</span>
  );
}
