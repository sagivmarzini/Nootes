import { getUserSession } from "@/lib/session";
import AuthButton from "./AuthButton";

export default async function NavBar() {
  const user = await getUserSession();

  return (
    <div className="shadow-sm navbar bg-base-100">
      <div className="flex-1">
        <a className="text-xl btn btn-ghost">Nootes</a>
      </div>
      <AuthButton />
    </div>
  );
}
