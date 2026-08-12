import { Sparkles } from "lucide-react";
import Link from "next/link";

export function PremiumUpgradePrompt({ featureDescription }: { featureDescription: string }) {
  const sentence = featureDescription.charAt(0).toUpperCase() + featureDescription.slice(1);
  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Sparkles className="h-5 w-5" />
      </span>
      <h1 className="font-heading text-2xl font-medium text-balance">This is a Premium feature</h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground text-pretty">
        {sentence} is part of Cherry Premium.
      </p>
      <Link
        href="/pricing"
        className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
      >
        See Premium plans
      </Link>
    </div>
  );
}
