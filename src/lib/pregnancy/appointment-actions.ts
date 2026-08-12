"use server";

import { createClient } from "@/lib/supabase/server";
import { getActivePregnancy } from "./pregnancy-lookup";

export interface AppointmentSummary {
  id: string;
  appointmentDate: string;
  appointmentTime: string | null;
  providerName: string | null;
  location: string | null;
  appointmentType: string | null;
  reminderEnabled: boolean;
}

export interface QuestionSummary {
  id: string;
  appointmentId: string | null;
  question: string;
  answered: boolean;
}

export interface NoteSummary {
  id: string;
  appointmentId: string | null;
  note: string;
  createdAt: string;
}

export type GetAppointmentsResult =
  | { status: "ready"; appointments: AppointmentSummary[]; questions: QuestionSummary[]; notes: NoteSummary[] }
  | { status: "signed_out" }
  | { status: "no_active_pregnancy" }
  | { status: "error"; message: string };

export async function getPregnancyAppointments(): Promise<GetAppointmentsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { status: "no_active_pregnancy" };

  const [{ data: appointments, error }, { data: questions }, { data: notes }] = await Promise.all([
    supabase
      .from("pregnancy_appointments")
      .select("id, appointment_date, appointment_time, provider_name, location, appointment_type, reminder_enabled")
      .eq("pregnancy_id", pregnancy.id)
      .order("appointment_date", { ascending: true }),
    supabase
      .from("pregnancy_questions")
      .select("id, appointment_id, question, answered")
      .eq("pregnancy_id", pregnancy.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("pregnancy_notes")
      .select("id, appointment_id, note, created_at")
      .eq("pregnancy_id", pregnancy.id)
      .order("created_at", { ascending: false }),
  ]);

  if (error) return { status: "error", message: "Couldn't load your appointments." };

  return {
    status: "ready",
    appointments: (appointments ?? []).map((a) => ({
      id: a.id,
      appointmentDate: a.appointment_date,
      appointmentTime: a.appointment_time,
      providerName: a.provider_name,
      location: a.location,
      appointmentType: a.appointment_type,
      reminderEnabled: a.reminder_enabled,
    })),
    questions: (questions ?? []).map((q) => ({ id: q.id, appointmentId: q.appointment_id, question: q.question, answered: q.answered })),
    notes: (notes ?? []).map((n) => ({ id: n.id, appointmentId: n.appointment_id, note: n.note, createdAt: n.created_at })),
  };
}

export interface AddAppointmentInput {
  appointmentDate: string;
  appointmentTime: string | null;
  providerName: string | null;
  location: string | null;
  appointmentType: string | null;
  reminderEnabled: boolean;
}

export async function addPregnancyAppointment(input: AddAppointmentInput): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { success: false, message: "No active pregnancy found." };

  const { error } = await supabase.from("pregnancy_appointments").insert({
    pregnancy_id: pregnancy.id,
    user_id: user.id,
    appointment_date: input.appointmentDate,
    appointment_time: input.appointmentTime,
    provider_name: input.providerName,
    location: input.location,
    appointment_type: input.appointmentType,
    reminder_enabled: input.reminderEnabled,
  });

  return error ? { success: false, message: "Couldn't add that appointment." } : { success: true };
}

export async function deletePregnancyAppointment(id: string): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const { error } = await supabase.from("pregnancy_appointments").delete().eq("id", id).eq("user_id", user.id);
  return error ? { success: false, message: "Couldn't delete that appointment." } : { success: true };
}

export async function addPregnancyQuestion(question: string, appointmentId: string | null): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { success: false, message: "No active pregnancy found." };

  const trimmed = question.trim();
  if (!trimmed) return { success: false, message: "Type a question first." };

  const { error } = await supabase.from("pregnancy_questions").insert({
    pregnancy_id: pregnancy.id,
    user_id: user.id,
    appointment_id: appointmentId,
    question: trimmed,
  });

  return error ? { success: false, message: "Couldn't add that question." } : { success: true };
}

export async function togglePregnancyQuestionAnswered(id: string, answered: boolean): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const { error } = await supabase.from("pregnancy_questions").update({ answered }).eq("id", id).eq("user_id", user.id);
  return error ? { success: false, message: "Couldn't update that question." } : { success: true };
}

export async function deletePregnancyQuestion(id: string): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const { error } = await supabase.from("pregnancy_questions").delete().eq("id", id).eq("user_id", user.id);
  return error ? { success: false, message: "Couldn't delete that question." } : { success: true };
}

export async function addPregnancyNote(note: string, appointmentId: string | null): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { success: false, message: "No active pregnancy found." };

  const trimmed = note.trim();
  if (!trimmed) return { success: false, message: "Write a note first." };

  const { error } = await supabase.from("pregnancy_notes").insert({
    pregnancy_id: pregnancy.id,
    user_id: user.id,
    appointment_id: appointmentId,
    note: trimmed,
  });

  return error ? { success: false, message: "Couldn't add that note." } : { success: true };
}

export async function deletePregnancyNote(id: string): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const { error } = await supabase.from("pregnancy_notes").delete().eq("id", id).eq("user_id", user.id);
  return error ? { success: false, message: "Couldn't delete that note." } : { success: true };
}
