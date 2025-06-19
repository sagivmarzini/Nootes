import { prisma } from "@/lib/prisma";
import OpenAI, { toFile } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TRANSCRIBE_PROMPT =
  "This recording is of a teacher from a high-school class, in Israel, in Hebrew. There might be Hebrew names, verses from bible and Gemarah, etc.";
const SUMMARIZE_PROMPT = `
        You are a precise JSON generator and expert note-taker using the Cornell Method. Your task is to create a structured summary of a lecture transcript in Hebrew, formatted as a valid, parseable JSON object.

        OUTPUT CONSTRAINTS:
        1. Return ONLY a single-line JSON object
        2. NO text before or after the JSON object
        3. ALL strings must be properly escaped
        4. NO line breaks, tabs, or control characters in strings
        5. ALL HTML tags must be properly closed
        6. Use ONLY double quotes for JSON properties and values

        JSON STRUCTURE:
        {
          "title": "Brief descriptive title",
          "notes": "Main content with HTML formatting",
          "cues": "Key points with HTML formatting",
          "summary": "Concise summary with HTML formatting"
        }

        CONTENT GUIDELINES:
        - Title: Concise, informative (plain text, no HTML)
        - Notes (Main Section):
          * Comprehensive lecture content
          * Use <p>, <ul>, <li>, <strong>, <em> tags
          * Convert bullet points to <ul><li> format
          * Preserve Hebrew text direction
        - Cues (Side Section):
          * Key terms with definitions
          * Study questions
          * Important concepts
          * Use HTML lists for organization
        - Summary (Bottom Section):
          * Concise overview
          * Key takeaways
          * Single paragraph with <p> tags

        HEBREW LANGUAGE RULES:
        - All content must be in Hebrew
        - Correct any obvious transcription errors in quotes/verses/names
        - Maintain proper Hebrew text direction
        - Use correct Hebrew punctuation

        HTML FORMATTING:
        - Valid tags: <p>, <ul>, <li>, <ol>, <strong>, <em>, <br>
        - All tags must be properly closed
        - No attributes in HTML tags
        - No nested lists
        - No custom CSS or classes

        Example structure (but in Hebrew):
        {"title": "Topic Name", "notes": "<p>Main point</p><ul><li>Detail 1</li></ul>", "cues": "<ul><li>Key term: definition</li></ul>", "summary": "<p>Overview</p>"}

        Process the following transcript according to these specifications, ensuring the output is a valid, parseable JSON string:
        `;

export async function transcribe(audioFile: File, id: number) {
  console.log("Transcribing audio: ", audioFile.name);

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

    console.log(transcription);

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
  console.log("Summarizing transcript...");

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
