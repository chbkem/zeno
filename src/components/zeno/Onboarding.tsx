import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { Sparkles, Wallet } from "lucide-react";
import { fb } from "@/lib/firebase";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

type Answers = {
  categories: string[];
  budget: string;
};

type LoadStatus = "checking" | "ready" | "error";

type OnboardingDoc = {
  completed?: boolean;
  answers?: {
    categories?: unknown;
    budget?: unknown;
  };
};

const categories = [
  { id: "food", label: "Food" },
  { id: "transport", label: "Transport" },
  { id: "data", label: "Data/Internet" },
  { id: "entertainment", label: "Entertainment" },
  { id: "shopping", label: "Shopping" },
  { id: "health", label: "Health" },
  { id: "education", label: "Education" },
  { id: "other", label: "Other" },
];

const steps = [
  {
    title: "Welcome to Zeno!",
    text: "Track your allowance, set budgets, and get AI-powered tips to stretch your money till month end.",
  },
  {
    title: "Select Your Categories",
    text: "Tell us which categories you spend on most. This helps Zeno give you relevant tips.",
  },
  {
    title: "Set Your Budget",
    text: "Set your monthly budget to get spending alerts before you overspend.",
  },
];

function formatNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-NG");
}

export function Onboarding({ user, onComplete }: { user: User; onComplete: () => void }) {
  const { db } = fb();

  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({ categories: [], budget: "" });
  const [status, setStatus] = useState<LoadStatus>("checking");
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Prefill from whatever was saved before (so a refresh doesn't lose progress).
  useEffect(() => {
    let active = true;
    setStatus("checking");
    setLoadError("");

    getDoc(doc(db, "users", user.uid, "onboarding", "status"))
      .then((snapshot) => {
        if (!active) return;

        const data = snapshot.data() as OnboardingDoc | undefined;
        if (data?.completed === true) {
          onComplete();
          return;
        }

        const saved = data?.answers;
        const savedCategories = Array.isArray(saved?.categories)
          ? saved.categories.filter((value): value is string => typeof value === "string")
          : [];
        const savedBudget = saved?.budget;

        if (savedCategories.length > 0 || savedBudget !== undefined) {
          setAnswers({
            categories: savedCategories,
            budget:
              typeof savedBudget === "number"
                ? formatNumber(String(savedBudget))
                : typeof savedBudget === "string"
                  ? formatNumber(savedBudget)
                  : "",
          });
        }

        setStatus("ready");
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to load onboarding status:", error);
        setLoadError(error instanceof Error ? error.message : "An unexpected error occurred.");
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [db, user.uid, onComplete, retryCount]);

  const handleContinue = () => setStep((current) => Math.min(current + 1, steps.length));

  const handleComplete = async () => {
    const budgetAmount = Number(answers.budget.replace(/,/g, ""));

    if (!Number.isSafeInteger(budgetAmount) || budgetAmount < 1000) {
      setSubmitError("Please enter a valid budget of at least ₦1,000.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await setDoc(
        doc(db, "users", user.uid, "onboarding", "status"),
        {
          completed: true,
          answers: { categories: answers.categories, budget: budgetAmount },
          step: steps.length,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      onComplete();
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save your onboarding details.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "checking") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Sparkles className="h-10 w-10 animate-pulse text-primary" />
        <p className="text-sm text-muted-foreground">Setting things up...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <h2 className="text-xl font-bold">Unable to load onboarding</h2>
        <p className="max-w-sm break-all text-center text-sm text-muted-foreground">{loadError}</p>
        <Button onClick={() => setRetryCount((count) => count + 1)}>Try Again</Button>
      </div>
    );
  }

  const currentStep = steps[step - 1] ?? steps[0]!;
  const budgetAmount = Number(answers.budget.replace(/,/g, ""));
  const isBudgetValid = Number.isSafeInteger(budgetAmount) && budgetAmount >= 1000;
  const selectedCategories = categories.filter((category) =>
    answers.categories.includes(category.id),
  );

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <header className="mx-auto mb-12 max-w-xl text-center">
        <span className="font-display text-3xl font-extrabold text-primary">zeno.</span>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
          {currentStep.title}
        </h1>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">{currentStep.text}</p>
      </header>

      <main className="mx-auto max-w-xl space-y-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Step {step} of {steps.length}
          </p>
          <p className="text-sm font-medium">{Math.round((step / steps.length) * 100)}% complete</p>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-8 text-center">
            <div className="flex items-center justify-center">
              <Sparkles className="h-16 w-16 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Let&apos;s personalize your Zeno experience.
            </p>
            <Button onClick={handleContinue} className="w-full">
              Get Started
            </Button>
          </div>
        )}

        {/* Step 2: Categories */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Where does your money go?</h2>
            </div>

            <ToggleGroup
              type="multiple"
              value={answers.categories}
              onValueChange={(values) =>
                setAnswers((previous) => ({ ...previous, categories: values }))
              }
              className="flex flex-wrap justify-start gap-2"
            >
              {categories.map((category) => (
                <ToggleGroupItem
                  key={category.id}
                  value={category.id}
                  aria-label={category.label}
                  className="rounded-md border px-4 py-2 text-sm"
                >
                  {category.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {selectedCategories.length > 0 && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-2 text-sm text-muted-foreground">Selected categories:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((category) => (
                    <span
                      key={category.id}
                      className="rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {category.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleContinue} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Budget */}
        {step === 3 && (
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-medium" htmlFor="budget">
                Monthly Budget (₦)
              </label>
              <Input
                id="budget"
                type="text"
                inputMode="numeric"
                value={answers.budget}
                onChange={(event) =>
                  setAnswers((previous) => ({
                    ...previous,
                    budget: formatNumber(event.target.value),
                  }))
                }
                placeholder="e.g. 50,000"
              />
              <p className="text-xs text-muted-foreground">
                Set your monthly spending limit. Zeno will help you monitor your expenses.
              </p>
            </div>

            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-semibold">Your onboarding summary</p>
              <div>
                <p className="text-xs text-muted-foreground">Categories</p>
                <p className="text-sm">
                  {selectedCategories.length > 0
                    ? selectedCategories.map((category) => category.label).join(", ")
                    : "No categories selected"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monthly budget</p>
                <p className="text-lg font-bold">
                  {answers.budget ? `₦${answers.budget}` : "Not set"}
                </p>
              </div>
            </div>

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(2)} disabled={isSubmitting}>
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isSubmitting || !isBudgetValid}
                className="flex-1"
              >
                {isSubmitting ? "Setting up..." : "Complete Onboarding"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
