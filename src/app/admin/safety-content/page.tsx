import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SafetyRulesAdminView } from "@/components/admin/safety-rules-admin-view";
import { listSafetyRulesForAdmin, updateSafetyRule } from "@/lib/safety";

export const metadata: Metadata = {
  title: "Safety rules — Cherry admin",
};

export default async function SafetyRulesAdminPage() {
  const result = await listSafetyRulesForAdmin();

  if (result.status === "signed_out") {
    redirect("/login");
  }

  // Don't distinguish "not admin" from "doesn't exist" for non-admins.
  if (result.status === "forbidden") {
    notFound();
  }

  if (result.status === "error") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[15px] text-muted-foreground">{result.message}</p>
      </div>
    );
  }

  return <SafetyRulesAdminView rules={result.rules} onSave={updateSafetyRule} />;
}
