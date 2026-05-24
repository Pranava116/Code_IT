"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Node {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  projectId: string;
}

interface SidebarProps {
  projectId: string;
}

export default function Sidebar({ projectId }: SidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [nodes, setNodes] = useState<Node[]>([]);

  useEffect(() => {
    if (!projectId) return;
    const fetchTree = async () => {
      const nodesRes = await fetch(`/api/nodes?projectId=${projectId}`);
      if (nodesRes.ok) {
        const data = await nodesRes.json();
        setNodes(data);
      }
    };
    fetchTree();
  }, [projectId]);

  const createNode = async (parentId: string | null, type: "file" | "folder") => {
    if (!projectId) return;
    const name = prompt(`Enter ${type} name:`);
    if (!name) return;
    
    const res = await fetch("/api/nodes", {
      method: "POST",
      body: JSON.stringify({ name, projectId, parentId, type }),
      headers: { "Content-Type": "application/json" }
    });
    
    if (res.ok) {
      const newNode = await res.json();
      setNodes([...nodes, newNode]);
      if (type === "file") {
        router.push(`/project/${projectId}?file=${newNode.id}`);
      }
    }
  };

  const buildTree = (parentId: string | null) => {
    return nodes
      .filter(n => n.parentId === parentId)
      .map(n => (
        <div key={n.id} style={{ marginLeft: parentId ? "15px" : "0px", marginTop: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {n.type === "folder" ? (
              <span style={{ fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                {n.name}
              </span>
            ) : (
              <Link href={`/project/${projectId}?file=${n.id}`} style={{ color: "var(--text-secondary)", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                {n.name}
              </Link>
            )}
            
            {n.type === "folder" && (
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => createNode(n.id, "file")} title="New File" style={btnStyle}>📄</button>
                <button onClick={() => createNode(n.id, "folder")} title="New Folder" style={btnStyle}>📂</button>
              </div>
            )}
          </div>
          {n.type === "folder" && buildTree(n.id)}
        </div>
      ));
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ paddingBottom: "0" }}>
        EXPLORER
      </div>
      <div className="sidebar-content" style={{ paddingTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "1px" }}>
          <div>PROJECT FILES</div>
          <div style={{ display: "flex", gap: "8px" }}>
             <button onClick={() => createNode(null, "file")} title="New File at Root" style={btnStyle}>📄</button>
             <button onClick={() => createNode(null, "folder")} title="New Folder at Root" style={btnStyle}>📂</button>
          </div>
        </div>
        
        <div style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
          {buildTree(null)}
        </div>
      </div>
      <div style={{ padding: "1rem", borderTop: "1px solid var(--border)" }}>
        <Link href="/" style={{ display: "block", textAlign: "center", textDecoration: "none", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
          Back to Dashboard
        </Link>
      </div>
    </aside>
  );
}

const btnStyle = {
  background: "transparent",
  border: "none",
  color: "var(--text-secondary)",
  cursor: "pointer",
  fontSize: "0.9rem",
  padding: "0"
};
