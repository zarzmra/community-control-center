import type { Metadata } from "next";
import { SettingsPage } from "@/modules/settings/SettingsPage";

export const metadata: Metadata = {
  title: "Configuración",
};

export default function Page() {
  return <SettingsPage />;
}
