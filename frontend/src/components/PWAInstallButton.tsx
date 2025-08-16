"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    console.log('PWA: Component mounted, checking install criteria');

    // Check if app is already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone ||
                         document.referrer.includes('android-app://');

    if (isStandalone) {
      console.log('PWA: App already running in standalone mode');
      setIsInstalled(true);
      return;
    }

    // Check for service worker support
    if (!('serviceWorker' in navigator)) {
      console.log('PWA: Service Worker not supported');
      return;
    }

    let promptEvent: BeforeInstallPromptEvent | null = null;

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired', e);
      
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Cast to our interface
      const installEvent = e as BeforeInstallPromptEvent;
      
      // Validate the event properly
      if (installEvent && 
          typeof installEvent.prompt === 'function' && 
          installEvent.userChoice instanceof Promise) {
        
        console.log('PWA: Valid install prompt event detected');
        promptEvent = installEvent;
        setDeferredPrompt(installEvent);
        setShowInstallBanner(true);
        
        // Log event details for debugging
        console.log('PWA: Event details', {
          platforms: installEvent.platforms,
          hasPrompt: typeof installEvent.prompt === 'function',
          hasUserChoice: installEvent.userChoice instanceof Promise
        });
      } else {
        console.warn('PWA: Invalid beforeinstallprompt event received', {
          hasPrompt: installEvent && typeof installEvent.prompt === 'function',
          hasUserChoice: installEvent && installEvent.userChoice instanceof Promise,
          event: installEvent
        });
      }
    };

    const handleAppInstalled = () => {
      console.log('PWA: App successfully installed');
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      promptEvent = null;
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Force check for install criteria after a delay
    const checkInstallCriteria = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          console.log('PWA: Service Worker registrations:', registrations.length);
          
          if (registrations.length > 0) {
            console.log('PWA: Service Worker is registered');
            
            // Check if manifest is properly linked
            const manifestLink = document.querySelector('link[rel="manifest"]');
            if (manifestLink) {
              console.log('PWA: Manifest is linked');
            } else {
              console.warn('PWA: Manifest not found in document');
            }
          }
        }
      } catch (error) {
        console.error('PWA: Error checking install criteria:', error);
      }
    };

    // Delay check to ensure everything is loaded
    setTimeout(checkInstallCriteria, 3000);

    // Cleanup function
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log('PWA: Install button clicked');
    
    if (!deferredPrompt) {
      console.log('PWA: No deferred prompt available');
      showManualInstructions();
      return;
    }

    // Double-check the prompt method exists
    if (typeof deferredPrompt.prompt !== 'function') {
      console.error('PWA: Deferred prompt missing prompt() method');
      showManualInstructions();
      return;
    }

    try {
      console.log('PWA: Triggering install prompt');
      
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;
      
      console.log('PWA: User choice result:', choiceResult);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted the install');
        setIsInstalled(true);
      } else {
        console.log('PWA: User dismissed the install');
      }
      
      // Clear the deferredPrompt as it can only be used once
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      
    } catch (error) {
      console.error('PWA: Error during installation:', error);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    let instructions = '';
    
    if (isMobile) {
      if (userAgent.includes('chrome')) {
        instructions = '1. Ketuk menu ⋮ (tiga titik)\n2. Pilih "Install app" atau "Add to Home screen"\n3. Ketuk "Install"';
      } else if (userAgent.includes('firefox')) {
        instructions = '1. Ketuk ikon rumah di address bar\n2. Pilih "Add to Home Screen"\n3. Ketuk "Add"';
      } else if (userAgent.includes('safari')) {
        instructions = '1. Ketuk tombol Share (⎋)\n2. Pilih "Add to Home Screen"\n3. Ketuk "Add"';
      } else {
        instructions = '1. Gunakan menu browser\n2. Cari opsi "Add to Home Screen" atau "Install app"\n3. Ikuti petunjuk yang muncul';
      }
    } else {
      if (userAgent.includes('chrome') || userAgent.includes('edg')) {
        instructions = '1. Klik menu ⋮ (tiga titik) di browser\n2. Pilih "Install Absensi Lampung..."\n3. Klik "Install" pada dialog';
      } else if (userAgent.includes('firefox')) {
        instructions = '1. Klik ikon + di address bar (jika tersedia)\n2. Atau bookmark halaman ini\n3. Firefox akan mengingatnya sebagai app';
      } else {
        instructions = '1. Bookmark halaman ini untuk akses cepat\n2. Atau cari menu "Install app" di browser\n3. Ikuti petunjuk browser Anda';
      }
    }

    alert(`Install Aplikasi Absensi Lampung:\n\n${instructions}\n\nCatatan: Pastikan Anda menggunakan HTTPS untuk semua fitur PWA.`);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    console.log('PWA: Install banner dismissed');
    
    // Remember dismissal for 24 hours
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Don't show if no install prompt available
  if (!showInstallBanner) {
    return null;
  }

  // Check if recently dismissed
  const lastDismissed = localStorage.getItem('pwa-install-dismissed');
  if (lastDismissed) {
    const dismissTime = parseInt(lastDismissed);
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (Date.now() - dismissTime < twentyFourHours) {
      return null;
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm animate-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <Download className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              Install Aplikasi
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
          Install aplikasi untuk akses lebih cepat, notifikasi push, dan penggunaan offline
        </p>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleInstallClick}
            size="sm"
            className="flex-1 text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Install
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDismiss}
            className="text-sm"
          >
            Nanti
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallButton;
