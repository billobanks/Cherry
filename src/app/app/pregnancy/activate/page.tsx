import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PregnancyActivationWizard } from "@/components/pregnancy/pregnancy-activation-wizard";
import { activatePregnancy } from "@/lib/pregnancy";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "I'm pregnant — Cherry",
};

export default async function PregnancyActivatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <PregnancyActivationWizard onActivate={activatePregnancy} />;
}
