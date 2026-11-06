export type Answers = {
  categories: string[];
  budget: string;
};

export type LoadStatus = "checking" | "ready" | "error";

export type OnboardingDoc = {
  completed?: boolean;
  answers?: {
    categories?: unknown;
    budget?: unknown;
  };
};

export { FOCUS_CATEGORIES as categories } from "@/lib/profile";

export const steps = [
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
