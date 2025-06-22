// app/notebook/[id]/Notebook.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import { BiDownload } from "react-icons/bi";
import localFont from "next/font/local";
import { Notebook } from "@prisma/client";

const gveretLevin = localFont({
  src: "../../fonts/GveretLevin.woff2",
  display: "swap",
  variable: "--font-gveretlevin",
});

export default function NotebookClient({ notebook }: { notebook: Notebook }) {
  const [failed, setFailed] = useState(notebook.status === "failed");
  const notebookRef = useRef<HTMLDivElement>(null);

  const page = useMemo(() => {
    if (!notebook?.summary) return null;
    try {
      return JSON.parse(notebook.summary);
    } catch (e) {
      console.error("Failed to parse summary:", e);
      return null;
    }
  }, [notebook.summary]);

  async function handleDownloadPDF() {
    const element = notebookRef?.current;
    if (!element) throw new Error("Element not found");

    await document.fonts.ready;

    const originalWidth = element.style.width;
    const originalMaxWidth = element.style.maxWidth;
    const originalLineColor = element.style.getPropertyValue("--line-color");

    element.style.width = "794px";
    element.style.maxWidth = "none";
    element.style.setProperty("--line-color", "--paper");

    await new Promise((r) => setTimeout(r, 100));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      allowTaint: true,
    });

    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
    element.style.setProperty("--line-color", originalLineColor);

    const data = canvas.toDataURL("image/jpeg", 1.0);
    const link = document.createElement("a");
    link.href = data;
    link.download = "Nootes.com-" + page?.title + ".jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <span className="loading loading-infinity loading-xl" />
        <span>טוען מחברת...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-gray-800 bg-base-100 sm:p-8">
      <div
        className={
          "w-full max-w-4xl my-4 relative overflow-hidden border border-gray-300 rounded-lg shadow-xl bg-paper " +
          gveretLevin.className
        }
        ref={notebookRef}
        style={
          {
            "--line-height": "28px",
            "--baseline-offset": "20px",
            "--line-color": "#caccd1",
          } as React.CSSProperties
        }
      >
        <button
          className="absolute btn btn-primary btn-square top-2 left-2 btn-soft"
          onClick={handleDownloadPDF}
        >
          <BiDownload fontSize={24} />
        </button>
        <header className="p-6 px-16 text-center border-b-2 border-gray-200 bg-paper">
          <h1 className="text-3xl font-black text-gray-700">{page.title}</h1>
        </header>
        <main
          style={{
            backgroundImage:
              "linear-gradient(to bottom, transparent 27px, var(--line-color) 28px)",
            backgroundSize: "100% 28px",
          }}
        >
          <div className="grid grid-cols-3 pt-[var(--baseline-offset)] min-h-[50vh] leading-[var(--line-height)]">
            <div
              className="col-span-2 p-4 pb-0 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: page.notes || "" }}
            ></div>
            <div
              className="col-span-1 p-4 pb-0 overflow-y-auto text-blue-800"
              dangerouslySetInnerHTML={{ __html: page.cues || "" }}
            ></div>
          </div>
          <div
            className=" border-pink-400 p-4 pt-2 text-red-800 leading-[var(--line-height)] bg-paper"
            dangerouslySetInnerHTML={{ __html: page.summary || "" }}
            style={{
              backgroundImage:
                "linear-gradient(to bottom, transparent 27px, var(--line-color) 28px)",
              backgroundSize: "100% 28px",
            }}
          ></div>
        </main>
      </div>
    </div>
  );
}
