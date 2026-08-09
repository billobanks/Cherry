import { Activity, Bike, Dumbbell, Flame, Flower2, Footprints, Moon, Move, Zap, type LucideIcon } from "lucide-react";
import type { MovementType } from "@/lib/movement";

export const MOVEMENT_ICONS: Record<MovementType, LucideIcon> = {
  walking: Footprints,
  yoga: Flower2,
  stretching: Move,
  strength_training: Dumbbell,
  pilates: Activity,
  cycling: Bike,
  running: Zap,
  hiit: Flame,
  recovery_rest: Moon,
};
