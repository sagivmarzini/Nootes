// app/notebook/[id]/page.tsx
import { Metadata } from "next";
import Notebook from "./Notebook";
import { PiSmileySad } from "react-icons/pi";
import { BiX } from "react-icons/bi";

type Params = { id: string };
type Props = { params: Promise<Params> };

const BASE = process.env.NEXTAPP_URL!;

// Dynamic metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const response = await fetch(`${BASE}/api/notebook/${id}`);
  if (!response.ok) return { title: "מחברת לא נמצאה | Nootes" };

  const notebook = await response.json();
  const page = notebook.summary ? JSON.parse(notebook.summary) : null;

  return { title: page?.title || "מחברת | Nootes" };
}

// Server component
export default async function NotebookPage({ params }: Props) {
  const { id } = await params;

  const response = await fetch(`${BASE}/api/notebook/${id}`, {
    next: { revalidate: 0 },
  });
  if (!response.ok)
    return (
      <div className="min-h-screen hero bg-base-200">
        <div className="text-center hero-content">
          <h1 className="flex flex-col items-center gap-2 text-xl font-semibold">
            <BiX className="text-5xl" />
            <span>המחברת שלך לא נמצאת בשום מקום</span>
          </h1>
        </div>
      </div>
    );

  const notebook = await response.json();

  return <Notebook notebook={notebook} />;
}
