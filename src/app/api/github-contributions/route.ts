import { parseContributionCalendar, type ContributionCalendar } from "@/lib/github-calendar";

export async function GET(request: Request) {
  const year = new URL(request.url).searchParams.get("year") ?? "rolling";
  const currentYear = new Date().getUTCFullYear();
  if (year !== "rolling" && (!/^\d{4}$/.test(year) || Number(year) < currentYear - 2 || Number(year) > currentYear)) {
    return Response.json({ error: "Invalid calendar year." }, { status: 400 });
  }
  const url = new URL("https://github.com/users/gavin100305/contributions");
  if (year !== "rolling") {
    url.searchParams.set("from", `${year}-01-01`);
    const today = new Date().toISOString().slice(0, 10);
    url.searchParams.set("to", Number(year) === currentYear ? today : `${year}-12-31`);
  }
  try {
    const response = await fetch(url, {
      next: { revalidate: 21_600 },
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "text/html", "User-Agent": "Gavin-Soares-Portfolio" },
    });
    if (!response.ok) throw new Error("GitHub unavailable");
    const today = new Date().toISOString().slice(0, 10);
    const days = parseContributionCalendar(await response.text()).filter(day => day.date <= today && (year === "rolling" || day.date.startsWith(`${year}-`)));
    if (!days.length) throw new Error("No calendar dates");
    const calendar: ContributionCalendar = {
      username: "gavin100305", days,
      total: days.reduce((sum, day) => sum + day.count, 0),
      fetchedAt: new Date().toISOString(),
    };
    return Response.json(calendar, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=21600" } });
  } catch {
    return Response.json({ error: "GitHub activity is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
