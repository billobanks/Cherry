export function PatternEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm leading-relaxed text-muted-foreground">
      {message}
    </div>
  );
}
