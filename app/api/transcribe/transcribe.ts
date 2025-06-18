import OpenAI, { toFile } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribe(audioFile: File) {
  console.log("Transcribing audio: ", audioFile.name);
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(audioFile, "audio.wav", {
        type: "audio/wav",
      }),
      model: "whisper-1",
      language: "he",
      prompt: `This recording is of a teacher from a high-school class, in Israel, in Hebrew.
        There might be Hebrew names, verses from bible and Gemarah, etc.`,
    });
    return transcription.text;
  } catch (error) {
    console.error("Error during transcription:", error);
    throw error;
  }
}
