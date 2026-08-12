import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export function PrivacyCenterCard() {
  return (
    <Link
      href="/settings/data"
      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 transition-colors hover:border-primary/40"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <ShieldCheck className="h-4.5 w-4.5" />
      </span>
      <span>
        <span className="block text-[15px] font-medium">Privacy center</span>
        <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
          See what&apos;s stored, export your data, or manage your account.
        </span>
      </span>
    </Link>
  );
}
