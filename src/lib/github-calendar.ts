export type ContributionDay = { date: string; count: number; level: number };
export type ContributionCalendar = {
  username: string;
  days: ContributionDay[];
  total: number;
  fetchedAt: string;
};

/** Read only dates, integer counts and levels from GitHub's public calendar.
 * Never send upstream markup to the browser. Fail closed if its format changes.
 */
export function parseContributionCalendar(html: string): ContributionDay[] {
  const labels = new Map<string, number>();
  for (const match of html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/g)) {
    const id = match[1].match(/\bfor="([^"]+)"/)?.[1];
    const label = match[2].replace(/<[^>]*>/g, "").trim();
    const count = label.match(/^([\d,]+) contributions? on /)?.[1];
    if (id && (count || /^No contributions on /.test(label))) {
      labels.set(id, count ? Number(count.replaceAll(",", "")) : 0);
    }
  }
  const days: ContributionDay[] = [];
  for (const match of html.matchAll(/<td\b([^>]*)>/g)) {
    const attrs = match[1];
    const date = attrs.match(/\bdata-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
    if (!date) continue;
    const id = attrs.match(/\bid="([^"]+)"/)?.[1];
    const level = Number(attrs.match(/\bdata-level="([0-4])"/)?.[1]);
    const count = id ? labels.get(id) : undefined;
    if (!Number.isInteger(level) || count === undefined || !Number.isSafeInteger(count) || count < 0) {
      throw new Error("GitHub calendar format changed");
    }
    days.push({ date, count, level });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  if (days.length < 1 || days.length > 371 || new Set(days.map(day => day.date)).size !== days.length) {
    throw new Error("Incomplete GitHub calendar");
  }
  return days;
}
