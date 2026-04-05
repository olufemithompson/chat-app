import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SocketProvider from "@/contexts/SocketContext";
import ThemeSync from "@/components/ThemeSync";

// Server component: protects all routes inside (app)/
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <>
      <ThemeSync />
      <SocketProvider>{children}</SocketProvider>
    </>
  );
}
