import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import params from "@/server-parameters.json";
import { deleteBlob, fetchBlobAsFile } from "./blob";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TRANSCRIBE_PROMPT = params.prompts.transcribe;
const SUMMARIZE_PROMPT = params.prompts.summarize;

export async function transcribe(
  recordingUrl: string,
  filename: string,
  id: number
) {
  try {
    const audioFile = await fetchBlobAsFile(recordingUrl, filename);

    await prisma.notebook.update({
      where: { id },
      data: { status: "transcribing" },
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
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

    deleteBlob(recordingUrl);
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
