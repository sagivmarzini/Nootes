import { prisma } from "@/lib/prisma";
import params from "@/server-parameters.json";
import { User } from "@prisma/client";
import { summarize, transcribe } from "@/lib/openai";
import { fetchBlobAsFile } from "@/lib/blob";

export async function handleRecording(
  recordingUrl: string,
  recordingName: string,
  userEmail: string,
  notebookId: number
) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) throw new Error(`No user with the email ${userEmail} found`);

  await enforceLimits(user);

  const recording = await fetchBlobAsFile(recordingUrl, recordingName);

  setTimeout(() => {
    processRecording(recording, notebookId);
  }, 0);

  return { id: notebookId };
}

async function enforceLimits(user: User) {
  const isAdmin =
    user.id === process.env.ADMIN_ID || user.email === process.env.ADMIN_EMAIL;
  if (!isAdmin && (await hitDailyLimit(user)))
    throw new Error("Daily limit reached. Come back tomorrow.");
}

async function processRecording(recording: File, notebookId: number) {
  try {
    // TODO: Fix OpenAI function responsibilities to only return result
    await transcribe(recording, notebookId);
    await summarize(notebookId);
  } catch (error) {
    console.error(error);
    await markNotebookFailed(notebookId);
  }
}

async function markNotebookFailed(id: number) {
  await prisma.notebook.update({
    where: { id },
    data: {
      status: "failed",
    },
  });
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

  return count >= params.daily_limit;
}
