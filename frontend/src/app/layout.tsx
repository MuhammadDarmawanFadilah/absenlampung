import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientSidebarWrapper from "@/components/ClientSidebarWrapper";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { cookies } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import NetworkInitializer from "@/components/NetworkInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono", 
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tren-Silapor - Sistem Pelaporan dan Pengawasan Pemilihan",
  description: "Sistem Informasi Alumni Fakultas Kedokteran Universitas Jenderal Soedirman",
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/logo.svg" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        {process.env.NODE_ENV === 'development' && (
          <script src="/network-filter.js" defer></script>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex`}
      >        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>            
            {process.env.NODE_ENV === 'development' && <NetworkInitializer />}
            <SidebarProvider defaultOpen={defaultOpen}>
              <ClientSidebarWrapper />              
              <main className="flex-1 min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <div className="w-full">{children}</div>
              </main>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
