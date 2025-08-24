import type { Metadata, Viewport } from "next";
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
  title: {
    default: "Absensi Lampung",
    template: "%s | Absensi Lampung"
  },
  description: "Aplikasi Absensi Online Pemerintah Provinsi Lampung - Sistem manajemen kehadiran pegawai yang modern dan efisien",
  manifest: "/manifest.json",
  keywords: ["absensi", "lampung", "pemerintah", "kehadiran", "pegawai"],
  authors: [{ name: "Pemerintah Provinsi Lampung" }],
  creator: "Pemerintah Provinsi Lampung",
  publisher: "Pemerintah Provinsi Lampung",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "16x16", type: "image/png" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Absensi Lampung",
  },
};

export const viewport: Viewport = {
  themeColor: "#f69435",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Absensi Lampung" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Absensi Lampung" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#f69435" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#f69435" />
        <meta name="color-scheme" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo.png" />
        <link rel="mask-icon" href="/logo.svg" color="#f69435" />
        <link rel="shortcut icon" href="/logo.png" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/logo.png" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* EMERGENCY CSP FIX FOR MEDIAPIPE WEBASSEMBLY */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // CRITICAL: Emergency CSP override for MediaPipe WebAssembly
            // This fixes the issue where browser receives wrong CSP without unsafe-eval
            (function() {
              console.log('🆘 Emergency CSP Fix: Initializing...');
              
              // Remove any existing bad CSP meta tags immediately
              const badCSPTags = document.querySelectorAll('meta[http-equiv*="Content-Security-Policy"], meta[http-equiv*="content-security-policy"]');
              badCSPTags.forEach((tag, index) => {
                const content = tag.getAttribute('content') || '';
                console.log(\`🔍 Found CSP meta tag \${index + 1}: \${content}\`);
                if (!content.includes('unsafe-eval')) {
                  console.log('🗑️ Removing bad CSP meta tag');
                  tag.remove();
                }
              });
              
              // Force add emergency CSP with unsafe-eval for WebAssembly
              const emergencyCSP = document.createElement('meta');
              emergencyCSP.setAttribute('http-equiv', 'Content-Security-Policy');
              emergencyCSP.setAttribute('content', 
                "default-src 'self' 'unsafe-eval' 'unsafe-inline' https: http: data: blob:; " +
                "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http: data: blob: 'wasm-unsafe-eval'; " +
                "worker-src 'self' 'unsafe-eval' blob: data:; " +
                "connect-src 'self' https: http: ws: wss:; " +
                "img-src 'self' https: http: data: blob:; " +
                "style-src 'self' 'unsafe-inline' https: http:; " +
                "font-src 'self' https: http: data:; " +
                "object-src 'none'; " +
                "base-uri 'self';"
              );
              
              // Insert emergency CSP as first meta tag for priority
              const head = document.head || document.getElementsByTagName('head')[0];
              const firstChild = head.firstElementChild;
              if (firstChild) {
                head.insertBefore(emergencyCSP, firstChild);
              } else {
                head.appendChild(emergencyCSP);
              }
              
              console.log('✅ Emergency CSP with unsafe-eval injected!');
              console.log('📋 Emergency CSP:', emergencyCSP.getAttribute('content'));
              
              // Test WebAssembly support immediately
              setTimeout(() => {
                try {
                  const wasmBytes = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
                  WebAssembly.instantiate(wasmBytes).then(() => {
                    console.log('✅ WebAssembly test successful! Emergency CSP fix worked.');
                    window.webAssemblySupported = true;
                  }).catch(error => {
                    console.error('❌ WebAssembly test failed:', error);
                    window.webAssemblySupported = false;
                  });
                } catch (error) {
                  console.error('❌ WebAssembly test error:', error);
                  window.webAssemblySupported = false;
                }
              }, 100);
              
            })();
          `
        }} />
        
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        {process.env.NODE_ENV === 'development' && (
          <>
            <script src="/network-filter.js" defer></script>
            <script src="/pwa-utils.js" defer></script>
          </>
        )}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered with scope: ', registration.scope);
                    
                    // Handle service worker updates
                    registration.addEventListener('updatefound', () => {
                      const newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker installed, show update notification
                            console.log('New service worker available, refreshing...');
                            if (${process.env.NODE_ENV === 'development'}) {
                              // Auto-refresh in development
                              window.location.reload();
                            } else {
                              // In production, you might want to show a notification to the user
                              if (confirm('Aplikasi telah diperbarui. Refresh halaman untuk menggunakan versi terbaru?')) {
                                window.location.reload();
                              }
                            }
                          }
                        });
                      }
                    });

                    // Check for updates periodically in development
                    if (${process.env.NODE_ENV === 'development'}) {
                      setInterval(() => {
                        registration.update();
                      }, 3000); // Check every 3 seconds in development
                    }
                  })
                  .catch(function(error) {
                    console.log('SW registration failed: ', error);
                  });
              });
            }
          `
        }} />
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
              <main className="flex-1 min-h-screen bg-background">
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
