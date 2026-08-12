import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PregnancyAssistantChatView } from "@/components/pregnancy/pregnancy-assistant-chat-view";
import { PremiumUpgradePrompt } from "@/components/subscription/premium-upgrade-prompt";
import { getPregnancyAssistantConversation, sendPregnancyAssistantMessage } from "@/lib/pregnancy/assistant";
import { getAssistantProvider } from "@/lib/assistant";
import { PREMIUM_FEATURE_KEYS } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "Ask about your pregnancy — Cherry",
};

export default async function PregnancyAssistantPage() {
  const result = await getPregnancyAssistantConversation();

  if (result.status === "signed_out") {
    redirect("/login");
  }
  if (result.status === "no_active_pregnancy") {
    redirect("/app/pregnancy/activate");
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
    <PregnancyAssistantChatView
      initialMessages={result.messages}
      providerConfigured={getAssistantProvider() !== null}
      onSend={sendPregnancyAssistantMessage}
    />
  );
}
