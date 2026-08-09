"use client";

type ChipOption<T extends string> = { value: T; label: string; emoji?: string };

type ChipSelectProps<T extends string> = {
  label: string;
  options: ChipOption<T>[];
} & (
  | { multi: true; value: T[]; onChange: (value: T[]) => void }
  | { multi: false; value: T | null; onChange: (value: T) => void }
);

export function ChipSelect<T extends string>(props: ChipSelectProps<T>) {
  const { label, options, multi } = props;

  function isSelected(value: T): boolean {
    return multi ? props.value.includes(value) : props.value === value;
  }

  function handleClick(value: T) {
    if (multi) {
      const current = props.value;
      props.onChange(
        current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      );
    } else {
      props.onChange(value);
    }
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = isSelected(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => handleClick(option.value)}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              {option.emoji ? <span aria-hidden>{option.emoji}</span> : null}
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
