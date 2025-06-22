"use server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import params from "@/server-parameters.json";
import { User } from "@prisma/client";
import { summarize, transcribe } from "@/lib/openai";
import { put } from "@vercel/blob";
import { storeFileInBlobStorage } from "@/lib/blob";

// Supported audio formats by OpenAI Whisper
const SUPPORTED_FORMATS = ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit

export async function uploadRecording(recording: File) {
  validateRecording(recording);
  validateFileFormat(recording);

  const session = await getUserSession();
  const user = await getUserFromSession(session);

  await enforceLimits(user);

  const notebook = await createPendingNotebook(user.id);

  processRecording(recording, notebook.id);

  return { id: notebook.id };
}

function validateRecording(recording: File | Blob | null) {
  if (!recording || !(recording instanceof Blob))
    throw new Error("No file uploaded or invalid file type");

  if (recording.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large: ${(recording.size / 1024 / 1024).toFixed(
        2
      )}MB. Maximum size: 25MB`
    );
  }

  if (recording.size === 0) {
    throw new Error("File is empty or corrupted");
  }
}

async function getUserSession() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("You must be logged in to upload a recording");
  if (!session?.user?.email) throw new Error("No user email in session");
  return session;
}

async function getUserFromSession(session: any) {
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email },
  });
  if (!user) throw new Error("Logged-in user not found");
  return user;
}

async function enforceLimits(user: User) {
  const isAdmin =
    user.id === process.env.ADMIN_ID || user.email === process.env.ADMIN_EMAIL;
  if (!isAdmin && (await hitDailyLimit(user)))
    throw new Error("Daily limit reached. Come back tomorrow.");
}

async function createPendingNotebook(userId: string) {
  return prisma.notebook.create({
    data: { status: "pending", userId },
  });
}

async function processRecording(recording: File, notebookId: number) {
  try {
    const blob = await uploadFileToBlobStorage(recording, notebookId);
    await transcribe(blob.url, blob.pathname, notebookId);
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

async function uploadFileToBlobStorage(file: File, notebookId: number) {
  const extension = getFileExtension(file.name);
  const filename = notebookId + "." + extension;

  return storeFileInBlobStorage(file, filename);
}

function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}
function validateFileFormat(recording: File) {
  const extension = getFileExtension(recording.name);

  if (!SUPPORTED_FORMATS.includes(extension)) {
    throw new Error(
      `Unsupported audio format: ${extension}. Supported formats: ${SUPPORTED_FORMATS.join(
        ", "
      )}`
    );
  }
}
