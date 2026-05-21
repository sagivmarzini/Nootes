"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createNotebook() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthenticated");

  const notebook = await prisma.notebook.create({
    data: { status: "pending" },
  });
  return notebook;
}
