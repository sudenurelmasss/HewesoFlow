"use client";

import {
  Bell,
  ChevronDown,
  LogOut,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StoredUser = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
};

export default function Topbar() {
  const router = useRouter();

  const [user, setUser] =
    useState<StoredUser | null>(null);

  const [menuOpen, setMenuOpen] =
    useState(false);

  useEffect(() => {
    const storedUser =
      sessionStorage.getItem("heweso_user");

    if (!storedUser) {
      return;
    }

    try {
      setUser(
        JSON.parse(storedUser) as StoredUser
      );
    } catch {
      sessionStorage.removeItem(
        "heweso_user"
      );
    }
  }, []);

  function logout() {
    sessionStorage.removeItem(
      "heweso_token"
    );

    sessionStorage.removeItem(
      "heweso_user"
    );

    router.replace("/login");
  }

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
        .toUpperCase()
    : "?";

  return (
    <header className="relative flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          HewesoFlow
        </h1>

        <p className="mt-1 text-sm text-[#92929d]">
          İşlerinizi tek bir yerde yönetin.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition hover:shadow-md"
        >
          <Bell size={18} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
            className="flex items-center gap-2 rounded-full bg-white p-1 pr-3 shadow-sm transition hover:shadow-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7c5cff] text-sm font-semibold text-white">
              {initials}
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-[130px] truncate text-xs font-semibold text-[#33333b]">
                {user
                  ? `${user.firstName} ${user.lastName}`
                  : "Kullanıcı"}
              </p>

              <p className="mt-0.5 text-[10px] text-[#9999a3]">
                {user?.roles?.[0] ??
                  "TeamMember"}
              </p>
            </div>

            <ChevronDown
              size={14}
              className="text-[#9999a3]"
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-14 z-50 w-60 rounded-[20px] border border-[#ededf2] bg-white p-2 shadow-[0_18px_50px_rgba(30,30,45,0.12)]">
              <div className="px-3 py-3">
                <p className="text-sm font-semibold text-[#33333b]">
                  {user
                    ? `${user.firstName} ${user.lastName}`
                    : "Kullanıcı"}
                </p>

                <p className="mt-1 truncate text-xs text-[#9999a3]">
                  {user?.email}
                </p>
              </div>

              <div className="my-1 h-px bg-[#f0f0f4]" />

              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#666670] transition hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={16} />
                Çıkış yap
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}