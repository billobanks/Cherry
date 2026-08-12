import { Heart } from "lucide-react";
import Link from "next/link";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function PostpartumView({ displayName, deliveryDate }: { displayName: string | null; deliveryDate: string | null }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Heart className="h-5 w-5" />
      </span>
      <h1 className="font-heading text-2xl font-medium text-balance">
        Congratulations{displayName ? `, ${displayName}` : ""}.
      </h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground text-pretty">
        {deliveryDate ? `Delivered ${formatDate(deliveryDate)}. ` : ""}
        You&apos;re now in the postpartum period. Recovery looks different for everyone — be gentle with
        yourself as your body and routine adjust.
      </p>
      <p className="text-sm text-muted-foreground">
        A dedicated postpartum experience is on its way. In the meantime, your prenatal care provider (or a
        postpartum follow-up visit) is the best resource for how you&apos;re healing.
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
