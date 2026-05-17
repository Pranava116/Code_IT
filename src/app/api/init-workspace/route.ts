import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  let workspace = await prisma.workspace.findFirst({
    where: { ownerId: userId }
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: { name: "Personal Workspace", ownerId: userId }
    });
  }

  let project = await prisma.project.findFirst({
    where: { workspaceId: workspace.id }
  });

  if (!project) {
    project = await prisma.project.create({
      data: { name: "Default Project", workspaceId: workspace.id }
    });
  }

  return NextResponse.json(project);
}
