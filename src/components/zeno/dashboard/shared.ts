export const today = () => new Date().toISOString().slice(0, 10);

/**
 * Hand-picked, high-chroma hues for spending categories.
 *
 * These are deliberately not theme tokens: the theme's green ramp made every
 * slice look like the same category. Each hue sits at mid lightness (0.58-0.72)
 * so it reads on both the cream light card and the deep green dark card.
 */
export const expenseColors = [
  "oklch(0.64 0.22 25)", // scarlet
  "oklch(0.70 0.15 62)", // tangerine
  "oklch(0.78 0.16 92)", // gold
  "oklch(0.68 0.16 148)", // spring green
  "oklch(0.70 0.11 205)", // lagoon
  "oklch(0.62 0.17 255)", // cobalt
  "oklch(0.58 0.20 300)", // violet
  "oklch(0.66 0.21 348)", // magenta
] as const;

/** Cheap deterministic hash: the same category always lands on the same hue. */
function hashName(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/**
 * Assign a colour to every category name, keyed by name.
 *
 * The hue is picked pseudo-randomly from `expenseColors` by hashing the name, so
 * it never changes between renders or between Home and Stats. If two visible
 * categories hash to the same hue, the later one walks to the next free hue so
 * no two slices ever share a colour.
 */
export function expenseColorMap(names: string[]) {
  const used = new Set<number>();
  const colors = new Map<string, string>();

  for (const name of names) {
    let slot = hashName(name) % expenseColors.length;
    while (used.size < expenseColors.length && used.has(slot)) {
      slot = (slot + 1) % expenseColors.length;
    }
    used.add(slot);
    colors.set(name, expenseColors[slot] ?? expenseColors[0]);
  }

  return colors;
}
