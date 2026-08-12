import Link from "next/link";

/**
 * Deliberately quiet — no icon flourish, no celebratory language, no
 * milestone/progress data. This view exists specifically so that a status
 * change to PREGNANCY_ENDED immediately stops every normal pregnancy
 * surface from showing, per the product requirement to never force
 * celebratory messaging after a loss.
 */
export function PregnancyEndedView({ displayName }: { displayName: string | null }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-2xl font-medium text-balance">
        We&apos;re thinking of you{displayName ? `, ${displayName}` : ""}.
      </h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground text-pretty">
        We&apos;ve turned off pregnancy tracking and updates for this pregnancy. Take the time you need.
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        If you&apos;d like support, your healthcare provider can help connect you with resources, and organizations
        like the{" "}
        <span className="font-medium text-foreground">Star Legacy Foundation</span> and{" "}
        <span className="font-medium text-foreground">Share Pregnancy &amp; Infant Loss Support</span> offer
        dedicated grief resources.
      </p>
      <Link
        href="/settings/data"
        className="mt-2 inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground"
      >
        Manage your data
      </Link>
    </div>
  );
}
