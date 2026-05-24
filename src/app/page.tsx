import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Dashboard userName={session.user?.name || "User"} />
    </main>
  );
}
