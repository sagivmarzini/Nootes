"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BiMicrophone } from "react-icons/bi";

export default function UploadAudio() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsLoading(true);

    const response = await fetch("/api/recording", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!data) {
      throw new Error(data.error);
    }

    router.push(`/notebook/${data.id}`);

    setIsLoading(false);
  };

  return (
    <div>
      <button
        className="btn btn-primary"
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
