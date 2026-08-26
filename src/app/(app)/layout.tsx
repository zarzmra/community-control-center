import { AppShell } from "@/components/layout/AppShell";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <AppShell user={session.user}>{children}</AppShell>;
}
