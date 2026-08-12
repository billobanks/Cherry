"use server";

import { z } from "zod";
import { CHECKIN_SYMPTOM_OPTIONS } from "@/lib/checkin";
import { addDays, calculateCycleInsights, formatISODate, parseISODate, todayEpochDays } from "@/lib/cycle-engine";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSafetyContextForCheckin, type SafetyAlert } from "@/lib/safety";
import { createClient } from "@/lib/supabase/server";
import { hasPremiumAccessForUser } from "@/lib/subscription";
import { buildAssistantContext } from "./context";
import { getAssistantProvider } from "./providers";
import { buildAssistantSystemPrompt } from "./prompt";
import { evaluateAssistantSafety } from "./safety-integration";
import type { AssistantMessage, AssistantTodaySignals } from "./types";

const RECENT_SYMPTOM_WINDOW_DAYS = 14;
const RECENT_MESSAGE_HISTORY_LIMIT = 20;

const SYMPTOM_LABELS: Record<string, string> = Object.fromEntries(
  CHECKIN_SYMPTOM_OPTIONS.map((option) => [option.key, option.label]),
);

const messageSchema = z.string().trim().min(1, "Type a question first.").max(2000, "Keep it under 2000 characters.");

export type GetAssistantConversationResult =
  | { status: "ready"; messages: AssistantMessage[] }
  | { status: "signed_out" }
  | { status: "premium_required" }
  | { status: "error"; message: string };

export async function getAssistantConversation(): Promise<GetAssistantConversationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  // The AI wellness assistant is a Premium feature — checked here, not just
  // at the page level, so calling this action directly can't bypass
  // entitlement.
  if (!(await hasPremiumAccessForUser(supabase, user.id))) {
    return { status: "premium_required" };
  }

  const { data, error } = await supabase
    .from("assistant_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return { status: "error", message: "Couldn't load your conversation." };
  }

  return { status: "ready", messages: data ?? [] };
}

export type SendAssistantMessageResult =
  | { status: "ready"; reply: AssistantMessage; safetyAlerts: SafetyAlert[] }
  | { status: "not_configured" }
  | { status: "signed_out" }
  | { status: "premium_required" }
  | { status: "error"; message: string };

export async function sendAssistantMessage(rawMessage: string): Promise<SendAssistantMessageResult> {
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

  const rateLimit = await checkRateLimit("assistantMessage", user.id);
  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: "You've sent a lot of messages in a short time — try again in a few minutes.",
    };
  }

  // The AI wellness assistant is a Premium feature — checked again here
  // (not just in getAssistantConversation) since this is its own callable
  // action and could otherwise be invoked directly to bypass the page gate.
  if (!(await hasPremiumAccessForUser(supabase, user.id))) {
    return { status: "premium_required" };
  }

  const todayISO = formatISODate(todayEpochDays());

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "last_period_start_date, avg_cycle_length_days, avg_period_length_days, cycle_regularity, personalization_enabled",
    )
    .eq("id", user.id)
    .single();

  const personalizationEnabled = profile?.personalization_enabled ?? true;

  let cycleInsights = null;
  if (personalizationEnabled && profile?.last_period_start_date) {
    const { data: cycles } = await supabase
      .from("cycles")
      .select("start_date")
      .eq("user_id", user.id)
      .order("start_date", { ascending: true });
    try {
      cycleInsights = calculateCycleInsights({
        mostRecentPeriodStartDate: profile.last_period_start_date,
        historicalPeriodStartDates: (cycles ?? []).map((c) => c.start_date),
        averageCycleLengthDays: profile.avg_cycle_length_days,
        averagePeriodDurationDays: profile.avg_period_length_days,
        cycleVariability: profile.cycle_regularity,
        today: todayISO,
      });
    } catch {
      cycleInsights = null;
    }
  }

  const { data: todayCheckin } = await supabase
    .from("daily_checkins")
    .select("id, flow, energy_level, sleep_quality, pain_severity, mood")
    .eq("user_id", user.id)
    .eq("checkin_date", todayISO)
    .maybeSingle();

  let today: AssistantTodaySignals | null = null;
  if (todayCheckin) {
    const { data: symptomRows } = await supabase
      .from("checkin_symptoms")
      .select("symptom_key")
      .eq("checkin_id", todayCheckin.id);
    today = {
      flow: todayCheckin.flow,
      energyLevel: todayCheckin.energy_level,
      sleepQuality: todayCheckin.sleep_quality,
      painSeverity: todayCheckin.pain_severity,
      mood: todayCheckin.mood,
      symptomKeys: (symptomRows ?? []).map((s) => s.symptom_key),
    };
  }

  const windowStart = formatISODate(addDays(parseISODate(todayISO), -RECENT_SYMPTOM_WINDOW_DAYS));
  const { data: recentCheckins } = await supabase
    .from("daily_checkins")
    .select("id")
    .eq("user_id", user.id)
    .gte("checkin_date", windowStart)
    .lte("checkin_date", todayISO);

  const recentCheckinIds = (recentCheckins ?? []).map((c) => c.id);
  let recentSymptomCounts: { symptomKey: string; count: number }[] = [];
  if (recentCheckinIds.length > 0) {
    const { data: recentSymptomRows } = await supabase
      .from("checkin_symptoms")
      .select("symptom_key")
      .in("checkin_id", recentCheckinIds);
    const counts = new Map<string, number>();
    for (const row of recentSymptomRows ?? []) {
      counts.set(row.symptom_key, (counts.get(row.symptom_key) ?? 0) + 1);
    }
    recentSymptomCounts = Array.from(counts.entries()).map(([symptomKey, count]) => ({ symptomKey, count }));
  }

  // Personalization off means the prompt gets none of today's/recent
  // history — but safety evaluation below still runs on the real `today`
  // signals regardless. Never let a privacy preference weaken the safety
  // check; it only controls what the AI gets told for personalization.
  const context = buildAssistantContext({
    cycleInsights,
    today: personalizationEnabled ? today : null,
    recentSymptomCounts: personalizationEnabled ? recentSymptomCounts : [],
    recentWindowDays: RECENT_SYMPTOM_WINDOW_DAYS,
    symptomLabels: SYMPTOM_LABELS,
  });

  const safetyContext = await getSafetyContextForCheckin(todayISO);
  const safetyAlerts =
    safetyContext.status === "ready"
      ? evaluateAssistantSafety(today, safetyContext.history, safetyContext.rules)
      : [];

  const systemPrompt = buildAssistantSystemPrompt(context);

  const { data: historyRows } = await supabase
    .from("assistant_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(RECENT_MESSAGE_HISTORY_LIMIT);

  const conversationHistory: AssistantMessage[] = (historyRows ?? []).reverse();
  const messages: AssistantMessage[] = [...conversationHistory, { role: "user", content: userMessage }];

  const { error: insertUserError } = await supabase
    .from("assistant_messages")
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

  await supabase.from("assistant_messages").insert({ user_id: user.id, role: "assistant", content: replyContent });

  return {
    status: "ready",
    reply: { role: "assistant", content: replyContent },
    safetyAlerts,
  };
}
