import { EXPENSE_CATEGORIES } from "./budget";

/**
 * The broad categories a student picks in onboarding and can change later in
 * Settings. Each one maps onto the transaction categories used in the app.
 */
export const FOCUS_CATEGORIES = [
  { id: "food", label: "Food", matches: ["Food & Snacks"] },
  { id: "transport", label: "Transport", matches: ["Transport"] },
  { id: "data", label: "Data/Internet", matches: ["Data & Airtime"] },
  { id: "entertainment", label: "Entertainment", matches: ["Hangouts"] },
  { id: "shopping", label: "Shopping", matches: ["Fashion"] },
  { id: "health", label: "Health", matches: ["Health"] },
  { id: "education", label: "Education", matches: ["Books & School"] },
  { id: "other", label: "Other", matches: ["Other"] },
] as const;

export type FocusCategoryId = (typeof FOCUS_CATEGORIES)[number]["id"];

/** What the student told us during onboarding, editable from Settings. */
export interface UserProfile {
  monthlyBudget: number;
  categories: FocusCategoryId[];
}

export const EMPTY_PROFILE: UserProfile = { monthlyBudget: 0, categories: [] };

const FOCUS_IDS = new Set<string>(FOCUS_CATEGORIES.map((category) => category.id));

/** Turns a Firestore document into a safe profile, or null when it has no data. */
export function normalizeProfile(value: unknown): UserProfile | null {
  if (!value || typeof value !== "object") return null;

  const data = value as Record<string, unknown>;
  const rawBudget = data["monthlyBudget"];
  const monthlyBudget =
    typeof rawBudget === "number" && Number.isFinite(rawBudget)
      ? Math.max(0, Math.round(rawBudget))
      : 0;
  const rawCategories = data["categories"];
  const categories = Array.isArray(rawCategories)
    ? [
        ...new Set(
          rawCategories.filter(
            (id): id is FocusCategoryId => typeof id === "string" && FOCUS_IDS.has(id),
          ),
        ),
      ]
    : [];

  return monthlyBudget > 0 || categories.length > 0 ? { monthlyBudget, categories } : null;
}

/** Reads the answers saved by the original onboarding flow. */
export function profileFromAnswers(value: unknown): UserProfile | null {
  if (!value || typeof value !== "object") return null;

  const answers = value as Record<string, unknown>;
  const rawBudget = answers["budget"];
  const budget =
    typeof rawBudget === "number"
      ? rawBudget
      : typeof rawBudget === "string"
        ? Number(rawBudget.replace(/,/g, ""))
        : 0;

  return normalizeProfile({ monthlyBudget: budget, categories: answers["categories"] });
}

export function focusCategoryLabels(ids: string[]): string[] {
  const selected = new Set(ids);
  return FOCUS_CATEGORIES.filter((category) => selected.has(category.id)).map(
    (category) => category.label,
  );
}

/** The transaction categories that belong to the student's focus areas. */
export function focusExpenseCategories(ids: string[]): string[] {
  const selected = new Set(ids);
  return FOCUS_CATEGORIES.filter((category) => selected.has(category.id)).flatMap((category) => [
    ...category.matches,
  ]);
}

/** Focus categories first, so the ones the student cares about are easiest to pick. */
export function orderExpenseCategories(ids: string[]): string[] {
  const focused = focusExpenseCategories(ids);
  return [...focused, ...EXPENSE_CATEGORIES.filter((category) => !focused.includes(category))];
}
