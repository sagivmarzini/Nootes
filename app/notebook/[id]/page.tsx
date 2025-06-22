// app/notebook/[id]/page.tsx
import { Metadata } from "next";
import Notebook from "./Notebook";
import { Notebook as NotebookType } from "@prisma/client";

// Dynamic metadata export
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const res = await fetch(`/api/notebook/${params.id}`);
  if (!res.ok) return { title: "Notebook Not Found | Nootes" };

  const notebook: NotebookType = await res.json();
  const page = notebook.summary ? JSON.parse(notebook.summary) : null;

  return {
    title: page?.title || "Notebook | Nootes",
  };
}

// Server-rendered page with data passed down
export default async function NotebookPage({
  params,
}: {
  params: { id: string };
}) {
  const response = await fetch(`/api/notebook/${params.id}`, {
    next: { revalidate: 0 }, // disable caching if needed
  });

  if (!response.ok) {
    return <div>Notebook not found</div>;
  }

  const notebook: NotebookType = await response.json();

  return <Notebook notebook={notebook} />;
}
