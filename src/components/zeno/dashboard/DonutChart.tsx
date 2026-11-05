import { formatNaira } from "@/lib/budget";

export function DonutChart({ data }: { data: { name: string; amount: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  let running = 0;
  const slices = data.map((item, index) => {
    const dash = total > 0 ? (item.amount / total) * circumference : 0;
    const slice = {
      ...item,
      dash,
      offset: running,
      color: `var(--chart-${(index % 5) + 1})`,
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
      <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--muted)" strokeWidth="24" />
      {slices.map((slice) => (
        <circle
          key={slice.name}
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={slice.color}
          strokeWidth="24"
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
