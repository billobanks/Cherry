"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { AccountData } from "@/lib/account/actions";
import { createClient } from "@/lib/supabase/client";

export function AccountView({
  account,
  onUpdateDisplayName,
}: {
  account: AccountData;
  onUpdateDisplayName: (displayName: string) => Promise<{ success: boolean; message?: string }>;
}) {
  const [displayName, setDisplayName] = useState(account.displayName ?? "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    startTransition(async () => {
      const result = await onUpdateDisplayName(displayName);
      if (!result.success) {
        toast.error(result.message ?? "Couldn't save your name.");
        return;
      }
      toast.success("Name updated.");
    });
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Settings</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Account</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card px-5 py-4">
        <label className="text-sm font-medium text-foreground" htmlFor="displayName">
          Name
        </label>
        <input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="What should we call you?"
          className="mt-2 w-full rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-[15px] outline-none focus:border-primary"
        />
        {account.email ? (
          <div className="mt-4">
            <span className="text-sm font-medium text-foreground">Email</span>
            <p className="mt-1 text-[15px] text-muted-foreground">{account.email}</p>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-70"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save name"}
      </button>

      <button
        type="button"
        onClick={handleSignOut}
        className="flex h-11 w-full items-center justify-center rounded-full border border-border text-sm font-medium text-foreground"
      >
        Sign out
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Want to export your data or delete your account?{" "}
        <Link href="/settings/data" className="font-medium text-primary underline">
          Go to Data &amp; privacy
        </Link>
      </p>
    </div>
  );
}
