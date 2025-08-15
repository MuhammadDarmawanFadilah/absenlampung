"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check PWA support
    const checkPWASupport = () => {
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasManifest = 'manifest' in document.createElement('link');
      const hasBeforeInstallPrompt = 'BeforeInstallPromptEvent' in window || 'onbeforeinstallprompt' in window;
      
      const supported = hasServiceWorker && (hasManifest || hasBeforeInstallPrompt);
      setIsSupported(supported);
      
      console.log('PWA Support Check:', {
        serviceWorker: hasServiceWorker,
        manifest: hasManifest,
        beforeInstallPrompt: hasBeforeInstallPrompt,
        supported
      });
    };

    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (installed)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true ||
                          document.referrer.includes('android-app://');
      
      setIsInstalled(isStandalone);
      console.log('PWA: Install check - isStandalone:', isStandalone);
      return isStandalone;
    };

    checkPWASupport();
    const installed = checkIfInstalled();

    // Only add event listeners if not installed and PWA is supported
    if (!installed && isSupported) {
      const handleBeforeInstallPrompt = (e: Event) => {
        console.log('PWA: beforeinstallprompt event fired');
        // Prevent browser from showing default prompt
        e.preventDefault();
        // Save event for later use
        setDeferredPrompt(e);
      };

      const handleAppInstalled = () => {
        console.log('PWA: App was installed');
        setIsInstalled(true);
        setDeferredPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      // Fallback: Check periodically if app becomes installable
      const checkInstallability = setInterval(() => {
        if (!deferredPrompt && !isInstalled) {
          console.log('PWA: Periodic installability check');
        }
      }, 5000);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        clearInterval(checkInstallability);
      };
    }

    // Debug logging
    console.log('PWA: Install button component mounted', {
      isInstalled: installed,
      isSupported,
      userAgent: navigator.userAgent
    });
  }, [isSupported]);

  const handleInstallClick = async () => {
    console.log('PWA: Install button clicked');
    
    if (!deferredPrompt) {
      console.log('PWA: No deferred prompt available');
      // Fallback: Show manual installation instructions
      alert('Untuk menginstall aplikasi ini:\n\n' +
            '1. Chrome/Edge: Klik menu (⋮) > "Install Absensi Lampung"\n' +
            '2. Firefox: Klik ikon rumah di address bar\n' +
            '3. Safari: Share > "Add to Home Screen"');
      return;
    }

    try {
      // Show install prompt
      console.log('PWA: Showing install prompt');
      deferredPrompt.prompt();
      
      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;
      console.log('PWA: User choice:', outcome);
      
      if (outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
      } else {
        console.log('PWA: User dismissed the install prompt');
      }
      
      // Prompt can only be used once
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA: Error during installation:', error);
      // Fallback message
      alert('Terjadi kesalahan saat installasi. Silahkan coba install manual melalui menu browser.');
    }
  };

  // Don't show button if app is already installed
  if (isInstalled) {
    console.log('PWA: Button hidden - app is installed');
    return null;
  }

  // Don't show button if PWA is not supported
  if (!isSupported) {
    console.log('PWA: Button hidden - PWA not supported');
    return null;
  }

  // Show button even without deferred prompt (for manual fallback)
  console.log('PWA: Rendering install button', { 
    hasDeferredPrompt: !!deferredPrompt,
    isSupported,
    isInstalled 
  });

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleInstallClick}
      className="flex"
      title={deferredPrompt ? "Install App" : "Install App (Manual)"}
    >
      <Download className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Install App</span>
    </Button>
  );
};

export default PWAInstallButton;
