import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountView } from "@/components/settings/account-view";
import { getAccount, updateDisplayName } from "@/lib/account/actions";

export const metadata: Metadata = {
  title: "Account — Cherry",
};

export default async function AccountSettingsPage() {
  const result = await getAccount();

  if (result.status === "signed_out") {
    redirect("/login");
  }

  return <AccountView account={result.account} onUpdateDisplayName={updateDisplayName} />;
}
