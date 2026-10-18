import type { ContributionDay, GitHubActivity } from "@/lib/github-activity";

// Public contribution counts, refreshed hourly by the upstream service and Next.
export async function GET() {
  try {
    const response = await fetch("https://github-contributions-api.jogruber.de/v4/gavin100305", {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error("Contribution service unavailable");
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("contributions" in payload) || !Array.isArray(payload.contributions)) throw new Error("Invalid contribution response");
    const through = new Date().toISOString().slice(0, 10);
    const days: ContributionDay[] = payload.contributions.filter((day): day is ContributionDay =>
      day && typeof day.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day.date) &&
      Number.isInteger(day.count) && day.count >= 0 && Number.isInteger(day.level) && day.level >= 0 && day.level <= 4 && day.date <= through,
    ).sort((a, b) => a.date.localeCompare(b.date));
    if (!days.length) throw new Error("No contribution history returned");
    const activity: GitHubActivity = { username: "gavin100305", through, days };
    return Response.json(activity, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return Response.json({ error: "GitHub activity is temporarily unavailable." }, { status: 503 });
  }
}
