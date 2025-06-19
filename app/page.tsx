import UploadAudio from "./components/UploadAudio";

export default function Home() {
  return (
    <main>
      <div className="min-h-screen hero bg-base-200">
        <div className="text-center hero-content">
          <div className="max-w-md">
            <h1 className="text-3xl font-bold ">
              זרקו את החפירות של המורה
              <br />
              <span className="text-4xl font-black text-transparent inline-blockfont-bold bg-gradient-to-r from-purple-400 to-secondary bg-clip-text">
                וקבלו סיכום חכם בכתב יד
              </span>
            </h1>
            <p className="py-6">
              העלו פה הקלטה של השיעור וה-AI שלנו יצור לכם סיכום ברור ומסודר בכתב
              יד!
            </p>

            <UploadAudio />
          </div>
        </div>
      </div>
    </main>
  );
}
