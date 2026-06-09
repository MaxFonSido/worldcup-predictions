import { cookies } from "next/headers";

export type Lang = "en" | "fa";

const en = {
  appName: "World Cup Predictions",
  tagline: "Family bracket — 2026",
  welcome: "Welcome",
  enterName: "Your name",
  namePlaceholder: "e.g. Sara",
  enterPin: "4-digit PIN",
  login: "Enter",
  loginHint: "First time? Pick any name and a 4-digit PIN — they're yours from now on.",
  wrongPin: "That PIN doesn't match this name.",
  badName: "Please enter a name.",
  badPin: "PIN must be exactly 4 digits.",
  matches: "Matches",
  leaderboard: "Leaderboard",
  logout: "Log out",
  hi: "Hi",
  picksLeft: "Picks left",
  teamAWins: "Win",
  draw: "Draw",
  teamBWins: "Win",
  locked: "Locked",
  kicksOff: "Kicks off",
  knockoutNote: "Knockout game — always ends with a winner, so a draw can't win here.",
  yourPick: "Your pick",
  everyonesPicks: "Everyone's picks",
  noPicksYet: "No picks yet",
  correct: "Correct",
  missed: "Missed",
  voided: "Match voided — no points",
  result: "Result",
  tapToPick: "Tap a team to predict",
  rank: "Rank",
  player: "Player",
  goldenTokens: "Golden Tokens",
  you: "you",
  emptyBoard: "No one has scored yet. Make some picks!",
  loading: "Loading…",
  groupStage: "Group Stage",
  knockout: "Knockout"
};

export type Dict = Record<keyof typeof en, string>;

const fa: Dict = {
  appName: "پیش‌بینی جام جهانی",
  tagline: "بازی خانوادگی — ۲۰۲۶",
  welcome: "خوش آمدید",
  enterName: "نام شما",
  namePlaceholder: "مثلاً سارا",
  enterPin: "رمز ۴ رقمی",
  login: "ورود",
  loginHint: "بار اول؟ یک نام و یک رمز ۴ رقمی انتخاب کنید — از این به بعد مال شماست.",
  wrongPin: "رمز با این نام مطابقت ندارد.",
  badName: "لطفاً نام را وارد کنید.",
  badPin: "رمز باید دقیقاً ۴ رقم باشد.",
  matches: "بازی‌ها",
  leaderboard: "جدول امتیازات",
  logout: "خروج",
  hi: "سلام",
  picksLeft: "پیش‌بینی باقی‌مانده",
  teamAWins: "برد",
  draw: "مساوی",
  teamBWins: "برد",
  locked: "قفل شد",
  kicksOff: "شروع",
  knockoutNote: "بازی حذفی — همیشه یک برنده دارد، پس مساوی اینجا برنده نمی‌شود.",
  yourPick: "پیش‌بینی شما",
  everyonesPicks: "پیش‌بینی همه",
  noPicksYet: "هنوز پیش‌بینی‌ای نیست",
  correct: "درست",
  missed: "اشتباه",
  voided: "بازی لغو شد — بدون امتیاز",
  result: "نتیجه",
  tapToPick: "برای پیش‌بینی روی یک تیم بزنید",
  rank: "رتبه",
  player: "بازیکن",
  goldenTokens: "سکه‌های طلایی",
  you: "شما",
  emptyBoard: "هنوز کسی امتیاز نگرفته. پیش‌بینی کنید!",
  loading: "در حال بارگذاری…",
  groupStage: "مرحله گروهی",
  knockout: "مرحله حذفی"
};

const dict: Record<Lang, Dict> = { en, fa };

export function getLang(): Lang {
  const c = cookies().get("lang")?.value;
  return c === "fa" ? "fa" : "en";
}

export function t(lang: Lang): Dict {
  return dict[lang];
}

export function dir(lang: Lang): "rtl" | "ltr" {
  return lang === "fa" ? "rtl" : "ltr";
}
