"use client";

import { useEffect, useRef, useState } from "react";
import { PiSmileySad } from "react-icons/pi";
import localFont from "next/font/local";
import { $Enums } from "@prisma/client";
import { BiDownload, BiX } from "react-icons/bi";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

const danaYad = localFont({
  src: "../../fonts/DanaYad.woff",
  display: "swap",
  variable: "--font-danayad",
});

const gveretLevin = localFont({
  src: "../../fonts/GveretLevin.woff2",
  display: "swap",
  variable: "--font-gveretlevin",
});

const cssOverrides = {
  "--color-base-100": "#fffefb",
  "--color-base-200": "#fefdf9",
  "--color-base-300": "#f0e6dc",
  "--color-base-content": "#181614",
  "--color-primary": "#ffad45",
  "--color-primary-content": "#fffefc",
  "--color-secondary": "#aa87f8",
  "--color-secondary-content": "#fdf9ff",
  "--color-accent": "#000000",
  "--color-accent-content": "#ffffff",
  "--color-neutral": "#0b0a0b",
  "--color-neutral-content": "#fffefb",
  "--color-info": "#6798ff",
  "--color-info-content": "#fcfbff",
  "--color-success": "#3fbf97",
  "--color-success-content": "#fefefc",
  "--color-warning": "#ffb62a",
  "--color-warning-content": "#fffdf6",
  "--color-error": "#b61a02",
  "--color-error-content": "#fff5f3",
};

type Props = { id: number };

type Notebook = {
  id: number;
  status: $Enums.NotebookStatus;
  transcription: string | null;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function Notebook({ id }: Props) {
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);
  const pageRef = useRef(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchNotebook = async () => {
      try {
        const response = await fetch(`/api/notebook/${id}`);
        if (!response.ok) throw new Error("not found");
        const data: Notebook = await response.json();
        setNotebook(data);
        setIsLoading(false);

        if (data.status === "completed" || data.status === "failed") {
          clearInterval(interval);
          if (data.status === "failed") {
            setIsLoading(false);
            setFailed(true);
          }
        }
      } catch (err) {
        console.error(err);
        setIsLoading(false);
        setNotFound(true);
        clearInterval(interval);
      }
    };

    fetchNotebook(); // call immediately
    interval = setInterval(fetchNotebook, 5000); // then poll every 5s

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
              סליחה, התהליך נכשל
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
            <span>המחברת שלך לא נמצאת בשום מקום</span>
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
    const element = pageRef.current;
    if (!element) throw new Error("Failed to find notebook page for download");

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const aspectRatio = imgWidth / imgHeight;

    // Convert px → mm (assuming 96 DPI)
    const pxToMm = (px: number) => (px * 25.4) / 96;
    const imgMmWidth = pxToMm(imgWidth);
    const imgMmHeight = pxToMm(imgHeight);

    // Scale to fit page
    let renderWidth = pageWidth;
    let renderHeight = renderWidth / aspectRatio;
    if (renderHeight > pageHeight) {
      renderHeight = pageHeight;
      renderWidth = renderHeight * aspectRatio;
    }

    const x = (pageWidth - renderWidth) / 2;
    const y = (pageHeight - renderHeight) / 2;

    pdf.addImage(imgData, "PNG", x, y, renderWidth, renderHeight);
    pdf.save(page.title || "notebook.pdf");
  }

  function statusToHebrew(status: $Enums.NotebookStatus): string {
    switch (status) {
      case "transcribing":
        return "מתמלל";
      case "summarizing":
        return "מסכם";

      default:
        return status;
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 text-gray-800 bg-base-100 sm:p-8">
      <button
        className="absolute btn btn-primary btn-square top-10 left-6 btn-soft"
        onClick={handleDownloadPDF}
      >
        <BiDownload fontSize={24} />
      </button>
      <div
        className={
          "w-full max-w-4xl my-4 overflow-hidden border border-gray-300 rounded-lg shadow-xl bg-paper " +
          gveretLevin.className
        }
        ref={pageRef}
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
