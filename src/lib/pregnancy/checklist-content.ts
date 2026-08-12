import type { PregnancyChecklistItemKey } from "@/types/database";

export interface ChecklistItemContent {
  key: PregnancyChecklistItemKey;
  label: string;
  detail: string;
}

/**
 * The "Newly Pregnant Checklist" — first-trimester onboarding tasks.
 * Deliberately short: the spec asks not to overwhelm the user, so this is
 * six items, not an exhaustive early-pregnancy to-do list.
 */
export const NEWLY_PREGNANT_CHECKLIST: ChecklistItemContent[] = [
  {
    key: "schedule_prenatal_care",
    label: "Schedule prenatal care",
    detail: "If you haven't already, scheduling your first prenatal visit is one of the most useful early steps.",
  },
  {
    key: "review_medications_with_clinician",
    label: "Review medications and supplements with your provider",
    detail: "Bring a list of anything you currently take, prescription or over-the-counter, to review together.",
  },
  {
    key: "review_prenatal_nutrition",
    label: "Review prenatal nutrition basics",
    detail: "A quick look at the Nutrition Center can help you get oriented on what's commonly recommended.",
  },
  {
    key: "review_food_safety",
    label: "Review food safety guidance",
    detail: "A few foods are commonly recommended to limit or avoid during pregnancy — worth a quick read.",
  },
  {
    key: "record_clinician_due_date",
    label: "Record your clinician-provided due date",
    detail: "Once your provider gives you a due date, adding it here keeps your timeline as accurate as possible.",
  },
  {
    key: "prepare_first_appointment_questions",
    label: "Write down questions for your first appointment",
    detail: "The Appointments section has a place to collect questions before you forget them.",
  },
];
