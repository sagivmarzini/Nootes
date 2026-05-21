// app/api/notebook/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notebook = await prisma.notebook.findUnique({ where: { id: params.id } });
  if (!notebook || !notebook.userId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (notebook.userId !== user?.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(notebook);
}
