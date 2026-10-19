import { answerQuestion, systemPrompt } from "@/lib/assistant";
import { isLang, type Lang } from "@/lib/types";

export async function POST(request: Request) {
  let body: { question?: unknown; lang?: unknown };
  try {
    body = (await request.json()) as { question?: unknown; lang?: unknown };
  } catch {
    return Response.json({ error: "Expected JSON." }, { status: 400 });
  }

  const lang: Lang = typeof body.lang === "string" && isLang(body.lang) ? body.lang : "en";
  const question = typeof body.question === "string" ? body.question.slice(0, 500) : "";
  const local = answerQuestion(question, lang);
  const key = process.env.ASSISTANT_API_KEY;
  const url = process.env.ASSISTANT_API_URL;

  if (local.confident || !key || !url) {
    return Response.json({ answer: local.answer, source: "local" });
  }

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ASSISTANT_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt(lang) },
          { role: "user", content: question },
        ],
      }),
    });
    if (!upstream.ok) throw new Error("upstream");
    const data = (await upstream.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (typeof text === "string" && text.trim()) {
      return Response.json({ answer: text.trim(), source: "remote" });
    }
  } catch {
    // The desk notes still answer when the optional upstream is down.
  }

  return Response.json({ answer: local.answer, source: "local" });
}
