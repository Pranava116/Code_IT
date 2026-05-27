import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

async function buildNodePath(nodeId: string, projectId: string) {
  const nodes = await prisma.node.findMany({
    where: { projectId, deletedAt: null }
  });
  const nodeMap = new Map();
  nodes.forEach((n: any) => nodeMap.set(n.id, n));

  let current = nodeMap.get(nodeId);
  let parts = [];
  while (current) {
    parts.unshift(current.name);
    if (current.parentId) {
      current = nodeMap.get(current.parentId);
    } else {
      current = null;
    }
  }
  return path.join(...parts);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const nodes = await prisma.node.findMany({
    where: { projectId, deletedAt: null }
  });
  return NextResponse.json(nodes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, projectId, parentId, type } = await req.json();

  const node = await prisma.node.create({
    data: { name, projectId, parentId, type }
  });

  try {
    const fullPath = await buildNodePath(node.id, projectId);
    const workspaceDir = path.join(process.cwd(), ".workspaces", projectId);
    const targetPath = path.join(workspaceDir, fullPath);

    if (type === "folder") {
      fs.mkdirSync(targetPath, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, "");
    }
  } catch (error) {
    console.error("Failed to sync node to workspace:", error);
  }

  return NextResponse.json(node);
}
