import type { Trimester } from "@/types/database";

export type BodySystem =
  | "hormones"
  | "cardiovascular"
  | "respiratory"
  | "digestive"
  | "urinary"
  | "musculoskeletal"
  | "skin"
  | "breasts"
  | "reproductive_system"
  | "sleep"
  | "energy"
  | "emotional_wellbeing";

export interface BodySystemTrimesterContent {
  /** A question in the user's own voice, e.g. "Why am I urinating more often?" */
  headline: string;
  explanation: string;
  whatMayHelp: string[];
  whatToMonitor: string[];
  whenToContactProvider: string;
}

export const BODY_SYSTEM_LABELS: Record<BodySystem, string> = {
  hormones: "Hormones",
  cardiovascular: "Cardiovascular",
  respiratory: "Respiratory",
  digestive: "Digestive",
  urinary: "Urinary",
  musculoskeletal: "Musculoskeletal",
  skin: "Skin",
  breasts: "Breasts",
  reproductive_system: "Reproductive system",
  sleep: "Sleep",
  energy: "Energy",
  emotional_wellbeing: "Emotional wellbeing",
};

/**
 * One entry per (body system, trimester) — trimester-level, not a full
 * 40-week matrix, matching the same scope decision already made for
 * `BODY_AREA_CONTENT`: real per-week medical review at that scale is out of
 * reach for a single pass, and unreviewed content must never reach
 * production as "approved." Never names a diagnosis or cause as fact.
 */
