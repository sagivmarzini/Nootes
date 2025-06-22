import { Session } from "next-auth";
import { User } from "@prisma/client";
import { getServerSession } from "next-auth";
import { prisma } from "../lib/prisma";

const session = (params: { session: Session }) => {
  return params.session;
};

export const getUserSession = async (): Promise<User | null> => {
  const authUserSession = await getServerSession({ callbacks: { session } });

  if (!authUserSession?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: authUserSession.user.email },
  });

  return user;
};
