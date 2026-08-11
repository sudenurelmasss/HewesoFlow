"use client";

import {
  CalendarDays,
  CheckSquare,
  FolderKanban,
  Home,
  Settings,
  Shield,
  Users,
  BarChart3,
  Building2,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type StoredUser = {
  roles: string[];
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

export default function BottomNavbar() {
  const pathname = usePathname();

  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("heweso_user");

    if (!storedUser) return;

    try {
      const user = JSON.parse(storedUser) as StoredUser;
      setRoles(user.roles ?? []);
    } catch {
      setRoles([]);
    }
  }, []);

  const isAdmin = roles.includes("Admin");

  const isProjectManager =
    roles.includes("ProjectManager");

  const navItems = useMemo<NavItem[]>(() => {
    if (isAdmin) {
      return [
        {
          label: "Ana Sayfa",
          href: "/",
          icon: Home,
        },
        {
          label: "Projeler",
          href: "/projects",
          icon: FolderKanban,
        },
        {
          label: "Ekip",
          href: "/team",
          icon: Users,
        },
        {
          label: "Yönetim",
          href: "/admin",
          icon: Shield,
        },
        {
          label: "Ayarlar",
          href: "/settings",
          icon: Settings,
        },
      ];
    }

    if (isProjectManager) {
      return [
        {
          label: "Ana Sayfa",
          href: "/",
          icon: Home,
        },
        {
          label: "Görevlerim",
          href: "/my-tasks",
          icon: CheckSquare,
        },
        {
          label: "Projeler",
          href: "/projects",
          icon: FolderKanban,
        },
        {
          label: "Raporlar",
          href: "/reports",
          icon: BarChart3,
        },
        {
          label: "Departmanlar",
          href: "/departments",
          icon: Building2,
        },
        {
          label: "Ayarlar",
          href: "/settings",
          icon: Settings,
        },
      ];
    }

    return [
      {
        label: "Ana Sayfa",
        href: "/",
        icon: Home,
      },
      {
        label: "Görevlerim",
        href: "/my-tasks",
        icon: CheckSquare,
      },
      {
        label: "Projeler",
        href: "/projects",
        icon: FolderKanban,
      },
      {
        label: "Takvim",
        href: "/calendar",
        icon: CalendarDays,
      },
      {
        label: "Ekip",
        href: "/team",
        icon: Users,
      },
      {
        label: "Ayarlar",
        href: "/settings",
        icon: Settings,
      },
    ];
  }, [isAdmin, isProjectManager]);

  return (
    <nav className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-32px)] max-w-[720px] -translate-x-1/2">
      <div className="flex items-center justify-between rounded-[24px] border border-white/70 bg-white/90 px-4 py-3 shadow-[0_15px_50px_rgba(32,32,50,0.12)] backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[82px] flex-col items-center gap-1.5 rounded-2xl px-3 py-2 text-xs transition ${
                active
                  ? "bg-[#f1efff] font-medium text-[#7256eb]"
                  : "text-[#9999a3] hover:bg-[#f7f7fa] hover:text-[#33333b]"
              }`}
            >
              <Icon size={19} strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}