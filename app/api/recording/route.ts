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
  await transcribe(recording, id);
  summarize(recording, id);
}
