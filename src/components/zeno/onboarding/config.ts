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

export const categories = [
  { id: "food", label: "Food" },
  { id: "transport", label: "Transport" },
  { id: "data", label: "Data/Internet" },
  { id: "entertainment", label: "Entertainment" },
  { id: "shopping", label: "Shopping" },
  { id: "health", label: "Health" },
  { id: "education", label: "Education" },
  { id: "other", label: "Other" },
];

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

export function formatNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-NG");
}
