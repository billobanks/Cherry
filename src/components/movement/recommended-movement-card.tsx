"use client";

import { ArrowLeftRight, Clock, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { todayEpochDays } from "@/lib/cycle-engine";
import { DURATION_BY_TIER, getGentlerOption, type MovementRecommendation } from "@/lib/movement";
import { MOVEMENT_ICONS } from "./movement-icons";
import { TierBadge } from "./tier-badge";

export function RecommendedMovementCard({ recommendation }: { recommendation: MovementRecommendation }) {
  const [showingGentler, setShowingGentler] = useState(false);

  const gentlerOption = useMemo(
    () => getGentlerOption(recommendation.tier, todayEpochDays()),
    [recommendation.tier],
  );

  const option = showingGentler ? gentlerOption : recommendation.primary;
  const tier = option.tier;
  const duration = DURATION_BY_TIER[tier];
  const Icon = MOVEMENT_ICONS[option.key];
  const AltIcon = MOVEMENT_ICONS[recommendation.alternative.key];

  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
        Today&apos;s Recommended Movement
      </span>

      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-medium">{option.label}</h1>
          <div className="mt-1 flex items-center gap-2">
            <TierBadge tier={tier} />
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {duration}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Why</span>
        <p className="mt-1 text-[15px] leading-relaxed text-foreground">
          {showingGentler
            ? "Here's a gentler option for today — there's no need to push through if it's not the day for it."
            : recommendation.why}
        </p>
      </div>

      {!showingGentler ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-secondary/60 px-3.5 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-foreground">
            <AltIcon className="h-4 w-4" />
          </span>
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Alternative option
            </span>
            <p className="text-sm font-medium text-foreground">{recommendation.alternative.label}</p>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setShowingGentler((s) => !s)}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border text-[15px] font-semibold text-foreground transition-colors hover:bg-secondary"
      >
        {showingGentler ? (
          <>
            <RotateCcw className="h-4 w-4" />
            Back to today&apos;s original suggestion
          </>
        ) : (
          <>
            <ArrowLeftRight className="h-4 w-4" />
            Not feeling it today?
          </>
        )}
      </button>
    </section>
  );
}
