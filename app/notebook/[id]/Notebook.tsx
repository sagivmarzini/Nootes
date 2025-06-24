"use client";

import { useEffect, useRef, useState } from "react";
import { PiSmileySad } from "react-icons/pi";
import { $Enums, Notebook as NotebookType } from "@prisma/client";
import { BiDownload, BiX } from "react-icons/bi";
import html2canvas from "html2canvas-pro";
import "./notebook.css";
import parameters from "@/server-parameters.json";

type Props = { id: number };

export default function Notebook({ id }: Props) {
  const [notebook, setNotebook] = useState<NotebookType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);
  const notebookRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line prefer-const
    let interval: NodeJS.Timeout;

    const fetchNotebook = async () => {
      try {
        const response = await fetch(`/api/notebook/${id}`);
        if (!response.ok) throw new Error("not found");
        const data: NotebookType = await response.json();
        setNotebook(data);

        if (data.status === "completed" || data.status === "failed") {
          clearInterval(interval);
          if (data.status === "failed") setFailed(true);
        }

        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setNotFound(true);
        setIsLoading(false);
        clearInterval(interval);
      }
    };

    interval = setInterval(fetchNotebook, parameters.notebook_polling_interval);
    fetchNotebook();

    return () => clearInterval(interval);
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <span className="loading loading-ring loading-xl"></span>
        <span>מחפשים את המחברת שלך...</span>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="min-h-screen hero bg-base-200">
        <div className="text-center hero-content">
          <h1 className="flex flex-col items-center gap-2 text-xl font-semibold">
            <BiX className="text-6xl" />
            <span>
              סליחה, התהליך נכשל.
              <br />
              אנא נסו שוב
            </span>
          </h1>
        </div>
      </div>
    );
  }

  if (notFound || !notebook) {
    return (
      <div className="min-h-screen hero bg-base-200">
        <div className="text-center hero-content">
          <h1 className="flex flex-col items-center gap-4 text-xl font-semibold">
            <PiSmileySad className="text-6xl" />
            <span>המחברת לא קיימת</span>
          </h1>
        </div>
      </div>
    );
  }

  if (!notebook.summary) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <span className="loading loading-infinity loading-xl" />
        <span>{statusToHebrew(notebook.status)}...</span>
      </div>
    );
  }

  const page = JSON.parse(notebook.summary);

  async function handleDownloadPDF() {
    const element = notebookRef?.current;
    if (!element) throw new Error("Failed to find notebook for download");
    await document.fonts.ready;

    // Save original style
    const originalWidth = element.style.width;
    const originalMaxWidth = element.style.maxWidth;
    const originalLineColor = element.style.getPropertyValue("--line-color");

    // Temporarily change styling for downloading
    element.style.width = "794px"; // A4 width in px at 96 DPI
    element.style.maxWidth = "none";
    element.style.setProperty("--line-color", "--paper");

    // Wait for the DOM to repaint with new dimensions
    await new Promise((r) => setTimeout(r, 100));

    // Screenshot the wide version
    const canvas = await html2canvas(element, {
      scale: 2, //
      //  quality
      useCORS: true,
      backgroundColor: null,
      allowTaint: true,
    });

    // Restore original styles
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
    element.style.setProperty("--line-color", originalLineColor);

    // Download as image
    const data = canvas.toDataURL("image/jpeg", 1.0);
    const link = document.createElement("a");
    link.href = data;
    link.download = "Nootes.com-" + page.title + ".jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function statusToHebrew(status: $Enums.NotebookStatus): string {
    switch (status) {
      case "pending":
        return "מתחיל";
      case "transcribing":
        return "מתמלל";
      case "summarizing":
        return "מסכם";

      default:
        return status;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-gray-800 bg-base-100 sm:p-8">
      <div className="relative w-full max-w-4xl my-4 overflow-hidden border border-gray-300 rounded-lg shadow-xl">
        <button
          className="absolute btn btn-primary btn-square top-2 left-2 btn-soft"
          onClick={handleDownloadPDF}
        >
          <BiDownload fontSize={24} />
        </button>
        <div
          className=" bg-paper font-gveretlevin"
          ref={notebookRef}
          style={
            {
              "--line-height": "28px",
              "--baseline-offset": "20px",
              "--line-color": "#caccd1",
            } as React.CSSProperties
          }
        >
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
    </div>
  );
}