export const BODY_SYSTEM_CONTENT: Record<BodySystem, Record<Trimester, BodySystemTrimesterContent>> = {
  hormones: {
    first: {
      headline: "Why do I feel so different lately?",
      explanation:
        "Levels of hCG (the hormone a pregnancy test detects), progesterone, and estrogen rise quickly in early pregnancy, and that shift can touch nearly everything — energy, mood, digestion, and smell/taste sensitivity.",
      whatMayHelp: ["Expecting some unpredictability in how you feel week to week", "Small, frequent meals if hormonal shifts affect your appetite", "Rest when you can"],
      whatToMonitor: ["How your energy and mood trend over the week, not any single day"],
      whenToContactProvider: "If mood changes feel severe or are affecting your ability to function, it's worth bringing up at your next visit.",
    },
    second: {
      headline: "Have my hormones settled down?",
      explanation: "Hormone levels are generally steadier in the second trimester than the first, which is part of why many people notice more consistent energy.",
      whatMayHelp: ["Noticing whether early-pregnancy symptoms have eased for you"],
      whatToMonitor: ["New symptoms that feel different from your first trimester"],
      whenToContactProvider: "Any new or unusual symptom is worth mentioning at a routine visit.",
    },
    third: {
      headline: "Why am I noticing more Braxton Hicks?",
      explanation: "Hormonal changes later in pregnancy help prepare the body for labor, which is part of why practice contractions (Braxton Hicks) can become more noticeable.",
      whatMayHelp: ["Changing position or resting when you notice tightening", "Staying hydrated"],
      whatToMonitor: ["Whether tightening is irregular (Braxton Hicks) or becomes regular and increasingly intense"],
      whenToContactProvider: "Regular, intensifying contractions before 37 weeks are worth contacting your provider about promptly.",
    },
  },
  cardiovascular: {
    first: {
      headline: "Why does my heart feel like it's racing sometimes?",
      explanation: "Blood volume begins increasing early in pregnancy to support the pregnancy, and your heart works somewhat harder as a result.",
      whatMayHelp: ["Standing up slowly to avoid lightheadedness", "Staying hydrated"],
      whatToMonitor: ["Dizziness, especially when standing up quickly"],
      whenToContactProvider: "Fainting, chest pain, or a racing heartbeat that doesn't settle is worth seeking prompt medical care for.",
    },
    second: {
      headline: "Why do I sometimes feel lightheaded lying down?",
      explanation: "As the uterus grows, lying flat on your back can put pressure on a major blood vessel, which some people notice as lightheadedness.",
      whatMayHelp: ["Lying on your side, especially the left side, rather than flat on your back", "Using a pillow for support while sleeping or resting"],
      whatToMonitor: ["Whether lightheadedness happens mainly when lying on your back"],
      whenToContactProvider: "Ongoing dizziness or fainting is worth mentioning promptly to your provider.",
    },
    third: {
      headline: "Why do my hands or feet swell more now?",
      explanation: "Blood volume peaks later in pregnancy, and the growing uterus can put pressure on blood vessels, both of which commonly contribute to swelling.",
      whatMayHelp: ["Elevating your feet when resting", "Resting on your side", "Comfortable, supportive footwear"],
      whatToMonitor: ["Whether swelling is gradual and symmetric, versus sudden or one-sided"],
      whenToContactProvider: "Sudden or severe swelling, especially with a headache or vision changes, is worth contacting your provider about promptly.",
    },
  },
  respiratory: {
    first: {
      headline: "Why do I feel a little more out of breath?",
      explanation: "Progesterone affects breathing rate early in pregnancy, which some people notice as mild breathlessness even without much exertion.",
      whatMayHelp: ["Pacing physical activity", "Good posture to give your lungs room to expand"],
      whatToMonitor: ["Whether breathlessness is mild and stable, or getting worse"],
      whenToContactProvider: "Severe or sudden shortness of breath is worth seeking prompt medical care for.",
    },
    second: {
      headline: "Is it normal to breathe a bit harder now?",
      explanation: "As the uterus grows, it gradually reduces the space available for the lungs to expand fully.",
      whatMayHelp: ["Sitting or standing tall rather than slouched", "Slowing down during activity when needed"],
      whatToMonitor: ["How breathlessness compares to your usual activity level"],
      whenToContactProvider: "Breathlessness that limits daily activity is worth mentioning at your next visit.",
    },
    third: {
      headline: "Why does it feel harder to take a full breath?",
      explanation: "Space for lung expansion is most limited later in pregnancy, though many people notice some relief once the baby's position shifts lower closer to delivery.",
      whatMayHelp: ["Resting in a more upright or side-lying position", "Slow, steady breathing during activity"],
      whatToMonitor: ["Sudden changes in how easily you can breathe"],
      whenToContactProvider: "Sudden or severe shortness of breath, chest pain, or a fast heartbeat is worth seeking prompt medical care for.",
    },
  },
  digestive: {
    first: {
      headline: "Why am I so nauseated?",
      explanation: "Rising hCG (the hormone a pregnancy test detects) and estrogen are commonly linked to nausea and food aversions in early pregnancy, often called 'morning sickness' even though it can happen any time of day.",
      whatMayHelp: ["Small, frequent meals rather than three large ones", "Bland, easy-to-digest foods", "Ginger or vitamin B6, only after checking with your provider", "Staying hydrated with small sips throughout the day"],
      whatToMonitor: ["Whether you're able to keep some food and fluids down overall"],
      whenToContactProvider: "Vomiting severe enough that you can't keep fluids down, or signs of dehydration, is worth contacting your provider about promptly.",
    },
    second: {
      headline: "Why do I have heartburn now?",
      explanation: "Hormones relax the valve between the stomach and esophagus, which can let stomach acid move upward more easily.",
      whatMayHelp: ["Smaller, more frequent meals", "Staying upright for a while after eating", "Avoiding known trigger foods when possible"],
      whatToMonitor: ["Whether heartburn is manageable with food/timing changes"],
      whenToContactProvider: "Heartburn that doesn't improve, or is severe, is worth mentioning at your next visit — safe options can be discussed.",
    },
    third: {
      headline: "Why am I so constipated and bloated?",
      explanation: "Hormones slow digestion throughout pregnancy, and later on, less space in the abdomen adds to this.",
      whatMayHelp: ["Fiber-rich foods and adequate fluids", "Gentle movement, as approved by your provider", "Regular meal timing"],
      whatToMonitor: ["Ongoing changes in bowel habits"],
      whenToContactProvider: "Severe abdominal pain, or constipation that doesn't improve, is worth mentioning to your provider.",
    },
  },
  urinary: {
    first: {
      headline: "Why am I urinating more often already?",
      explanation: "Increased blood flow to the kidneys early in pregnancy means more fluid is filtered, which can mean more frequent trips to the bathroom.",
      whatMayHelp: ["Not reducing fluids to manage this — staying hydrated remains important", "Leaning forward when urinating to help empty your bladder fully"],
      whatToMonitor: ["Any pain, burning, or urgency alongside frequency"],
      whenToContactProvider: "Pain or burning with urination, or fever, is worth contacting your provider about promptly.",
    },
    second: {
      headline: "Has the frequent urination eased up?",
      explanation: "Many people notice some relief in the second trimester as the uterus rises out of the pelvis, before pressure returns later on.",
      whatMayHelp: ["Continuing to stay well hydrated"],
      whatToMonitor: ["Any pain or burning with urination"],
      whenToContactProvider: "Pain, burning, or blood in the urine is worth mentioning promptly to your provider.",
    },
    third: {
      headline: "Why am I back to urinating so often?",
      explanation: "As the baby moves lower into the pelvis later in pregnancy, added pressure on the bladder commonly brings frequent urination back.",
      whatMayHelp: ["Leaning forward when urinating to help empty your bladder fully", "Planning bathroom access, especially for sleep and travel"],
      whatToMonitor: ["Leaking of fluid that isn't urine"],
      whenToContactProvider: "Fluid leaking that doesn't feel like urine is worth contacting your provider about promptly.",
    },
  },
  musculoskeletal: {
    first: {
      headline: "Why do I feel achy already?",
      explanation: "Ligaments begin loosening early in pregnancy under the influence of hormones like relaxin (which helps the body get ready to stretch and, eventually, give birth).",
      whatMayHelp: ["Gentle movement, as approved by your provider", "Supportive, comfortable shoes"],
      whatToMonitor: ["Any pain that's sharp, one-sided, or unusual for you"],
      whenToContactProvider: "Severe or unusual pain is worth mentioning to your provider.",
    },
    second: {
      headline: "Why does my lower back and round-ligament area hurt?",
      explanation: "As the uterus and belly grow, posture shifts and ligaments stretch, which commonly brings round ligament pain (a stretching sensation along the lower belly) and back discomfort.",
      whatMayHelp: ["Supportive, low-heeled shoes", "Changing positions slowly", "Gentle stretching, as approved by your provider", "A supportive belly band, if comfortable"],
      whatToMonitor: ["Whether discomfort is intermittent stretching versus persistent pain"],
      whenToContactProvider: "Severe, persistent, or one-sided abdominal pain is worth contacting your provider about promptly.",
    },
    third: {
      headline: "Why does my pelvis and back hurt more now?",
      explanation: "The growing weight of the pregnancy, loosened ligaments, and shifted posture all add pressure on the back and pelvis later in pregnancy.",
      whatMayHelp: ["Resting in a side-lying position with support", "Pelvic tilts or gentle stretching, as approved by your provider", "A supportive belly band, if comfortable"],
      whatToMonitor: ["Rhythmic back or pelvic pain alongside contractions"],
      whenToContactProvider: "Severe pelvic pressure or pain before 37 weeks, especially with contractions, is worth contacting your provider about promptly.",
    },
  },
  skin: {
    first: {
      headline: "Why does my skin look different already?",
      explanation: "Hormonal changes can affect oil production and pigmentation from early in pregnancy, which is different for everyone.",
      whatMayHelp: ["Gentle skincare — check with your provider before starting new products", "Sun protection for pigmentation changes"],
      whatToMonitor: ["New or unusual skin changes"],
      whenToContactProvider: "Anything that concerns you is worth asking about at a routine visit.",
    },
    second: {
      headline: "Why am I noticing stretch marks and darker skin patches?",
      explanation: "Stretching skin and hormone-driven pigment changes (like a darker line down the belly, or patches on the face) are commonly reported in the second trimester.",
      whatMayHelp: ["Moisturizing regularly, if that's comfortable for you", "Sun protection, since some pigment changes are sun-sensitive"],
      whatToMonitor: ["Itching that's more than mild"],
      whenToContactProvider: "Significant itching, especially on the palms and soles, is worth contacting your provider about promptly.",
    },
    third: {
      headline: "Why is my skin so itchy now?",
      explanation: "Stretching skin over a growing belly commonly causes itching later in pregnancy.",
      whatMayHelp: ["Moisturizing regularly", "Lukewarm (not hot) showers", "Loose, breathable clothing"],
      whatToMonitor: ["Whether itching is localized to stretching skin or more widespread"],
      whenToContactProvider: "Severe itching, especially on the palms and soles, is worth contacting your provider about promptly — it can have several possible causes worth ruling out.",
    },
  },
  breasts: {
    first: {
      headline: "Why are my breasts so tender?",
      explanation: "Hormonal changes increase blood flow and begin preparing the breasts for eventual breastfeeding, often starting within the first few weeks.",
      whatMayHelp: ["A supportive, well-fitting bra", "Warm or cool compresses, whichever feels better to you"],
      whatToMonitor: ["Tenderness trending as expected versus a new lump or area of concern"],
      whenToContactProvider: "A new lump, redness, or warmth (especially with fever) is worth contacting your provider about promptly.",
    },
    second: {
      headline: "Why are my breasts changing shape and size?",
      explanation: "Continued hormonal changes and increased blood flow and glandular tissue commonly cause noticeable growth in the second trimester.",
      whatMayHelp: ["Reassessing bra fit as your size changes", "A supportive sleep bra, if helpful"],
      whatToMonitor: ["Any leaking (colostrum) — common and not concerning on its own"],
      whenToContactProvider: "A new lump, unusual discharge, or persistent pain is worth mentioning at your next visit.",
    },
    third: {
      headline: "Why am I leaking colostrum?",
      explanation: "The breasts continue preparing for breastfeeding, and some people notice early colostrum (early milk) leaking in the third trimester — many don't, and that's typical too.",
      whatMayHelp: ["Breast pads, if leaking is noticeable", "A supportive, well-fitting bra"],
      whatToMonitor: ["Whether you experience it or not — both are common"],
      whenToContactProvider: "A new lump, redness, warmth, or fever is worth contacting your provider about promptly.",
    },
  },
  reproductive_system: {
    first: {
      headline: "Is spotting or cramping normal early on?",
      explanation: "Mild spotting or cramping is reported by some in early pregnancy as the uterus and its blood supply adjust, though it can also have other causes.",
      whatMayHelp: ["Resting", "Tracking what you notice to share with your provider"],
      whatToMonitor: ["Whether bleeding is spotting versus heavier, or pain is mild versus severe"],
      whenToContactProvider: "Bleeding that's heavier than spotting, or is accompanied by severe pain, is worth contacting your provider about promptly.",
    },
    second: {
      headline: "Why does my belly feel tight sometimes?",
      explanation: "The uterus grows substantially in the second trimester, and mild, irregular tightening (Braxton Hicks) can start to be noticeable for some.",
      whatMayHelp: ["Changing position", "Staying hydrated"],
      whatToMonitor: ["Whether tightening is irregular versus regular and increasingly frequent"],
      whenToContactProvider: "Regular contractions, pelvic pressure, or fluid leaking before 37 weeks is worth contacting your provider about promptly.",
    },
    third: {
      headline: "How do I tell Braxton Hicks from real labor?",
      explanation: "Both involve tightening of the uterus. Braxton Hicks are typically irregular and don't intensify, while labor contractions tend to become regular, closer together, and stronger over time — but a provider is the right person to help you tell the difference.",
      whatMayHelp: ["Timing contractions if they start feeling different", "Changing position or resting to see if irregular tightening eases"],
      whatToMonitor: ["Regularity, frequency, and intensity of any tightening"],
      whenToContactProvider: "Regular, intensifying contractions, fluid leaking, or bleeding is worth contacting your provider about promptly, especially before 37 weeks.",
    },
  },
  sleep: {
    first: {
      headline: "Why am I so tired but sleeping poorly?",
      explanation: "Rising progesterone can make you feel sleepy, while frequent urination and nausea can interrupt actual sleep — a common, frustrating combination early on.",
      whatMayHelp: ["Short naps when possible", "Limiting fluids close to bedtime", "A consistent wind-down routine"],
      whatToMonitor: ["Whether you're able to get some rest overall, even if fragmented"],
      whenToContactProvider: "Ongoing insomnia that's affecting your wellbeing is worth mentioning at a routine visit.",
    },
    second: {
      headline: "What's the best position to sleep in now?",
      explanation: "As the uterus grows, side-lying (especially the left side) is commonly recommended to support blood flow, though comfort varies by person.",
      whatMayHelp: ["A pregnancy pillow or regular pillows for support", "Side-lying with a pillow between the knees"],
      whatToMonitor: ["Comfort and quality of rest with different positions"],
      whenToContactProvider: "Ongoing sleep difficulty is worth bringing up at your next visit.",
    },
    third: {
      headline: "Why is sleep so hard to get comfortable for now?",
      explanation: "A larger belly, more frequent urination, and physical discomfort commonly make sleep harder later in pregnancy.",
      whatMayHelp: ["Extra pillows for support (between knees, under the belly, behind the back)", "A consistent, calming bedtime routine", "Side-lying position"],
      whatToMonitor: ["Snoring or gasping during sleep, which is worth mentioning"],
      whenToContactProvider: "Significant, ongoing sleep disruption is worth discussing with your provider — support is available.",
    },
  },
  energy: {
    first: {
      headline: "Why am I exhausted all the time?",
      explanation: "Rising progesterone, increased blood volume, and the metabolic demands of early pregnancy commonly cause significant fatigue.",
      whatMayHelp: ["Resting when you can, including short naps", "Small, frequent meals to help steady energy", "Gentle movement, as approved by your provider"],
      whatToMonitor: ["Whether fatigue is gradually easing as you move through the first trimester"],
      whenToContactProvider: "Fatigue that feels extreme or isn't improving is worth mentioning at your next visit.",
    },
    second: {
      headline: "Why do I suddenly have more energy?",
      explanation: "Many people notice an energy rebound in the second trimester as hormone levels and early symptoms settle somewhat.",
      whatMayHelp: ["Pacing activity even on higher-energy days", "Continuing to prioritize rest and nutrition"],
      whatToMonitor: ["Your energy trend over the week, not any single day"],
      whenToContactProvider: "Persistent low energy despite rest is worth mentioning at a routine visit.",
    },
    third: {
      headline: "Why am I tired again?",
      explanation: "Carrying more weight, disrupted sleep, and the body's preparation for labor commonly bring fatigue back in the third trimester.",
      whatMayHelp: ["Resting when you can", "Pacing activity and preparation tasks", "Accepting help from others where possible"],
      whatToMonitor: ["Whether fatigue is manageable with rest, or feels overwhelming"],
      whenToContactProvider: "Extreme fatigue, especially with other symptoms, is worth mentioning to your provider.",
    },
  },
  emotional_wellbeing: {
    first: {
      headline: "Why am I so emotional right now?",
      explanation: "Hormonal shifts, the news of pregnancy itself, and physical discomfort can all contribute to mood swings, anxiety, or tearfulness early on — this varies a lot from person to person.",
      whatMayHelp: ["Talking with people you trust", "Being patient with yourself during a big transition", "Rest and gentle movement, as approved by your provider"],
      whatToMonitor: ["Whether low mood or anxiety feels manageable or persistent"],
      whenToContactProvider: "Ongoing low mood, anxiety, or feeling overwhelmed is worth bringing up with your provider — support is available and this is common.",
    },
    second: {
      headline: "Why do I feel more like myself again?",
      explanation: "Many people notice steadier mood in the second trimester alongside more stable hormones and easing early symptoms, though this isn't universal.",
      whatMayHelp: ["Continuing to check in with yourself regularly", "Staying connected with support people"],
      whatToMonitor: ["Any return of low mood or anxiety"],
      whenToContactProvider: "Persistent low mood or anxiety at any point is worth discussing with your provider.",
    },
    third: {
      headline: "Why am I anxious as my due date gets closer?",
      explanation: "Anticipation about labor, delivery, and the transition to caring for a baby commonly brings a mix of excitement and anxiety later in pregnancy.",
      whatMayHelp: ["Learning about labor and delivery at your own pace", "Talking through concerns with your provider or support people", "Building a support plan for after delivery"],
      whatToMonitor: ["Whether anxiety is manageable or interferes with daily life or sleep"],
      whenToContactProvider: "Thoughts of harming yourself, or feeling unable to cope, warrant reaching out for help right away — contact your provider, a crisis line, or emergency services.",
    },
  },
};
