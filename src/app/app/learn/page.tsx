import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LearnView } from "@/components/learn/learn-view";
import { getLearnContext } from "@/lib/learn/actions";

export const metadata: Metadata = {
  title: "Learn — Cherry",
};

export default async function LearnPage() {
  const result = await getLearnContext();

  if (result.status === "signed_out") {
    redirect("/login");
  }

  return <LearnView initialPhase={result.currentPhase} />;
}
