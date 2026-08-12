import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppointmentsView } from "@/components/pregnancy/appointments-view";
import {
  addPregnancyAppointment,
  addPregnancyNote,
  addPregnancyQuestion,
  deletePregnancyAppointment,
  deletePregnancyNote,
  deletePregnancyQuestion,
  getPregnancyAppointments,
  togglePregnancyQuestionAnswered,
} from "@/lib/pregnancy/appointment-actions";

export const metadata: Metadata = {
  title: "Appointments — Cherry",
};

export default async function PregnancyAppointmentsPage() {
  const result = await getPregnancyAppointments();

  if (result.status === "signed_out") {
    redirect("/login");
  }
  if (result.status === "no_active_pregnancy") {
    redirect("/app/pregnancy/activate");
  }
  if (result.status === "error") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[15px] text-muted-foreground">{result.message}</p>
      </div>
    );
  }

  return (
    <AppointmentsView
      appointments={result.appointments}
      questions={result.questions}
      notes={result.notes}
      onAddAppointment={addPregnancyAppointment}
      onDeleteAppointment={deletePregnancyAppointment}
      onAddQuestion={addPregnancyQuestion}
      onToggleQuestion={togglePregnancyQuestionAnswered}
      onDeleteQuestion={deletePregnancyQuestion}
      onAddNote={addPregnancyNote}
      onDeleteNote={deletePregnancyNote}
    />
  );
}
