import { notFound } from "next/navigation";
import { SettingsHubView } from "@/components/settings/settings-hub-view";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function SettingsPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <SettingsHubView />;
}
