import { steps } from "./config";

export function OnboardingHeader({ step }: { step: number }) {
  const currentStep = steps[step - 1] ?? steps[0]!;

  return (
    <header className="mx-auto mb-12 max-w-xl text-center">
      <span className="font-display text-3xl font-extrabold text-primary">zeno.</span>
      <h1 className="mt-4 text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
        {currentStep.title}
      </h1>
      <p className="mt-4 text-base text-muted-foreground md:text-lg">{currentStep.text}</p>
    </header>
  );
}
