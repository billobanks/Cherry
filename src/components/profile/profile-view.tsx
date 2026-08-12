"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChipSelect } from "@/components/checkin/chip-select";
import { TagInput } from "@/components/nutrition/tag-input";
import { MOVEMENT_CATALOG, MOVEMENT_ORDER } from "@/lib/movement";
import { FOCUS_OPTIONS, GOAL_OPTIONS, REGULARITY_OPTIONS } from "@/lib/onboarding/constants";
import type { ProfileData, UpdateProfileInput } from "@/lib/profile/actions";
import type { DietaryPreference } from "@/types/database";

const DIETARY_PREFERENCE_OPTIONS: { value: DietaryPreference; label: string }[] = [
  { value: "none", label: "No restrictions" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
];

const MOVEMENT_OPTIONS = MOVEMENT_ORDER.map((key) => ({ value: key, label: MOVEMENT_CATALOG[key].label }));

export function ProfileView({
  profile,
  onUpdateProfile,
  onUpdateNutritionPreferences,
  onUpdateWorkoutPreferences,
}: {
  profile: ProfileData;
  onUpdateProfile: (input: UpdateProfileInput) => Promise<{ success: boolean; message?: string }>;
  onUpdateNutritionPreferences: (input: {
    dietaryPreference: DietaryPreference;
    foodAllergies: string[];
    foodsToAvoid: string[];
  }) => Promise<{ success: boolean; message?: string }>;
  onUpdateWorkoutPreferences: (preferences: (typeof MOVEMENT_ORDER)[number][]) => Promise<{ success: boolean; message?: string }>;
}) {
  const [primaryFocus, setPrimaryFocus] = useState(profile.primaryFocus);
  const [avgCycleLengthDays, setAvgCycleLengthDays] = useState(profile.avgCycleLengthDays);
  const [avgPeriodLengthDays, setAvgPeriodLengthDays] = useState(profile.avgPeriodLengthDays);
  const [cycleRegularity, setCycleRegularity] = useState(profile.cycleRegularity);
  const [goals, setGoals] = useState(profile.goals);
  const [dietaryPreference, setDietaryPreference] = useState(profile.dietaryPreference);
  const [foodAllergies, setFoodAllergies] = useState(profile.foodAllergies);
  const [foodsToAvoid, setFoodsToAvoid] = useState(profile.foodsToAvoid);
  const [workoutPreferences, setWorkoutPreferences] = useState(profile.workoutPreferences);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const [profileResult, nutritionResult, movementResult] = await Promise.all([
        onUpdateProfile({
          displayName: profile.displayName ?? "",
          primaryFocus,
          avgCycleLengthDays,
          avgPeriodLengthDays,
          cycleRegularity,
          goals,
        }),
        onUpdateNutritionPreferences({ dietaryPreference, foodAllergies, foodsToAvoid }),
        onUpdateWorkoutPreferences(workoutPreferences),
      ]);
      if (!profileResult.success || !nutritionResult.success || !movementResult.success) {
        toast.error("Some changes couldn't be saved — please try again.");
        return;
      }
      toast.success("Profile updated.");
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Profile</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Your profile</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Update what we know about you and your preferences — this shapes what you see day to day.
        </p>
      </div>

      <ChipSelect label="Main focus" options={FOCUS_OPTIONS} multi={false} value={primaryFocus} onChange={setPrimaryFocus} />
      <ChipSelect label="Goals" options={GOAL_OPTIONS} multi={true} value={goals} onChange={setGoals} />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
          <label className="text-sm font-medium text-foreground" htmlFor="cycleLength">
            Average cycle length
          </label>
          <input
            id="cycleLength"
            type="number"
            value={avgCycleLengthDays ?? ""}
            onChange={(e) => setAvgCycleLengthDays(e.target.value ? Number(e.target.value) : null)}
            className="mt-2 w-full rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-[15px] outline-none focus:border-primary"
          />
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
          <label className="text-sm font-medium text-foreground" htmlFor="periodLength">
            Average period length
          </label>
          <input
            id="periodLength"
            type="number"
            value={avgPeriodLengthDays ?? ""}
            onChange={(e) => setAvgPeriodLengthDays(e.target.value ? Number(e.target.value) : null)}
            className="mt-2 w-full rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-[15px] outline-none focus:border-primary"
          />
        </div>
      </div>

      <ChipSelect label="Cycle regularity" options={REGULARITY_OPTIONS} multi={false} value={cycleRegularity} onChange={setCycleRegularity} />
      <ChipSelect
        label="Dietary preference"
        options={DIETARY_PREFERENCE_OPTIONS}
        multi={false}
        value={dietaryPreference}
        onChange={setDietaryPreference}
      />
      <TagInput label="Food allergies" placeholder="Add an allergy…" values={foodAllergies} onChange={setFoodAllergies} />
      <TagInput label="Foods to avoid" placeholder="Add a food to avoid…" values={foodsToAvoid} onChange={setFoodsToAvoid} />
      <ChipSelect label="Preferred movement" options={MOVEMENT_OPTIONS} multi={true} value={workoutPreferences} onChange={setWorkoutPreferences} />

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-70"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
      </button>
    </div>
  );
}
