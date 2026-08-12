"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { AdminUserRow } from "@/lib/admin";

export function AdminUsersView({
  users,
  onSetUserAdmin,
}: {
  users: AdminUserRow[];
  onSetUserAdmin: (userId: string, isAdmin: boolean) => Promise<{ success: boolean; message?: string }>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(userId: string, isAdmin: boolean) {
    startTransition(async () => {
      const result = await onSetUserAdmin(userId, isAdmin);
      if (!result.success) {
        toast.error(result.message ?? "Couldn't update that user.");
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Admin</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Users</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">Most recent {users.length} users.</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-medium text-foreground">{user.displayName ?? "Unnamed"}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email ?? "No email"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Joined {new Date(user.createdAt).toLocaleDateString()}
                {user.subscriptionPlan ? ` · ${user.subscriptionPlan}${user.subscriptionStatus ? ` (${user.subscriptionStatus})` : ""}` : ""}
              </p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleToggle(user.id, !user.isAdmin)}
              aria-pressed={user.isAdmin}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                user.isAdmin ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary/40 text-foreground"
              }`}
            >
              {user.isAdmin ? "Admin" : "Make admin"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
