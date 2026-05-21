"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createNotebook() {
  let email: string | null | undefined;

  if (process.env.NODE_ENV === "development") {
    email = process.env.NEXT_PUBLIC_DEV_USER_EMAIL;
  } else {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new Error("Unauthenticated");
    email = session.user.email;
  }

  if (!email) throw new Error("Unauthenticated");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  const notebook = await prisma.notebook.create({
    data: { status: "pending", userId: user.id },
  });
  return notebook;
}
