import { Resend } from "resend";
import { db } from "@/lib/db";
import { createHmac } from "crypto";

const resend = () => new Resend(process.env.RESEND_API_KEY);

const APP_URL = "https://worldcup-predictions-psi.vercel.app";
const FROM = "World Cup Predictions <onboarding@resend.dev>"; // Resend's free-tier sender

// Simple HMAC token for unsubscribe links (no DB lookup needed).
function unsubToken(userId: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET ?? "s")
    .update(userId)
    .digest("hex")
    .slice(0, 16);
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
      timeZone: "America/New_York"
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
      timeZone: "America/New_York"
    });
  } catch {
    return "";
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
            <span style="color:#6B7A70;font-size:13px">${fmtTime(m.kickoff_utc)} · ${m.group_name ?? m.stage}${m.venue ? ` · ${m.venue}` : ""}</span>
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

  // Today's matches (UTC day boundaries, but we grab a generous window)
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const { data: matches } = await supabase
    .from("matches")
    .select("team_a, team_b, kickoff_utc, stage, group_name, venue")
    .gte("kickoff_utc", startOfDay.toISOString())
    .lte("kickoff_utc", endOfDay.toISOString())
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

  const r = resend();
  let sent = 0;

  for (const { match } of toSend) {
    // Mark as sent immediately to prevent duplicates
    await supabase.from("app_meta").upsert(
      { key: `reminder_sent_${match.id}`, value: new Date().toISOString() },
      { onConflict: "key" }
    );

    for (const sub of subs) {
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
