const SUGGESTED_QUESTIONS = [
  "I'm exhausted lately — why?",
  "Why do I feel bloated?",
  "Why am I suddenly constipated?",
  "What should I eat today?",
  "What should I ask at my next appointment?",
  "When should I start preparing my hospital bag?",
];

export function PregnancySuggestedQuestions({ onSelect }: { onSelect: (question: string) => void }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-sm font-medium text-muted-foreground">Try asking</span>
      {SUGGESTED_QUESTIONS.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => onSelect(question)}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-left text-[15px] text-foreground transition-colors hover:border-primary/40"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
