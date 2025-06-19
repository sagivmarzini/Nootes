// app/notebook/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { PiSmileySad } from "react-icons/pi";
import localFont from "next/font/local";

const danaYad = localFont({
  src: "../../fonts/DanaYad-Normal.woff",
  display: "swap",
  variable: "--font-danayad",
});

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NotebookPage(props: Props) {
  const params = await props.params;
  const id = parseInt(params.id);
  let notebook = await prisma.notebook.findUnique({
    where: { id },
  });

  const interval = setInterval(async () => {
    notebook = await prisma.notebook.findUnique({
      where: { id },
    });

    if (notebook?.status === "completed") {
      clearInterval(interval);
    }
  }, 5000);

  if (!notebook) {
    return (
      <div className="min-h-screen hero bg-base-200">
        <div className="text-center hero-content">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <PiSmileySad className="text-3xl" /> Sorry, we don't have that
            notebook
          </h1>
        </div>
      </div>
    );
  }
  if (!notebook.summary) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <span className="loading loading-infinity loading-xl"></span>
        <span>{notebook.status}...</span>
      </div>
    );
  }

  const page = await JSON.parse(notebook.summary);

  return (
    <div
      dir="rtl"
      className="flex flex-col items-start justify-center min-h-screen p-4 text-gray-800 bg-base-100 sm:p-8"
    >
      <div
        className={
          "w-full max-w-5xl my-8 overflow-hidden border text-xl border-gray-300 rounded-lg shadow-xl bg-paper " +
          danaYad.className
        }
      >
        <header className="p-6 px-16 text-center border-b-2 border-gray-200 bg-paper">
          <h1 className="text-3xl font-black text-gray-700">{page.title}</h1>
        </header>
        <main
          style={{
            backgroundImage:
              "linear-gradient(to bottom, transparent 27px, #caccd1 28px)",
            backgroundSize: "100% 28px",
          }}
        >
          {/* 1. Container for Notes & Cues */}
          <div className="grid grid-cols-3 pt-5 min-h-[50vh]">
            <div
              className="col-span-2 p-4 pb-0 overflow-y-auto leading-[28px]"
              dangerouslySetInnerHTML={{ __html: page.notes || "" }}
            ></div>
            <div
              className="col-span-1 p-4 pb-0 text-blue-800 overflow-y-auto leading-[28px]"
              dangerouslySetInnerHTML={{ __html: page.cues || "" }}
            ></div>
          </div>

          {/* 4. Summary Section at the bottom */}
          <div
            className=" border-pink-400 p-4 pt-2 text-red-800 leading-[28px] bg-paper"
            dangerouslySetInnerHTML={{ __html: page.summary || "" }}
            style={{
              backgroundImage:
                "linear-gradient(to bottom, transparent 27px, #caccd1 28px)",
              backgroundSize: "100% 28px",
            }}
          ></div>
        </main>
      </div>
    </div>
  );
}
