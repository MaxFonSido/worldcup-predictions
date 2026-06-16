// Generates a short bilingual match analysis using Claude.
// Called once per match during digest generation.

export type MatchAnalysis = { en: string; fa: string };

export async function analyzeMatch(
  homeTeam: string,
  awayTeam: string,
  homeWin: number,
  draw: number,
  awayWin: number
): Promise<MatchAnalysis | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const favorite = homeWin > awayWin ? homeTeam : awayTeam;
  const favPct = Math.max(homeWin, awayWin);
  const underdog = homeWin > awayWin ? awayTeam : homeTeam;
  const isClose = Math.abs(homeWin - awayWin) < 15;

  const prompt = `You are "Ey Vay", a witty and knowledgeable World Cup 2026 pundit. 
Write a SHORT match preview (2 sentences max each) for ${homeTeam} vs ${awayTeam} in the FIFA World Cup 2026.
The odds say: ${homeTeam} ${homeWin}% · Draw ${draw}% · ${awayTeam} ${awayWin}%.
${isClose ? "This is a close match." : `${favorite} are the clear favorite at ${favPct}%.`}

Be direct, insightful, and slightly playful. Mention the favorite and why the underdog might surprise.
Respond ONLY with valid JSON, no markdown, no explanation:
{"en": "English analysis here", "fa": "تحلیل فارسی اینجا"}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.content?.[0]?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (parsed?.en && parsed?.fa) return { en: parsed.en, fa: parsed.fa };
    return null;
  } catch {
    return null;
  }
}
