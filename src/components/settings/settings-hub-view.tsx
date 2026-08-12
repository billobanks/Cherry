import { Bell, CreditCard, Database, Shield, User } from "lucide-react";
import Link from "next/link";

const LINKS = [
  { href: "/settings/account", label: "Account", description: "Your name and email", Icon: User },
  { href: "/settings/notifications", label: "Notifications", description: "What we can remind you about", Icon: Bell },
  { href: "/settings/subscription", label: "Subscription", description: "Manage your plan and billing", Icon: CreditCard },
  { href: "/settings/privacy", label: "Privacy", description: "Control personalization", Icon: Shield },
  { href: "/settings/data", label: "Data", description: "Export or delete your data", Icon: Database },
];

export function SettingsHubView() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Settings</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Settings</h1>
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
