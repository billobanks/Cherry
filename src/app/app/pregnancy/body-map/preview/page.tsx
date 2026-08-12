import { notFound } from "next/navigation";
import { BodyMapView } from "@/components/pregnancy/body-map-view";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function BodyMapPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <BodyMapView gestationalAgeWeeks={24} />;
}
