import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

async function getOrCreateWorkspace(userId: string) {
  let workspace = await prisma.workspace.findFirst({
    where: { ownerId: userId }
  });
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: { name: "Personal Workspace", ownerId: userId }
    });
  }
  return workspace;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getOrCreateWorkspace(session.user.id);

  const projects = await prisma.project.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  const workspace = await getOrCreateWorkspace(session.user.id);

  const project = await prisma.project.create({
    data: { 
      name: name || "Untitled Project", 
      workspaceId: workspace.id 
    }
  });
  return NextResponse.json(project);
}
