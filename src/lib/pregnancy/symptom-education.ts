import type { PregnancySymptomKey } from "@/types/database";

/**
 * One hedged, non-diagnostic sentence per symptom — used to add brief
 * context when a symptom is logged. Deliberately short; the deeper,
 * five-part explanation lives in the "What is happening to my body?"
 * feature (body-map.ts).
 */
export const SYMPTOM_EDUCATION: Record<PregnancySymptomKey, string> = {
  nausea: "Nausea is commonly reported, especially earlier in pregnancy, and often eases with time for many people.",
  vomiting: "Vomiting alongside nausea is commonly reported earlier in pregnancy; staying hydrated in small sips can help.",
  headache: "Headaches can have several possible causes during pregnancy, including hormonal changes, hydration, and sleep.",
  heartburn: "Heartburn is commonly reported as pregnancy progresses, often related to hormonal changes and reduced space for digestion.",
  constipation: "Constipation is commonly reported during pregnancy, often related to hormonal changes and iron intake.",
  bloating: "Bloating is commonly reported and can relate to hormonal changes affecting digestion.",
  back_discomfort: "Back discomfort is commonly reported as posture and weight distribution shift during pregnancy.",
  pelvic_discomfort: "Pelvic discomfort can have several possible causes as ligaments and joints adjust during pregnancy.",
  cramping: "Mild cramping can have several possible causes during pregnancy; it's worth mentioning at your next visit if it continues.",
  breast_tenderness: "Breast tenderness is commonly reported, especially early on, as hormone levels shift.",
  swelling: "Some swelling, especially in the feet and ankles, is commonly reported later in pregnancy.",
  shortness_of_breath: "Shortness of breath is commonly reported later in pregnancy as growing size affects breathing space.",
  vaginal_discharge: "An increase in discharge is commonly reported during pregnancy; a change in color, smell, or texture is worth mentioning to your provider.",
  spotting_bleeding: "Spotting can have several possible causes during pregnancy and is worth mentioning to your provider, especially if it continues.",
  fetal_movement: "Movement patterns vary, but getting familiar with your baby's usual pattern can help you notice changes worth discussing with your provider.",
  contractions: "Contractions can be a normal part of later pregnancy (sometimes called practice contractions) or a sign of labor — timing and intensity are useful details for your provider.",
  fever: "A fever can have several possible causes during pregnancy and is worth discussing with your provider.",
  vision_changes: "Vision changes can have several possible causes during pregnancy and are worth discussing with your provider, especially alongside a headache.",
  fluid_leaking: "Fluid leaking can have several possible causes during pregnancy and is worth discussing with your provider promptly.",
  other: "Symptoms outside this list are still worth noting in your check-in notes and mentioning to your provider if they're new or concerning to you.",
};
