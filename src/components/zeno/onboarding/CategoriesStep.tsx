import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { categories } from "./config";

export function CategoriesStep({
  selected,
  onChange,
  onBack,
  onContinue,
}: {
  selected: string[];
  onChange: (categories: string[]) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const selectedCategories = categories.filter((category) => selected.includes(category.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Where does your money go?</h2>
      </div>

      <ToggleGroup
        type="multiple"
        value={selected}
        onValueChange={onChange}
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
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}
