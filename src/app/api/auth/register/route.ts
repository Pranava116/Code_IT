import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        workspacesOwned: {
          create: {
            name: "Personal Workspace",
          }
        }
      },
      include: {
        workspacesOwned: true
      }
    });

    if (user.workspacesOwned[0]) {
      await prisma.workspaceMember.create({
        data: {
          workspaceId: user.workspacesOwned[0].id,
          userId: user.id,
          role: "owner"
        }
      });
    }

    return NextResponse.json({ message: "User created" }, { status: 201 });
  } catch (error) {
    console.error("Registration Error", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
