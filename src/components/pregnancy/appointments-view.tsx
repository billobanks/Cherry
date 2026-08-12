"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import type {
  AddAppointmentInput,
  AppointmentSummary,
  NoteSummary,
  QuestionSummary,
} from "@/lib/pregnancy/appointment-actions";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function AppointmentsView({
  appointments,
  questions,
  notes,
  onAddAppointment,
  onDeleteAppointment,
  onAddQuestion,
  onToggleQuestion,
  onDeleteQuestion,
  onAddNote,
  onDeleteNote,
}: {
  appointments: AppointmentSummary[];
  questions: QuestionSummary[];
  notes: NoteSummary[];
  onAddAppointment: (input: AddAppointmentInput) => Promise<{ success: boolean; message?: string }>;
  onDeleteAppointment: (id: string) => Promise<{ success: boolean; message?: string }>;
  onAddQuestion: (question: string, appointmentId: string | null) => Promise<{ success: boolean; message?: string }>;
  onToggleQuestion: (id: string, answered: boolean) => Promise<{ success: boolean; message?: string }>;
  onDeleteQuestion: (id: string) => Promise<{ success: boolean; message?: string }>;
  onAddNote: (note: string, appointmentId: string | null) => Promise<{ success: boolean; message?: string }>;
  onDeleteNote: (id: string) => Promise<{ success: boolean; message?: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [provider, setProvider] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [reminder, setReminder] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [newNote, setNewNote] = useState("");

  function refresh() {
    router.refresh();
  }

  function handleAddAppointment() {
    if (!date) {
      toast.error("Pick a date first.");
      return;
    }
    startTransition(async () => {
      const result = await onAddAppointment({
        appointmentDate: date,
        appointmentTime: time || null,
        providerName: provider || null,
        location: location || null,
        appointmentType: type || null,
        reminderEnabled: reminder,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setDate("");
      setTime("");
      setProvider("");
      setLocation("");
      setType("");
      toast.success("Appointment added.");
      refresh();
    });
  }

  function handleAddQuestion() {
    startTransition(async () => {
      const result = await onAddQuestion(newQuestion, null);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setNewQuestion("");
      refresh();
    });
  }

  function handleAddNote() {
    startTransition(async () => {
      const result = await onAddNote(newNote, null);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setNewNote("");
      refresh();
    });
  }

  const inputClass = "h-11 w-full rounded-2xl border border-border bg-card px-3.5 text-[15px] outline-none focus:border-primary";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Appointments</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Prenatal appointments</h1>
      </div>

      <section className="rounded-2xl border border-border bg-card px-5 py-5">
        <h2 className="font-heading text-lg font-medium">Add appointment</h2>
        <div className="mt-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
          </div>
          <input placeholder="Provider name" value={provider} onChange={(e) => setProvider(e.target.value)} className={inputClass} />
          <input placeholder="Hospital / birth center / location" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
          <input placeholder="Type (e.g. routine check-up, anatomy scan)" value={type} onChange={(e) => setType(e.target.value)} className={inputClass} />
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Reminder</span>
            <Switch checked={reminder} onCheckedChange={setReminder} />
          </div>
          <button
            type="button"
            onClick={handleAddAppointment}
            disabled={isPending}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-70"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add appointment
          </button>
        </div>
      </section>

      <section>
        <h2 className="px-1 font-heading text-lg font-medium">Upcoming &amp; past</h2>
        {appointments.length === 0 ? (
          <p className="mt-2 px-1 text-sm text-muted-foreground">No appointments added yet.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            {appointments.map((appt) => (
              <div key={appt.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
                <div>
                  <p className="text-[15px] font-medium text-foreground">
                    {formatDate(appt.appointmentDate)}
                    {appt.appointmentTime ? ` · ${appt.appointmentTime}` : ""}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[appt.appointmentType, appt.providerName, appt.location].filter(Boolean).join(" · ") || "No details added"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startTransition(async () => { await onDeleteAppointment(appt.id); refresh(); })}
                  aria-label="Delete appointment"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card px-5 py-5">
        <h2 className="font-heading text-lg font-medium">Questions I want to ask</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Add a question…"
            className={inputClass}
            onKeyDown={(e) => e.key === "Enter" && handleAddQuestion()}
          />
          <button type="button" onClick={handleAddQuestion} disabled={isPending} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-70">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {questions.map((q) => (
            <div key={q.id} className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-2.5">
              <input
                type="checkbox"
                checked={q.answered}
                onChange={(e) => startTransition(async () => { await onToggleQuestion(q.id, e.target.checked); refresh(); })}
                className="h-4 w-4 shrink-0"
              />
              <span className={`flex-1 text-sm ${q.answered ? "text-muted-foreground line-through" : "text-foreground"}`}>{q.question}</span>
              <button type="button" onClick={() => startTransition(async () => { await onDeleteQuestion(q.id); refresh(); })} aria-label="Delete question" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card px-5 py-5">
        <h2 className="font-heading text-lg font-medium">Notes from my visits</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="What did your provider tell you?"
            className={inputClass}
            onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
          />
          <button type="button" onClick={handleAddNote} disabled={isPending} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-70">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {notes.map((n) => (
            <div key={n.id} className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-2.5">
              <span className="flex-1 text-sm text-foreground">{n.note}</span>
              <button type="button" onClick={() => startTransition(async () => { await onDeleteNote(n.id); refresh(); })} aria-label="Delete note" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Your own notes only — Cherry never interprets lab or imaging results for you.
        </p>
      </section>
    </div>
  );
}
