import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

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
    <html lang="en" className="h-full bg-gray-50">
      <body className={`${geist.className} h-full antialiased`}>
        <div className="min-h-full">
          <header className="bg-white shadow">
            <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center">
                  <a href="/" className="text-xl font-bold text-gray-900">
                    Flight Booking System
                  </a>
                </div>
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
