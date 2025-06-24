import { del, put } from "@vercel/blob";

export async function fetchFile(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch file");
  return await response.blob();
}

export async function fetchBlobAsFile(
  url: string,
  filename: string
): Promise<File> {
  const blob = await fetchFile(url);
  return new File([blob], filename);
}

export async function putFileInBlobStorage(file: File, filename: string) {
  return await put(filename, file, { access: "public" });
}

export async function deleteBlob(url: string) {
  await del(url);
}
