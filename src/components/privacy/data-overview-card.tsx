import type { DataOverview } from "@/lib/privacy";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function DataOverviewCard({ overview }: { overview: DataOverview }) {
  const rows = [
    { label: "Cycles logged", value: overview.cyclesLogged },
    { label: "Daily check-ins", value: overview.checkinsLogged },
    { label: "Symptoms logged", value: overview.symptomsLoggedTotal },
    { label: "Messages with Cherry", value: overview.assistantMessages },
    { label: "Pregnancy check-ins", value: overview.pregnancyCheckinsLogged },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <h2 className="font-heading text-lg font-medium">What we store</h2>
      <p className="mt-1 text-sm text-muted-foreground">Member since {formatDate(overview.memberSince)}.</p>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl bg-secondary/60 px-3.5 py-3">
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
