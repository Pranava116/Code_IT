import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditorWrapper from "@/components/EditorWrapper";
import Sidebar from "@/components/Sidebar";
import TerminalWrapper from "@/components/TerminalWrapper";

export default async function EditorPage({ params }: { params: Promise<{ nodeId: string }> }) {
  const { nodeId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const node = await prisma.node.findUnique({
    where: { id: nodeId },
    select: { projectId: true }
  });

  if (!node) {
    redirect("/"); // or some 404
  }

  
  return (
    <div className="app-shell">
      <Sidebar projectId={node.projectId} />
      <main className="main-content">
        <header className="top-nav">
          <div style={{ fontWeight: 600 }}>Code It</div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", display: "flex", gap: "1rem", alignItems: "center" }}>
            <a href={`/editor/${nodeId}/history`} style={{ color: "var(--accent)", textDecoration: "none" }}>Version History</a>
            <span>Logged in as {session.user?.name}</span>
          </div>
        </header>
        <div style={{ padding: "2rem", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", gap: "1rem" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Editing File: {nodeId}</h1>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Changes are synced in real-time</span>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <EditorWrapper documentId={nodeId} userName={session.user?.name || "Anonymous"} />
            </div>
          </div>
          
          <div style={{ height: "30%", minHeight: "200px", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
            <TerminalWrapper projectId={node.projectId} />
          </div>
        </div>
      </main>
    </div>
  );
}
