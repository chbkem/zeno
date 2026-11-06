import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/budget";
import { categories, type Answers } from "./config";

export function BudgetStep({
  answers,
  onChange,
  onBack,
  onComplete,
  isSubmitting,
  isBudgetValid,
  submitError,
}: {
  answers: Answers;
  onChange: (answers: Answers) => void;
  onBack: () => void;
  onComplete: () => void;
  isSubmitting: boolean;
  isBudgetValid: boolean;
  submitError: string;
}) {
  const selectedCategories = categories.filter((category) =>
    answers.categories.includes(category.id),
  );

  return (
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
          onChange={(event) => onChange({ ...answers, budget: formatNumber(event.target.value) })}
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
          <p className="text-lg font-bold">{answers.budget ? `₦${answers.budget}` : "Not set"}</p>
        </div>
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <div className="flex gap-2">
        <Button variant="ghost" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={onComplete} disabled={isSubmitting || !isBudgetValid} className="flex-1">
          {isSubmitting ? "Setting up..." : "Complete Onboarding"}
        </Button>
      </div>
    </div>
  );
}
