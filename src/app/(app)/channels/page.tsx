import type { Metadata } from "next";
import { ChannelsPage } from "@/modules/channels/ChannelsPage";

export const metadata: Metadata = {
  title: "Canales",
};

export default function Page() {
  return <ChannelsPage />;
}
