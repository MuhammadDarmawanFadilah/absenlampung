"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (installed)
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true) {
        setIsInstalled(true);
        console.log('PWA: App is already installed');
        return;
      }
    };

    checkIfInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired');
      // Mencegah browser menampilkan prompt default
      e.preventDefault();
      // Simpan event untuk digunakan nanti
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      console.log('PWA: App was installed');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Debug: Log current state
    console.log('PWA: Install button component mounted');
    console.log('PWA: Service Worker registration:', 'serviceWorker' in navigator);
    console.log('PWA: Display mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log('PWA: Install button clicked');
    
    if (!deferredPrompt) {
      console.log('PWA: No deferred prompt available');
      return;
    }

    try {
      // Tampilkan prompt instalasi
      console.log('PWA: Showing install prompt');
      deferredPrompt.prompt();
      
      // Tunggu respons pengguna
      const { outcome } = await deferredPrompt.userChoice;
      console.log('PWA: User choice:', outcome);
      
      if (outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
      } else {
        console.log('PWA: User dismissed the install prompt');
      }
      
      // Prompt hanya bisa digunakan sekali
      setDeferredPrompt(null);
    } catch (error) {
      console.error('PWA: Error during installation:', error);
    }
  };

  // Don't show button if app is already installed
  if (isInstalled) {
    console.log('PWA: Button hidden - app is installed');
    return null;
  }

  // Don't show button if no install prompt is available
  if (!deferredPrompt) {
    console.log('PWA: Button hidden - no deferred prompt');
    return null;
  }

  console.log('PWA: Rendering install button');

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleInstallClick}
      className="flex"
      title="Install App"
    >
      <Download className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Install App</span>
    </Button>
  );
};

export default PWAInstallButton;
