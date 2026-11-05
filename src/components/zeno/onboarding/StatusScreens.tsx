import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OnboardingLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <Sparkles className="h-10 w-10 animate-pulse text-primary" />
      <p className="text-sm text-muted-foreground">Setting things up...</p>
    </div>
  );
}

export function OnboardingError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
      <h2 className="text-xl font-bold">Unable to load onboarding</h2>
      <p className="max-w-sm break-all text-center text-sm text-muted-foreground">{message}</p>
      <Button onClick={onRetry}>Try Again</Button>
    </div>
  );
}
