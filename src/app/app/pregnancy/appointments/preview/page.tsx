import { notFound } from "next/navigation";
import { AppointmentsView } from "@/components/pregnancy/appointments-view";
import type { AppointmentSummary, NoteSummary, QuestionSummary } from "@/lib/pregnancy/appointment-actions";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function PregnancyAppointmentsPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const appointments: AppointmentSummary[] = [
    { id: "1", appointmentDate: "2026-09-02", appointmentTime: "10:30", providerName: "Dr. Rivera", location: "Cherry Women's Health", appointmentType: "Anatomy scan", reminderEnabled: true },
    { id: "2", appointmentDate: "2026-08-05", appointmentTime: "09:00", providerName: "Dr. Rivera", location: "Cherry Women's Health", appointmentType: "Routine check-up", reminderEnabled: true },
  ];
  const questions: QuestionSummary[] = [
    { id: "1", appointmentId: null, question: "Is there anything about my anatomy scan you'd like to discuss?", answered: false },
    { id: "2", appointmentId: null, question: "What prenatal vitamin do you recommend?", answered: true },
  ];
  const notes: NoteSummary[] = [
    { id: "1", appointmentId: null, note: "Blood pressure normal, weight gain on track.", createdAt: "2026-08-05T00:00:00Z" },
  ];

  const noop = async () => {
    "use server";
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { success: true };
  };

  return (
    <AppointmentsView
      appointments={appointments}
      questions={questions}
      notes={notes}
      onAddAppointment={noop}
      onDeleteAppointment={noop}
      onAddQuestion={noop}
      onToggleQuestion={noop}
      onDeleteQuestion={noop}
      onAddNote={noop}
      onDeleteNote={noop}
    />
  );
}
