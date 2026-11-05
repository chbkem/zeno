import { formatNaira } from "@/lib/budget";

export function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-primary-foreground/10 p-3">
      <div className="flex items-center gap-1.5 text-xs dark:text-foreground  opacity-80">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold">{formatNaira(value)}</p>
    </div>
  );
}
