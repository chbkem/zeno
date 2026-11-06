import { formatNaira } from "@/lib/budget";
import { expenseColorMap, expenseColors } from "./shared";

const radius = 70;
const strokeWidth = 24;
const gap = 6;

export function DonutChart({
  data,
  colors = expenseColorMap(data.map((item) => item.name)),
}: {
  data: { name: string; amount: number }[];
  /** Category colours, keyed by name, so slices match their legend dots. */
  colors?: Map<string, string>;
}) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const circumference = 2 * Math.PI * radius;

  let running = 0;
  const slices = data.map((item) => {
    const dash = total > 0 ? (item.amount / total) * circumference : 0;
    // Tiny slices keep their full arc, otherwise the gap would erase them.
    const inset = dash > gap * 2 ? gap : 0;
    const slice = {
      name: item.name,
      color: colors.get(item.name) ?? expenseColors[0],
      dash: Math.max(dash - inset, 0),
      offset: running + inset / 2,
    };
    running += dash;
    return slice;
  });

  return (
    <svg
      viewBox="0 0 200 200"
      className="h-48 w-48 shrink-0"
      role="img"
      aria-label={`Spending breakdown: ${data
        .map((item) => `${item.name} ${formatNaira(item.amount)}`)
        .join(", ")}`}
    >
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={strokeWidth}
      />
      {slices.map((slice) => (
        <circle
          key={slice.name}
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={slice.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${slice.dash} ${circumference - slice.dash}`}
          strokeDashoffset={-slice.offset}
          transform="rotate(-90 100 100)"
        />
      ))}
      <text x="100" y="98" textAnchor="middle" fill="currentColor" fontSize="18" fontWeight="700">
        {formatNaira(total)}
      </text>
      <text x="100" y="118" textAnchor="middle" fill="var(--muted-foreground)" fontSize="11">
        spent
      </text>
    </svg>
  );
}
