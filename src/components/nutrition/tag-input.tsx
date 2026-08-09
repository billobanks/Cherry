"use client";

import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

export function TagInput({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && !values.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...values, trimmed]);
    }
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  function remove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-2">
        {values.map((value, i) => (
          <span
            key={value}
            className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-sm text-foreground"
          >
            {value}
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove ${value}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          aria-label={label}
          placeholder={values.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
