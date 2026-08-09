import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getSymptomOptions } from "@/lib/onboarding/data";

export const metadata: Metadata = {
  title: "Get started — Cherry",
};

export default async function OnboardingPage() {
  const symptomOptions = await getSymptomOptions();

  return <OnboardingWizard symptomOptions={symptomOptions} />;
}
