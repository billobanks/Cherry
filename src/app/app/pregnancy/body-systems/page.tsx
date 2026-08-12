import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BodySystemView } from "@/components/pregnancy/body-system-view";
import { getBodyMapContext } from "@/lib/pregnancy/body-map-actions";

export const metadata: Metadata = {
  title: "Why am I feeling this way? — Cherry",
};

export default async function BodySystemsPage() {
  const result = await getBodyMapContext();

  if (result.status === "signed_out") {
    redirect("/login");
  }
  if (result.status === "no_active_pregnancy") {
    redirect("/app/pregnancy/activate");
  }

  return <BodySystemView gestationalAgeWeeks={result.gestationalAgeWeeks} trimester={result.trimester} />;
}
