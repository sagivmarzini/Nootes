import OpenAI from "openai";
import params from "@/server-parameters.json";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TRANSCRIBE_PROMPT = params.prompts.transcribe;
const SUMMARIZE_PROMPT = params.prompts.summarize;

export async function transcribe(recording: File) {
  try {
    return await openai.audio.transcriptions.create({
      file: recording,
      model: "whisper-1",
      language: "he",
      prompt: TRANSCRIBE_PROMPT,
      response_format: "text",
    });
  } catch (error) {
    console.error(`Transcription failed for: ${recording.name}`, error);

    if (error instanceof Error) {
      throw new Error(`Transcription failed: ${error.message}`);
    } else {
      throw new Error(`Transcription failed: ${String(error)}`);
    }
  }
}

export async function summarize(transcription: string) {
  try {
    if (!transcription) {
      throw new Error("No transcription given");
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
          content: "THIS IS THE TRANSCRIPTION: " + transcription,
        },
      ],
      stream: false,
      response_format: { type: "json_object" },
    });

    const summary = response.choices[0].message.content;
    if (!summary) {
      throw new Error("Failed to get ChatGPT content");
    }

    return summary;
  } catch (error) {
    console.error("Summarization failed: ", error);

    if (error instanceof Error) {
      throw new Error(`Summarization failed: ${error.message}`);
    } else {
      throw new Error(`Summarization failed: ${String(error)}`);
    }
  }
}
