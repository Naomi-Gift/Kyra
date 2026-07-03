import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Kyra — Automated Savings Circles",
  description:
    "Automated savings circles with scheduled collections, member reminders, and backend-managed payouts.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Kyra",
    description: "Automated savings circles with backend-managed payments",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark grain" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "rgba(17,17,24,0.95)",
              border: "1px solid rgba(251,191,36,0.2)",
              color: "#e8e8f0",
              fontFamily: "'DM Sans', sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
