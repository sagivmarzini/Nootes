import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { summarize, transcribe } from "./utils/openai";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "No file uploaded or invalid file type" },
      { status: 400 }
    );
  }

  const notebook = await prisma.notebook.create({
    data: { status: "pending" },
  });
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
