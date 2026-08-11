"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  getStoredToken,
  logout,
} from "@/services/authService";

type AppShellProps = {
  children: ReactNode;
};

type CurrentUser = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type ThemeMode =
  | "light"
  | "dark";

type JwtPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;

  role?: string;

  [key: string]:
    | string
    | string[]
    | number
    | boolean
    | undefined;
};

function decodeToken(
  token: string
): JwtPayload | null {
  try {
    const payload =
      token.split(".")[1];

    if (!payload) {
      return null;
    }

    const normalized =
      payload
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const decoded =
      decodeURIComponent(
        window
          .atob(normalized)
          .split("")
          .map(
            (char) =>
              "%" +
              (
                "00" +
                char
                  .charCodeAt(0)
                  .toString(16)
              ).slice(-2)
          )
          .join("")
      );

    return JSON.parse(
      decoded
    );
  } catch {
    return null;
  }
}

function getUserFromToken():
  | CurrentUser
  | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  const token =
    getStoredToken();

  if (!token) {
    return null;
  }

  const payload =
    decodeToken(token);

  if (!payload) {
    return null;
  }

  const microsoftRole =
    payload[
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    ];

  const microsoftEmail =
    payload[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
    ];

  const microsoftName =
    payload[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
    ];

  let role = "";

  if (
    typeof payload.role ===
    "string"
  ) {
    role =
      payload.role;
  } else if (
    typeof microsoftRole ===
    "string"
  ) {
    role =
      microsoftRole;
  } else if (
    Array.isArray(
      microsoftRole
    )
  ) {
    role =
      microsoftRole[0] ??
      "";
  }

  const email =
    typeof payload.email ===
    "string"
      ? payload.email
      : typeof microsoftEmail ===
          "string"
        ? microsoftEmail
        : "";

  let firstName =
    typeof payload.firstName ===
    "string"
      ? payload.firstName
      : "";

  let lastName =
    typeof payload.lastName ===
    "string"
      ? payload.lastName
      : "";

  if (
    !firstName &&
    typeof microsoftName ===
      "string"
  ) {
    const parts =
      microsoftName
        .trim()
        .split(" ");

    firstName =
      parts[0] ?? "";

    lastName =
      parts
        .slice(1)
        .join(" ");
  }

  return {
    firstName,
    lastName,
    email,
    role,
  };
}

function normalizeRole(
  role: string
) {
  return role
    .replace(/\s/g, "")
    .toLowerCase();
}

function applyTheme(
  theme: ThemeMode
) {
  document.documentElement.setAttribute(
    "data-theme",
    theme
  );
}

