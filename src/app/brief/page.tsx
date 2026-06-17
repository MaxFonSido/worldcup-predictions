import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import Nav from "@/components/Nav";
import type { DigestContent } from "@/lib/email";

export const dynamic = "force-dynamic";

const TZ = "America/New_York";

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: TZ,
    }) + " ET";
  } catch {
    return "";
  }
}

function fmtStage(stage: string, group: string | null): string {
  if (group) return group.replace(/^GROUP[_\s]*/i, "Group ");
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function MorningBriefPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const lang = getLang();
  const tr = t(lang);
  const supabase = db();

  // Get today's date in ET
  const today = new Date().toLocaleDateString("en-CA", { timeZone: TZ });

  const { data: row } = await supabase
    .from("daily_digest")
    .select("content, created_at")
    .eq("date", today)
    .maybeSingle();

  const digest: DigestContent | null = row?.content ? JSON.parse(row.content) : null;

  return (
    <>
      <Nav lang={lang} displayName={session.displayName} userId={session.userId} active="brief" />
      <main className="mx-auto max-w-2xl px-5 py-6">

        {/* Header */}
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-pitch to-pitch-deep p-6 text-white text-center">
          <div className="text-xs font-bold tracking-widest text-gold uppercase">Family World Cup · 2026</div>
          <div className="mt-2 text-2xl font-extrabold">☀️ Morning Brief</div>
          {digest && (
            <div className="mt-1 text-sm text-white/70">{digest.date}</div>
          )}
        </div>

        {/* No digest yet */}
        {!digest && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-card">
            <div className="text-4xl mb-3">☀️</div>
            <div className="font-semibold text-pitch-deep">Check back at 7 AM!</div>
            <p className="mt-2 text-sm text-muted">
              The Morning Brief is generated fresh each day at 7 AM Eastern — with today's matches, win probabilities, and AI analysis.
            </p>
          </div>
        )}

        {digest && (
          <div className="space-y-4">
            {/* Match cards */}
            {digest.matches.map((m, i) => (
              <div key={i} className="rounded-2xl bg-white shadow-card overflow-hidden">
                {/* Match header */}
                <div className="px-5 pt-5 pb-4">
                  <div className="text-xs font-bold tracking-wide text-muted uppercase mb-3">
                    {fmtStage(m.stage, m.group_name)}
                    {m.weather && (
                      <span className="ml-2 font-normal normal-case">
                        · {m.weather.icon} {m.weather.temp}°F
                        {m.venue ? ` · ${m.venue}` : ""}
                      </span>
                    )}
                  </div>

                  {/* Teams */}
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-pitch-deep">{m.team_a}</div>
                    <div className="text-sm font-semibold text-muted px-3">vs</div>
                    <div className="text-lg font-bold text-pitch-deep text-right">{m.team_b}</div>
                  </div>

                  <div className="mt-1 text-xs text-muted text-center">{fmtTime(m.kickoff_utc)}</div>

                  {/* Win probabilities */}
                  {m.odds && (
                    <div className="mt-4 grid grid-cols-3 gap-2 bg-surface rounded-xl p-3">
                      <div className="text-center">
                        <div className={`text-xl font-extrabold ${m.odds.homeWin >= m.odds.awayWin ? "text-pitch" : "text-ink/50"}`}>
                          {m.odds.homeWin}%
                        </div>
                        <div className="text-[10px] text-muted mt-0.5">{m.team_a}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gold">{m.odds.draw}%</div>
                        <div className="text-[10px] text-muted mt-0.5">Draw</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-xl font-extrabold ${m.odds.awayWin > m.odds.homeWin ? "text-pitch" : "text-ink/50"}`}>
                          {m.odds.awayWin}%
                        </div>
                        <div className="text-[10px] text-muted mt-0.5">{m.team_b}</div>
                      </div>
                    </div>
                  )}

                  {/* AI Analysis */}
                  {m.analysis?.en && (
                    <div className="mt-4 border-t border-line pt-4">
                      <div className="text-[10px] font-bold tracking-widest text-muted uppercase mb-2">AI Analysis</div>
                      <p className="text-sm text-ink/80 leading-relaxed">{m.analysis.en}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Family Highlights */}
            {(digest.family.bestPredictor || digest.family.hottestStreak || digest.family.topThree.length > 0) && (
              <div className="rounded-2xl bg-white shadow-card p-5">
                <div className="text-xs font-bold tracking-widest text-muted uppercase mb-4">
                  👨‍👩‍👧‍👦 Family Highlights
                </div>
                <div className="space-y-3">
                  {digest.family.bestPredictor && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <div className="text-xs text-muted">Best Predictor</div>
                        <div className="font-semibold">{digest.family.bestPredictor.name}</div>
                        <div className="text-xs text-muted">{digest.family.bestPredictor.correct} correct picks</div>
                      </div>
                    </div>
                  )}
                  {digest.family.hottestStreak && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔥</span>
                      <div>
                        <div className="text-xs text-muted">Hottest Streak</div>
                        <div className="font-semibold">{digest.family.hottestStreak.name}</div>
                        <div className="text-xs text-muted">{digest.family.hottestStreak.streak} in a row</div>
                      </div>
                    </div>
                  )}
                  {digest.family.topThree.length > 0 && (
                    <div>
                      <div className="text-xs text-muted mb-2">Leaderboard</div>
                      {digest.family.topThree.map((p, i) => (
                        <div key={p.name} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2">
                            <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                            <span className="font-medium">{p.name}</span>
                          </div>
                          <span className="text-sm font-bold text-gold">{p.tokens} 🪙</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-center text-xs text-muted pb-4">
              Generated at 7 AM · Updates tomorrow morning
            </p>
          </div>
        )}
      </main>
    </>
  );
}
