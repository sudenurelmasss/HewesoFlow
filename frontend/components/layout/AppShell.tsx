"use client";

import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ChevronLeft,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  Users,
} from "lucide-react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import { useAppearance } from "../../contexts/AppearanceContext";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { logout } from "../../services/authService";

type AppShellProps = {
  children: ReactNode;
};

type ThemeMode =
  | "light"
  | "dark";

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

  const {
    appearance,
  } = useAppearance();

  const {
    user,
    isAdmin,
    isProjectManager,
  } = useCurrentUser();

  const [
    theme,
    setTheme,
  ] =
    useState<ThemeMode>(
      "light"
    );

  const [
    themeReady,
    setThemeReady,
  ] =
    useState(false);

  const [
    sidebarOpen,
    setSidebarOpen,
  ] =
    useState(true);

  useEffect(() => {
    const storedTheme =
      localStorage.getItem(
        "heweso-theme"
      );

    let initialTheme:
      ThemeMode = "light";

    if (
      storedTheme === "light" ||
      storedTheme === "dark"
    ) {
      initialTheme =
        storedTheme;
    } else if (
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
    ) {
      initialTheme =
        "dark";
    }

    setTheme(initialTheme);
    applyTheme(initialTheme);
    setThemeReady(true);
  }, []);

  const publicPage =
    pathname === "/login" ||
    pathname === "/register";

  const canManage =
    isAdmin ||
    isProjectManager;

  const menuItems =
    useMemo(
      () => [
        {
          label: "Dashboard",
          href: "/",
          icon: LayoutDashboard,
          show: true,
        },
        {
          label: "Projeler",
          href: "/projects",
          icon: FolderKanban,
          show: true,
        },
        {
          label: "Görevlerim",
          href: "/my-tasks",
          icon: ListTodo,
          show: !isAdmin,
        },
        {
          label: "Takvim",
          href: "/calendar",
          icon: CalendarDays,
          show: true,
        },
        {
          label: "Ekip",
          href: "/team",
          icon: Users,
          show: canManage,
        },
        {
          label: "Departmanlar",
          href: "/departments",
          icon: Building2,
          show: canManage,
        },
        {
          label: "Raporlar",
          href: "/reports",
          icon: BarChart3,
          show: canManage,
        },
        {
          label: "Admin",
          href: "/admin",
          icon: ShieldCheck,
          show: isAdmin,
        },
        {
          label: "Görünüm",
          href: "/appearance",
          icon: Palette,
          show: isAdmin,
        },
      ],
      [
        canManage,
        isAdmin,
      ]
    );

  if (publicPage) {
    return (
      <div className="app-shell">
        {children}
      </div>
    );
  }

  function isActive(
    href: string
  ) {
    return href === "/"
      ? pathname === "/"
      : pathname.startsWith(
          href
        );
  }

  function toggleTheme() {
    const nextTheme:
      ThemeMode =
      theme === "light"
        ? "dark"
        : "light";

    setTheme(nextTheme);

    localStorage.setItem(
      "heweso-theme",
      nextTheme
    );

    applyTheme(nextTheme);
  }

  function handleLogout() {
    logout();

    router.replace(
      "/login"
    );
  }

  const fullName =
    `${
      user?.firstName ?? ""
    } ${
      user?.lastName ?? ""
    }`.trim() ||
    user?.email ||
    "Kullanıcı";

  const visibleCompanyName =
    appearance.companyName?.trim() ||
    "Heweso";

  return (
    <div className="app-shell">
      <aside
        className={`heweso-sidebar ${
          sidebarOpen
            ? "heweso-sidebar-open"
            : "heweso-sidebar-closed"
        }`}
      >
        <div className="flex h-full flex-col">
          <div
            className={`flex h-[74px] shrink-0 items-center ${
              sidebarOpen
                ? "justify-between px-4"
                : "justify-center"
            }`}
          >
            {sidebarOpen && (
              <div className="select-none">
                <p className="heweso-sidebar-brand-small">
                  {visibleCompanyName.toUpperCase()}
                </p>

                <p
                  className="heweso-sidebar-brand"
                  style={{
                    color:
                      theme === "dark"
                        ? "#ffffff"
                        : "#000000",
                  }}
                >
                  Flow
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                setSidebarOpen(
                  (current) =>
                    !current
                )
              }
              className="heweso-sidebar-collapse"
              title={
                sidebarOpen
                  ? "Menüyü daralt"
                  : "Menüyü aç"
              }
            >
              {sidebarOpen ? (
                <ChevronLeft
                  size={17}
                  strokeWidth={2}
                />
              ) : (
                <Menu
                  size={18}
                  strokeWidth={2}
                />
              )}
            </button>
          </div>

          <nav className="heweso-sidebar-menu">
            {menuItems
              .filter(
                (item) =>
                  item.show
              )
              .map((item) => {
                const Icon =
                  item.icon;

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
                    title={
                      !sidebarOpen
                        ? item.label
                        : undefined
                    }
                    className={`heweso-sidebar-item ${
                      active
                        ? "heweso-sidebar-item-active"
                        : ""
                    } ${
                      sidebarOpen
                        ? "heweso-sidebar-item-open"
                        : "heweso-sidebar-item-closed"
                    }`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={
                        active
                          ? 2.15
                          : 1.8
                      }
                    />

                    {sidebarOpen && (
                      <span className="heweso-sidebar-label">
                        {
                          item.label
                        }
                      </span>
                    )}
                  </button>
                );
              })}
          </nav>

          <div className="flex-1" />

          <div className="heweso-sidebar-tools">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/notifications"
                )
              }
              title={
                !sidebarOpen
                  ? "Bildirimler"
                  : undefined
              }
              className={`heweso-sidebar-tool ${
                sidebarOpen
                  ? "heweso-sidebar-tool-open"
                  : "heweso-sidebar-tool-closed"
              }`}
            >
              <Bell
                size={18}
                strokeWidth={1.9}
              />

              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left">
                    Bildirimler
                  </span>

                  <span className="heweso-notification-dot" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={
                toggleTheme
              }
              title={
                !sidebarOpen
                  ? theme ===
                    "light"
                    ? "Koyu moda geç"
                    : "Aydınlık moda geç"
                  : undefined
              }
              className={`heweso-sidebar-tool ${
                sidebarOpen
                  ? "heweso-sidebar-tool-open"
                  : "heweso-sidebar-tool-closed"
              }`}
            >
              {!themeReady ? (
                <div className="h-[18px] w-[18px]" />
              ) : theme ===
                "light" ? (
                <Moon
                  size={18}
                  strokeWidth={
                    1.9
                  }
                />
              ) : (
                <Sun
                  size={18}
                  strokeWidth={
                    1.9
                  }
                />
              )}

              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left">
                    {theme ===
                    "light"
                      ? "Koyu Tema"
                      : "Aydınlık Tema"}
                  </span>

                  <span className="heweso-theme-state">
                    Aç
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="heweso-sidebar-footer">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/settings"
                )
              }
              title={
                !sidebarOpen
                  ? fullName
                  : undefined
              }
              className={`heweso-sidebar-user ${
                sidebarOpen
                  ? "justify-start"
                  : "justify-center"
              }`}
            >
              <div className="heweso-sidebar-avatar">
                {user?.firstName
                  ?.charAt(0)
                  .toUpperCase() ||
                  user?.email
                    ?.charAt(0)
                    .toUpperCase() ||
                  "U"}
              </div>

              {sidebarOpen && (
                <div className="min-w-0 flex-1 text-left">
                  <p className="heweso-sidebar-user-name">
                    {fullName}
                  </p>

                  <p className="heweso-sidebar-user-role">
                    {user
                      ?.roles?.[0] ||
                      "Kullanıcı"}
                  </p>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={
                handleLogout
              }
              title={
                !sidebarOpen
                  ? "Çıkış"
                  : undefined
              }
              className={`heweso-sidebar-logout ${
                sidebarOpen
                  ? "justify-start"
                  : "justify-center"
              }`}
            >
              <LogOut
                size={17}
                strokeWidth={1.9}
              />

              {sidebarOpen && (
                <span>
                  Çıkış
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      <div
        className={`min-h-screen transition-[padding] duration-300 ease-out ${
          sidebarOpen
            ? "pl-[230px]"
            : "pl-[76px]"
        }`}
      >
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </div>
    </div>
  );
}