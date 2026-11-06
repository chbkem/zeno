import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { fb } from "@/lib/firebase";
import { formatNumber } from "@/lib/budget";
import { BudgetStep } from "./onboarding/BudgetStep";
import { CategoriesStep } from "./onboarding/CategoriesStep";
import { OnboardingHeader } from "./onboarding/OnboardingHeader";
import { OnboardingProgress } from "./onboarding/OnboardingProgress";
import { OnboardingError, OnboardingLoading } from "./onboarding/StatusScreens";
import { WelcomeStep } from "./onboarding/WelcomeStep";
import { steps, type Answers, type LoadStatus, type OnboardingDoc } from "./onboarding/config";

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
      // Save the plan separately from the onboarding flag so Settings can edit
      // it later, and write both in one batch so the account never ends up
      // onboarded without a profile.
      const batch = writeBatch(db);
      batch.set(
        doc(db, "users", user.uid, "onboarding", "status"),
        {
          completed: true,
          answers: { categories: answers.categories, budget: budgetAmount },
          step: steps.length,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      batch.set(
        doc(db, "users", user.uid, "settings", "profile"),
        {
          monthlyBudget: budgetAmount,
          categories: answers.categories,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      await batch.commit();
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

  if (status === "checking") return <OnboardingLoading />;

  if (status === "error") {
    return (
      <OnboardingError message={loadError} onRetry={() => setRetryCount((count) => count + 1)} />
    );
  }

  const budgetAmount = Number(answers.budget.replace(/,/g, ""));
  const isBudgetValid = Number.isSafeInteger(budgetAmount) && budgetAmount >= 1000;

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <OnboardingHeader step={step} />

      <main className="mx-auto max-w-xl space-y-8">
        <OnboardingProgress step={step} />

        {step === 1 && <WelcomeStep onContinue={handleContinue} />}

        {step === 2 && (
          <CategoriesStep
            selected={answers.categories}
            onChange={(categories) => setAnswers((previous) => ({ ...previous, categories }))}
            onBack={() => setStep(1)}
            onContinue={handleContinue}
          />
        )}

        {step === 3 && (
          <BudgetStep
            answers={answers}
            onChange={setAnswers}
            onBack={() => setStep(2)}
            onComplete={handleComplete}
            isSubmitting={isSubmitting}
            isBudgetValid={isBudgetValid}
            submitError={submitError}
          />
        )}
      </main>
    </div>
  );
}
