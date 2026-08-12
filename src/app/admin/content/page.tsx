import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PregnancyContentAdminView } from "@/components/admin/pregnancy-content-admin-view";
import { listWeekContentForAdmin, updateWeekContent } from "@/lib/pregnancy";

export const metadata: Metadata = {
  title: "Pregnancy content — Cherry admin",
};

export default async function PregnancyContentAdminPage() {
  const result = await listWeekContentForAdmin();

  if (result.status === "signed_out") {
    redirect("/login");
  }
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

  return <PregnancyContentAdminView rows={result.rows} onSave={updateWeekContent} />;
}
