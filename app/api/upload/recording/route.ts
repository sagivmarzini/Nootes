import { handleUpload, HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { handleRecording, markNotebookFailed } from "./recording";
import { prisma } from "@/lib/prisma";
import { getFileExtension } from "@/lib/utils";

export async function POST(request: Request): Promise<NextResponse> {
  const body: HandleUploadBody = await request.json();

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname: string,
        clientPayload: string | null
      ) => {
        let clientJson = {};
        try {
          clientJson = clientPayload ? JSON.parse(clientPayload) : {};
        } catch (error) {
          console.error("Failed to parse clientPayload:", error);
          throw new Error(
            "Failed to parse clientPayload in onBeforeGenerateToken: " + error
          );
        }

        const fullPayload = {
          ...clientJson,
        };

        return {
          allowedContentTypes: ["audio/*"],
          allowOverwrite: true,
          tokenPayload: JSON.stringify(fullPayload),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log(`Upload completed for blob: ${blob.url}`);

        if (!tokenPayload) {
          console.error("Missing tokenPayload in upload completed handler");
          return;
        }

        let payload: { email: string; notebookId: number };
        try {
          payload = JSON.parse(tokenPayload);
        } catch (error) {
          console.error("Failed to parse tokenPayload:", error);
          return;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: payload.email },
          });

          if (!user) {
            throw new Error(`User not found for email: ${payload.email}`);
          }

          await prisma.notebook.update({
            where: { id: payload.notebookId },
            data: { userId: user.id },
          });

          console.log(`Starting processing for notebook ${payload.notebookId}`);

          await handleRecording(
            blob.url,
            getFileExtension(blob.pathname),
            user,
            payload.notebookId
          );

          console.log(
            `Successfully completed processing for notebook ${payload.notebookId}`
          );
        } catch (error) {
          console.error("onUploadCompleted failed:", error);
          await markNotebookFailed(
            payload.notebookId,
            error instanceof Error ? error.message : String(error)
          );
          // Do NOT re-throw: Vercel Blob retries the webhook on non-2xx
          // responses, which re-runs the entire pipeline (and OpenAI calls)
          // 2-3 more times. The notebook is already marked failed and the
          // user can see the reason via errorMessage.
        }
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown upload error" },
      { status: 500 }
    );
  }
}
