// src/components/PWAInstaller.tsx
"use client";

import { useEffect, useState } from "react";
import { colors, fonts } from "@/lib/constants";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Listen for install prompt (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show install prompt after 3 seconds
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Store dismissal in localStorage to not show again for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = parseInt(dismissed);
      const daysSinceDismissal = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 7) {
        setShowInstallPrompt(false);
      }
    }
  }, []);

  // Don't render if running as PWA
  if (isStandalone) return null;

  // iOS Install Instructions
  if (isIOS && showInstallPrompt) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 sm:pb-4 animate-slide-up"
        style={{
          background: `linear-gradient(180deg, rgba(16, 16, 22, 0.98) 0%, rgba(8, 8, 12, 0.98) 100%)`,
          borderTop: `1px solid ${colors.border}`,
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%)`,
              }}
            >
              <span className="text-2xl">🎮</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="text-base font-bold mb-1"
                style={{ fontFamily: fonts.heading, color: colors.textPrimary }}
              >
                Install BookMyGame
              </h3>
              <p className="text-xs sm:text-sm" style={{ color: colors.textSecondary }}>
                Add to your home screen for a better experience!
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-zinc-500 hover:text-white p-1"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* iOS Instructions */}
          <div
            className="p-3 rounded-lg mb-3"
            style={{
              background: colors.darkCard,
              border: `1px solid ${colors.border}`,
            }}
          >
            <p className="text-xs sm:text-sm mb-2 font-semibold" style={{ color: colors.cyan }}>
              📱 How to Install (iOS):
            </p>
            <ol className="text-xs space-y-1.5" style={{ color: colors.textMuted }}>
              <li>1. Tap the Share button <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg></li>
              <li>2. Scroll down and tap "Add to Home Screen"</li>
              <li>3. Tap "Add" to confirm</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Android/Desktop Install Prompt
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div
        className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-slide-up"
      >
        <div
          className="p-4 rounded-2xl shadow-2xl"
          style={{
            background: `linear-gradient(135deg, rgba(20, 20, 28, 0.98) 0%, rgba(16, 16, 22, 0.98) 100%)`,
            border: `1px solid ${colors.border}`,
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%)`,
              }}
            >
              <span className="text-2xl">🎮</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="text-base font-bold mb-1"
                style={{ fontFamily: fonts.heading, color: colors.textPrimary }}
              >
                Install BookMyGame
              </h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Install our app for quick access and offline support!
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-zinc-500 hover:text-white p-1"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors"
              style={{
                background: colors.darkCard,
                border: `1px solid ${colors.border}`,
                color: colors.textSecondary,
              }}
            >
              Not Now
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-[2] py-2.5 px-4 rounded-lg text-sm font-bold text-white transition-all"
              style={{
                background: `linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%)`,
                fontFamily: fonts.heading,
              }}
            >
              Install App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
