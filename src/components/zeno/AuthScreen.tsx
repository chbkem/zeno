import { AuthCard } from "./AuthCard";
import { fb, isFirebaseConfigured } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";

export function AuthScreen() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (!isFirebaseConfigured) { setUser(null); return; }
    return onAuthStateChanged(fb().auth, setUser);
  }, []);

  if (user) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      {/* Auth card - full width, no grid */}
      <AuthCard />
    </div>
  );
}