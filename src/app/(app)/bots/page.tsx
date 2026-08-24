import type { Metadata } from "next";
import { BotsPage } from "@/modules/bots/BotsPage";

export const metadata: Metadata = {
  title: "Bots",
};

export default function Page() {
  return <BotsPage />;
}
