import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export default async function HistoryPage({ params }: { params: Promise<{ nodeId: string }> }) {
  const { nodeId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const versions = await prisma.documentVersion.findMany({
    where: { nodeId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <header className="top-nav">
          <div style={{ fontWeight: 600 }}>Version History</div>
          <div>
            <Link href={`/editor/${nodeId}`} style={{ color: "var(--accent)" }}>
              Back to Editor
            </Link>
          </div>
        </header>
        <div style={{ padding: "2rem", flex: 1, overflowY: "auto" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h2>History for Document: {nodeId}</h2>
            <ul style={{ listStyle: "none", marginTop: "2rem" }}>
              {versions.length === 0 && <p style={{ color: "var(--text-secondary)" }}>No history available yet.</p>}
              {versions.map((v: any, index: number) => (
                <li key={v.id} style={{ padding: "1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>Version {versions.length - index}</strong>
                    <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      {new Date(v.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <button className="btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", background: "var(--bg-hover)", color: "var(--text-primary)" }}>
                      Restore
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
