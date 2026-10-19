import { resumeText } from "@/lib/resume";
import { isLang } from "@/lib/types";

export async function GET(request: Request) {
  const langParam = new URL(request.url).searchParams.get("lang") ?? "en";
  const lang = isLang(langParam) ? langParam : "en";
  return new Response(resumeText(lang), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="Adib-Rezazadeh-${lang}.txt"`,
    },
  });
}
