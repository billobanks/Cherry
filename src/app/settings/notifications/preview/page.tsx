import { notFound } from "next/navigation";
import { NotificationPreferencesCard } from "@/components/privacy/notification-preferences-card";
import type { NotificationPreferenceRow } from "@/lib/privacy";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function NotificationSettingsPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const notificationPreferences: NotificationPreferenceRow[] = [
    { category: "daily_checkin_reminder", enabled: true },
    { category: "period_prediction", enabled: true },
    { category: "insight_digest", enabled: false },
    { category: "product_updates", enabled: false },
  ];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Settings</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Notifications</h1>
      </div>
      <NotificationPreferencesCard
        initial={notificationPreferences}
        onUpdate={async () => {
          "use server";
          return { success: true };
        }}
      />
    </div>
  );
}
