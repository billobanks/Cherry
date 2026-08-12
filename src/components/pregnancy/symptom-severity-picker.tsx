"use client";

import type { PregnancySymptomKey, PregnancySymptomSeverity } from "@/types/database";

const SEVERITIES: PregnancySymptomSeverity[] = ["mild", "moderate", "severe"];

export function SymptomSeverityPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: PregnancySymptomKey; label: string }[];
  value: Partial<Record<PregnancySymptomKey, PregnancySymptomSeverity>>;
  onChange: (value: Partial<Record<PregnancySymptomKey, PregnancySymptomSeverity>>) => void;
}) {
  function toggle(key: PregnancySymptomKey) {
    const next = { ...value };
    if (next[key]) {
      delete next[key];
    } else {
      next[key] = "mild";
    }
    onChange(next);
  }

  function setSeverity(key: PregnancySymptomKey, severity: PregnancySymptomSeverity) {
    onChange({ ...value, [key]: severity });
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <div className="mt-2 flex flex-col gap-2">
        {options.map((option) => {
          const selected = value[option.key];
          return (
            <div
              key={option.key}
              className={`rounded-2xl border px-3.5 py-2.5 transition-colors ${
                selected ? "border-primary bg-accent/40" : "border-border bg-card"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(option.key)}
                aria-pressed={Boolean(selected)}
                className="flex w-full items-center justify-between gap-2 text-left text-[15px] font-medium text-foreground"
              >
                {option.label}
                <span className={`text-xs font-normal ${selected ? "text-primary" : "text-muted-foreground"}`}>
                  {selected ? "Logged" : "Tap to log"}
                </span>
              </button>
              {selected ? (
                <div className="mt-2 flex gap-1.5" role="group" aria-label={`${option.label} severity`}>
                  {SEVERITIES.map((severity) => (
                    <button
                      key={severity}
                      type="button"
                      onClick={() => setSeverity(option.key, severity)}
                      aria-pressed={value[option.key] === severity}
                      className={`flex-1 rounded-full border px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                        value[option.key] === severity
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {severity}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
