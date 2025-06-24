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
          const error = "Missing tokenPayload in upload completed handler";
          console.error(error);
          throw new Error(error);
        }

        let payload: { email: string; notebookId: number };
        try {
          payload = JSON.parse(tokenPayload);
        } catch (error) {
          console.error("Failed to parse tokenPayload:", error);
          throw new Error("Invalid tokenPayload format");
        }

        try {
          // Update the notebook owner
          const user = await prisma.user.findUnique({
            where: { email: payload.email },
          });

          if (!user) {
            const error = `User not found for email: ${payload.email}`;
            console.error(error);
            await markNotebookFailed(payload.notebookId);
            throw new Error(error);
          }

          await prisma.notebook.update({
            where: { id: payload.notebookId },
            data: { userId: user.id },
          });

          console.log(`Starting processing for notebook ${payload.notebookId}`);

          // IMPORTANT: Await the processing to catch errors
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
          await markNotebookFailed(payload.notebookId);
          // Re-throw to propagate error to client
          throw error;
        }
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown upload error",
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}
