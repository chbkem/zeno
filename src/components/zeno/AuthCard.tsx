import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { toast } from "sonner";
import { fb } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthCard() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { auth } = fb();
      if (mode === "up") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      toast.error((err as Error).message.replace("Firebase: ", ""));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    try {
      await signInWithPopup(fb().auth, new GoogleAuthProvider());
    } catch (err) {
      toast.error((err as Error).message.replace("Firebase: ", ""));
    }
  };

  return (
    <div className="w-full max-w-sm rounded-3xl border bg-card p-7 shadow-soft">
      <h2 className="text-2xl font-bold">{mode === "in" ? "Welcome back" : "Create your account"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "in" ? "Sign in to see your money." : "Takes 20 seconds. No wahala."}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "up" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">First name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Password</Label>
          <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}
        </Button>
      </form>
      <Button variant="outline" className="mt-3 w-full" onClick={google}>
        Continue with Google
      </Button>
      <button
        className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
      >
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
