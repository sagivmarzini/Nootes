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
  console.log(`handleRecording started for notebook ${notebookId}`);

  try {
    await enforceLimits(user);

    const recording = await fetchBlobAsFile(
      recordingUrl,
      "recording." + fileExtension
    );

    console.log(`Fetched blob file, size: ${recording.size} bytes`);

    // IMPORTANT: Await the processing
    await processRecording(recording, notebookId, recordingUrl);

    console.log(
      `handleRecording completed successfully for notebook ${notebookId}`
    );
    return { id: notebookId };
  } catch (error) {
    console.error(`handleRecording failed for notebook ${notebookId}:`, error);
    await markNotebookFailed(notebookId);
    throw error; // Re-throw to propagate error
  }
}

async function enforceLimits(user: User) {
  const isAdmin =
    user.id === process.env.ADMIN_ID || user.email === process.env.ADMIN_EMAIL;
  if (!isAdmin && (await hitDailyLimit(user))) {
    throw new Error("Daily limit reached. Come back tomorrow.");
  }
}

async function processRecording(
  recording: File,
  notebookId: number,
  blobUrl: string
) {
  console.log(`processRecording started for notebook ${notebookId}`);

  try {
    // Set status to transcribing
    await prisma.notebook.update({
      where: { id: notebookId },
      data: { status: "transcribing" },
    });

    console.log(`Starting transcription for notebook ${notebookId}`);
    const transcriptionStart = Date.now();

    const transcription = await transcribe(recording);

    const transcriptionTime = Date.now() - transcriptionStart;
    console.log(
      `Transcription completed for notebook ${notebookId} in ${transcriptionTime}ms`
    );

    if (!transcription || transcription.trim().length === 0) {
      throw new Error("Transcription returned empty result");
    }

    await prisma.notebook.update({
      where: { id: notebookId },
      data: {
        transcription: transcription,
        status: "summarizing",
      },
    });

    console.log(`Starting blob deletion for notebook ${notebookId}`);
    try {
      await deleteBlob(blobUrl);
      console.log(`Blob deleted successfully for notebook ${notebookId}`);
    } catch (deleteError) {
      // Don't fail the whole process if blob deletion fails
      console.warn(
        `Failed to delete blob for notebook ${notebookId}:`,
        deleteError
      );
    }

    console.log(`Starting summarization for notebook ${notebookId}`);
    const summaryStart = Date.now();

    const summary = await summarize(transcription);

    const summaryTime = Date.now() - summaryStart;
    console.log(
      `Summarization completed for notebook ${notebookId} in ${summaryTime}ms`
    );

    await prisma.notebook.update({
      where: { id: notebookId },
      data: {
        status: "completed",
        summary,
      },
    });

    console.log(
      `processRecording completed successfully for notebook ${notebookId}`
    );
  } catch (error) {
    console.error(`processRecording failed for notebook ${notebookId}:`, error);
    await markNotebookFailed(notebookId);
    throw error; // Re-throw to propagate error
  }
}

export async function markNotebookFailed(id: number) {
  try {
    console.log(`Marking notebook ${id} as failed`);
    await prisma.notebook.update({
      where: { id },
      data: {
        status: "failed",
        // Optionally store error message
        // errorMessage: error?.message || "Unknown error"
      },
    });
    console.log(`Notebook ${id} marked as failed`);
  } catch (error) {
    console.error(`Failed to mark notebook ${id} as failed:`, error);
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

  return count >= params.daily_limit;
}
