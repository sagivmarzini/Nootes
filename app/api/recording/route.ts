import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { summarize, transcribe } from "./utils/openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import parameters from "@/server-parameters.json";
import { User } from "@prisma/client";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "No file uploaded or invalid file type" },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { error: "You must be logged in to upload a recording" },
      { status: 401 }
    );
  }

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "No user email in session" },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email },
  });
  if (!user) {
    return NextResponse.json(
      { error: "Logged-in user not found" },
      { status: 404 }
    );
  }

  const isAdmin = user.id === process.env.ADMIN_ID;
  if (!isAdmin && (await hitDailyLimit(user))) {
    return NextResponse.json(
      { error: "Daily limit reached. Come back tomorrow." },
      { status: 429 }
    );
  }

  const notebook = await prisma.notebook.create({
    data: { status: "pending", userId: user.id },
  });

  processRecording(file, notebook.id);

  return NextResponse.json({ id: notebook.id, status: notebook.status });
}

async function processRecording(recording: File, id: number) {
  try {
    await transcribe(recording, id);
    await summarize(id);
  } catch (error) {
    console.error(error);
    await prisma.notebook.update({
      where: { id },
      data: {
        status: "failed",
      },
    });
  }
}

async function hitDailyLimit(user: User) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await prisma.notebook.count({
    where: {
      userId: user.id,
      createdAt: {
        gte: today,
      },
    },
  });

  if (count >= parameters.daily_limit) {
    return true;
  }

  return false;
}
