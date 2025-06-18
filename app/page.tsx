import UploadAudio from "./components/UploadAudio";

export default function Home() {
  return (
    <main>
      <div className="hero bg-base-200 min-h-screen">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold">
              Drop Your Teacher’s Nonsense Here — Get a Handwritten Summary
            </h1>
            <p className="py-6">
              Upload a recording of your class. Our AI will generate clear,
              handwritten-style notes and a structured summary for you.
            </p>

            <UploadAudio />
          </div>
        </div>
      </div>
    </main>
  );
}
