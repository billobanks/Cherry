import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AssistantChatView } from "@/components/assistant/chat-view";
import { PremiumUpgradePrompt } from "@/components/subscription/premium-upgrade-prompt";
import { getAssistantConversation, getAssistantProvider, sendAssistantMessage } from "@/lib/assistant";
import { PREMIUM_FEATURE_KEYS } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "Ask Cherry",
};

export default async function AssistantPage() {
  const result = await getAssistantConversation();

  if (result.status === "signed_out") {
    redirect("/login");
  }

  if (result.status === "premium_required") {
    return <PremiumUpgradePrompt featureDescription={PREMIUM_FEATURE_KEYS.assistant} />;
  }

  if (result.status === "error") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[15px] text-muted-foreground">{result.message}</p>
      </div>
    );
  }

  return (
    <AssistantChatView
      initialMessages={result.messages}
      providerConfigured={getAssistantProvider() !== null}
      onSend={sendAssistantMessage}
    />
  );
}
