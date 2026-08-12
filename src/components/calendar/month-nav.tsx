import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { addMonths } from "@/lib/calendar";

export function MonthNav({
  year,
  month,
  monthLabel,
}: {
  year: number;
  month: number;
  monthLabel: string;
}) {
  const prev = addMonths(year, month, -1);
  const next = addMonths(year, month, 1);

  return (
    <div className="flex items-center justify-between">
      <Link
        href={`/app/calendar?year=${prev.year}&month=${prev.month}`}
        aria-label="Previous month"
        className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
      >
        <ChevronLeft className="h-4.5 w-4.5" />
      </Link>
      <h1 className="font-heading text-xl font-medium">{monthLabel}</h1>
      <Link
        href={`/app/calendar?year=${next.year}&month=${next.month}`}
        aria-label="Next month"
        className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
      >
        <ChevronRight className="h-4.5 w-4.5" />
      </Link>
    </div>
  );
}
