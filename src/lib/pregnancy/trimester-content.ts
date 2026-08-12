import type { Trimester } from "@/types/database";

export interface TrimesterGuidance {
  babyDevelopment: string;
  babyDevelopmentDetails: string[];
  bodyChanges: string;
  bodyChangesList: string[];
  commonExperiences: string[];
  todayInsight: string;
  nutrition: string;
  movement: string;
  hydration: string;
  sleep: string;
  selfCare: string;
  emotionalWellness: string;
  questionsForProvider: string[];
  topicsToLearn: string[];
}

/**
 * Generic, trimester-level fallback content — used whenever no medically
 * reviewed, PUBLISHED content exists yet for the specific gestational week
 * (see week-content-actions.ts). Keeps the dashboard useful before any week
 * content has gone through admin review, without ever presenting unreviewed
 * per-week detail as if it were reviewed.
 */
export const TRIMESTER_GUIDANCE: Record<Trimester, TrimesterGuidance> = {
  first: {
    babyDevelopment:
      "Early in pregnancy, a lot of foundational development is happening — major organs and body systems begin forming during this window. Growth can be hard to feel or see from the outside this early.",
    babyDevelopmentDetails: [
      "Major organs and body systems begin forming during this window.",
      "Growth is measured in millimeters early on and isn't yet something you can feel.",
      "Every pregnancy develops on its own timeline — these are general patterns, not guarantees.",
    ],
    bodyChanges:
      "Some people notice breast tenderness, fatigue, and nausea as hormone levels shift quickly in early pregnancy. It can be common to feel more tired than usual.",
    bodyChangesList: [
      "Breast tenderness and fatigue often show up as hormone levels shift quickly.",
      "Nausea and food aversions are common, though they vary widely from person to person.",
      "Frequent urination can start early as blood flow to the kidneys increases.",
    ],
    commonExperiences: [
      "Feeling more tired than usual, even with enough sleep",
      "Nausea, with or without vomiting, at any time of day",
      "A heightened sense of smell or new food aversions",
    ],
    todayInsight:
      "Fatigue and nausea are par for the course in the first trimester as your body adjusts — how much you notice either one varies a lot from person to person.",
    nutrition:
      "Small, frequent meals with some protein can help if nausea makes bigger meals hard to face. It's common for providers to recommend starting a prenatal vitamin early on, if you haven't already.",
    movement: "Gentle movement like walking usually feels fine early on, but energy can be lower than usual — rest when you need to.",
    hydration: "Small sips throughout the day are often easier to manage than large amounts at once, especially with nausea.",
    sleep: "Extra fatigue is normal in the first trimester as your body adjusts — it isn't a sign anything is wrong.",
    selfCare: "Resting when you can, going easy on yourself about doing less than usual, and telling a few trusted people early can help lighten the load.",
    emotionalWellness:
      "A mix of excitement, anxiety, and mood swings is common in early pregnancy — hormonal shifts play a real role, and you're not alone in feeling this way.",
    questionsForProvider: [
      "What prenatal vitamin or supplement routine do you recommend for me?",
      "What symptoms should prompt me to call between now and my next visit?",
      "When will we schedule my next appointment or any early screening tests?",
    ],
    topicsToLearn: ["Prenatal nutrition and food safety basics", "What to expect at your first prenatal appointment", "Medications and supplements worth reviewing with your provider"],
  },
  second: {
    babyDevelopment:
      "Many people describe the second trimester as a period of noticeable growth — movement often becomes easier to feel during this window, and features continue developing.",
    babyDevelopmentDetails: [
      "Movement often becomes easier to feel during this window, though timing varies widely.",
      "Growth continues steadily, and many people have an anatomy scan sometime in this trimester.",
      "These are general patterns — your provider is the best source for how your pregnancy is progressing specifically.",
    ],
    bodyChanges:
      "A visibly growing belly is common by now, along with changes in skin, appetite, and energy as your body continues adjusting.",
    bodyChangesList: [
      "A visibly growing belly and shifting posture are common by now.",
      "Skin changes like stretch marks or darker patches show up for a lot of people.",
      "Round ligament pain — a stretching sensation along the lower belly — is common as the uterus grows.",
    ],
    commonExperiences: [
      "A return of energy for many people, though not everyone",
      "First noticeable fetal movement, sometimes described as flutters",
      "Mild back or round-ligament discomfort as the belly grows",
    ],
    todayInsight:
      "A lot of people get some energy back in the second trimester, though that's far from universal — if you're still feeling more tired than usual, that's normal too.",
    nutrition:
      "Iron and calcium needs go up in the second trimester, and many people find their appetite for more varied meals comes back around now.",
    movement: "With energy often higher in the second trimester, this can be a good stretch to maintain or gradually build movement, as approved by your provider.",
    hydration: "Fluid needs typically increase as blood volume expands — keeping water accessible through the day can help.",
    sleep: "Sleep is often a bit more comfortable in the second trimester, though finding a good position can take some adjusting as your body changes.",
    selfCare: "This is a common time to start researching childbirth classes, feeding, and support options at a pace that feels comfortable, without needing to decide anything yet.",
    emotionalWellness:
      "Many people describe the second trimester as an emotional \"settling in\" period, though this varies widely from person to person.",
    questionsForProvider: [
      "Is there anything about my anatomy scan or screening results you'd like to discuss?",
      "What does typical fetal movement feel like at this stage, and when should I start tracking it?",
      "Are there any classes or resources you'd recommend starting to look into?",
    ],
    topicsToLearn: ["What fetal movement typically feels like", "Preparing for your anatomy scan", "Early thoughts on childbirth classes and feeding"],
  },
  third: {
    babyDevelopment:
      "In the third trimester, continued growth and preparation for birth are the main themes — many of the systems that developed earlier keep maturing during this window.",
    babyDevelopmentDetails: [
      "Continued growth and maturing body systems are the main themes of this window.",
      "Many people notice a fairly consistent pattern to movement — worth mentioning to your provider if that changes.",
      "The general position and timing of labor preparation varies a lot — your provider can speak to your specific situation.",
    ],
    bodyChanges:
      "Growing size can bring new physical sensations — back discomfort, shortness of breath, and trouble sleeping are commonly reported as your body prepares for birth.",
    bodyChangesList: [
      "Back discomfort and pelvic pressure tend to build as the pregnancy's weight increases.",
      "Shortness of breath and trouble sleeping become more noticeable as space gets more limited.",
      "Braxton Hicks (practice contractions) tend to show up more often from here on.",
    ],
    commonExperiences: [
      "Back and pelvic discomfort as the pregnancy's weight increases",
      "Braxton Hicks — irregular practice contractions",
      "Trouble finding a comfortable sleep position",
    ],
    todayInsight:
      "Discomfort and disrupted sleep are par for the course in the third trimester as your body gets ready for birth — how much varies a lot from person to person.",
    nutrition: "Smaller, more frequent meals can help as growing space in your abdomen leaves less room for large ones.",
    movement:
      "Gentle movement is generally fine as tolerated, though balance and comfort shift as your body changes — check with your provider about what's right for you.",
    hydration: "Staying hydrated remains important; some swelling is normal on its own and isn't a reason to cut back on fluids — ask your provider if you're concerned.",
    sleep: "Sleep can get harder in the third trimester — lying on your side with a pillow between your knees tends to feel more comfortable for a lot of people.",
    selfCare: "This is a common time to gradually prepare — thinking through your hospital bag, support plan, and birth preferences at whatever pace feels manageable.",
    emotionalWellness:
      "A mix of anticipation and anxiety about labor and birth is common as your due date approaches — talking it through with your provider or support system can help.",
    questionsForProvider: [
      "What signs of labor should prompt me to call you or go to the hospital?",
      "Can we review my birth preferences together?",
      "What does a typical timeline look like for my last few prenatal visits?",
    ],
    topicsToLearn: ["Signs of labor and when to call your provider", "Packing a hospital bag", "Postpartum recovery and feeding basics"],
  },
};
