import { notFound } from "next/navigation";
import { LoginView } from "@/components/auth/login-view";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function LoginPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <LoginView
      onLogIn={async () => {
        "use server";
        return { status: "error" as const, message: "That email and password don't match — try again.", field: "password" as const };
      }}
    />
  );
}
