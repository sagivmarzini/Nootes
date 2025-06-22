"use server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import params from "@/server-parameters.json";
import { User } from "@prisma/client";
import { summarize, transcribe } from "@/lib/openai";

export async function uploadRecording(recording: File) {
  if (!recording || !(recording instanceof Blob))
    throw new Error("No file uploaded or invalid file type");

  const session = await getServerSession(authOptions);
  if (!session) throw new Error("You must be logged in to upload a recording");
  if (!session?.user?.email) throw new Error("No user email in session");

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email },
  });
  if (!user) throw new Error("Logged-in user not found");

  const isAdmin =
    user.id === process.env.ADMIN_ID || user.email === process.env.ADMIN_EMAIL;
  if (!isAdmin && (await hitDailyLimit(user)))
    throw new Error("Daily limit reached. Come back tomorrow.");

  const notebook = await prisma.notebook.create({
    data: { status: "pending", userId: user.id },
  });

  processRecording(recording, notebook.id);

  return { id: notebook.id };
}

async function processRecording(recording: File, id: number) {
  try {
    console.log("Transcribing file: " + recording.name);
    await transcribe(recording, id);
    console.log("Summarizing file: " + recording.name);
    await summarize(id);
  } catch (error) {
    console.error(error);
    await prisma.notebook.update({
      where: { id },
      data: {
        status: "failed",
      },
    });
  }
}

async function hitDailyLimit(user: User) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await prisma.notebook.count({
    where: {
      userId: user.id,
      createdAt: {
        gte: today,
      },
    },
  });

  if (count >= params.daily_limit) {
    return true;
  }

  return false;
}
