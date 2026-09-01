import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecoverFlow — AI Subscription Rescue Agent",
  description: "Automated AI recovery engine for failed Razorpay subscriptions in Indian SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0F1117] text-white min-h-screen antialiased selection:bg-[#6C63FF] selection:text-white">
        {children}
      </body>
    </html>
  );
}
