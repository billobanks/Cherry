export type BodyArea =
  | "head"
  | "breasts"
  | "chest"
  | "abdomen"
  | "pelvis"
  | "back"
  | "skin"
  | "legs"
  | "feet"
  | "digestive_system"
  | "bladder"
  | "emotions";

export interface BodyAreaContent {
  label: string;
  whatMayBeHappening: string;
  whyItCanHappen: string;
  thingsThatMayHelp: string[];
  whenToDiscuss: string;
  whenUrgent: string;
}

/**
 * One general, hedged explanation per body area — not a full symptom ×
 * gestational-week combinatorial matrix (that would need real medical
 * review at a scale beyond this pass). Never a diagnosis of a cause.
 */
export const BODY_AREA_CONTENT: Record<BodyArea, BodyAreaContent> = {
  head: {
    label: "Head",
    whatMayBeHappening: "Headaches are commonly reported during pregnancy, especially in the first trimester.",
    whyItCanHappen: "Hormonal shifts, changes in blood volume, hydration, sleep, and caffeine changes can all play a role.",
    thingsThatMayHelp: ["Staying hydrated", "Regular meals and steady blood sugar", "Rest and stress management", "Discuss any pain relief options with your provider before taking anything"],
    whenToDiscuss: "If headaches are frequent or don't improve with rest and hydration, it's worth mentioning at your next visit.",
    whenUrgent: "A severe headache, especially with vision changes, is worth contacting your provider about promptly rather than waiting.",
  },
  breasts: {
    label: "Breasts",
    whatMayBeHappening: "Breast tenderness, swelling, and changes in the nipples/areola are commonly reported, especially early on.",
    whyItCanHappen: "Hormonal changes prepare the body for eventual breastfeeding, and blood flow to the area increases.",
    thingsThatMayHelp: ["A supportive, well-fitting bra", "Warm or cool compresses, whichever feels better to you"],
    whenToDiscuss: "Ongoing significant discomfort is worth mentioning at a routine visit.",
    whenUrgent: "A new lump, redness, or warmth (especially with fever) is worth contacting your provider about promptly.",
  },
  chest: {
    label: "Chest",
    whatMayBeHappening: "Shortness of breath and a sense of chest tightness are commonly reported, especially later in pregnancy.",
    whyItCanHappen: "A growing uterus can reduce space for the lungs to expand fully, and increased blood volume also plays a role.",
    thingsThatMayHelp: ["Sitting or standing with good posture", "Pacing activity and resting as needed"],
    whenToDiscuss: "Ongoing shortness of breath that limits daily activity is worth mentioning at your next visit.",
    whenUrgent: "Sudden or severe shortness of breath, chest pain, or a fast heartbeat is worth seeking prompt medical care for.",
  },
  abdomen: {
    label: "Abdomen",
    whatMayBeHappening: "Stretching sensations, round ligament pain, and mild cramping are commonly reported as the uterus grows.",
    whyItCanHappen: "The uterus and surrounding ligaments stretch considerably to accommodate a growing pregnancy.",
    thingsThatMayHelp: ["Changing position slowly", "Gentle stretching, as approved by your provider", "A warm (not hot) compress"],
    whenToDiscuss: "Cramping or discomfort that's new or unusual for you is worth mentioning at your next visit.",
    whenUrgent: "Severe or persistent abdominal pain, especially with bleeding, fever, or feeling unwell, is worth seeking prompt medical care for.",
  },
  pelvis: {
    label: "Pelvis",
    whatMayBeHappening: "Pelvic pressure or discomfort is commonly reported, especially later in pregnancy.",
    whyItCanHappen: "Hormones loosen ligaments in preparation for birth, and the growing weight of the pregnancy adds pressure.",
    thingsThatMayHelp: ["A supportive belly band, if comfortable for you", "Pelvic tilts or gentle stretching, as approved by your provider", "Resting in a side-lying position"],
    whenToDiscuss: "Ongoing pelvic discomfort that affects daily activity is worth discussing at your next visit.",
    whenUrgent: "Severe pelvic pressure or pain before 37 weeks, especially with contractions or fluid leaking, is worth contacting your provider about promptly.",
  },
  back: {
    label: "Back",
    whatMayBeHappening: "Back discomfort, especially in the lower back, is commonly reported as pregnancy progresses.",
    whyItCanHappen: "Shifting posture, loosening ligaments, and the growing weight of the pregnancy change how weight is distributed.",
    thingsThatMayHelp: ["Supportive, low-heeled shoes", "Good posture and supportive seating", "Gentle stretching or prenatal-appropriate movement, as approved by your provider"],
    whenToDiscuss: "Persistent or worsening back discomfort is worth mentioning at your next visit.",
    whenUrgent: "Severe back pain with fever, or rhythmic back pain alongside contractions before 37 weeks, is worth contacting your provider about promptly.",
  },
  skin: {
    label: "Skin",
    whatMayBeHappening: "Changes like stretch marks, darker patches of skin, or increased oiliness are commonly reported.",
    whyItCanHappen: "Hormonal changes and stretching skin as the body grows both play a role.",
    thingsThatMayHelp: ["Moisturizing regularly, if that's comfortable for you", "Gentle skincare — check with your provider before starting new products"],
    whenToDiscuss: "New or unusual skin changes are worth mentioning at a routine visit.",
    whenUrgent: "Severe itching, especially on the palms and soles, is worth contacting your provider about promptly — it can have several possible causes worth ruling out.",
  },
  legs: {
    label: "Legs",
    whatMayBeHappening: "Leg cramps and mild swelling are commonly reported, especially later in pregnancy.",
    whyItCanHappen: "Changes in circulation, weight distribution, and fluid retention all commonly contribute.",
    thingsThatMayHelp: ["Gentle stretching before bed", "Staying hydrated", "Elevating your legs when resting"],
    whenToDiscuss: "Frequent or worsening cramps are worth mentioning at your next visit.",
    whenUrgent: "Swelling, pain, or redness in one leg that's noticeably different from the other is worth contacting your provider about promptly.",
  },
  feet: {
    label: "Feet",
    whatMayBeHappening: "Swelling in the feet and ankles is commonly reported, especially by the end of the day later in pregnancy.",
    whyItCanHappen: "Increased fluid volume and reduced circulation from a growing uterus commonly contribute.",
    thingsThatMayHelp: ["Elevating your feet when resting", "Comfortable, supportive shoes", "Staying hydrated (swelling isn't usually a reason to limit fluids)"],
    whenToDiscuss: "Ongoing swelling is worth mentioning at a routine visit.",
    whenUrgent: "Sudden or severe swelling, especially with a headache or vision changes, is worth contacting your provider about promptly.",
  },
  digestive_system: {
    label: "Digestive system",
    whatMayBeHappening: "Heartburn, bloating, constipation, and nausea are all commonly reported at different points in pregnancy.",
    whyItCanHappen: "Hormonal changes slow digestion, and later on, less space for the stomach and intestines adds to this.",
    thingsThatMayHelp: ["Smaller, more frequent meals", "Staying upright after eating", "Fiber-rich foods and fluids for constipation"],
    whenToDiscuss: "Ongoing or worsening digestive discomfort is worth mentioning at your next visit.",
    whenUrgent: "Vomiting severe enough that you can't keep fluids down is worth contacting your provider about promptly.",
  },
  bladder: {
    label: "Bladder",
    whatMayBeHappening: "More frequent urination is commonly reported, especially in the first and third trimesters.",
    whyItCanHappen: "Increased blood flow to the kidneys and pressure from the growing uterus on the bladder both play a role.",
    thingsThatMayHelp: ["Not reducing fluids to avoid this — staying hydrated remains important", "Leaning forward when urinating to help empty your bladder fully"],
    whenToDiscuss: "A change in frequency that concerns you is worth mentioning at a routine visit.",
    whenUrgent: "Pain or burning with urination, or fever, is worth contacting your provider about promptly — urinary tract infections are treatable and worth addressing.",
  },
  emotions: {
    label: "Emotions",
    whatMayBeHappening: "A wide range of emotions — excitement, anxiety, mood swings, moments of low mood — are all commonly reported during pregnancy.",
    whyItCanHappen: "Hormonal shifts, physical changes, and the significance of the transition itself all contribute, and this varies a lot from person to person.",
    thingsThatMayHelp: ["Talking with people you trust", "Rest and gentle movement, as approved by your provider", "Being patient with yourself — this is a big transition"],
    whenToDiscuss: "Ongoing low mood, anxiety, or feeling overwhelmed is worth bringing up with your provider — support is available and this is common.",
    whenUrgent: "Thoughts of harming yourself, or feeling unable to cope, warrant reaching out for help right away — contact your provider, a crisis line, or emergency services.",
  },
};
