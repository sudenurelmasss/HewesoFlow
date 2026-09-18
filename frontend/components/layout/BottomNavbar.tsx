"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type StoredUser = { roles?: string[] };
type NavItem = { label: string; href: string };

export default function BottomNavbar() {
  const pathname = usePathname();
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("heweso_user") || localStorage.getItem("user");
      if (!raw) return;
      const user = JSON.parse(raw) as StoredUser;
      setRoles(user.roles ?? []);
    } catch { setRoles([]); }
  }, []);

  const items = useMemo<NavItem[]>(() => {
    const common: NavItem[] = [
      { label: "Dashboard", href: "/" },
      { label: "Projeler", href: "/projects" },
      { label: "Görevlerim", href: "/my-tasks" },
      { label: "Takvim", href: "/calendar" },
      { label: "Ekip", href: "/team" },
    ];
    if (roles.includes("Admin")) return [...common, { label: "Departmanlar", href: "/departments" }, { label: "Admin", href: "/admin" }];
    if (roles.includes("ProjectManager")) return [...common, { label: "Departmanlar", href: "/departments" }, { label: "Raporlar", href: "/reports" }];
    return common;
  }, [roles]);

  return (
    <nav className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-32px)] max-w-[900px] -translate-x-1/2">
      <div className="flex items-center justify-center gap-1 overflow-x-auto rounded-[22px] border border-black/10 bg-white/95 p-2 shadow-[0_18px_55px_rgba(20,20,35,0.16)] backdrop-blur-xl">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} className={`whitespace-nowrap rounded-[15px] px-5 py-3 text-[13px] font-bold tracking-[-0.01em] transition ${active ? "bg-black text-white shadow-sm" : "text-[#4b4d55] hover:bg-[#f2f2f5] hover:text-black"}`}>{item.label}</Link>;
        })}
      </div>
    </nav>
  );
}
