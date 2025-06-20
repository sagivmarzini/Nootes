import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { summarize, transcribe } from "./utils/openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const session = await getServerSession(authOptions);
  let notebook;

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "No file uploaded or invalid file type" },
      { status: 400 }
    );
  }

  if (session) {
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! },
    });

    notebook = await prisma.notebook.create({
      data: { status: "pending", userId: user?.id },
    });
  } else {
    notebook = await prisma.notebook.create({
      data: { status: "pending" },
    });
  }

  processRecording(file, notebook.id);

  return NextResponse.json({ id: notebook.id, status: notebook.status });
}

async function processRecording(recording: File, id: number) {
  try {
    await transcribe(recording, id);
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
