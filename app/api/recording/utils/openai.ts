import { prisma } from "@/lib/prisma";
import OpenAI, { toFile } from "openai";
import { readFileSync } from "fs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TRANSCRIBE_PROMPT =
  "This recording is of a teacher from a high-school class, in Israel, in Hebrew. There might be Hebrew and foreign names, verses from bible and Talmud, etc.";
const SUMMARIZE_PROMPT = readFileSync("./prompts/summarize.txt", "utf8");

// Supported audio formats by OpenAI Whisper
const SUPPORTED_FORMATS = ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit

function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

function validateAudioFile(file: File): void {
  const extension = getFileExtension(file.name);

  if (!SUPPORTED_FORMATS.includes(extension)) {
    throw new Error(
      `Unsupported audio format: ${extension}. Supported formats: ${SUPPORTED_FORMATS.join(
        ", "
      )}`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large: ${(file.size / 1024 / 1024).toFixed(
        2
      )}MB. Maximum size: 25MB`
    );
  }

  if (file.size === 0) {
    throw new Error("File is empty or corrupted");
  }
}

export async function transcribe(audioFile: File, id: number) {
  try {
    // Validate the audio file first
    validateAudioFile(audioFile);

    await prisma.notebook.update({
      where: { id },
      data: { status: "transcribing" },
    });

    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(audioFile, audioFile.name),
      model: "whisper-1",
      language: "he",
      prompt: TRANSCRIBE_PROMPT,
      response_format: "text",
    });

    await prisma.notebook.update({
      where: { id },
      data: {
        transcription: transcription,
        status: "summarizing",
      },
    });
  } catch (error) {
    console.error(`Transcription failed for ID: ${id}`, error);

    // Re-throw with more specific error information
    if (error instanceof Error) {
      throw new Error(`Transcription failed: ${error.message}`);
    } else {
      throw new Error(`Transcription failed: ${String(error)}`);
    }
  }
}

export async function summarize(id: number) {
  try {
    const notebook = await prisma.notebook.findUnique({
      where: { id },
    });

    if (!notebook?.transcription) {
      throw new Error("No transcription found");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: SUMMARIZE_PROMPT,
        },
        {
          role: "user",
          content: "THIS IS THE TRANSCRIPTION: " + notebook.transcription,
        },
      ],
      stream: false,
      response_format: { type: "json_object" },
    });

    const summary = response.choices[0].message.content;
    if (!summary) {
      throw new Error("Failed to get ChatGPT content");
    }

    await prisma.notebook.update({
      where: { id },
      data: {
        status: "completed",
        summary,
      },
    });
  } catch (error) {
    console.error(`Summarization failed for ID: ${id}:`, error);

    throw error;
  }
}

// Helper function to check audio file before processing
export async function validateAndProcessAudio(
  audioFile: File
): Promise<{ isValid: boolean; error?: string }> {
  try {
    validateAudioFile(audioFile);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
