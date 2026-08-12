import type { Metadata } from "next";
import { SignupFlow } from "@/components/onboarding/signup-flow";

export const metadata: Metadata = {
  title: "Create your account — Cherry",
};

export default function SignupPage() {
  return <SignupFlow />;
}
