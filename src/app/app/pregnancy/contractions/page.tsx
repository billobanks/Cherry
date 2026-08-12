import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ContractionTrackerView } from "@/components/pregnancy/contraction-tracker-view";
import { deleteContraction, endContraction, getRecentContractions, startContraction } from "@/lib/pregnancy/contraction-actions";
import { logDelivery } from "@/lib/pregnancy/delivery-actions";

export const metadata: Metadata = {
  title: "Contractions — Cherry",
};

export default async function ContractionsPage() {
  const result = await getRecentContractions();

  if (result.status === "signed_out") {
    redirect("/login");
  }
  if (result.status === "no_active_pregnancy") {
    redirect("/app/pregnancy/activate");
  }
  if (result.status === "error") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[15px] text-muted-foreground">{result.message}</p>
      </div>
    );
  }

  const activeContraction = result.contractions.find((c) => c.durationSeconds === null);

  return (
    <ContractionTrackerView
      contractions={result.contractions}
      activeContractionId={activeContraction?.id ?? null}
      onStart={startContraction}
      onEnd={endContraction}
      onDelete={deleteContraction}
      onLogDelivery={logDelivery}
    />
  );
}
