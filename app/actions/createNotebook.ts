"use server";

import { prisma } from "@/lib/prisma";

export async function createNotebook() {
  const notebook = await prisma.notebook.create({
    data: { status: "pending" },
  });
  return notebook;
}
