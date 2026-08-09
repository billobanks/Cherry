import type { CyclePhase } from "@/lib/cycle-engine";
import type { InsightSectionKey } from "@/types/database";

export interface SectionCopy {
  summary: string;
  points: string[];
  /** symptom_catalog keys this section commonly relates to — only set on symptoms_to_monitor. */
  relatedSymptomKeys?: string[];
}

type PhaseContent = Record<InsightSectionKey, SectionCopy>;

/**
 * All copy here is deliberately hedged: general tendencies and "some people /
 * you may" framing, never "you have" or "this means." hormonal_changes is the
 * one exception that states physiology plainly — hormone-level trends across
 * a cycle are well-established biology, not a claim about any individual's
 * experience, which is what the hedging elsewhere is protecting against.
 */
export const PHASE_SECTION_CONTENT: Record<CyclePhase, PhaseContent> = {
  menstrual: {
    body_overview: {
      summary:
        "Your period marks the start of a new cycle. The uterine lining is shedding, and estrogen and progesterone are both at their lowest point.",
      points: [
        "It's common to feel more inward-focused or ready to slow down during the first day or two.",
        "Cramping, if it happens, tends to be most noticeable on day 1 or 2 and often eases as the days go on.",
        "Some people barely notice this phase beyond bleeding; others feel it more in the body as a whole.",
      ],
    },
    hormonal_changes: {
      summary:
        "Estrogen and progesterone are both low as this phase begins, which is part of what triggers the uterine lining to shed.",
      points: [
        "Hormone levels stay low for the first few days before estrogen slowly starts to rise again.",
        "Prostaglandins — compounds involved in the uterus contracting — are typically highest right now, which is part of what drives cramping.",
        "This hormonal low point is also thought to play a role in lower energy for some people during this phase.",
      ],
    },
    energy: {
      summary: "You may notice energy is lower than usual, especially in the first couple of days.",
      points: [
        "Some people feel like they need more rest or a slower pace right now.",
        "Afternoon dips can feel more noticeable during this phase for some.",
        "Energy often starts to lift again as the period tapers off.",
      ],
    },
    mood: {
      summary: "It can be common to feel more introspective or emotionally quieter during your period.",
      points: [
        "Some people feel a sense of relief if PMS symptoms were present beforehand.",
        "Low mood or tearfulness can show up for some, often easing after the first day or two.",
        "Others notice very little mood shift at all — the range here is wide and normal.",
      ],
    },
    skin: {
      summary: "Skin can go either way during your period — some people notice it calming down, others still see breakouts.",
      points: [
        "Any premenstrual breakouts may start to settle as the period continues.",
        "Skin can feel a little more sensitive or dry for some during this phase.",
        "Any changes tend to be temporary and often shift again by the next phase.",
      ],
    },
    digestion: {
      summary: "Digestion may feel a bit off in the first day or two, often easing as the period continues.",
      points: [
        "Bloating is common right around the start of a period for many people.",
        "Some notice looser stools at the very start, related to prostaglandins.",
        "Others don't notice any digestive changes at all during this phase.",
      ],
    },
    appetite_and_cravings: {
      summary: "Appetite can shift during your period — some people want more comfort food, others eat less than usual.",
      points: [
        "Cravings for warm or iron-rich foods are common for some right now.",
        "Lower appetite in the first day or two is also common.",
        "There's no ‘right’ way to eat during this phase — following your hunger cues is generally a reasonable approach.",
      ],
    },
    sleep: {
      summary: "Sleep quality can dip slightly during your period, particularly if cramping is present.",
      points: [
        "Some people find it harder to get comfortable in the first night or two.",
        "A lower core body temperature during this phase can, for some, make sleep feel a little different.",
        "Gentle routines — a heating pad, earlier wind-down — can help some people settle in.",
      ],
    },
    exercise: {
      summary: "Many people find gentler movement feels better during the first days of their period, though this varies a lot.",
      points: [
        "Walking, stretching, or light yoga are often mentioned as feeling good right now.",
        "Some people feel completely fine doing their usual routine — there's no need to hold back if that's you.",
        "If cramping is significant, scaling back intensity for a day or two is a reasonable choice.",
      ],
    },
    nutrition: {
      summary: "Since you're losing blood, some people find it helpful to lean on iron-rich foods during this phase.",
      points: [
        "Leafy greens, beans, and lean proteins are commonly suggested sources of iron.",
        "Staying hydrated can help with both bloating and energy for some people.",
        "Warm, easy-to-digest meals are often mentioned as comforting during this phase.",
      ],
    },
    self_care: {
      summary: "This phase can be a good time to build in a little extra rest, if your schedule allows for it.",
      points: [
        "Heat — a warm bath or heating pad — is a common comfort measure for cramping.",
        "Giving yourself permission to slow down for a day, without guilt, can be part of the reset.",
        "Some people use this time to reflect on the cycle just finished.",
      ],
    },
    symptoms_to_monitor: {
      summary: "A few things are commonly reported during the menstrual phase and are generally considered part of the normal range.",
      points: [
        "Cramping that's noticeable but manageable with rest or over-the-counter options.",
        "Bloating, fatigue, or mild headaches in the first day or two.",
        "Mood dips that ease as the period continues.",
      ],
      relatedSymptomKeys: ["cramps", "bloating", "fatigue", "headache", "backache"],
    },
    professional_guidance: {
      summary:
        "Most menstrual symptoms fall within a wide, normal range — but a few patterns are worth a conversation with a licensed healthcare professional.",
      points: [
        "Pain that isn't manageable with rest or over-the-counter pain relief, or that stops you from going about your day.",
        "Bleeding heavy enough to soak through a pad or tampon every hour or two for several hours in a row.",
        "A period lasting longer than about 7 days, or a sudden, significant change from what's typical for you.",
      ],
    },
  },

  follicular: {
    body_overview: {
      summary:
        "With your period ending, estrogen begins a steady climb as the body prepares to release an egg later in the cycle.",
      points: [
        "This is often described as a phase where things start to feel like they're picking back up.",
        "The uterine lining begins rebuilding during this window.",
        "How this phase feels can vary a lot from person to person and cycle to cycle.",
      ],
    },
    hormonal_changes: {
      summary:
        "Estrogen rises steadily through this phase as follicles in the ovaries develop, preparing one to release an egg.",
      points: [
        "Progesterone stays low throughout the follicular phase.",
        "Rising estrogen is part of what's thought to support mood and energy for many people during this window.",
        "Near the end of this phase, a luteinizing hormone (LH) surge triggers ovulation.",
      ],
    },
    energy: {
      summary: "You may notice energy building as this phase goes on, for some people quite noticeably.",
      points: [
        "Many people describe feeling more motivated or capable of tackling bigger tasks right now.",
        "This can be a phase where higher-effort projects feel more approachable.",
        "Not everyone notices a strong shift — energy patterns are individual.",
      ],
    },
    mood: {
      summary: "It's common to feel a lift in mood as estrogen rises through this phase.",
      points: [
        "Some people notice more optimism, sociability, or motivation.",
        "This can be a good stretch for starting new projects or making plans, if that resonates with you.",
        "As always, mood is shaped by a lot more than hormones — sleep, stress, and life circumstances matter too.",
      ],
    },
    skin: {
      summary: "Skin often looks and feels more balanced during the follicular phase for many people.",
      points: [
        "Some notice fewer breakouts and a more even tone right now.",
        "Skin may also feel more hydrated as estrogen rises.",
        "As with everything here, this varies — some people notice little change at all.",
      ],
    },
    digestion: {
      summary: "Digestion tends to feel more settled for many people during this phase.",
      points: [
        "Bloating, if it was present during the period, often eases.",
        "Appetite is often more predictable right now.",
        "This can be a comfortable stretch for trying new foods or routines, if that interests you.",
      ],
    },
    appetite_and_cravings: {
      summary: "Appetite is often steadier during the follicular phase, with fewer strong cravings for many people.",
      points: [
        "Some notice less interest in sweet or salty foods compared to the days before their period.",
        "Hunger cues can feel easier to read for some during this window.",
        "This isn't universal — appetite patterns are still individual.",
      ],
    },
    sleep: {
      summary: "Sleep is often a little easier during the follicular phase for many people.",
      points: [
        "Some notice falling asleep more easily and waking feeling more rested.",
        "This can be a good time to reset a sleep routine, if that's something you're working on.",
        "Life factors — stress, screens, caffeine — still matter more than cycle phase for most people's sleep.",
      ],
    },
    exercise: {
      summary: "Many people feel ready for more intensity during the follicular phase, though preferences vary widely.",
      points: [
        "Strength training or higher-intensity workouts are often mentioned as feeling good right now.",
        "Energy for trying something new — a class, a longer run — can feel more available.",
        "Listening to your body still matters more than any general pattern.",
      ],
    },
    nutrition: {
      summary: "This can be a good window for balanced, energy-supporting meals as activity levels may rise.",
      points: [
        "Protein and complex carbohydrates are commonly mentioned as helpful for sustained energy.",
        "Some people find this a natural time to plan meals or try new recipes.",
        "There's no special ‘follicular phase diet’ required — general balanced eating applies here as always.",
      ],
    },
    self_care: {
      summary: "With energy often higher, this can be a good stretch for the things that take more effort or planning.",
      points: [
        "Social plans, creative projects, or tackling a to-do list can feel more doable right now for some.",
        "It's still worth checking in with yourself rather than assuming you ‘should’ feel energized.",
        "Rest is just as valid a form of self-care here as at any other point in the cycle.",
      ],
    },
    symptoms_to_monitor: {
      summary: "The follicular phase is often the most symptom-light part of the cycle for many people, though everyone's pattern differs.",
      points: [
        "Mild changes in skin or appetite as hormone levels shift.",
        "Occasional lighter mood dips unrelated to the cycle are still worth noticing on their own terms.",
        "Anything that feels new or unusual for you is worth keeping an eye on, regardless of phase.",
      ],
      relatedSymptomKeys: ["acne", "food_cravings"],
    },
    professional_guidance: {
      summary:
        "This is usually a lower-symptom phase, which can make new or persistent symptoms stand out more clearly.",
      points: [
        "Pain, bleeding, or spotting that's unrelated to your period and doesn't have an obvious explanation.",
        "Persistent fatigue or low mood that doesn't track with your usual cycle pattern.",
        "Any symptom that feels significantly different from what's typical for you, especially if it continues for more than a cycle or two.",
      ],
    },
  },

  ovulation_window: {
    body_overview: {
      summary:
        "This is your estimated ovulation window — the days around when an egg is most likely released. Estrogen is at or near its peak.",
      points: [
        "A luteinizing hormone (LH) surge is what triggers ovulation itself.",
        "Some people notice a distinct shift in how they feel right around this window; many notice very little.",
        "This is an estimate, not a confirmed ovulation date — timing can shift cycle to cycle.",
      ],
    },
    hormonal_changes: {
      summary:
        "Estrogen typically peaks just before ovulation, triggering the LH surge that causes the egg to be released.",
      points: [
        "Testosterone also rises slightly around this window for many people.",
        "After ovulation, progesterone begins rising as the body prepares for a possible pregnancy.",
        "Estrogen drops sharply right after ovulation, which is part of why mood or energy can shift quickly for some people at this point.",
      ],
    },
    energy: {
      summary: "Some people notice energy and confidence peaking right around this window.",
      points: [
        "This is often described as one of the more energetic stretches of the cycle.",
        "A short dip can follow right after ovulation for some, as hormone levels shift.",
        "Others don't notice a strong energy pattern tied to this window at all.",
      ],
    },
    mood: {
      summary: "Mood is often upbeat during this window for many people, tracking with rising estrogen.",
      points: [
        "Some people notice increased sociability or confidence right now.",
        "A brief mood dip in the day or two afterward is common, as hormone levels shift quickly.",
        "As always, this varies — plenty of people notice no particular pattern here.",
      ],
    },
    skin: {
      summary: "Skin is often at its most balanced right around ovulation for many people, thanks to peak estrogen.",
      points: [
        "Some notice a natural glow or more hydrated-looking skin right now.",
        "This tends to shift again once progesterone starts rising after ovulation.",
        "Mild, one-sided pelvic twinges are sometimes noticed around ovulation — usually brief, but worth mentioning to a doctor if severe.",
      ],
    },
    digestion: {
      summary: "Digestion is often stable during this window for most people.",
      points: [
        "Some notice mild bloating right around ovulation, related to the hormone shift.",
        "This is generally brief if it happens at all.",
        "Nothing specific is typically needed here beyond your usual routine.",
      ],
    },
    appetite_and_cravings: {
      summary: "Appetite tends to be fairly steady during this window for many people.",
      points: [
        "Some people notice a slight uptick in appetite right around ovulation.",
        "Cravings are generally milder here than in the days before a period.",
        "Following your usual hunger cues works well for most people during this phase.",
      ],
    },
    sleep: {
      summary: "Sleep is often unremarkable during this window, though some people notice a brief dip in quality.",
      points: [
        "A slight rise in body temperature around ovulation can, for some, make sleep feel a little different.",
        "This is usually brief and not something most people need to plan around.",
        "Your general sleep habits matter more here than cycle phase for most people.",
      ],
    },
    exercise: {
      summary: "With energy often higher, many people feel good pushing intensity during this window.",
      points: [
        "This can be a good stretch for a harder workout or a personal best attempt, if that appeals to you.",
        "Some notice more coordination or strength right around ovulation — though the evidence on this varies.",
        "As always, comfort and how you actually feel should lead over any general pattern.",
      ],
    },
    nutrition: {
      summary: "General balanced eating continues to apply here — no specific changes are typically needed.",
      points: [
        "Staying hydrated is a reasonable habit to keep up, as with any phase.",
        "Some people find they have a bit more appetite for protein-rich foods right now.",
        "There's no evidence-backed ‘ovulation diet’ that applies universally.",
      ],
    },
    self_care: {
      summary: "This window can be a good time to lean into higher-energy plans, if that's how you're feeling.",
      points: [
        "Social or physically active plans often feel appealing right now for many people.",
        "It's still worth resting when you need to — energy patterns are a tendency, not a rule.",
        "Mild pelvic discomfort, if it shows up, often responds well to rest or a heating pad.",
      ],
    },
    symptoms_to_monitor: {
      summary: "A few things are sometimes reported around the estimated ovulation window.",
      points: [
        "Mild, brief one-sided pelvic twinges (sometimes called mittelschmerz).",
        "A short mood or energy dip in the day or two after ovulation.",
        "Slight breast tenderness for some, as hormone levels shift.",
      ],
      relatedSymptomKeys: ["breast_tenderness", "backache"],
    },
    professional_guidance: {
      summary:
        "Ovulation-window discomfort is usually mild and brief — a few patterns are worth flagging to a healthcare professional.",
      points: [
        "Pelvic pain that's severe, one-sided, and doesn't ease within a day or so.",
        "Pain accompanied by fever, nausea, or a level of discomfort that feels out of proportion to a typical twinge.",
        "Any bleeding or spotting pattern that's new or concerning to you.",
      ],
    },
  },

  luteal: {
    body_overview: {
      summary:
        "After ovulation, progesterone rises to help prepare the body for a possible pregnancy, then falls again if pregnancy doesn't occur — leading into your next period.",
      points: [
        "This is often the phase where premenstrual symptoms, if you experience them, are most noticeable.",
        "The back half of this phase (sometimes called ‘late luteal’) is when shifts tend to be most pronounced for people who notice them.",
        "How much this phase is felt varies enormously from person to person.",
      ],
    },
    hormonal_changes: {
      summary:
        "Progesterone rises through most of this phase, then both progesterone and estrogen drop sharply in the final days if pregnancy doesn't occur — this drop is what triggers your next period.",
      points: [
        "This hormonal drop in the late luteal phase is thought to be a major driver of PMS symptoms for people who experience them.",
        "Serotonin activity is also thought to be affected by these hormone shifts for some people, which can relate to mood changes.",
        "Everyone's sensitivity to these hormonal shifts is different — some people notice a lot, others very little.",
      ],
    },
    energy: {
      summary: "You may notice energy dipping as this phase goes on, especially in the final few days before your period.",
      points: [
        "Afternoon slumps can feel more pronounced for some people right now.",
        "This is a common time to want a slower pace, if your schedule allows.",
        "Not everyone experiences a dip — some people notice little to no change in energy through this phase.",
      ],
    },
    mood: {
      summary: "It can be common to notice more emotional sensitivity in the days leading up to your period.",
      points: [
        "Irritability, anxiety, or low mood are commonly reported premenstrual experiences.",
        "For some, these feelings are mild; for others they're more pronounced — both are within a wide normal range.",
        "If mood symptoms feel severe or are disrupting daily life, that's worth a look at the ‘healthcare professional’ section below.",
      ],
    },
    skin: {
      summary: "Breakouts are commonly reported in the days before a period, related to rising then falling progesterone.",
      points: [
        "Some notice more oiliness or sensitivity along the jawline and chin specifically.",
        "This tends to ease once the period starts and hormone levels reset.",
        "A gentle, consistent skincare routine is often mentioned as helpful through this stretch.",
      ],
    },
    digestion: {
      summary: "Digestion can feel a bit different in the luteal phase — bloating and changes in regularity are both commonly reported.",
      points: [
        "Some people notice constipation; others notice looser stools — both are commonly described premenstrual patterns.",
        "Bloating tends to be most noticeable in the final days before a period.",
        "Reducing salty foods can help some people manage bloating, though results vary.",
      ],
    },
    appetite_and_cravings: {
      summary: "Increased appetite and cravings — especially for sweet, salty, or carb-heavy foods — are very commonly reported premenstrually.",
      points: [
        "This is thought to relate to hormone shifts and their effect on blood sugar and serotonin.",
        "There's nothing wrong with honoring cravings in moderation — restriction can sometimes make them feel stronger.",
        "Balancing cravings with protein or fiber is a strategy some people find helpful, though it's not necessary.",
      ],
    },
    sleep: {
      summary: "Sleep quality may dip in the luteal phase, particularly in the final days before your period.",
      points: [
        "Some people notice it's harder to fall asleep or that sleep feels lighter right now.",
        "Rising body temperature through this phase is thought to play a role for some.",
        "A consistent wind-down routine can help some people through this stretch.",
      ],
    },
    exercise: {
      summary: "Many people find gentler or more moderate exercise feels better in the late luteal phase, though this varies a lot.",
      points: [
        "Walking, yoga, or lighter strength work are commonly mentioned as feeling good right now.",
        "Some people feel completely fine maintaining higher intensity — there's no need to hold back if that's you.",
        "Movement in general, even gentle movement, is often reported to help with mood and bloating.",
      ],
    },
    nutrition: {
      summary: "Some people find that a few nutrition adjustments help ease premenstrual symptoms, though none of this is required.",
      points: [
        "Complex carbohydrates and magnesium-rich foods (leafy greens, nuts, seeds) are commonly mentioned.",
        "Reducing caffeine, alcohol, and salt in the final days is a strategy some people find helps with mood and bloating.",
        "Staying hydrated can help with bloating for some people.",
      ],
    },
    self_care: {
      summary: "This phase often benefits from a little extra patience with yourself, especially in the final days before your period.",
      points: [
        "Building in downtime, if you can, is commonly mentioned as helpful right now.",
        "Stress management — even a short walk or a few minutes of quiet — can make a noticeable difference for some people.",
        "Setting gentler expectations for yourself during this window is a reasonable and common approach.",
      ],
    },
    symptoms_to_monitor: {
      summary: "The luteal phase, especially its final days, is when premenstrual symptoms are most commonly reported.",
      points: [
        "Mood changes: irritability, sadness, or anxiety that eases once the period starts.",
        "Physical symptoms: bloating, breast tenderness, headaches, fatigue, or food cravings.",
        "Sleep or appetite changes in the days leading up to your period.",
      ],
      relatedSymptomKeys: [
        "mood_swings",
        "bloating",
        "breast_tenderness",
        "food_cravings",
        "insomnia",
        "acne",
        "fatigue",
      ],
    },
    professional_guidance: {
      summary:
        "Most premenstrual symptoms are common and manageable — but a few patterns are worth discussing with a licensed healthcare professional.",
      points: [
        "Mood symptoms severe enough to disrupt work, relationships, or daily functioning each cycle (sometimes associated with PMDD).",
        "Physical symptoms that feel significantly more intense than what's typical for you, or that don't ease once your period starts.",
        "Any pattern that feels like it's getting worse over several cycles, rather than staying consistent.",
      ],
    },
  },
};
