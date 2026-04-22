const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

/**
 * Short narrative insight for admin Platform analytics only (orders / payments sample).
 * Returns null if no API key or on failure.
 */
export async function summarizePlatformAnalytics({
  orderCount,
  successfulPaymentsCount,
  revenueFormatted,
}) {
  if (!API_KEY?.trim()) return null;

  const prompt = `You help a marketplace admin interpret sample platform metrics for RecycleHub (B2B recycling in Rwanda).

Metrics (from a limited API sample, not necessarily full history):
- Orders in sample: ${orderCount}
- Successful mobile-money payments in sample: ${successfulPaymentsCount}
- Sum of successful payment amounts in sample: ${revenueFormatted}

Write 2–4 short sentences of plain English: what this might suggest, caveats about sample size, and one practical next step. No markdown, no bullet characters, no JSON.`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string' || !text.trim()) return null;
    return text.trim();
  } catch (e) {
    console.warn('Gemini analytics insight failed:', e);
    return null;
  }
}
