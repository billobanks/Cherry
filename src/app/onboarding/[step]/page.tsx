import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getSymptomOptions } from "@/lib/onboarding/data";
import { ANSWER_STEP_SLUGS, isAnswerStepSlug } from "@/lib/onboarding/step-routes";

export const metadata: Metadata = {
  title: "Get started — Cherry",
};

export function generateStaticParams() {
  return ANSWER_STEP_SLUGS.map((step) => ({ step }));
}

export default async function OnboardingStepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  if (!isAnswerStepSlug(step)) {
    notFound();
  }

  const symptomOptions = await getSymptomOptions();

  return <OnboardingWizard slug={step} symptomOptions={symptomOptions} />;
}
