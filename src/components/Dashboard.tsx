"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export default function Dashboard({ userName }: { userName: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
        }
        setLoading(false);
      });
  }, []);

  const handleCreateProject = async () => {
    const name = prompt("Enter project name:");
    if (!name) return;

    const res = await fetch("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      const newProject = await res.json();
      router.push(`/project/${newProject.id}`);
    }
  };

  const handleJoinProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      router.push(`/project/${joinCode.trim()}`);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "2rem", color: "var(--text-primary)" }}>Projects Dashboard</h1>
          <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 0 0" }}>Welcome back, {userName}</p>
        </div>
        <button onClick={() => signOut()} style={{ background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}>Sign Out</button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        
        {/* Create / Join Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <h2 style={{ marginTop: 0, fontSize: "1.25rem", color: "var(--text-primary)" }}>New Project</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Create a new workspace for your code.</p>
            <button onClick={handleCreateProject} className="btn-primary" style={{ width: "100%", padding: "0.75rem", fontSize: "1rem" }}>
              + Create New Project
            </button>
          </div>

          <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <h2 style={{ marginTop: 0, fontSize: "1.25rem", color: "var(--text-primary)" }}>Join Project</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Enter a project code to collaborate.</p>
            <form onSubmit={handleJoinProject} style={{ display: "flex", gap: "0.5rem" }}>
              <input 
                type="text" 
                placeholder="Project Code (e.g., clq...)" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                style={{ flex: 1, padding: "0.75rem", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
              />
              <button type="submit" className="btn-primary" style={{ padding: "0.75rem 1.5rem" }}>Join</button>
            </form>
          </div>
        </div>

        {/* Recent Projects List */}
        <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
          <h2 style={{ marginTop: 0, fontSize: "1.25rem", color: "var(--text-primary)" }}>Your Projects</h2>
          
          <div style={{ marginTop: "1rem", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {loading ? (
              <p style={{ color: "var(--text-secondary)", textAlign: "center" }}>Loading...</p>
            ) : projects.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", textAlign: "center", marginTop: "2rem" }}>No projects found. Create one to get started!</p>
            ) : (
              projects.map(project => (
                <div key={project.id} onClick={() => router.push(`/project/${project.id}`)} style={{ padding: "1rem", background: "var(--bg-primary)", borderRadius: "6px", border: "1px solid var(--border)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "border-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{project.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Code: <span style={{ fontFamily: "monospace", background: "var(--bg-secondary)", padding: "2px 4px", borderRadius: "3px" }}>{project.id}</span></div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
