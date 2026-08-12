"use client";

import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { SafetyAlertBanner } from "@/components/safety/safety-alert-banner";
import { Textarea } from "@/components/ui/textarea";
import type { AssistantMessage, SendAssistantMessageResult } from "@/lib/assistant";
import type { SafetyAlert } from "@/lib/safety";
import { MessageBubble } from "./message-bubble";
import { SuggestedQuestions } from "./suggested-questions";

export function AssistantChatView({
  initialMessages,
  providerConfigured,
  onSend,
}: {
  initialMessages: AssistantMessage[];
  providerConfigured: boolean;
  onSend: (message: string) => Promise<SendAssistantMessageResult>;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  function handleSend(text?: string) {
    const message = (text ?? input).trim();
    if (!message || isPending) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);

    startTransition(async () => {
      const result = await onSend(message);
      if (result.status === "ready") {
        setMessages((prev) => [...prev, result.reply]);
        setSafetyAlerts(result.safetyAlerts);
        return;
      }
      if (result.status === "not_configured") {
        toast.error("The assistant isn't set up yet.");
        return;
      }
      if (result.status === "signed_out") {
        toast.error("Please sign in again.");
        return;
      }
      if (result.status === "premium_required") {
        toast.error("The AI assistant is a Premium feature.");
        return;
      }
      toast.error(result.message);
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <div className="px-5 pt-8 sm:px-8">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Cherry</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Ask Cherry</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          General education and wellness guidance, personalized with what you&apos;ve logged when it&apos;s
          relevant — never a diagnosis, and never a replacement for professional care.
        </p>
      </div>

      {!providerConfigured ? (
        <div className="mx-5 mt-6 rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground sm:mx-8">
          The assistant isn&apos;t set up yet — an admin needs to add an AI provider API key before Cherry can
          reply.
        </div>
      ) : (
        <>
          <div className="mt-6 flex-1 px-5 sm:px-8">
            {messages.length === 0 ? (
              <SuggestedQuestions onSelect={handleSend} />
            ) : (
              <div className="flex flex-col gap-4 pb-4">
                {messages.map((message, index) => (
                  <MessageBubble key={index} message={message} />
                ))}
                {safetyAlerts.length > 0 ? <SafetyAlertBanner alerts={safetyAlerts} /> : null}
                {isPending ? (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Cherry is thinking…
                    </div>
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="sticky bottom-0 border-t border-border/60 bg-background/85 px-5 py-4 backdrop-blur sm:px-8">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Cherry something…"
                rows={1}
                className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={isPending || !input.trim()}
                aria-label="Send"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-50"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </div>
            <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
              Educational only, not medical advice. If something feels urgent, contact a healthcare
              professional.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
