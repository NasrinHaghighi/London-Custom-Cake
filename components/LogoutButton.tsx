"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const confirmed = confirm("Are you sure you want to logout?");
    if (!confirmed) return;
    
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-md hover:from-gray-900 hover:to-black transition-colors font-medium text-sm shadow-sm"
    >
      <span>Logout</span>
    </button>
  );
}
