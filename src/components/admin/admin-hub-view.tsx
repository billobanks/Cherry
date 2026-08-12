import { CreditCard, FileText, LayoutDashboard, ShieldAlert, Users } from "lucide-react";
import Link from "next/link";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", description: "Users, signups, subscriptions at a glance", Icon: LayoutDashboard },
  { href: "/admin/content", label: "Content", description: "Pregnancy week content governance", Icon: FileText },
  { href: "/admin/users", label: "Users", description: "Look up users and admin access", Icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", description: "Billing status across users", Icon: CreditCard },
  { href: "/admin/safety-content", label: "Safety content", description: "Symptom safety rule copy", Icon: ShieldAlert },
];

export function AdminHubView() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Admin</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Admin</h1>
      </div>

      <div className="flex flex-col gap-2.5">
        {LINKS.map(({ href, label, description, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3.5 rounded-2xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-primary/40"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Icon className="h-4.5 w-4.5" />
            </span>
            <span className="flex-1">
              <span className="block text-[15px] font-medium text-foreground">{label}</span>
              <span className="block text-sm text-muted-foreground">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
