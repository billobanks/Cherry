"use client";

import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import type { PregnancyAssistantMessage, SendPregnancyAssistantMessageResult } from "@/lib/pregnancy/assistant";
import type { PregnancySafetyAlert } from "@/lib/pregnancy";
import { PregnancyMessageBubble } from "./pregnancy-message-bubble";
import { PregnancySafetyAlertBanner } from "./pregnancy-safety-alert-banner";
import { PregnancySuggestedQuestions } from "./pregnancy-suggested-questions";

export function PregnancyAssistantChatView({
  initialMessages,
  providerConfigured,
  onSend,
}: {
  initialMessages: PregnancyAssistantMessage[];
  providerConfigured: boolean;
  onSend: (message: string) => Promise<SendPregnancyAssistantMessageResult>;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [safetyAlerts, setSafetyAlerts] = useState<PregnancySafetyAlert[]>([]);
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
      if (result.status === "no_active_pregnancy") {
        toast.error("No active pregnancy found.");
        return;
      }
      if (result.status === "premium_required") {
        toast.error("The pregnancy assistant is a Premium feature.");
        return;
      }
      toast.error(result.message);
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <div className="px-5 pt-8 sm:px-8">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Pregnancy</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Ask about your pregnancy</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          General education, personalized with what you&apos;ve logged when it&apos;s relevant — never a diagnosis,
          and never a replacement for prenatal care.
        </p>
      </div>

      {!providerConfigured ? (
        <div className="mx-5 mt-6 rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground sm:mx-8">
          The assistant isn&apos;t set up yet — an admin needs to add an AI provider API key before it can reply.
        </div>
      ) : (
        <>
          <div className="mt-6 flex-1 px-5 sm:px-8">
            {messages.length === 0 ? (
              <PregnancySuggestedQuestions onSelect={handleSend} />
            ) : (
              <div className="flex flex-col gap-4 pb-4">
                {messages.map((message, index) => (
                  <PregnancyMessageBubble key={index} message={message} />
                ))}
                {safetyAlerts.length > 0 ? <PregnancySafetyAlertBanner alerts={safetyAlerts} /> : null}
                {isPending ? (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Thinking…
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
                placeholder="Ask about your pregnancy…"
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
              Educational only, not medical advice. If something feels urgent, contact your prenatal care provider.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
