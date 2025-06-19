import { prisma } from "@/lib/prisma";
import OpenAI, { toFile } from "openai";
import { readFileSync } from "fs";
import { join } from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TRANSCRIBE_PROMPT =
  "This recording is of a teacher from a high-school class, in Israel, in Hebrew. There might be Hebrew and foreign names, verses from bible and Talmud, etc.";
const SUMMARIZE_PROMPT = readFileSync("./prompts/summarize.txt", "utf8");

export async function transcribe(audioFile: File, id: number) {
  try {
    await prisma.notebook.update({
      where: { id },
      data: { status: "transcribing" },
    });

    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(audioFile, "audio.wav", {
        type: "audio/wav",
      }),
      model: "whisper-1",
      language: "he",
      prompt: TRANSCRIBE_PROMPT,
    });

    await prisma.notebook.update({
      where: { id },
      data: {
        transcription: transcription.text,
        status: "summarizing",
      },
    });
  } catch (error) {
    console.error("Error during transcription:", error);
    throw error;
  }
}

export async function summarize(audioFile: File, id: number) {
  try {
    const transcription = (
      await prisma.notebook.findUnique({
        where: { id },
      })
    )?.transcription;
    if (!transcription) {
      throw new Error("No transcription found");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano-2025-04-14",
      messages: [
        {
          role: "system",
          content: SUMMARIZE_PROMPT,
        },
        {
          role: "user",
          content: "THIS IS THE TRANSCRIPTION:" + transcription,
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
      data: { status: "completed", summary },
    });
  } catch (error) {
    await prisma.notebook.update({
      where: { id },
      data: { status: "failed" },
    });
    console.error("Error during summarization:", error);
  }
}
