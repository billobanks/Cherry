import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsHubView } from "@/components/settings/settings-hub-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Settings — Cherry",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <SettingsHubView />;
}
