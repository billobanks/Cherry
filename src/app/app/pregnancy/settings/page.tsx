import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PregnancySettingsView } from "@/components/pregnancy/pregnancy-settings-view";
import { endPregnancy } from "@/lib/pregnancy";
import {
  getPregnancyNotificationPreferences,
  updateAllNotificationPreviewDetail,
  updatePregnancyNotificationPreference,
} from "@/lib/pregnancy/notification-actions";

export const metadata: Metadata = {
  title: "Pregnancy settings — Cherry",
};

export default async function PregnancySettingsPage() {
  const result = await getPregnancyNotificationPreferences();

  if (result.status === "signed_out") {
    redirect("/login");
  }

  return (
    <PregnancySettingsView
      initialPreferences={result.preferences}
      initialPreviewDetail={result.preferences[0]?.previewDetail ?? "private"}
      onToggleCategory={(category, enabled) => updatePregnancyNotificationPreference(category, { enabled })}
      onUpdatePreviewDetail={updateAllNotificationPreviewDetail}
      onEndPregnancy={endPregnancy}
    />
  );
}
