"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded transition"
    >
      Logout
    </button>
  );
}
