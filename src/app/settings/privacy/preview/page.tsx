import { notFound } from "next/navigation";
import { PersonalizationCard } from "@/components/privacy/personalization-card";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function PrivacySettingsPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Settings</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Privacy</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Control whether your own logs are used to personalize what you see.
        </p>
      </div>
      <PersonalizationCard
        initial={true}
        onUpdate={async () => {
          "use server";
          return { success: true };
        }}
      />
    </div>
  );
}
