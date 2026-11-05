import { useCallback, useEffect, useState } from "react";

/** Minimal typings for the non-standard install prompt event. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/** True when Zeno is already running as an installed app (any platform). */
export function isStandalone() {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  const displayMode = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  return displayMode || iosStandalone === true;
}

/**
 * Registers the service worker that makes the app installable and lets the
 * shell open offline. Only runs in production builds: a cached app shell in
 * dev gets in the way of hot reloading.
 */
export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  const register = () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((error) => console.warn("PWA: service worker registration failed", error));
  };

  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}

/**
 * Tracks installability. Chrome/Edge/Android fire `beforeinstallprompt`, which
 * we keep around so an in-app button can trigger the native prompt. iOS Safari
 * never fires it, so `canInstall` stays false there.
 */
export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    const media = window.matchMedia?.("(display-mode: standalone)");
    const onDisplayModeChange = () => setInstalled(isStandalone());

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    media?.addEventListener("change", onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      media?.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") setPromptEvent(null);
    return outcome === "accepted";
  }, [promptEvent]);

  return { canInstall: Boolean(promptEvent) && !installed, installed, install };
}
