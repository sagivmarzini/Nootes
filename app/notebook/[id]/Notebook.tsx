"use client";

import { useEffect, useState } from "react";
import { PiSmileySad } from "react-icons/pi";
import localFont from "next/font/local";
import { $Enums } from "@prisma/client";
import { BiX } from "react-icons/bi";

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
        <span>We're looking for your notebook...</span>
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
              Sorry, the process failed.
              <br />
              Please try again.
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
            <span>Sorry, we couldn't find your notebook</span>
          </h1>
        </div>
      </div>
    );
  }

  if (!notebook.summary) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <span className="loading loading-infinity loading-xl" />
        <span>{notebook.status}...</span>
      </div>
    );
  }

  const page = JSON.parse(notebook.summary);

  return (
    <div className="flex flex-col items-start justify-center min-h-screen p-4 text-gray-800 bg-base-100 sm:p-8">
      <div
        className={
          "w-full max-w-5xl my-4 overflow-hidden border border-gray-300 rounded-lg shadow-xl bg-paper " +
          gveretLevin.className
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
