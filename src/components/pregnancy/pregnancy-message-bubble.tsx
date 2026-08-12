import type { PregnancyAssistantMessage } from "@/lib/pregnancy/assistant";

export function PregnancyMessageBubble({ message }: { message: PregnancyAssistantMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
          isUser ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
