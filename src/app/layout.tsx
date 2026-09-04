import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "ROYA — AI Film Production Manager",
  description: "AI-powered film production manager for screenplay analysis, weather-aware scheduling, and department coordination.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-dark-900 text-gray-100 antialiased">
        <Sidebar />
        <main className="md:ml-60 min-h-screen pt-16 md:pt-0">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </body>
    </html>
  );
}
