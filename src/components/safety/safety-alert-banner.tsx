import { AlertTriangle, ShieldAlert } from "lucide-react";
import type { SafetyAlert } from "@/lib/safety";

const SEVERITY_STYLES: Record<
  SafetyAlert["severity"],
  { container: string; iconWrap: string; eyebrow: string; eyebrowText: string; Icon: typeof AlertTriangle }
> = {
  urgent: {
    container: "border-destructive/40 bg-destructive/10",
    iconWrap: "bg-destructive/15 text-destructive",
    eyebrow: "text-destructive",
    eyebrowText: "Seek timely care",
    Icon: AlertTriangle,
  },
  routine: {
    container: "border-amber-500/40 bg-amber-500/10",
    iconWrap: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    eyebrow: "text-amber-700 dark:text-amber-400",
    eyebrowText: "Worth a check-in",
    Icon: ShieldAlert,
  },
};

/**
 * Educational only — never a diagnosis. `alert.message` already carries the
 * hedged "can have several possible causes" framing plus a severity-driven
 * call-to-action; this component only handles presentation.
 */
export function SafetyAlertBanner({ alerts }: { alerts: SafetyAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {alerts.map((alert) => {
        const style = SEVERITY_STYLES[alert.severity];
        const Icon = style.Icon;
        return (
          <div
            key={alert.ruleKey}
            role="status"
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${style.container}`}
          >
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.iconWrap}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <span className={`text-xs font-semibold uppercase tracking-wide ${style.eyebrow}`}>
                {style.eyebrowText}
              </span>
              <p className="mt-1 text-[15px] leading-relaxed text-foreground">{alert.message}</p>
            </div>
          </div>
        );
      })}
      <p className="px-1 text-xs leading-relaxed text-muted-foreground">
        This is general information, not a diagnosis — a healthcare professional can evaluate your specific
        situation.
      </p>
    </div>
  );
}
