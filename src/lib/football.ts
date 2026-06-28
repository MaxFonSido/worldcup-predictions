import { db } from "./db";
import { sendPreGameReminders } from "./email";
import { fixStuckMatches } from "./espn-backup";

const API = "https://api.football-data.org/v4/competitions/WC/matches";
const STALE_MS = 5 * 60 * 1000; // re-sync at most every 5 minutes on page load
const REMINDER_MS = 15 * 60 * 1000; // check reminders at most every 15 min

type ApiTeam = { name: string | null; tla: string | null; crest: string | null };
type ApiMatch = {
  id: number;
  utcDate: string;
  status: string; // SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED | POSTPONED | SUSPENDED | CANCELLED | AWARDED
  stage: string; // GROUP_STAGE | LAST_32 | LAST_16 | QUARTER_FINALS | SEMI_FINALS | THIRD_PLACE | FINAL
  group: string | null;
  venue: string | null;
  homeTeam: ApiTeam;
  awayTeam: ApiTeam;
  score: { winner: string | null; fullTime: { home: number | null; away: number | null } };
};

function resultFromApi(m: ApiMatch): string | null {
  if (m.status === "FINISHED") {
    // score.winner already accounts for extra time and penalty shootouts.
    if (m.score.winner === "HOME_TEAM") return "TEAM_A";
    if (m.score.winner === "AWAY_TEAM") return "TEAM_B";
    if (m.score.winner === "DRAW") return "DRAW";
    // Fallback: derive from scores if winner field is missing
    const h = m.score?.fullTime?.home;
    const a = m.score?.fullTime?.away;
    if (h != null && a != null) {
      if (h > a) return "TEAM_A";
      if (a > h) return "TEAM_B";
      return "DRAW";
    }
    return null;
  }
  if (m.status === "CANCELLED") return "VOID";
  return null; // not played yet, postponed, or in progress
}

export async function syncMatches(): Promise<{ updated: number }> {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) throw new Error("Missing FOOTBALL_DATA_TOKEN");

  // Fetch all matches + a separate call for knockout stages
  // The full endpoint returns null team names for LAST_32+, but the stage-specific endpoint has real names
  const [resAll, resKnockout] = await Promise.all([
    fetch(API, { headers: { "X-Auth-Token": token }, cache: "no-store" }),
    fetch(`${API}?stage=LAST_32`, { headers: { "X-Auth-Token": token }, cache: "no-store" }),
  ]);

  if (!resAll.ok) throw new Error(`football-data responded ${resAll.status}`);

  const data = (await resAll.json()) as { matches: ApiMatch[] };
  const matches = data.matches ?? [];

  // Build a map of knockout match overrides keyed by external ID
  const knockoutOverrides = new Map<number, ApiMatch>();
  if (resKnockout.ok) {
    const knockoutData = (await resKnockout.json()) as { matches: ApiMatch[] };
    for (const m of knockoutData.matches ?? []) {
      knockoutOverrides.set(m.id, m);
    }
  }

  // Merge: use knockout-specific data for team names when available
  const mergedMatches = matches.map((m) => {
    const override = knockoutOverrides.get(m.id);
    if (override) {
      return {
        ...m,
        homeTeam: override.homeTeam?.name ? override.homeTeam : m.homeTeam,
        awayTeam: override.awayTeam?.name ? override.awayTeam : m.awayTeam,
      };
    }
    return m;
  });

  const rows = mergedMatches.map((m) => ({
    external_id: m.id,
    stage: m.stage,
    group_name: m.group,
    venue: m.venue ?? null,
    team_a: m.homeTeam?.name ?? "TBD",
    team_b: m.awayTeam?.name ?? "TBD",
    team_a_code: m.homeTeam?.tla ?? null,
    team_b_code: m.awayTeam?.tla ?? null,
    team_a_crest: m.homeTeam?.crest ?? null,
    team_b_crest: m.awayTeam?.crest ?? null,
    kickoff_utc: m.utcDate,
    allows_draw: m.stage === "GROUP_STAGE",
    status: m.status,
    result: resultFromApi(m),
    score_a: m.score?.fullTime?.home ?? null,
    score_b: m.score?.fullTime?.away ?? null,
    updated_at: new Date().toISOString()
  }));

  if (rows.length > 0) {
    const { error } = await db().from("matches").upsert(rows, { onConflict: "external_id" });
    if (error) throw new Error(error.message);
  }

  await db()
    .from("app_meta")
    .upsert({ key: "last_sync", value: new Date().toISOString() }, { onConflict: "key" });

  return { updated: rows.length };
}

// Called when a page loads. Best-effort: only re-syncs if data is stale,
// and never throws (a feed hiccup must not break the page).
export async function syncIfStale(): Promise<void> {
  try {
    const { data } = await db().from("app_meta").select("value").eq("key", "last_sync").maybeSingle();
    const last = data?.value ? new Date(data.value).getTime() : 0;
    if (Date.now() - last < STALE_MS) return;
    // Debounce immediately so concurrent loads don't all sync at once.
    await db()
      .from("app_meta")
      .upsert({ key: "last_sync", value: new Date().toISOString() }, { onConflict: "key" });
    await syncMatches();

    // ESPN backup: fix matches stuck as IN_PLAY after the game ended.
    await fixStuckMatches().catch(() => {});

    // Pre-game email reminders — check at most every 15 min.
    try {
      const { data: lr } = await db().from("app_meta").select("value").eq("key", "last_reminder_check").maybeSingle();
      const lastReminder = lr?.value ? new Date(lr.value).getTime() : 0;
      if (Date.now() - lastReminder >= REMINDER_MS) {
        await db().from("app_meta").upsert({ key: "last_reminder_check", value: new Date().toISOString() }, { onConflict: "key" });
        await sendPreGameReminders().catch(() => {});
      }
    } catch { /* ignore reminder errors */ }
  } catch (e) {
    console.error("syncIfStale failed (ignored):", e);
  }
}
