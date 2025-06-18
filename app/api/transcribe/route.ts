import { NextResponse } from "next/server";
import { transcribe } from "./transcribe";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No file uploaded or invalid file type" },
        { status: 400 }
      );
    }

    const transcription = await transcribe(file as File);

    return NextResponse.json({ transcription });
  } catch (err) {
    console.error("Error in /api/transcribe:", err);
    return NextResponse.json({ error: "Something exploded" }, { status: 500 });
  }
}
