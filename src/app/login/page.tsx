import type { Metadata } from "next";
import { LoginView } from "@/components/auth/login-view";
import { logIn } from "@/lib/auth/login-actions";

export const metadata: Metadata = {
  title: "Log in — Cherry",
};

export default function LoginPage() {
  return <LoginView onLogIn={logIn} />;
}
