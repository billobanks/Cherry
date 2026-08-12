"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChipSelect } from "@/components/checkin/chip-select";
import { TagInput } from "@/components/nutrition/tag-input";
import type { PregnancyDietaryPreference } from "@/types/database";

const DIETARY_OPTIONS: { value: PregnancyDietaryPreference; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "gluten_free", label: "Gluten-free" },
  { value: "dairy_free", label: "Dairy-free" },
];

export function PregnancyNutritionPreferencesCard({
  initialDietaryPreferences,
  initialCulturalPreferences,
  initialFoodAllergies,
  onUpdate,
}: {
  initialDietaryPreferences: PregnancyDietaryPreference[];
  initialCulturalPreferences: string;
  initialFoodAllergies: string[];
  onUpdate: (input: {
    dietaryPreferences: PregnancyDietaryPreference[];
    culturalPreferences: string;
    foodAllergies: string[];
  }) => Promise<{ success: boolean; message?: string }>;
}) {
  const [dietaryPreferences, setDietaryPreferences] = useState(initialDietaryPreferences);
  const [culturalPreferences, setCulturalPreferences] = useState(initialCulturalPreferences);
  const [foodAllergies, setFoodAllergies] = useState(initialFoodAllergies);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    startTransition(async () => {
      const result = await onUpdate({ dietaryPreferences, culturalPreferences, foodAllergies });
      if (!result.success) {
        toast.error(result.message ?? "Couldn't save your preferences.");
        return;
      }
      toast.success("Preferences saved.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <h2 className="font-heading text-lg font-medium">Your preferences</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We&apos;ll tailor suggestions to these — but supplement and diet decisions specific to you should go
        through your provider.
      </p>

      <div className="mt-4">
        <ChipSelect label="Dietary preferences" options={DIETARY_OPTIONS} multi={true} value={dietaryPreferences} onChange={setDietaryPreferences} />
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-foreground" htmlFor="cultural-preferences">
          Cultural food preferences <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="cultural-preferences"
          value={culturalPreferences}
          onChange={(e) => setCulturalPreferences(e.target.value.slice(0, 500))}
          rows={2}
          className="mt-2 w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-[15px] outline-none focus:border-primary"
          placeholder="Anything worth knowing about your food traditions or preferences?"
        />
      </div>

      <div className="mt-4">
        <TagInput label="Food allergies" placeholder="Type and press Enter" values={foodAllergies} onChange={setFoodAllergies} />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-70"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save preferences"}
      </button>
    </section>
  );
}
