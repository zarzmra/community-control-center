import type { Metadata } from "next";
import { CommunityDetailPage } from "@/modules/communities/CommunityDetailPage";

export const metadata: Metadata = {
  title: "Detalle de Comunidad",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CommunityDetailPage id={id} />;
}
