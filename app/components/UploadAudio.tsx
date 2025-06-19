"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BiMicrophone, BiX } from "react-icons/bi";

export default function UploadAudio() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null); // Clear any existing errors
    inputRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // Check if no file was selected
    if (!file) {
      setError("לא נבחר קובץ שמע. אנא בחרו קובץ שמע תקין.");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("audio/")) {
      setError("הקובץ שנבחר אינו קובץ שמע תקין. אנא בחרו קובץ שמע.");
      return;
    }

    // Optional: Check file size (e.g., max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      setError("הקובץ גדול מדי. גודל מקסימלי: 50MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recording", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "שגיאה בעת העלאת הקובץ");
      }

      router.push(`/notebook/${data.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "שגיאה לא ידועה בעת העלאת הקובץ"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const dismissError = () => {
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <div className="absolute mx-4 alert alert-error top-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 stroke-current shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={dismissError}
          >
            <BiX size={16} />
          </button>
        </div>
      )}

      {/* Upload Button */}
      <button
        className="shadow-xl btn btn-primary"
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="loading loading-spinner" />
        ) : (
          <BiMicrophone />
        )}
        {isLoading ? "טוען..." : "העלו הקלטה"}
      </button>

      {/* Hidden File Input */}
      <input
        type="file"
        accept="audio/*"
        ref={inputRef}
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
