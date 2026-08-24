import type { Metadata } from "next";
import { CommunitiesPage } from "@/modules/communities/CommunitiesPage";

export const metadata: Metadata = {
  title: "Comunidades",
};

export default function Page() {
  return <CommunitiesPage />;
}
