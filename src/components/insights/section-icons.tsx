import {
  Activity,
  AlertCircle,
  Apple,
  Dumbbell,
  Flower2,
  Heart,
  Moon,
  Sparkle,
  Sparkles,
  Stethoscope,
  Utensils,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { InsightSectionKey } from "@/lib/insights";

export const SECTION_ICONS: Record<InsightSectionKey, LucideIcon> = {
  body_overview: Sparkles,
  hormonal_changes: Activity,
  energy: Zap,
  mood: Heart,
  skin: Sparkle,
  digestion: Waves,
  appetite_and_cravings: Utensils,
  sleep: Moon,
  exercise: Dumbbell,
  nutrition: Apple,
  self_care: Flower2,
  symptoms_to_monitor: AlertCircle,
  professional_guidance: Stethoscope,
};