export default function AppShell({
  children,
}: AppShellProps) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [user, setUser] =
    useState<CurrentUser | null>(
      null
    );

  const [theme, setTheme] =
    useState<ThemeMode>(
      "light"
    );

  const [
    themeReady,
    setThemeReady,
  ] = useState(false);

  /* =========================
     USER
  ========================= */

  useEffect(() => {
    setUser(
      getUserFromToken()
    );
  }, [pathname]);

  /* =========================
     THEME INITIAL LOAD
  ========================= */

  useEffect(() => {
    const storedTheme =
      localStorage.getItem(
        "heweso-theme"
      );

    let initialTheme:
      ThemeMode =
      "light";

    if (
      storedTheme ===
        "dark" ||
      storedTheme ===
        "light"
    ) {
      initialTheme =
        storedTheme;
    } else {
      const prefersDark =
        window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;

      initialTheme =
        prefersDark
          ? "dark"
          : "light";
    }

    setTheme(
      initialTheme
    );

    applyTheme(
      initialTheme
    );

    setThemeReady(true);
  }, []);

  /* =========================
     THEME CHANGE
  ========================= */

  function toggleTheme() {
    const newTheme:
      ThemeMode =
      theme === "light"
        ? "dark"
        : "light";

    setTheme(newTheme);

    localStorage.setItem(
      "heweso-theme",
      newTheme
    );

    applyTheme(
      newTheme
    );
  }

  /* =========================
     PUBLIC PAGES
  ========================= */

  const publicPages =
    pathname === "/login" ||
    pathname === "/register";

  if (publicPages) {
    return (
      <div className="app-shell">
        {children}
      </div>
    );
  }

  /* =========================
     ROLES
  ========================= */

  const role =
    normalizeRole(
      user?.role ?? ""
    );

  const isAdmin =
    role === "admin";

  const isManager =
    role ===
    "projectmanager";

  const canManage =
    isAdmin ||
    isManager;

  /* =========================
     MENU
  ========================= */

  const menuItems = [
    {
      label: "Dashboard",
      href: "/",
      icon: "⌂",
      show: true,
    },

    {
      label: "Projeler",
      href: "/projects",
      icon: "◫",
      show: true,
    },

    {
      label: "Görevlerim",
      href: "/my-tasks",
      icon: "✓",
      show: true,
    },

    {
      label: "Takvim",
      href: "/calendar",
      icon: "□",
      show: true,
    },

    {
      label: "Ekip",
      href: "/team",
      icon: "♙",
      show: canManage,
    },

    {
      label:
        "Departmanlar",
      href:
        "/departments",
      icon: "◇",
      show: canManage,
    },

    {
      label: "Raporlar",
      href: "/reports",
      icon: "⌁",
      show: canManage,
    },

    {
      label: "Admin",
      href: "/admin",
      icon: "⚙",
      show: isAdmin,
    },
  ];

  function isActive(
    href: string
  ) {
    if (href === "/") {
      return (
        pathname === "/"
      );
    }

    return pathname.startsWith(
      href
    );
  }

  function handleLogout() {
    logout();

    router.replace(
      "/login"
    );
  }

  return (
    <div className="app-shell">
      {/* =========================
          TOP BAR
      ========================= */}

      <header className="heweso-topbar sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-6">

          {/* LOGO */}

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-semibold text-white">
              H
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold tracking-tight">
                HewesoFlow
              </p>

              <p className="text-[10px] text-gray-400">
                Work Management
              </p>
            </div>
          </button>

          {/* RIGHT SIDE */}

          <div className="flex items-center gap-2">

            {/* SEARCH */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/search"
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm transition hover:bg-gray-50"
              title="Ara"
            >
              ⌕
            </button>

            {/* NOTIFICATIONS */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/notifications"
                )
              }
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm transition hover:bg-gray-50"
              title="Bildirimler"
            >
              ♢
            </button>

            {/* THEME */}

            <button
              type="button"
              onClick={
                toggleTheme
              }
              className="flex h-9 min-w-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 text-sm transition hover:bg-gray-50"
              title={
                theme ===
                "light"
                  ? "Koyu moda geç"
                  : "Aydınlık moda geç"
              }
            >
              <span>
                {!themeReady
                  ? "◐"
                  : theme ===
                      "light"
                    ? "☀"
                    : "☾"}
              </span>

              <span className="hidden text-[11px] font-medium lg:block">
                {theme ===
                "light"
                  ? "Aydınlık"
                  : "Koyu"}
              </span>
            </button>

            <div className="mx-1 hidden h-7 w-px bg-gray-200 sm:block" />

            {/* USER */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/settings"
                )
              }
              className="hidden items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-gray-100 sm:flex"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                {user?.firstName
                  ?.charAt(0)
                  .toUpperCase() ||
                  user?.email
                    ?.charAt(0)
                    .toUpperCase() ||
                  "U"}
              </div>

              <div className="max-w-[150px] text-left">
                <p className="truncate text-xs font-semibold">
                  {user?.firstName ||
                  user?.lastName
                    ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
                    : user?.email ||
                      "Kullanıcı"}
                </p>

                <p className="truncate text-[10px] text-gray-400">
                  {user?.role ||
                    "Kullanıcı"}
                </p>
              </div>
            </button>

            {/* LOGOUT */}

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="ml-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* =========================
          PAGE CONTENT
      ========================= */}

      <div className="relative z-10 pb-32">
        {children}
      </div>

      {/* =========================
          BOTTOM NAVBAR
      ========================= */}

      <nav className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-24px)] max-w-fit -translate-x-1/2">

        <div className="heweso-navbar flex items-center gap-1 rounded-[24px] border p-1.5 shadow-xl shadow-black/10">

          {menuItems
            .filter(
              (item) =>
                item.show
            )
            .map(
              (item) => {
                const active =
                  isActive(
                    item.href
                  );

                return (
                  <button
                    key={
                      item.href
                    }
                    type="button"
                    onClick={() =>
                      router.push(
                        item.href
                      )
                    }
                    className={`group flex h-12 items-center gap-2 rounded-[18px] px-3 transition-all duration-200 sm:px-4 ${
                      active
                        ? "bg-black text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-base">
                      {
                        item.icon
                      }
                    </span>

                    <span
                      className={`hidden whitespace-nowrap text-xs font-medium md:block ${
                        active
                          ? "text-white"
                          : ""
                      }`}
                    >
                      {
                        item.label
                      }
                    </span>
                  </button>
                );
              }
            )}
        </div>
      </nav>
    </div>
  );
}