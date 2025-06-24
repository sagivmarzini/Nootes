import { prisma } from "@/lib/prisma";
import params from "@/server-parameters.json";
import { User } from "@prisma/client";
import { summarize, transcribe } from "@/lib/openai";
import { deleteBlob, fetchBlobAsFile } from "@/lib/blob";

export async function handleRecording(
  recordingUrl: string,
  fileExtension: string,
  user: User,
  notebookId: number
) {
  await enforceLimits(user);

  const recording = await fetchBlobAsFile(
    recordingUrl,
    "recording." + fileExtension
  );

  processRecording(recording, notebookId, recordingUrl);

  return { id: notebookId };
}

async function enforceLimits(user: User) {
  const isAdmin =
    user.id === process.env.ADMIN_ID || user.email === process.env.ADMIN_EMAIL;
  if (!isAdmin && (await hitDailyLimit(user)))
    throw new Error("Daily limit reached. Come back tomorrow.");
}

async function processRecording(
  recording: File,
  notebookId: number,
  blobUrl: string
) {
  try {
    await prisma.notebook.update({
      where: { id: notebookId },
      data: { status: "transcribing" },
    });
    const transcription = await transcribe(recording);
    await prisma.notebook.update({
      where: { id: notebookId },
      data: {
        transcription: transcription,
        status: "summarizing",
      },
    });
    console.log("FINISHED TRANSCRIBING, DELETING BLOB...");
    deleteBlob(blobUrl);

    const summary = await summarize(transcription);
    await prisma.notebook.update({
      where: { id: notebookId },
      data: {
        status: "completed",
        summary,
      },
    });
  } catch (error) {
    console.error(error);
    await markNotebookFailed(notebookId);
  }
}

export async function markNotebookFailed(id: number) {
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
