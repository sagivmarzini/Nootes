export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}
