import { User } from "@prisma/client";
import { getServerSession } from "next-auth";

const session = (params: any) => {
  return params.session;
};

export const getUserSession = async (): Promise<User> => {
  const authUserSession = await getServerSession({ callbacks: { session } });

  return authUserSession?.user;
};
