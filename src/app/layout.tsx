import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CyVault - Secure Your Digital Life",
  description: "All-in-one solution for password management, secure storage, and digital asset protection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
