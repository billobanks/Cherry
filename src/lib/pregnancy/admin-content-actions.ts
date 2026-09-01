"use server";

import { createClient } from "@/lib/supabase/server";
import type { ContentGovernanceStatus, PregnancyWeekSection } from "@/types/database";

export interface AdminWeekContentRow {
  id: string;
  weekNumber: number;
  section: PregnancyWeekSection;
  content: string;
  status: ContentGovernanceStatus;
  source: string | null;
  sourceUrl: string | null;
  medicalReviewer: string | null;
  dateReviewed: string | null;
  contentVersion: number;
  updatedAt: string;
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function requireAdmin(): Promise<{ ok: true; supabase: Supabase } | { ok: false; reason: "signed_out" | "forbidden" }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "signed_out" };

  const { data: adminRow } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return { ok: false, reason: "forbidden" };

  return { ok: true, supabase };
}

export type ListWeekContentResult =
  | { status: "ready"; rows: AdminWeekContentRow[] }
  | { status: "signed_out" }
  | { status: "forbidden" }
  | { status: "error"; message: string };

export async function listWeekContentForAdmin(): Promise<ListWeekContentResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { status: guard.reason };

  const { data, error } = await guard.supabase
    .from("pregnancy_week_content")
    .select("id, week_number, section, content, status, source, source_url, medical_reviewer, date_reviewed, content_version, updated_at")
    .order("week_number", { ascending: true });

  if (error || !data) return { status: "error", message: "Couldn't load week content." };

  return {
    status: "ready",
    rows: data.map((row) => ({
      id: row.id,
      weekNumber: row.week_number,
      section: row.section,
      content: row.content,
      status: row.status,
      source: row.source,
      sourceUrl: row.source_url,
      medicalReviewer: row.medical_reviewer,
      dateReviewed: row.date_reviewed,
      contentVersion: row.content_version,
      updatedAt: row.updated_at,
    })),
  };
}

export interface WeekContentUpdate {
  content: string;
  status: ContentGovernanceStatus;
  source: string | null;
  sourceUrl: string | null;
  medicalReviewer: string | null;
  dateReviewed: string | null;
}

/**
 * A blunt but effective guard against skipping review: PUBLISHED can only
 * be set from APPROVED, and APPROVED requires a medical reviewer to be on
 * record. This can't fully substitute for an actual editorial process, but
 * it stops the one-click "just publish it" path.
 */
export async function updateWeekContent(id: string, update: WeekContentUpdate): Promise<{ success: boolean; message?: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, message: guard.reason === "signed_out" ? "Please sign in." : "You don't have access to manage pregnancy content." };
  }

  const content = update.content.trim();
  if (!content) return { success: false, message: "Content can't be empty." };

  if ((update.status === "APPROVED" || update.status === "PUBLISHED") && !update.medicalReviewer?.trim()) {
    return { success: false, message: "A medical reviewer must be on record before content can be approved or published." };
  }

  const { data: current } = await guard.supabase.from("pregnancy_week_content").select("content_version").eq("id", id).single();

  const { error } = await guard.supabase
    .from("pregnancy_week_content")
    .update({
      content,
      status: update.status,
      source: update.source?.trim() || null,
      source_url: update.sourceUrl?.trim() || null,
      medical_reviewer: update.medicalReviewer?.trim() || null,
      date_reviewed: update.dateReviewed || null,
      content_version: (current?.content_version ?? 1) + 1,
    })
    .eq("id", id);

  return error ? { success: false, message: "Couldn't save changes — please try again." } : { success: true };
}
