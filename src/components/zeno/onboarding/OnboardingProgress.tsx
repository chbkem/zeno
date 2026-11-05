import { steps } from "./config";

export function OnboardingProgress({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Step {step} of {steps.length}
      </p>
      <p className="text-sm font-medium">{Math.round((step / steps.length) * 100)}% complete</p>
    </div>
  );
}
