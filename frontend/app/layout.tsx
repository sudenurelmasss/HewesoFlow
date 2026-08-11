import type { Metadata } from "next";

import "./globals.css";

import AuthGuard from "@/components/layout/AuthGuard";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "HewesoFlow",
  description:
    "Proje ve görev yönetim sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
    >
      <body>
        <AuthGuard>
          <AppShell>
            {children}
          </AppShell>
        </AuthGuard>
      </body>
    </html>
  );
}