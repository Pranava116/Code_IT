import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

export default async function EditorPage({ params }: { params: Promise<{ nodeId: string }> }) {
  const { nodeId } = await params;
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
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", display: "flex", gap: "1rem", alignItems: "center" }}>
            <a href={`/editor/${nodeId}/history`} style={{ color: "var(--accent)", textDecoration: "none" }}>Version History</a>
            <span>Logged in as {session.user?.name}</span>
          </div>
        </header>
        <div style={{ padding: "2rem", flex: 1, overflowY: "auto" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h1 style={{ marginBottom: "1rem" }}>Editing File: {nodeId}</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
              Changes are synced in real-time. Share the URL to collaborate!
            </p>
            <Editor documentId={nodeId} userName={session.user?.name || "Anonymous"} />
          </div>
        </div>
      </main>
    </div>
  );
}
