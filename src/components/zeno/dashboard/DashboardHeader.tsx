import { Link } from "@tanstack/react-router";
import { LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DashboardHeader({
  month,
  onMonthChange,
  onAdd,
  onSignOut,
}: {
  month: string;
  onMonthChange: (month: string) => void;
  onAdd: () => void;
  onSignOut: () => void;
}) {
  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-4 py-3">
      <Link to="/" className="font-display text-xl font-extrabold text-primary">
        zeno.
      </Link>
      <div className="flex items-center gap-2">
        <Input
          type="month"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className="w-36"
          aria-label="Month"
        />
        <Button variant="ghost" size="icon" onClick={onAdd} aria-label="Add transaction">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onSignOut} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
