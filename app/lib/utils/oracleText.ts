/** Render only known oracle notation. Costs/choices in brackets keep their meaning. */
export function normalizeOracleText(text: string): string {
  return text.replace(/\{i1?\}|\{\/i\}/g, "")
    .replace(/\{Battle\}/g, "Battle")
    .replace(/\[Haste\]/g, "Haste")
    .replace(/\/\[/g, "[")
    .replace(/\[(\d+|X)([rbegmdlp]+)\]/g, (_, mana: string, pips: string) => {
      const names: Record<string, string> = { r: "Fire", b: "Water", e: "Earth", g: "Wood", m: "Metal", d: "Dark", l: "Light", p: "Prismite" };
      const counts: Record<string, number> = {};
      for (const pip of pips) counts[pip] = (counts[pip] || 0) + 1;
      return `[${mana}; ${Object.entries(counts).map(([pip, count]) => `${names[pip]} ${count}`).join(", ")}]`;
    })
    .replace(/\s+/g, " ").trim();
}
