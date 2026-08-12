import { notFound } from "next/navigation";
import { PregnancyContentAdminView } from "@/components/admin/pregnancy-content-admin-view";
import type { AdminWeekContentRow } from "@/lib/pregnancy/admin-content-actions";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function PregnancyContentAdminPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const rows: AdminWeekContentRow[] = [
    {
      id: "1",
      weekNumber: 8,
      section: "baby_development",
      content:
        "Around this week, early development of major organs and body systems is underway. Limb buds continue forming, and the earliest heartbeat activity is often detectable around this stage — though timing varies.",
      status: "DRAFT",
      source: null,
      sourceUrl: null,
      medicalReviewer: null,
      dateReviewed: null,
      contentVersion: 1,
      updatedAt: "2026-08-19T00:00:00Z",
    },
    {
      id: "2",
      weekNumber: 20,
      section: "what_you_may_notice",
      content:
        "Some people notice round ligament pain (a pulling sensation on one or both sides of the lower belly), mild back discomfort, or increased appetite. Others notice very little change beyond a growing belly. Both are common.",
      status: "MEDICAL_REVIEW",
      source: null,
      sourceUrl: null,
      medicalReviewer: null,
      dateReviewed: null,
      contentVersion: 2,
      updatedAt: "2026-08-19T00:00:00Z",
    },
    {
      id: "3",
      weekNumber: 32,
      section: "questions_for_provider",
      content: "What signs of labor should prompt me to call you or go to the hospital?\nCan we start talking through my birth preferences?",
      status: "PUBLISHED",
      source: "ACOG",
      sourceUrl: "https://www.acog.org",
      medicalReviewer: "Dr. Jane Smith, MD, OB-GYN",
      dateReviewed: "2026-08-01",
      contentVersion: 3,
      updatedAt: "2026-08-19T00:00:00Z",
    },
  ];

  return (
    <PregnancyContentAdminView
      rows={rows}
      onSave={async () => {
        "use server";
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { success: true };
      }}
    />
  );
}
