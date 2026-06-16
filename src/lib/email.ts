import { Resend } from "resend";
import { db } from "@/lib/db";
import { createHmac } from "crypto";

const resend = () => new Resend(process.env.RESEND_API_KEY);

const APP_URL = "https://worldcup-predictions-psi.vercel.app";
const FROM = "World Cup Predictions <worldcup@havenixsolutions.com>";
const TZ = "America/New_York"; // all email scheduling uses Eastern Time

// Simple HMAC token for unsubscribe links (no DB lookup needed).
function unsubToken(userId: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET ?? "s")
    .update(userId)
    .digest("hex")
    .slice(0, 16);
}

// Get start and end of "today" in Eastern Time, as UTC ISO strings.
// The World Cup runs June–July = always EDT (UTC-4).
function todayET(): { start: string; end: string } {
  const now = new Date();
  const etDate = now.toLocaleDateString("en-CA", { timeZone: TZ }); // "2026-06-14"
  // Midnight ET in UTC: June–July is EDT = UTC-4, so add 4 hours
  const startUTC = new Date(`${etDate}T04:00:00.000Z`);
  // End of day ET in UTC: 23:59:59 ET = 03:59:59 UTC next day
  const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start: startUTC.toISOString(), end: endUTC.toISOString() };
}

export function unsubLink(userId: string): string {
  return `${APP_URL}/api/unsubscribe?uid=${userId}&tok=${unsubToken(userId)}`;
}

export function verifyUnsub(userId: string, tok: string): boolean {
  return tok === unsubToken(userId);
}

type Match = {
  team_a: string;
  team_b: string;
  team_a_code: string | null;
  team_b_code: string | null;
  kickoff_utc: string;
  stage: string;
  group_name: string | null;
  venue: string | null;
};

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: TZ
    }) + " ET";
  } catch {
    return "";
  }
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: TZ
    });
  } catch {
    return "";
  }
}

