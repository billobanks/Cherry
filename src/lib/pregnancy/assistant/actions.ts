"use server";

import { z } from "zod";
import { formatISODate, addDays, parseISODate, todayEpochDays } from "@/lib/cycle-engine";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { hasPremiumAccessForUser } from "@/lib/subscription";
import { getAssistantProvider } from "@/lib/assistant/providers";
import { PREGNANCY_SYMPTOM_OPTIONS } from "../constants";
import { calculatePregnancyDating } from "../dating-engine";
import { getActivePregnancy } from "../pregnancy-lookup";
import { getActivePregnancySafetyRules } from "../safety-actions";
import type { PregnancySafetyAlert } from "../safety-types";
import { buildPregnancyAssistantContext } from "./context";
import { buildPregnancyAssistantSystemPrompt } from "./prompt";
import { evaluatePregnancyAssistantSafety } from "./safety-integration";
import type { PregnancyAssistantMessage, PregnancyAssistantTodaySignals } from "./types";

const RECENT_SYMPTOM_WINDOW_DAYS = 14;
const RECENT_MESSAGE_HISTORY_LIMIT = 20;

const SYMPTOM_LABELS: Record<string, string> = Object.fromEntries(
  PREGNANCY_SYMPTOM_OPTIONS.map((option) => [option.key, option.label]),
);

const messageSchema = z.string().trim().min(1, "Type a question first.").max(2000, "Keep it under 2000 characters.");

export type GetPregnancyAssistantConversationResult =
  | { status: "ready"; messages: PregnancyAssistantMessage[] }
  | { status: "signed_out" }
  | { status: "no_active_pregnancy" }
  | { status: "premium_required" }
  | { status: "error"; message: string };

export async function getPregnancyAssistantConversation(): Promise<GetPregnancyAssistantConversationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { status: "no_active_pregnancy" };

  // Same Premium feature as the general assistant — checked here, not just
  // at the page level, so calling this action directly can't bypass
  // entitlement.
  if (!(await hasPremiumAccessForUser(supabase, user.id))) {
    return { status: "premium_required" };
  }

  const { data, error } = await supabase
    .from("pregnancy_assistant_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return { status: "error", message: "Couldn't load your conversation." };
  }

  return { status: "ready", messages: data ?? [] };
}

export type SendPregnancyAssistantMessageResult =
  | { status: "ready"; reply: PregnancyAssistantMessage; safetyAlerts: PregnancySafetyAlert[] }
  | { status: "not_configured" }
  | { status: "signed_out" }
  | { status: "no_active_pregnancy" }
  | { status: "premium_required" }
  | { status: "error"; message: string };

