import Link from "next/link";
import React from "react";
import { HiHome } from "react-icons/hi2";

type Props = {
  children: React.ReactNode;
};

export default function NotebookLayout({ children }: Props) {
  return (
    <div>
      <Link href="../" className="p-2 m-4 btn btn-square bg-primary">
        <HiHome fontSize={24} />
      </Link>
      <main>{children}</main>
    </div>
  );
}
