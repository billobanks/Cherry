import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import type { ProfileData } from "@/lib/profile/actions";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function ProfilePreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const profile: ProfileData = {
    displayName: "Maya",
    email: "maya@example.com",
    primaryFocus: "understand_symptoms",
    avgCycleLengthDays: 28,
    avgPeriodLengthDays: 5,
    cycleRegularity: "regular",
    goals: ["understand_pms", "improve_energy"],
    dietaryPreference: "vegetarian",
    foodAllergies: ["peanuts"],
    foodsToAvoid: [],
    workoutPreferences: ["yoga", "walking"],
  };

  return (
    <ProfileView
      profile={profile}
      onUpdateProfile={async () => {
        "use server";
        return { success: true };
      }}
      onUpdateNutritionPreferences={async () => {
        "use server";
        return { success: true };
      }}
      onUpdateWorkoutPreferences={async () => {
        "use server";
        return { success: true };
      }}
    />
  );
}
