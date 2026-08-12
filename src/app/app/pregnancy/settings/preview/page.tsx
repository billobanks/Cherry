import { notFound } from "next/navigation";
import { PregnancySettingsView } from "@/components/pregnancy/pregnancy-settings-view";
import type { PregnancyNotificationPreference } from "@/lib/pregnancy/notification-actions";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function PregnancySettingsPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const preferences: PregnancyNotificationPreference[] = [
    { category: "weekly_milestone", enabled: true, previewDetail: "private" },
    { category: "appointment_reminder", enabled: true, previewDetail: "private" },
    { category: "daily_checkin_reminder", enabled: false, previewDetail: "private" },
    { category: "safety_follow_up", enabled: true, previewDetail: "private" },
  ];

  return (
    <PregnancySettingsView
      initialPreferences={preferences}
      initialPreviewDetail="private"
      onToggleCategory={async () => {
        "use server";
        return { success: true };
      }}
      onUpdatePreviewDetail={async () => {
        "use server";
        return { success: true };
      }}
      onEndPregnancy={async () => {
        "use server";
        return { status: "ready" as const };
      }}
    />
  );
}
