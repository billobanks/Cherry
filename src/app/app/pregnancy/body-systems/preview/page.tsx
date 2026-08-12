import { notFound } from "next/navigation";
import { BodySystemView } from "@/components/pregnancy/body-system-view";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function BodySystemsPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <BodySystemView gestationalAgeWeeks={24} trimester="second" />;
}
