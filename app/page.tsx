import { getUserSession } from "@/lib/session";
import UploadAudio from "./components/UploadAudio";

export default async function Home() {
  return (
    <main>
      <div className="min-h-screen hero bg-base-200">
        <div className="text-center hero-content">
          <div className="max-w-md text-balance">
            <h1 className="flex flex-col gap-2 text-3xl font-bold">
              <div>לא מצליחים גם להקשיב וגם לסכם?</div>
              <span className="text-5xl font-black text-transparent drop-shadow-md inline-blockfont-bold bg-gradient-to-r from-purple-400 to-secondary bg-clip-text">
                תנו ל־AI לעשות את זה בשבילכם
              </span>
            </h1>
            <p className="py-6">
              פשוט העלו הקלטה של השיעור וה־AI שלנו יהפוך אותה לסיכום ברור, כתוב
              כאילו הכנתם אותו בעצמכם.
            </p>

            <UploadAudio />
          </div>
        </div>
      </div>
    </main>
  );
}
