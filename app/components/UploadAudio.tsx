"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BiMicrophone, BiX } from "react-icons/bi";
import { uploadRecording } from "../actions/recording";

export default function UploadAudio() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);

    if (status !== "authenticated") {
      signIn("google", { callbackUrl: "/" });
      return;
    }

    inputRef.current?.click();
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError("לא הועלה קובץ.");
      return;
    }
    if (!validateFileInput(file)) {
      return;
    }

    submitAudioFile(file);
  };

  async function submitAudioFile(file: File) {
    setIsLoading(true);
    setError(null);

    try {
      const notebook = await uploadRecording(file);

      router.push(`/notebook/${notebook.id}`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "שגיאה לא ידועה בעת העלאת הקובץ"
      );
      setIsLoading(false);
    }
  }

  function validateFileInput(file: File) {
    // Check if no file was selected
    if (!file) {
      setError("לא נבחר קובץ שמע. אנא בחרו קובץ שמע תקין.");
      return false;
    }
    // Validate file type
    if (!file.type.startsWith("audio/")) {
      setError("הקובץ שנבחר אינו קובץ שמע תקין. אנא בחרו קובץ שמע.");
      return false;
    }
    // Check file size (e.g., max 25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (file.size > maxSize) {
      setError("הקובץ גדול מדי. גודל מקסימלי: 25MB.");
      return false;
    }

    return true;
  }

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
        {isLoading
          ? "טוען..."
          : status !== "authenticated"
          ? "התחברות והעלאת הקלטה"
          : "העלו הקלטה"}
      </button>
      {status !== "authenticated" && (
        <div className="flex items-center justify-center w-full gap-1 text-sm text-center text-gray-500">
          <span className="max-w-xs">
            ההרשמה חינמית, אך העלאת הקלטה דורשת התחברות לחשבון Google שלך.
          </span>
        </div>
      )}

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
