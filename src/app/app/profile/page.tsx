import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import { updateNutritionPreferences } from "@/lib/nutrition";
import { updateWorkoutPreferences } from "@/lib/movement";
import { getProfile, updateProfile } from "@/lib/profile/actions";

export const metadata: Metadata = {
  title: "Your profile — Cherry",
};

export default async function ProfilePage() {
  const result = await getProfile();

  if (result.status === "signed_out") {
    redirect("/login");
  }

  if (result.status === "error") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[15px] text-muted-foreground">{result.message}</p>
      </div>
    );
  }

  return (
    <ProfileView
      profile={result.profile}
      onUpdateProfile={updateProfile}
      onUpdateNutritionPreferences={updateNutritionPreferences}
      onUpdateWorkoutPreferences={updateWorkoutPreferences}
    />
  );
}
