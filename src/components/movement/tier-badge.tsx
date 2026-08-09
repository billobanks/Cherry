import type { IntensityTier } from "@/lib/movement";

const TIER_LABEL: Record<IntensityTier, string> = {
  gentle: "Gentle",
  moderate: "Moderate",
  vigorous: "Vigorous",
};

const TIER_CLASSES: Record<IntensityTier, string> = {
  gentle: "bg-moss-soft text-moss",
  moderate: "bg-accent text-accent-foreground",
  vigorous: "bg-primary text-primary-foreground",
};

export function TierBadge({ tier }: { tier: IntensityTier }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TIER_CLASSES[tier]}`}>
      {TIER_LABEL[tier]}
    </span>
  );
}
