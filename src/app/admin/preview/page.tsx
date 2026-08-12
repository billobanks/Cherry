import { notFound } from "next/navigation";
import { AdminHubView } from "@/components/admin/admin-hub-view";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function AdminPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <AdminHubView />;
}
