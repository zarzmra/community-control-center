import type { Metadata } from "next";
import { AutomationsPage } from "@/modules/automations/AutomationsPage";

export const metadata: Metadata = {
  title: "Automatizaciones",
};

export default function Page() {
  return <AutomationsPage />;
}
