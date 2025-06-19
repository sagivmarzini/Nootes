// app/notebook/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { PiSmileySad } from "react-icons/pi";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NotebookPage(props: Props) {
  const params = await props.params;
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
    <div
      dir="rtl"
      className="bg-base-100 min-h-screen p-4 sm:p-8 flex flex-col justify-center items-start text-gray-800"
    >
      <div className="w-full max-w-5xl bg-white shadow-2xl rounded-lg overflow-hidden my-8 border border-gray-300">
        <header className="p-5 text-center border-b-2 border-gray-200 bg-gray-50">
          <h1 className="font-black text-3xl text-gray-700">{page.title}</h1>{" "}
        </header>
        <main
          style={{
            backgroundImage:
              "linear-gradient(to bottom, transparent 27px, #e5e7eb 28px)",
            backgroundSize: "100% 28px",
          }}
        >
          {/* 1. Container for Notes & Cues with horizontal lines */}
          <div className="grid grid-cols-3 pt-5 min-h-[50vh]">
            <div
              className="col-span-2 p-4 overflow-y-auto leading-[28px]"
              dangerouslySetInnerHTML={{ __html: page.notes || "" }}
            ></div>
            <div
              className="col-span-1 p-4 text-blue-800 overflow-y-auto leading-[28px]"
              dangerouslySetInnerHTML={{ __html: page.cues || "" }}
            ></div>
          </div>

          {/* 4. Summary Section at the bottom */}
          <div
            className="pt-6 border-pink-400 p-4 text-red-800 leading-[28px]"
            dangerouslySetInnerHTML={{ __html: page.summary || "" }}
          ></div>
        </main>
      </div>
    </div>
  );
}
