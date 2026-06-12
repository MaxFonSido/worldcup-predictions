import { SupabaseClient } from "@supabase/supabase-js";

// All-time World Cup titles — used ONLY to sort the dropdown (most successful first).
// Countries not listed here count as 0 and fall to the bottom (alphabetically).
const TITLES: Record<string, number> = {
  Brazil: 5,
  Germany: 4,
  Italy: 4,
  Argentina: 3,
  France: 2,
  Uruguay: 2,
  England: 1,
  Spain: 1
};

export function titlesFor(country: string): number {
  return TITLES[country] ?? 0;
}

// The participating countries = every team that appears in a group-stage fixture.
// Deriving it from the synced fixtures means the list is always exactly the real
// 2026 participants — no hand-maintained country list to get wrong.
export async function getParticipants(db: SupabaseClient): Promise<string[]> {
  const { data } = await db.from("matches").select("team_a, team_b").eq("stage", "GROUP_STAGE");

  const set = new Set<string>();
  for (const m of data ?? []) {
    if (m.team_a && m.team_a !== "TBD") set.add(m.team_a);
    if (m.team_b && m.team_b !== "TBD") set.add(m.team_b);
  }

  return Array.from(set).sort((a, b) => {
    const byTitles = titlesFor(b) - titlesFor(a); // titles descending
    return byTitles !== 0 ? byTitles : a.localeCompare(b); // then A→Z
  });
}

// Champion-pick lock state.
// Normally picks lock at the first kickoff. The organizer can REOPEN them by setting
// app_meta "champion_closes_at" to a future time — that override then governs the lock,
// and re-locks automatically once it passes.
export async function getChampionLock(
  db: SupabaseClient
): Promise<{ open: boolean; reopened: boolean; closesAt: string | null }> {
  const [{ data: meta }, { data: first }] = await Promise.all([
    db.from("app_meta").select("value").eq("key", "champion_closes_at").maybeSingle(),
    db.from("matches").select("kickoff_utc").order("kickoff_utc", { ascending: true }).limit(1)
  ]);

  const closesAt = (meta?.value as string | null) ?? null;
  const override = closesAt ? new Date(closesAt).getTime() : null;
  const firstKickoff = first && first.length ? new Date(first[0].kickoff_utc).getTime() : null;

  const deadline = override ?? firstKickoff; // override wins when present
  const open = deadline === null ? true : Date.now() < deadline;
  const reopened = override !== null && Date.now() < override;

  return { open, reopened, closesAt };
}
