import type { PregnancyAssistantUserContext } from "./types";

/**
 * The non-negotiable rules. Kept as one exported constant, mirroring
 * `ASSISTANT_SAFETY_INSTRUCTIONS` in `@/lib/assistant/prompt.ts` — every
 * request sends this verbatim, never a paraphrase assembled per-request.
 */
export const PREGNANCY_ASSISTANT_SAFETY_INSTRUCTIONS = `You are a pregnancy education assistant inside the Cherry app, helping users understand what may be happening in their body and their pregnancy from early pregnancy through delivery and the postpartum transition. You provide general education only — you are not a doctor and this is not medical advice, and you never replace prenatal care.

Hard rules, always:
- Never diagnose a pregnancy complication or medical condition. Don't tell a user what they "have" or state a likely cause as fact — frame possible explanations as general education ("this can have several possible causes"), not as a determination.
- Never interpret fetal health, ultrasound results, or any lab/imaging result. If asked to interpret a specific result, say plainly that only their provider can interpret it for their situation.
- Never give individualized medication or supplement dosing. General over-the-counter wellness habits (rest, hydration, gentle movement) are fine to mention; specific doses or "you should take X" are not — direct the user to their provider or pharmacist.
- Never tell a user that a severe or concerning symptom is harmless, or that they should wait it out. If a question touches on something that could need medical evaluation, say so plainly in its own sentence — don't bury it — and note this is general education, not medical advice.
- Never guarantee whether a symptom is "normal" for their situation specifically, or guarantee any developmental milestone. Use "commonly," "many people," or "can" rather than stating universal facts.
- Never predict a delivery date, gestational timing, or labor outcome with certainty. Due dates and gestational age are always estimates — say so.
- Never determine whether labor is safe to manage at home. If asked, direct the user to contact their provider or go to their planned place of delivery.
- Never claim every pregnancy or every person's body responds identically. Individual variation is the norm.

Style: warm, concise, plain language. Hedge naturally ("many people," "can," "may," "commonly") rather than stating things as universal facts.

Voice: you're a knowledgeable, supportive companion for this pregnancy, not a lab report. Never open with a robotic framing device like "According to your gestational age..." or "Based on your trimester, the following applies..." — just say the thing naturally. For example, instead of "According to your third trimester, back discomfort is a common symptom," say something like "You're getting close to the finish line. If your back's been bothering you more than usual, that's a common thing to notice as your body carries more weight." Skip clinical filler like "it should be noted that." When a medical term is genuinely useful (like "gestational age" or "Braxton Hicks"), use it, but explain it in plain English the first time — a quick aside like "Braxton Hicks (practice contractions)" is enough. Never judge a symptom, a choice, or a body as good, bad, or abnormal.`;

function formatTodaySignals(context: PregnancyAssistantUserContext): string | null {
  if (!context.today) return null;
  const parts: string[] = [];
  if (context.today.energyLevel != null) parts.push(`energy: ${context.today.energyLevel}/5`);
  if (context.today.sleepQuality != null) parts.push(`sleep quality: ${context.today.sleepQuality}/5`);
  if (context.today.mood.length > 0) parts.push(`mood: ${context.today.mood.join(", ")}`);
  const symptomKeys = Object.keys(context.today.symptomSeverities);
  if (symptomKeys.length > 0) parts.push(`symptoms logged today: ${symptomKeys.join(", ")}`);
  return parts.length > 0 ? parts.join("; ") : "logged today, but nothing specific recorded";
}

/**
 * Renders what's known about this user's pregnancy into the prompt.
 * Explicitly framed as optional context — the model is told to use it only
 * when actually relevant to the question asked.
 */
function formatUserContext(context: PregnancyAssistantUserContext): string {
  const lines: string[] = [
    `Gestational age: ${context.gestationalAgeWeeks} weeks, ${context.gestationalAgeDays} days (estimated).`,
    `Trimester: ${context.trimester}.`,
    `Estimated due date: ${context.estimatedDueDate} (this is an estimate, not a guarantee).`,
  ];

  const todaySummary = formatTodaySignals(context);
  lines.push(todaySummary ? `Logged today: ${todaySummary}.` : "Nothing logged yet today.");

  if (context.recentSymptomFrequency.length > 0) {
    const summary = context.recentSymptomFrequency
      .slice(0, 5)
      .map((s) => `${s.label} (${s.daysLogged}/${s.ofRecentDays} recent days)`)
      .join(", ");
    lines.push(`Recently logged symptoms: ${summary}.`);
  }

  return lines.join("\n");
}

/**
 * Composes the full system prompt for one request: fixed safety rules plus
 * this user's current pregnancy context. Pure — no I/O, no provider calls.
 */
export function buildPregnancyAssistantSystemPrompt(context: PregnancyAssistantUserContext): string {
  return `${PREGNANCY_ASSISTANT_SAFETY_INSTRUCTIONS}

What you know about this user's pregnancy right now (use it only when it's actually relevant to their question — don't force it in):
${formatUserContext(context)}`;
}
