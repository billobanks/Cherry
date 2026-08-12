import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BirthPreparationView } from "@/components/pregnancy/birth-preparation-view";
import { getBirthPreferences, updateBirthPreferences } from "@/lib/pregnancy/birth-preferences-actions";

export const metadata: Metadata = {
  title: "Birth preparation — Cherry",
};

export default async function BirthPreparationPage() {
  const result = await getBirthPreferences();

  if (result.status === "signed_out") {
    redirect("/login");
  }
  if (result.status === "no_active_pregnancy") {
    redirect("/app/pregnancy/activate");
  }

  return (
    <BirthPreparationView
      initialPreferences={result.preferences}
      revealedTopics={result.revealedTopics}
      upcomingTopics={result.upcomingTopics}
      onUpdate={updateBirthPreferences}
    />
  );
}