function fmtStage(stage: string, group: string | null): string {
  if (group) return group.replace(/^GROUP[_\s]*/i, "Group ");
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Welcome email (sent immediately on subscribe) ────────────
function welcomeHtml(matches: Match[], userId: string): string {
  const hasMatches = matches.length > 0;
  const rows = matches
    .map(
      (m) =>
        `<tr>
          <td style="padding:12px 16px;border-bottom:1px solid #E6E8E3">
            <strong>${m.team_a} vs ${m.team_b}</strong><br>
            <span style="color:#6B7A70;font-size:13px">${fmtTime(m.kickoff_utc)} · ${fmtStage(m.stage, m.group_name)}${m.venue ? ` · ${m.venue}` : ""}</span>
          </td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <div style="background:linear-gradient(180deg,#0E7A4F,#093A2A);border-radius:16px;padding:24px;color:#fff;text-align:center">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#D9A521">FAMILY WORLD CUP · 2026</div>
        <div style="font-size:24px;font-weight:800;margin-top:10px">You're all set! ⚽</div>
        <div style="font-size:14px;color:#CFE5DA;margin-top:6px">Match reminders are now on.</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:20px;margin-top:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
        <p style="font-size:14px;color:#14201A;margin:0">Here's what you'll get:</p>
        <p style="font-size:13px;color:#6B7A70;margin:8px 0 0">☀️ <strong>Morning email</strong> — today's matches and kickoff times</p>
        <p style="font-size:13px;color:#6B7A70;margin:6px 0 0">⏰ <strong>1-hour reminder</strong> — only for matches you haven't bet on yet</p>
      </div>
      ${hasMatches ? `
      <div style="margin-top:16px">
        <div style="font-size:13px;font-weight:700;color:#6B7A70;letter-spacing:1px;margin-bottom:8px">REMAINING TODAY</div>
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
          ${rows}
        </table>
      </div>` : ""}
      <div style="text-align:center;margin-top:20px">
        <a href="${APP_URL}" style="display:inline-block;background:#0E7A4F;color:#fff;font-weight:700;padding:12px 32px;border-radius:30px;text-decoration:none;font-size:15px">Open the App</a>
      </div>
      <p style="text-align:center;font-size:11px;color:#6B7A70;margin-top:24px">
        <a href="${unsubLink(userId)}" style="color:#6B7A70">Unsubscribe</a>
      </p>
    </div>`;
}

// ─── Send welcome email ───────────────────────────────────────
export async function sendWelcomeEmail(userId: string, email: string): Promise<boolean> {
  const supabase = db();
  const now = new Date();
  const { start, end } = todayET();

  // Get remaining matches today ET (only those not yet kicked off)
  const { data: matches } = await supabase
    .from("matches")
    .select("team_a, team_b, team_a_code, team_b_code, kickoff_utc, stage, group_name, venue")
    .gt("kickoff_utc", now.toISOString())
    .lte("kickoff_utc", end)
    .order("kickoff_utc", { ascending: true });

  try {
    await resend().emails.send({
      from: FROM,
      to: email,
      subject: "✅ You're subscribed — match reminders are on!",
      html: welcomeHtml((matches ?? []) as Match[], userId)
    });
    return true;
  } catch (e) {
    console.error("Welcome email failed for", email, e);
    return false;
  }
}

// ─── Morning digest ───────────────────────────────────────────
// ─── Types for enriched digest ────────────────────────────────
type EnrichedMatch = Match & {
  homeFlag: string;
  awayFlag: string;
  weather: { city: string; temp: number; icon: string } | null;
  odds: { homeWin: number; draw: number; awayWin: number } | null;
};

import {
  flagFor,
  getVenueWeather,
  getYesterdayResults,
  getFamilyHighlights,
  type YesterdayMatch,
  type FamilyHighlights
} from "./email-enrich";

import { fetchMatchOdds } from "./email-odds";

function digestHtml(
  matches: EnrichedMatch[],
  yesterday: YesterdayMatch[],
  family: FamilyHighlights,
  userId: string
): string {
  const date = matches.length ? fmtDate(matches[0].kickoff_utc) : "Today";

  // Today's match cards
  const matchCards = matches
    .map((m) => {
      const weatherLine = m.weather
        ? `🏟️ ${m.venue ?? ""}${m.weather.city ? `, ${m.weather.city}` : ""} &nbsp;·&nbsp; ${m.weather.icon} ${m.weather.temp}°F`
        : m.venue
        ? `🏟️ ${m.venue}`
        : "";

      const oddsSection = m.odds
        ? `<div style="margin-top:14px;background:#f8f7f2;border-radius:14px;padding:14px 16px">
            <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#9A8A6B;margin-bottom:8px">EY VAY PREDICTION</div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="text-align:center;flex:1"><div style="font-size:24px;font-weight:800;color:${m.odds.homeWin >= m.odds.awayWin ? "#0E7A4F" : "#6B7A70"}">${m.odds.homeWin}%</div><div style="font-size:11px;color:#6B7A70;margin-top:2px">${m.homeFlag} ${m.team_a}</div></div>
              <div style="text-align:center;width:60px"><div style="font-size:14px;font-weight:700;color:#D9A521">${m.odds.draw}%</div><div style="font-size:10px;color:#9A8A6B;margin-top:2px">Draw</div></div>
              <div style="text-align:center;flex:1"><div style="font-size:24px;font-weight:800;color:${m.odds.awayWin > m.odds.homeWin ? "#0E7A4F" : "#6B7A70"}">${m.odds.awayWin}%</div><div style="font-size:11px;color:#6B7A70;margin-top:2px">${m.team_b} ${m.awayFlag}</div></div>
            </div>
            <div style="display:flex;gap:3px;height:6px;border-radius:3px;overflow:hidden;margin-top:10px">
              <div style="width:${m.odds.homeWin}%;background:${m.odds.homeWin >= m.odds.awayWin ? "#0E7A4F" : "#C4CDCA"};border-radius:3px"></div>
              <div style="width:${m.odds.draw}%;background:#D9A521;border-radius:3px"></div>
              <div style="width:${m.odds.awayWin}%;background:${m.odds.awayWin > m.odds.homeWin ? "#0E7A4F" : "#C4CDCA"};border-radius:3px"></div>
            </div>
          </div>`
        : "";

      return `
      <div style="background:#fff;border-radius:16px;padding:20px;margin-top:10px;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
        ${weatherLine ? `<div style="text-align:center;font-size:12px;color:#9A8A6B;margin-bottom:12px">${weatherLine}</div>` : ""}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-size:11px;font-weight:700;letter-spacing:1px;color:#6B7A70">${fmtStage(m.stage, m.group_name).toUpperCase()}</span>
          <span style="background:rgba(14,122,79,0.08);color:#0E7A4F;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">${fmtTime(m.kickoff_utc)}</span>
        </div>
        <div style="font-size:18px;font-weight:700;color:#14201A;text-align:center">
          ${m.homeFlag} ${m.team_a} &nbsp;vs&nbsp; ${m.team_b} ${m.awayFlag}
        </div>
        ${oddsSection}
      </div>`;
    })
    .join("");

  // Yesterday's results
  let yesterdaySection = "";
  if (yesterday.length > 0) {
    const totalGoals = yesterday.reduce((s, m) => s + m.homeScore + m.awayScore, 0);
    const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: TZ
    });
    const resultCards = yesterday
      .map((m) => {
        const scoreColor = m.isDraw ? "#D9A521" : "#0E7A4F";
        return `
        <div style="background:#fff;border-radius:14px;padding:14px 16px;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:15px;font-weight:700">${m.homeFlag} ${m.homeTeam}</span>
            <span style="font-size:22px;font-weight:800;color:${scoreColor}">${m.homeScore} – ${m.awayScore}</span>
            <span style="font-size:15px;font-weight:700">${m.awayTeam} ${m.awayFlag}</span>
          </div>
          ${m.headline ? `<div style="margin-top:8px;font-size:12px;color:#6B7A70;line-height:1.6">${m.headline}</div>` : ""}
        </div>`;
      })
      .join("");

    yesterdaySection = `
      <div style="margin:28px 0;border-top:2px solid #E6E8E3"></div>
      <div style="text-align:center;margin-bottom:18px">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#9A8A6B">YESTERDAY'S RECAP</div>
        <div style="font-size:18px;font-weight:800;color:#14201A;margin-top:4px">${yesterdayDate}${totalGoals > 0 ? ` — ${totalGoals} Goals!` : ""}</div>
      </div>
      ${resultCards}`;
  }

  // Family highlights
  let familySection = "";
  const highlights: string[] = [];
  if (family.bestPredictor) {
    highlights.push(`🎯 <strong>Best predictor yesterday:</strong> ${family.bestPredictor.name} — ${family.bestPredictor.correct} of ${family.bestPredictor.total} correct!`);
  }
  if (family.biggestUpset) {
    highlights.push(`😬 <strong>Biggest upset:</strong> Only ${family.biggestUpset.correctCount} of ${family.biggestUpset.totalPlayers} predicted ${family.biggestUpset.match} correctly`);
  }
  if (family.hottestStreak && family.hottestStreak.streak >= 2) {
    highlights.push(`🔥 <strong>Hottest streak:</strong> ${family.hottestStreak.name} is on a ${family.hottestStreak.streak}-game streak!`);
  }
  if (family.topThree.length > 0) {
    const medals = ["🥇", "🥈", "🥉"];
    const lb = family.topThree.map((t, i) => `${medals[i] ?? ""} ${t.name} — ${t.tokens} ⭐`).join("<br>");
    highlights.push(`<div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#D9A521;margin-bottom:6px">LEADERBOARD</div><div style="font-size:14px;line-height:2">${lb}</div>`);
  }

  if (highlights.length > 0) {
    const items = highlights
      .map((h) => `<div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:12px 14px;margin-bottom:8px;font-size:13px">${h}</div>`)
      .join("");
    familySection = `
      <div style="margin:24px 0 16px;border-top:2px solid #E6E8E3"></div>
      <div style="background:linear-gradient(135deg,#0E7A4F 0%,#0B5138 100%);border-radius:16px;padding:20px;color:#fff">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#D9A521;text-align:center;margin-bottom:14px">FAMILY HIGHLIGHTS</div>
        ${items}
      </div>`;
  }

  // ── Farsi section (RTL) ──
  const faMatchCards = matches
    .map((m) => {
      const oddsFA = m.odds
        ? `<div style="margin-top:12px;background:#f8f7f2;border-radius:14px;padding:12px 14px">
            <div style="font-size:10px;font-weight:700;color:#9A8A6B;margin-bottom:6px;text-align:center">انتخابات ای وای</div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="text-align:center;flex:1"><div style="font-size:20px;font-weight:800;color:${m.odds.homeWin >= m.odds.awayWin ? "#0E7A4F" : "#6B7A70"}">${m.odds.homeWin}%</div><div style="font-size:11px;color:#6B7A70">${m.homeFlag}</div></div>
              <div style="text-align:center;width:50px"><div style="font-size:13px;font-weight:700;color:#D9A521">${m.odds.draw}%</div><div style="font-size:10px;color:#9A8A6B">مساوی</div></div>
              <div style="text-align:center;flex:1"><div style="font-size:20px;font-weight:800;color:${m.odds.awayWin > m.odds.homeWin ? "#0E7A4F" : "#6B7A70"}">${m.odds.awayWin}%</div><div style="font-size:11px;color:#6B7A70">${m.awayFlag}</div></div>
            </div>
          </div>`
        : "";
      return `
      <div style="background:#fff;border-radius:14px;padding:14px 16px;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:11px;font-weight:700;color:#6B7A70">${fmtStage(m.stage, m.group_name).toUpperCase()}</span>
          <span style="font-size:12px;font-weight:600;color:#0E7A4F">${fmtTime(m.kickoff_utc)}</span>
        </div>
        <div style="font-size:16px;font-weight:700;color:#14201A;text-align:center">${m.homeFlag} ${m.team_a} &nbsp;مقابل&nbsp; ${m.team_b} ${m.awayFlag}</div>
        ${oddsFA}
      </div>`;
    })
    .join("");

  const faYesterday = yesterday.length > 0
    ? `<div style="font-size:11px;font-weight:700;color:#9A8A6B;text-align:center;margin:12px 0 8px">نتایج دیروز</div>` +
      yesterday.map((m) => `
        <div style="background:#fff;border-radius:12px;padding:10px 14px;margin-bottom:6px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:14px;font-weight:700">${m.homeFlag} ${m.homeTeam}</span>
            <span style="font-size:18px;font-weight:800;color:${m.isDraw ? "#D9A521" : "#0E7A4F"}">${m.homeScore} – ${m.awayScore}</span>
            <span style="font-size:14px;font-weight:700">${m.awayTeam} ${m.awayFlag}</span>
          </div>
        </div>`).join("")
    : "";

  const faFamily = family.topThree.length > 0
    ? `<div style="background:linear-gradient(135deg,#0E7A4F,#0B5138);border-radius:14px;padding:16px;color:#fff;margin-top:10px">
        <div style="font-size:11px;font-weight:700;color:#D9A521;text-align:center;margin-bottom:10px">برترین‌های خانواده</div>
        ${family.bestPredictor ? `<div style="background:rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;margin-bottom:6px;font-size:13px">🎯 بهترین پیش‌بینی دیروز: <strong>${family.bestPredictor.name}</strong> — ${family.bestPredictor.correct} از ${family.bestPredictor.total} درست!</div>` : ""}
        ${family.hottestStreak && family.hottestStreak.streak >= 2 ? `<div style="background:rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;margin-bottom:6px;font-size:13px">🔥 داغ‌ترین: <strong>${family.hottestStreak.name}</strong> — ${family.hottestStreak.streak} پیش‌بینی درست پشت سر هم!</div>` : ""}
        <div style="background:rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;font-size:13px">
          <div style="font-size:11px;font-weight:700;color:#D9A521;margin-bottom:4px">جدول</div>
          ${family.topThree.map((t, i) => `${"🥇🥈🥉"[i] ?? ""} ${t.name} — ${t.tokens} ⭐`).join("<br>")}
        </div>
      </div>`
    : "";

  const farsiSection = `
    <div style="margin:28px 0;border-top:2px solid #E6E8E3"></div>
    <div dir="rtl" style="text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Tahoma,sans-serif">
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#D9A521">جام جهانی خانوادگی · ۲۰۲۶</div>
        <div style="font-size:20px;font-weight:800;color:#14201A;margin-top:6px">بازی‌های امروز</div>
        <div style="font-size:13px;color:#6B7A70;margin-top:2px">${matches.length} بازی</div>
      </div>
      ${faMatchCards}
      <div style="text-align:center;margin-top:16px">
        <a href="${APP_URL}" style="display:inline-block;background:#0E7A4F;color:#fff;font-weight:700;padding:12px 28px;border-radius:30px;text-decoration:none;font-size:14px">ثبت پیش‌بینی</a>
      </div>
      ${faYesterday}
      ${faFamily}
    </div>`;

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <div style="background:linear-gradient(180deg,#0E7A4F,#093A2A);border-radius:16px;padding:24px;color:#fff;text-align:center">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#D9A521">FAMILY WORLD CUP · 2026</div>
        <div style="font-size:24px;font-weight:800;margin-top:8px">Today's Matches</div>
        <div style="font-size:14px;color:#CFE5DA;margin-top:4px">${date} · ${matches.length} game${matches.length > 1 ? "s" : ""}</div>
      </div>
      ${matchCards}
      <div style="text-align:center;margin-top:22px">
        <a href="${APP_URL}" style="display:inline-block;background:#0E7A4F;color:#fff;font-weight:700;padding:14px 36px;border-radius:30px;text-decoration:none;font-size:16px">Place Your Bets</a>
      </div>
      ${yesterdaySection}
      ${familySection}
      ${farsiSection}
      <p style="text-align:center;font-size:11px;color:#6B7A70;margin-top:20px">
        <a href="${unsubLink(userId)}" style="color:#6B7A70">Unsubscribe</a>
      </p>
    </div>`;
}

// ─── Pre-game reminder ────────────────────────────────────────
function reminderHtml(match: Match, userId: string): string {
  const homeFlag = flagFor(match.team_a_code ?? match.team_a);
  const awayFlag = flagFor(match.team_b_code ?? match.team_b);
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <div style="background:linear-gradient(180deg,#0E7A4F,#093A2A);border-radius:16px;padding:24px;color:#fff;text-align:center">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#D9A521">⚽ MATCH REMINDER</div>
        <div style="font-size:24px;font-weight:800;margin-top:10px">${homeFlag} ${match.team_a} vs ${match.team_b} ${awayFlag}</div>
        <div style="font-size:15px;color:#CFE5DA;margin-top:6px">Kicks off in about 1 hour · ${fmtTime(match.kickoff_utc)}</div>
      </div>
      <div style="text-align:center;margin-top:20px">
        <a href="${APP_URL}" style="display:inline-block;background:#D9A521;color:#3A2C07;font-weight:700;padding:14px 36px;border-radius:30px;text-decoration:none;font-size:16px">Place Your Bet Now</a>
      </div>
      <p style="text-align:center;font-size:13px;color:#6B7A70;margin-top:16px">Don't miss out — bets lock at kickoff!</p>
      <p style="text-align:center;font-size:11px;color:#6B7A70;margin-top:24px">
        <a href="${unsubLink(userId)}" style="color:#6B7A70">Unsubscribe</a>
      </p>
    </div>`;
}

