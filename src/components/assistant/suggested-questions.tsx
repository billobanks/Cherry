const SUGGESTED_QUESTIONS = [
  "Why am I so tired today?",
  "Why am I craving sweets?",
  "Is bloating common during this part of my cycle?",
  "What exercise could I do today?",
  "What foods might be good today?",
];

export function SuggestedQuestions({ onSelect }: { onSelect: (question: string) => void }) {
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
