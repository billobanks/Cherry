import { notFound } from "next/navigation";
import { AccountView } from "@/components/settings/account-view";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function AccountSettingsPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <AccountView
      account={{ displayName: "Maya", email: "maya@example.com" }}
      onUpdateDisplayName={async () => {
        "use server";
        return { success: true };
      }}
    />
  );
}
