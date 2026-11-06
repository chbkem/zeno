import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { fb, isFirebaseConfigured } from "@/lib/firebase";
import { AuthScreen } from "./AuthScreen";
import { Onboarding } from "./Onboarding";
import { Dashboard, type DashboardPage } from "./Dashboard";
import { Logo } from "./Logo";

// Firebase's auth listener is the source of truth. This module-level cache only
// stops the gate from flashing its splash again when it remounts on a tab change.
// It is only written on the client, so SSR always starts from "unknown".
let cachedUser: User | null | undefined;
let cachedOnboardingUid: string | null = null;
let cachedOnboardingDone = false;

function Splash({ label = "Setting things up..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <Logo className="h-12 w-12 animate-pulse text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Single entry point for the app flow:
 *   loading -> sign in (AuthScreen) -> onboarding (first run only) -> dashboard
 * Every route is wrapped by the same gate, so /stats and /settings behave exactly
 * like "/" instead of showing another copy of the dashboard to signed-out visitors.
 */
export function AppShell({ page = "home" }: { page?: DashboardPage }) {
  const [user, setUser] = useState<User | null | undefined>(cachedUser);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(
    cachedUser ? cachedOnboardingUid === cachedUser.uid && cachedOnboardingDone : false,
  );

  useEffect(() => {
    if (!isFirebaseConfigured) {
      cachedUser = null;
      setUser(null);
      return;
    }

    return onAuthStateChanged(fb().auth, (next) => {
      cachedUser = next;
      setUser(next);

      if (!next) {
        cachedOnboardingUid = null;
        cachedOnboardingDone = false;
        setOnboardingDone(false);
        setCheckingOnboarding(false);
        return;
      }

      // Same account that already resolved (token refresh, tab remount).
      if (cachedOnboardingUid === next.uid) {
        setOnboardingDone(cachedOnboardingDone);
        setCheckingOnboarding(false);
        return;
      }

      // New account: onboarding has to be checked again.
      cachedOnboardingUid = null;
      cachedOnboardingDone = false;
      setOnboardingDone(false);
      setCheckingOnboarding(true);
    });
  }, []);

  const uid = user?.uid;

  useEffect(() => {
    if (!uid || cachedOnboardingUid === uid) return;

    let active = true;
    const ref = doc(fb().db, "users", uid, "onboarding", "status");

    getDoc(ref)
      .then((snap) => {
        if (!active) return;
        cachedOnboardingUid = uid;
        cachedOnboardingDone = snap.data()?.["completed"] === true;
        setOnboardingDone(cachedOnboardingDone);
      })
      .catch((error) => {
        if (!active) return;
        // Onboarding is optional: never trap the user behind a failed read.
        console.warn("Couldn't read onboarding status, skipping onboarding:", error);
        cachedOnboardingUid = uid;
        cachedOnboardingDone = true;
        setOnboardingDone(true);
      })
      .finally(() => {
        if (active) setCheckingOnboarding(false);
      });

    return () => {
      active = false;
    };
  }, [uid]);

  const finishOnboarding = useCallback(() => {
    if (cachedUser) {
      cachedOnboardingUid = cachedUser.uid;
      cachedOnboardingDone = true;
    }
    setOnboardingDone(true);
  }, []);

  if (user === undefined) return <Splash />;
  if (!user) return <AuthScreen />;
  if (checkingOnboarding) return <Splash label="Loading your account..." />;
  if (!onboardingDone) return <Onboarding user={user} onComplete={finishOnboarding} />;

  return <Dashboard user={user} page={page} />;
}
