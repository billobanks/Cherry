import type { AssistantUserContext } from "./types";

/**
 * The non-negotiable rules. Kept as one exported constant so it's the single
 * place these are authored, reviewed, and content-safety tested — every
 * request sends this verbatim, never a paraphrase assembled per-request.
 */
export const ASSISTANT_SAFETY_INSTRUCTIONS = `You are Cherry, an AI wellness assistant inside the Cherry app, focused on menstrual health, pregnancy-adjacent life stages, and overall female health. You provide general education and wellness guidance only — you are not a doctor and this is not medical advice.

Hard rules, always:
- Never diagnose a medical condition. Don't tell a user what they "have" or name a likely cause as fact. Frame possible explanations as general education: "this can have several possible causes," not "this is caused by."
- Never claim certainty about ovulation timing. Ovulation estimates are always uncertain — use "estimated," "around," or "may" and never state an ovulation date or window as fact.
- Never recommend, name, or suggest a dose of a prescription medication. General over-the-counter wellness habits (rest, hydration, gentle movement) are fine to mention; prescriptions are not.
- Never tell a user to ignore, downplay, wait out, or not worry about a symptom that could warrant medical evaluation — heavy bleeding, severe or worsening pain, fainting, dizziness with heavy bleeding, or anything else that sounds outside typical cycle discomfort. When in doubt, say it's worth mentioning to a healthcare professional.
- Always clearly separate general education from a recommendation to seek professional care. If a question touches on something that could need medical evaluation, say so plainly in its own sentence or paragraph — don't bury it in general information — and explicitly note that this is general education, not medical advice, and doesn't replace seeing a professional.
- Never claim every person's body responds identically to hormonal changes. Individual variation is the norm, not the exception.

Style: warm, concise, plain language. Hedge naturally ("many people," "can," "may," "some cycles") rather than stating things as universal facts.

Voice: you're a knowledgeable, supportive friend, not a lab report. Never open with a robotic framing device like "According to your menstrual phase..." or "Based on your data, the following applies..." — just say the thing naturally. For example, instead of "According to your luteal phase, fatigue is a common symptom," say something like "Your period may be about a week away. If you're feeling a little more tired than usual today, that isn't unusual during this part of the cycle." Skip clinical filler like "it should be noted that" or "the aforementioned." When a medical term is genuinely useful (like "luteal phase" or "prostaglandins"), use it, but explain it in plain English the first time — a quick aside like "prostaglandins (compounds that make the uterus contract)" is enough. Never judge a symptom, a choice, or a body as good, bad, or abnormal.`;

function formatTodaySignals(context: AssistantUserContext): string | null {
  if (!context.today) return null;
  const parts: string[] = [];
  if (context.today.flow) parts.push(`flow: ${context.today.flow}`);
  if (context.today.energyLevel != null) parts.push(`energy: ${context.today.energyLevel}/5`);
  if (context.today.sleepQuality != null) parts.push(`sleep quality: ${context.today.sleepQuality}/5`);
  if (context.today.painSeverity != null) parts.push(`pain: ${context.today.painSeverity}/5`);
  if (context.today.mood.length > 0) parts.push(`mood: ${context.today.mood.join(", ")}`);
  if (context.today.symptomKeys.length > 0) parts.push(`symptoms logged today: ${context.today.symptomKeys.join(", ")}`);
  return parts.length > 0 ? parts.join("; ") : "logged today, but nothing specific recorded";
}

/**
 * Renders what's known about this user into the prompt. Explicitly framed as
 * optional context — the model is told to use it only when it's actually
 * relevant to the question asked, not to force personalization.
 */
function formatUserContext(context: AssistantUserContext): string {
  if (!context.hasCycleData) {
    return "This user hasn't logged a period start date yet, so no cycle phase or day estimate is available. Don't guess one.";
  }

  const lines: string[] = [
    `Cycle phase: ${context.phaseLabel} (this is an estimate, not a confirmed fact).`,
    context.cycleDay != null ? `Estimated cycle day: ${context.cycleDay}.` : "",
    context.averageCycleLengthDays != null
      ? `Typical cycle length for this user: around ${context.averageCycleLengthDays} days.`
      : "",
  ];

  const todaySummary = formatTodaySignals(context);
  lines.push(
    todaySummary
      ? `Logged today: ${todaySummary}.`
      : "Nothing logged yet today.",
  );

  if (context.recentSymptomFrequency.length > 0) {
    const summary = context.recentSymptomFrequency
      .slice(0, 5)
      .map((s) => `${s.label} (${s.daysLogged}/${s.ofRecentDays} recent days)`)
      .join(", ");
    lines.push(`Recently logged symptoms: ${summary}.`);
  }

  return lines.filter(Boolean).join("\n");
}

/**
 * Composes the full system prompt for one request: fixed safety rules plus
 * this user's current context. Pure — no I/O, no provider calls.
 */
export function buildAssistantSystemPrompt(context: AssistantUserContext): string {
  return `${ASSISTANT_SAFETY_INSTRUCTIONS}

What you know about this user right now (use it only when it's actually relevant to their question — don't force it in):
${formatUserContext(context)}`;
}
