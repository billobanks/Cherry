import { Apple, Baby, CalendarClock, ClipboardList, HelpCircle, LineChart, MessageCircleHeart, Settings, Timer } from "lucide-react";
import Link from "next/link";

const LINKS = [
  { href: "/app/pregnancy/nutrition", label: "Nutrition", Icon: Apple },
  { href: "/app/pregnancy/body-map", label: "What's happening to me?", Icon: Baby },
  { href: "/app/pregnancy/body-systems", label: "Why do I feel this way?", Icon: HelpCircle },
  { href: "/app/pregnancy/appointments", label: "Appointments", Icon: CalendarClock },
  { href: "/app/pregnancy/contractions", label: "Contractions", Icon: Timer },
  { href: "/app/pregnancy/patterns", label: "My patterns", Icon: LineChart },
  { href: "/app/pregnancy/assistant", label: "Ask about my pregnancy", Icon: MessageCircleHeart },
  { href: "/app/pregnancy/birth-preparation", label: "Birth preparation", Icon: ClipboardList },
  { href: "/app/pregnancy/settings", label: "Settings", Icon: Settings },
];

export function PregnancyQuickLinks() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {LINKS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card px-3.5 py-3.5 transition-colors hover:border-primary/40"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium leading-snug text-foreground">{label}</span>
        </Link>
      ))}
    </div>
  );
}
