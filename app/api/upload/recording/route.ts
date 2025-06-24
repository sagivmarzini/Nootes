import { handleUpload, HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { handleRecording } from "./recording";
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
        try {
          if (!tokenPayload)
            throw new Error("Missing tokenPayload in upload completed handler");

          const payload: { email: string; notebookId: number } =
            JSON.parse(tokenPayload);

          // Update the notebook owner
          const user = await prisma.user.findUnique({
            where: { email: payload.email },
          });
          if (!user)
            throw new Error("User not found for email: " + payload.email);
          await prisma.notebook.update({
            where: { id: payload.notebookId },
            data: { userId: user?.id },
          });

          setTimeout(() => {
            handleRecording(
              blob.url,
              getFileExtension(blob.pathname),
              user,
              payload.notebookId
            );
          }, 0);
        } catch (error) {
          console.error("onUploadCompleted failed:", error);
        }
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
