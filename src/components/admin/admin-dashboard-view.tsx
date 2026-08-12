import type { AdminDashboardStats } from "@/lib/admin";

const STAT_LABELS: { key: keyof AdminDashboardStats; label: string }[] = [
  { key: "totalUsers", label: "Total users" },
  { key: "newUsersLast7Days", label: "New users (7 days)" },
  { key: "activeSubscriptions", label: "Active subscriptions" },
  { key: "totalAdmins", label: "Admins" },
];

export function AdminDashboardView({ stats }: { stats: AdminDashboardStats }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Admin</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {STAT_LABELS.map(({ key, label }) => (
          <div key={key} className="rounded-2xl border border-border bg-card px-4 py-4">
            <span className="text-2xl font-medium text-foreground">{stats[key]}</span>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
