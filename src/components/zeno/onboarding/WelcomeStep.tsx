import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="space-y-8 text-center">
      <div className="flex items-center justify-center">
        <Sparkles className="h-16 w-16 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">Let&apos;s personalize your Zeno experience.</p>
      <Button onClick={onContinue} className="w-full">
        Get Started
      </Button>
    </div>
  );
}
