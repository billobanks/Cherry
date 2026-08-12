import { notFound } from "next/navigation";
import { LearnView } from "@/components/learn/learn-view";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function LearnPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <LearnView initialPhase="luteal" />;
}