// ─── Get subscribers ──────────────────────────────────────────
async function getSubscribers(): Promise<{ id: string; email: string }[]> {
  const { data } = await db()
    .from("users")
    .select("id, email")
    .not("email", "is", null);
  return (data ?? [])
    .filter((u) => u.email)
    .map((u) => ({ id: u.id as string, email: u.email as string }));
}

// ─── Send morning digest ──────────────────────────────────────
export async function sendMorningDigest(adminOnly?: string): Promise<number> {
  const supabase = db();
  const { start, end } = todayET();

  const { data: matches } = await supabase
    .from("matches")
    .select("team_a, team_b, team_a_code, team_b_code, kickoff_utc, stage, group_name, venue")
    .gte("kickoff_utc", start)
    .lte("kickoff_utc", end)
    .order("kickoff_utc", { ascending: true });

  if (!matches || matches.length === 0) return 0;

  // Enrich each match with flags, weather, and odds
  const enriched: EnrichedMatch[] = await Promise.all(
    (matches as Match[]).map(async (m) => {
      const [weather, odds] = await Promise.all([
        getVenueWeather(m.venue).catch(() => null),
        fetchMatchOdds(m.team_a, m.team_b).catch(() => null)
      ]);
      return {
        ...m,
        homeFlag: flagFor(m.team_a_code ?? m.team_a),
        awayFlag: flagFor(m.team_b_code ?? m.team_b),
        weather,
        odds
      };
    })
  );

  // Yesterday's results + family highlights
  const [yesterday, family] = await Promise.all([
    getYesterdayResults(supabase).catch(() => []),
    getFamilyHighlights(supabase).catch(() => ({
      bestPredictor: null, biggestUpset: null, hottestStreak: null, topThree: []
    }))
  ]);

  // If adminOnly is set, only send to that email
  const subs = adminOnly
    ? [{ id: "admin", email: adminOnly }]
    : await getSubscribers();
  if (subs.length === 0) return 0;

  const r = resend();
  try {
    await r.batch.send(
      subs.map((sub) => ({
        from: FROM,
        to: sub.email,
        subject: `⚽ Today's Matches — ${enriched.length} game${enriched.length > 1 ? "s" : ""} to bet on`,
        html: digestHtml(enriched, yesterday, family, sub.id)
      }))
    );
    return subs.length;
  } catch (e) {
    console.error("Batch digest send failed:", e);
    return 0;
  }
}

