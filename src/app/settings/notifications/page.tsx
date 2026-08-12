import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NotificationPreferencesCard } from "@/components/privacy/notification-preferences-card";
import { getPrivacyPreferences, updateNotificationPreference } from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Notifications — Cherry",
};

export default async function NotificationSettingsPage() {
  const result = await getPrivacyPreferences();

  if (result.status === "signed_out") {
    redirect("/login");
  }

  if (result.status === "error") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[15px] text-muted-foreground">{result.message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Settings</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Notifications</h1>
      </div>
      <NotificationPreferencesCard initial={result.notificationPreferences} onUpdate={updateNotificationPreference} />
    </div>
  );
}
