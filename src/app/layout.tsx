import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SupabaseProvider } from "@/lib/supabase/context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StartCup AMF",
  description: "Evento gamificado de empreendedorismo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ✨ P3: Centralized Supabase Provider */}
        <SupabaseProvider>
          {/* ✅ REMOVED: EventEndCountdownWrapper was duplicated here and in live-dashboard/page.tsx
              It should ONLY appear on /live-dashboard, not globally in layout.
              Rendering it globally was causing:
              - Double polling at different times
              - Sync conflicts between instances
              - Unexpected refresh propagation when other pages updated data
          */}
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
