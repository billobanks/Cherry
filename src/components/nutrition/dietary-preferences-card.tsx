"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChipSelect } from "@/components/checkin/chip-select";
import { updateNutritionPreferences, type DietaryPreference, type NutritionData } from "@/lib/nutrition";
import { TagInput } from "./tag-input";

const DIET_OPTIONS: { value: DietaryPreference; label: string }[] = [
  { value: "none", label: "No dietary restrictions" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
];

export function DietaryPreferencesCard({ data }: { data: NutritionData }) {
  const [dietaryPreference, setDietaryPreference] = useState(data.dietaryPreference);
  const [foodAllergies, setFoodAllergies] = useState(data.foodAllergies);
  const [foodsToAvoid, setFoodsToAvoid] = useState(data.foodsToAvoid);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    startTransition(async () => {
      const result = await updateNutritionPreferences({ dietaryPreference, foodAllergies, foodsToAvoid });
      if (!result.success) {
        toast.error(result.message ?? "Couldn't save your preferences.");
        return;
      }
      toast.success("Preferences saved — today's suggestions will reflect them.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <h2 className="font-heading text-lg font-medium">Preferences</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Filters what shows up in Foods to Consider and Simple Meal Ideas.
      </p>

      <div className="mt-4">
        <ChipSelect
          label="Dietary preference"
          options={DIET_OPTIONS}
          multi={false}
          value={dietaryPreference}
          onChange={setDietaryPreference}
        />
      </div>

      <div className="mt-4">
        <TagInput
          label="Allergies"
          placeholder="Type an allergy and press Enter"
          values={foodAllergies}
          onChange={setFoodAllergies}
        />
      </div>

      <div className="mt-4">
        <TagInput
          label="Other foods to avoid"
          placeholder="Type a food and press Enter"
          values={foodsToAvoid}
          onChange={setFoodsToAvoid}
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-70"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save preferences"}
      </button>
    </section>
  );
}
