import Link from "next/link";
import { SECTION_ICONS } from "@/components/insights/section-icons";
import type { RecommendedCard } from "@/lib/dashboard";

const CARD_HREF: Record<RecommendedCard["key"], string> = {
  nutrition: "/nutrition",
  exercise: "/insights/today",
  self_care: "/insights/today",
  sleep: "/insights/today",
};

export function RecommendedToday({ cards }: { cards: RecommendedCard[] }) {
  return (
    <div>
      <h2 className="px-1 font-heading text-lg font-medium">Recommended today</h2>
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = SECTION_ICONS[card.key];
          return (
            <Link
              key={card.key}
              href={CARD_HREF[card.key]}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-4 transition-colors hover:border-primary/40"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span>
                <span className="block text-[15px] font-medium">{card.title}</span>
                <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
                  {card.teaser}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
