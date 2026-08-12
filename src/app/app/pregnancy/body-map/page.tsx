import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BodyMapView } from "@/components/pregnancy/body-map-view";
import { getBodyMapContext } from "@/lib/pregnancy/body-map-actions";

export const metadata: Metadata = {
  title: "What is happening to my body? — Cherry",
};

export default async function BodyMapPage() {
  const result = await getBodyMapContext();

  if (result.status === "signed_out") {
    redirect("/login");
  }
  if (result.status === "no_active_pregnancy") {
    redirect("/app/pregnancy/activate");
  }

  return <BodyMapView gestationalAgeWeeks={result.gestationalAgeWeeks} />;
}
