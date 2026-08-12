import type { Metadata } from "next";
import { WelcomeScreen } from "@/components/onboarding/welcome-screen";

export const metadata: Metadata = {
  title: "Get started — Cherry",
};

export default function OnboardingPage() {
  return <WelcomeScreen />;
}