export async function sendPregnancyAssistantMessage(rawMessage: string): Promise<SendPregnancyAssistantMessageResult> {
  const parsed = messageSchema.safeParse(rawMessage);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "That doesn't look right." };
  }
  const userMessage = parsed.data;

  const provider = getAssistantProvider();
  if (!provider) {
    return { status: "not_configured" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const rateLimit = await checkRateLimit("pregnancyAssistantMessage", user.id);
  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: "You've sent a lot of messages in a short time — try again in a few minutes.",
    };
  }

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { status: "no_active_pregnancy" };

  // Checked again here (not just in getPregnancyAssistantConversation)
  // since this is its own callable action.
  if (!(await hasPremiumAccessForUser(supabase, user.id))) {
    return { status: "premium_required" };
  }

  let dating;
  try {
    dating = calculatePregnancyDating({
      lastMenstrualPeriodDate: pregnancy.lastMenstrualPeriod,
      clinicianEstimatedDueDate: pregnancy.clinicianDueDate,
      ultrasoundEstimatedDueDate: pregnancy.ultrasoundDueDate,
      userEnteredDueDate: pregnancy.estimatedDueDate,
    });
  } catch {
    return { status: "error", message: "We couldn't calculate your pregnancy timeline." };
  }

  const todayISO = formatISODate(todayEpochDays());

  const { data: todayLog } = await supabase
    .from("pregnancy_daily_logs")
    .select("id, energy_level, sleep_quality")
    .eq("pregnancy_id", pregnancy.id)
    .eq("log_date", todayISO)
    .maybeSingle();

  let today: PregnancyAssistantTodaySignals | null = null;
  if (todayLog) {
    const [{ data: moodRows }, { data: symptomRows }] = await Promise.all([
      supabase.from("pregnancy_moods").select("mood_key").eq("daily_log_id", todayLog.id),
      supabase.from("pregnancy_symptoms").select("symptom_key, severity").eq("daily_log_id", todayLog.id),
    ]);
    const symptomSeverities: PregnancyAssistantTodaySignals["symptomSeverities"] = {};
    for (const row of symptomRows ?? []) {
      if (row.severity) symptomSeverities[row.symptom_key] = row.severity;
    }
    today = {
      mood: (moodRows ?? []).map((m) => m.mood_key),
      energyLevel: todayLog.energy_level,
      sleepQuality: todayLog.sleep_quality,
      symptomSeverities,
    };
  }

  const windowStart = formatISODate(addDays(parseISODate(todayISO), -RECENT_SYMPTOM_WINDOW_DAYS));
  const { data: recentLogs } = await supabase
    .from("pregnancy_daily_logs")
    .select("id")
    .eq("pregnancy_id", pregnancy.id)
    .gte("log_date", windowStart)
    .lte("log_date", todayISO);

  const recentLogIds = (recentLogs ?? []).map((l) => l.id);
  let recentSymptomCounts: { symptomKey: string; count: number }[] = [];
  if (recentLogIds.length > 0) {
    const { data: recentSymptomRows } = await supabase
      .from("pregnancy_symptoms")
      .select("symptom_key")
      .in("daily_log_id", recentLogIds);
    const counts = new Map<string, number>();
    for (const row of recentSymptomRows ?? []) {
      counts.set(row.symptom_key, (counts.get(row.symptom_key) ?? 0) + 1);
    }
    recentSymptomCounts = Array.from(counts.entries()).map(([symptomKey, count]) => ({ symptomKey, count }));
  }

  const context = buildPregnancyAssistantContext({
    dating,
    today,
    recentSymptomCounts,
    recentWindowDays: RECENT_SYMPTOM_WINDOW_DAYS,
    symptomLabels: SYMPTOM_LABELS,
  });

  // Runs BEFORE the AI call, on the same real signals the prompt is built
  // from — the safety alert is never something the model has to remember
  // or infer on its own, and it's returned to the UI regardless of what
  // the model says.
  const rules = await getActivePregnancySafetyRules();
  const safetyAlerts = evaluatePregnancyAssistantSafety(dating.gestationalAgeWeeks, today, rules);

  const systemPrompt = buildPregnancyAssistantSystemPrompt(context);

  const { data: historyRows } = await supabase
    .from("pregnancy_assistant_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(RECENT_MESSAGE_HISTORY_LIMIT);

  const conversationHistory: PregnancyAssistantMessage[] = (historyRows ?? []).reverse();
  const messages: PregnancyAssistantMessage[] = [...conversationHistory, { role: "user", content: userMessage }];

  const { error: insertUserError } = await supabase
    .from("pregnancy_assistant_messages")
    .insert({ user_id: user.id, role: "user", content: userMessage });
  if (insertUserError) {
    return { status: "error", message: "Couldn't send your message — please try again." };
  }

  let replyContent: string;
  try {
    const result = await provider.generateReply({ systemPrompt, messages });
    replyContent = result.content;
  } catch {
    return {
      status: "error",
      message: "Couldn't reach the assistant right now — your message was saved, try again in a moment.",
    };
  }

  await supabase.from("pregnancy_assistant_messages").insert({ user_id: user.id, role: "assistant", content: replyContent });

  return {
    status: "ready",
    reply: { role: "assistant", content: replyContent },
    safetyAlerts,
  };
}
