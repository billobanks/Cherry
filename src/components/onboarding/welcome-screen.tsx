"use client";

import { useRouter } from "next/navigation";
import { WelcomeStep } from "./steps/welcome-step";

export function WelcomeScreen() {
  const router = useRouter();
  return <WelcomeStep onNext={() => router.push("/onboarding/goals")} />;
}
