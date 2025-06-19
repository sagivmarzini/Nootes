// app/notebook/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { PiSmileySad } from "react-icons/pi";

type Props = {
  params: { id: string };
};

export default async function NotebookPage({ params }: Props) {
  const id = parseInt(params.id);
  const notebook = await prisma.notebook.findUnique({
    where: { id },
  });

  if (!notebook || typeof notebook.summary !== "string") {
    return (
      <div className="hero bg-base-200 min-h-screen">
        <div className="hero-content text-center">
          <h1 className="text-xl flex items-center font-semibold gap-2">
            <PiSmileySad className="text-3xl" /> Sorry, we don't have that
            notebook
          </h1>
        </div>
      </div>
    );
  }

  const page = await JSON.parse(notebook.summary);

  return (
    <div className="min-h-screen p-8" dir="rtl">
      <header className="text-center pb-4">
        <h1 className="font-black text-2xl ">{page.title}</h1>
      </header>
      <main className="h-full grid gap-4">
        <div
          className="col-span-2 row-span-3 overflow-auto"
          dangerouslySetInnerHTML={{ __html: page.notes || "" }}
        ></div>
        <div
          className="col-span-1 row-span-3 overflow-auto text-blue-800"
          dangerouslySetInnerHTML={{ __html: page.cues || "" }}
        ></div>
        <div
          className="col-span-3 row-span-1 text-red-800 pt-[19px] overflow-auto"
          dangerouslySetInnerHTML={{ __html: page.summary || "" }}
        ></div>
      </main>
    </div>
  );
}
