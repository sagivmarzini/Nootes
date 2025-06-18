"use client";

import { useRef, useState } from "react";
import { BiMicrophone } from "react-icons/bi";

export default function UploadAudio() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsLoading(true);

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data) {
      console.log(data.transcription);
    } else {
      console.error("Error:", data.error);
    }

    setIsLoading(false);
  };

  return (
    <div>
      <button
        className="btn btn-primary"
        onClick={handleClick}
        disabled={isLoading}
      >
        <BiMicrophone />
        {isLoading ? "Transcribing..." : "Upload Recording"}
      </button>
      <input
        type="file"
        accept="audio/*"
        ref={inputRef}
        onChange={handleUpload}
        className="hidden"
      />
      {result && (
        <div className="mt-4 p-2 bg-base-300 rounded">
          <p className="text-sm font-mono whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
}