// ─── Send pre-game reminders ──────────────────────────────────
export async function sendPreGameReminders(): Promise<number> {
  const supabase = db();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  // Find matches kicking off in 45–75 minutes
  const from = new Date(now + 45 * 60 * 1000).toISOString();
  const to = new Date(now + 75 * 60 * 1000).toISOString();

  const { data: matches } = await supabase
    .from("matches")
    .select("id, team_a, team_b, team_a_code, team_b_code, kickoff_utc, stage, group_name, venue, status")
    .gte("kickoff_utc", from)
    .lte("kickoff_utc", to)
    .eq("status", "TIMED");

  if (!matches || matches.length === 0) return 0;

  // Check which reminders were already sent
  const sentKeys = await Promise.all(
    matches.map(async (m) => {
      const key = `reminder_sent_${m.id}`;
      const { data } = await supabase
        .from("app_meta")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      return { match: m, alreadySent: !!data };
    })
  );

  const toSend = sentKeys.filter((s) => !s.alreadySent);
  if (toSend.length === 0) return 0;

  const subs = await getSubscribers();
  if (subs.length === 0) return 0;

  // Get all predictions for these matches so we can skip already-bet ones
  const matchIds = toSend.map((s) => s.match.id);
  const { data: predictions } = await supabase
    .from("predictions")
    .select("user_id, match_id")
    .in("match_id", matchIds);
  const hasBet = new Set((predictions ?? []).map((p) => `${p.user_id}_${p.match_id}`));

  const r = resend();
  const allEmails: { from: string; to: string; subject: string; html: string }[] = [];

  for (const { match } of toSend) {
    // Mark as sent immediately to prevent duplicates
    await supabase.from("app_meta").upsert(
      { key: `reminder_sent_${match.id}`, value: new Date().toISOString() },
      { onConflict: "key" }
    );

    for (const sub of subs) {
      // Skip if this person already placed their bet
      if (hasBet.has(`${sub.id}_${match.id}`)) continue;

      allEmails.push({
        from: FROM,
        to: sub.email,
        subject: `⏰ ${match.team_a} vs ${match.team_b} — 1 hour to bet!`,
        html: reminderHtml(match as Match, sub.id)
      });
    }
  }

  if (allEmails.length === 0) return 0;

  try {
    await r.batch.send(allEmails);
    return allEmails.length;
  } catch (e) {
    console.error("Batch reminder send failed:", e);
    return 0;
  }
}
