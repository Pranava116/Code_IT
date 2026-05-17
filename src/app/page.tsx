import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <header className="top-nav">
          <div style={{ fontWeight: 600 }}>Code It</div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ cursor: "pointer", position: "relative" }}>
              🔔 <span style={{ position: "absolute", top: -5, right: -5, background: "var(--danger)", color: "white", borderRadius: "50%", width: 14, height: 14, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>1</span>
            </span>
            <span>Logged in as {session.user?.name}</span>
          </div>
        </header>
        <div className="editor-container">
          <div style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "20vh" }}>
            <h2>Welcome to Code It!</h2>
            <p>Select a file from the sidebar to start editing.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
