// app/api/notebook/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;

  const id = parseInt(params.id);
  const notebook = await prisma.notebook.findUnique({ where: { id } });
  if (!notebook)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(notebook);
}
