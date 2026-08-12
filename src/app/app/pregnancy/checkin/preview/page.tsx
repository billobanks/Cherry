import { notFound } from "next/navigation";
import { PregnancyCheckinForm } from "@/components/pregnancy/pregnancy-checkin-form";
import { emptyPregnancyCheckinFormValues } from "@/lib/pregnancy";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function PregnancyCheckinPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const initialValues = {
    ...emptyPregnancyCheckinFormValues("2026-08-08"),
    mood: ["stressed" as const],
    symptoms: { heartburn: "moderate" as const, fever: "mild" as const },
  };

  return (
    <PregnancyCheckinForm
      initialValues={initialValues}
      gestationalAgeWeeks={24}
      onSave={async () => {
        "use server";
        await new Promise((resolve) => setTimeout(resolve, 300));
        return {
          status: "ready",
          safetyAlerts: [
            {
              ruleKey: "fever",
              severity: "urgent",
              label: "Fever",
              message:
                "A fever during pregnancy can have several possible causes. Because of that, it's a good idea to contact your prenatal care provider or seek medical care promptly rather than waiting.",
            },
          ],
        };
      }}
    />
  );
}
