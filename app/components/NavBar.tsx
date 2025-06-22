import AuthButton from "./AuthButton";
import Link from "next/link";

export default async function NavBar() {
  return (
    <div className="shadow-sm navbar bg-base-100">
      <div className="flex-1">
        <Link href={"/"} className="text-xl btn btn-ghost">
          Nootes
        </Link>
      </div>
      <AuthButton />
    </div>
  );
}
