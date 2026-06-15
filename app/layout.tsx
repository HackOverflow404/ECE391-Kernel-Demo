import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ECE391 Kernel Demo",
  description: "A RISC-V64 kernel built from scratch for UIUC's ECE391, running in the browser via WebAssembly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
