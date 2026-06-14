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
    .select("team_a, team_b, kickoff_utc, stage, group_name, venue")
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
function digestHtml(matches: Match[], userId: string): string {
  const date = matches.length ? fmtDate(matches[0].kickoff_utc) : "Today";
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
        <div style="font-size:22px;font-weight:800;margin-top:8px">Today's Matches</div>
        <div style="font-size:13px;color:#CFE5DA;margin-top:4px">${date}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
        ${rows}
      </table>
      <div style="text-align:center;margin-top:20px">
        <a href="${APP_URL}" style="display:inline-block;background:#0E7A4F;color:#fff;font-weight:700;padding:12px 32px;border-radius:30px;text-decoration:none;font-size:15px">Place Your Bets</a>
      </div>
      <p style="text-align:center;font-size:11px;color:#6B7A70;margin-top:24px">
        <a href="${unsubLink(userId)}" style="color:#6B7A70">Unsubscribe</a>
      </p>
    </div>`;
}

// ─── Pre-game reminder ────────────────────────────────────────
function reminderHtml(match: Match, userId: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <div style="background:linear-gradient(180deg,#0E7A4F,#093A2A);border-radius:16px;padding:24px;color:#fff;text-align:center">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#D9A521">⚽ MATCH REMINDER</div>
        <div style="font-size:24px;font-weight:800;margin-top:10px">${match.team_a} vs ${match.team_b}</div>
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
export async function sendMorningDigest(): Promise<number> {
  const supabase = db();
  const { start, end } = todayET();

  const { data: matches } = await supabase
    .from("matches")
    .select("team_a, team_b, kickoff_utc, stage, group_name, venue")
    .gte("kickoff_utc", start)
    .lte("kickoff_utc", end)
    .order("kickoff_utc", { ascending: true });

  if (!matches || matches.length === 0) return 0;

  const subs = await getSubscribers();
  if (subs.length === 0) return 0;

  const r = resend();
  let sent = 0;
  for (const sub of subs) {
    try {
      await r.emails.send({
        from: FROM,
        to: sub.email,
        subject: `⚽ Today's Matches — ${matches.length} game${matches.length > 1 ? "s" : ""} to bet on`,
        html: digestHtml(matches as Match[], sub.id)
      });
      sent++;
    } catch (e) {
      console.error("Digest send failed for", sub.email, e);
    }
  }
  return sent;
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
    .select("id, team_a, team_b, kickoff_utc, stage, group_name, venue, status")
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
  let sent = 0;

  for (const { match } of toSend) {
    // Mark as sent immediately to prevent duplicates
    await supabase.from("app_meta").upsert(
      { key: `reminder_sent_${match.id}`, value: new Date().toISOString() },
      { onConflict: "key" }
    );

    for (const sub of subs) {
      // Skip if this person already placed their bet
      if (hasBet.has(`${sub.id}_${match.id}`)) continue;

      try {
        await r.emails.send({
          from: FROM,
          to: sub.email,
          subject: `⏰ ${match.team_a} vs ${match.team_b} — 1 hour to bet!`,
          html: reminderHtml(match as Match, sub.id)
        });
        sent++;
      } catch (e) {
        console.error("Reminder send failed for", sub.email, e);
      }
    }
  }
  return sent;
}
