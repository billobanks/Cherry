import type { AdminSubscriptionRow } from "@/lib/admin";

export function AdminSubscriptionsView({ subscriptions }: { subscriptions: AdminSubscriptionRow[] }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Admin</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Subscriptions</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">Most recent {subscriptions.length} subscriptions.</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-medium text-foreground">{sub.displayName ?? "Unnamed user"}</p>
              <p className="text-sm text-muted-foreground">
                {sub.plan}
                {sub.status ? ` · ${sub.status}` : ""}
                {sub.cancelAtPeriodEnd ? " · canceling" : ""}
              </p>
              {sub.currentPeriodEnd ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </p>
              ) : null}
            </div>
            <span
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                sub.plan === "premium" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/40 text-muted-foreground"
              }`}
            >
              {sub.plan}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
