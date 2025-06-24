import OpenAI from "openai";
import params from "@/server-parameters.json";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000, // 2 minutes timeout
});

const TRANSCRIBE_PROMPT = params.prompts.transcribe;
const SUMMARIZE_PROMPT = params.prompts.summarize;

export async function transcribe(recording: File) {
  console.log(
    `Starting transcription for file: ${recording.name}, size: ${recording.size} bytes`
  );

  try {
    // Validate file before sending to OpenAI
    if (!recording || recording.size === 0) {
      throw new Error("Invalid or empty audio file");
    }

    // Check file size (OpenAI has a 25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (recording.size > maxSize) {
      throw new Error(
        `Audio file too large: ${recording.size} bytes (max: ${maxSize} bytes)`
      );
    }

    const startTime = Date.now();

    const result = await openai.audio.transcriptions.create({
      file: recording,
      model: "whisper-1",
      language: "he",
      prompt: TRANSCRIBE_PROMPT,
      response_format: "text",
    });

    const duration = Date.now() - startTime;
    console.log(
      `Transcription completed in ${duration}ms for file: ${recording.name}`
    );

    if (!result || typeof result !== "string" || result.trim().length === 0) {
      console.warn(`Empty transcription result for file: ${recording.name}`);
      throw new Error("Transcription returned empty result");
    }

    console.log(
      `Transcription successful, length: ${result.length} characters`
    );
    return result;
  } catch (error) {
    console.error(`Transcription failed for: ${recording.name}`, {
      error: error,
      fileSize: recording.size,
      fileName: recording.name,
      fileType: recording.type,
    });

    // Handle specific OpenAI API errors
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        throw new Error(
          `Transcription timeout: Audio file may be too long or service is slow`
        );
      } else if (error.message.includes("rate_limit")) {
        throw new Error(`Rate limit exceeded: Please try again later`);
      } else if (error.message.includes("invalid_request_error")) {
        throw new Error(
          `Invalid audio format: Please upload a valid audio file`
        );
      } else if (error.message.includes("insufficient_quota")) {
        throw new Error(`API quota exceeded: Please contact support`);
      }

      throw new Error(`Transcription failed: ${error.message}`);
    } else {
      throw new Error(`Transcription failed: ${String(error)}`);
    }
  }
}

export async function summarize(transcription: string) {
  console.log(
    `Starting summarization for transcription of length: ${transcription.length}`
  );

  try {
    if (!transcription || transcription.trim().length === 0) {
      throw new Error("No transcription provided for summarization");
    }

    // Check if transcription is too long (rough estimate for token limits)
    const estimatedTokens = transcription.length / 4; // Rough estimate: 1 token ≈ 4 characters
    const maxTokens = 100000; // Conservative limit for gpt-4o-mini

    if (estimatedTokens > maxTokens) {
      console.warn(`Transcription may be too long: ~${estimatedTokens} tokens`);
      // Truncate if too long (you might want to implement chunking instead)
      transcription = transcription.substring(0, maxTokens * 4);
    }

    const startTime = Date.now();

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

    const duration = Date.now() - startTime;
    console.log(`Summarization completed in ${duration}ms`);

    const summary = response.choices[0]?.message?.content;
    if (!summary) {
      throw new Error("No content returned from ChatGPT");
    }

    // Validate JSON format
    try {
      JSON.parse(summary);
    } catch (parseError) {
      console.error("Invalid JSON in summary:", summary);
      throw new Error("Summary is not valid JSON format");
    }

    console.log(
      `Summarization successful, length: ${summary.length} characters`
    );
    return summary;
  } catch (error) {
    console.error("Summarization failed:", {
      error: error,
      transcriptionLength: transcription?.length || 0,
      transcriptionPreview: transcription?.substring(0, 100) || "N/A",
    });

    // Handle specific OpenAI API errors
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        throw new Error(`Summarization timeout: Content may be too long`);
      } else if (error.message.includes("rate_limit")) {
        throw new Error(`Rate limit exceeded: Please try again later`);
      } else if (error.message.includes("insufficient_quota")) {
        throw new Error(`API quota exceeded: Please contact support`);
      }

      throw new Error(`Summarization failed: ${error.message}`);
    } else {
      throw new Error(`Summarization failed: ${String(error)}`);
    }
  }
}
