import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import AuthGuard from "../components/layout/AuthGuard";
import AppShell from "../components/layout/AppShell";
import { AppearanceProvider } from "../contexts/AppearanceContext";

export const metadata: Metadata = {
  title: "Flow",
  description: "Proje ve görev yönetim sistemi",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <AppearanceProvider>
          <AuthGuard>
            <AppShell>{children}</AppShell>
          </AuthGuard>
        </AppearanceProvider>
      </body>
    </html>
  );
}