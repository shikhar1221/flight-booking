import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { useAuth } from '@/contexts/AuthContext';
import { Header } from "@/components/layout/Header";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { Navbar } from '@/components/layout/Navbar';

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flight Booking System",
  description: "Book your flights easily and securely",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-gray-100">
      <body className={`${geist.className} h-full antialiased`}>
        <Providers>
        <div className="min-h-full">
          <Header/>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
            <div/>
        
          <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
            {children}
          </main>
          </div>
        </div>
        </Providers>
      </body>
    </html>
  );
}
