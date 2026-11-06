import { describe, expect, it } from "vitest";
import { EXPENSE_CATEGORIES } from "./budget";
import {
  normalizeProfile,
  orderExpenseCategories,
  profileFromAnswers,
  focusCategoryLabels,
} from "./profile";

describe("profile", () => {
  it("keeps only known categories and drops duplicates", () => {
    const profile = normalizeProfile({
      monthlyBudget: 25000.6,
      categories: ["food", "food", "nope", "transport"],
    });

    expect(profile).toEqual({ monthlyBudget: 25001, categories: ["food", "transport"] });
  });

  it("returns null when the profile has no usable data", () => {
    expect(normalizeProfile({ monthlyBudget: 0, categories: [] })).toBeNull();
    expect(normalizeProfile(null)).toBeNull();
  });

  it("reads the original onboarding answer shape, including formatted budgets", () => {
    expect(profileFromAnswers({ budget: "35,000", categories: ["data", "education"] })).toEqual({
      monthlyBudget: 35000,
      categories: ["data", "education"],
    });
  });

  it("puts focus categories first without losing any expense category", () => {
    const ordered = orderExpenseCategories(["transport", "food"]);

    expect(ordered.slice(0, 2)).toEqual(["Food & Snacks", "Transport"]);
    expect(ordered).toHaveLength(EXPENSE_CATEGORIES.length);
    expect(new Set(ordered)).toEqual(new Set(EXPENSE_CATEGORIES));
  });

  it("turns stored ids into readable labels for the AI", () => {
    expect(focusCategoryLabels(["entertainment", "other"])).toEqual(["Entertainment", "Other"]);
  });
});
