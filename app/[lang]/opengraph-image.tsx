import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { person } from "@/lib/profile";
import { LANGS, type Lang } from "@/lib/types";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${person.name}, ${person.roleLine.en}`;

// Vazirmatn (SIL OFL 1.1, assets/fonts/vazirmatn) covers Latin, Persian, and Arabic.
const fontDir = join(process.cwd(), "assets", "fonts", "vazirmatn");

export default async function OpenGraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang: Lang = (LANGS as readonly string[]).includes(raw) ? (raw as Lang) : "en";
  const rtl = lang !== "en";
  const [regular, bold] = await Promise.all([
    readFile(join(fontDir, "Vazirmatn-Regular.ttf")),
    readFile(join(fontDir, "Vazirmatn-Bold.ttf")),
  ]);
  let photo: string | null = null;
  try {
    photo = `data:image/jpeg;base64,${(await readFile(join(process.cwd(), "public", "me.jpg"))).toString("base64")}`;
  } catch {
    // No portrait: the card is text only.
  }
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 64, padding: "0 88px", background: "#1c1b19", color: "#f3f0ea", fontFamily: "Vazirmatn", direction: rtl ? "rtl" : "ltr" }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- rendered by satori, not the browser.
          <img src={photo} width={300} height={300} style={{ borderRadius: 150, objectFit: "cover" }} alt="" />
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, width: photo ? 660 : 1024 }}>
          <div style={{ fontSize: 30, letterSpacing: 4, textTransform: rtl ? "none" : "uppercase", opacity: 0.6 }}>{person.location[lang]}</div>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>{person.names[lang]}</div>
          <div style={{ fontSize: 38, opacity: 0.85 }}>{person.roleLine[lang]}</div>
          <div style={{ fontSize: 28, opacity: 0.6 }}>React · Next.js · TypeScript · Node.js</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Vazirmatn", data: regular, weight: 400, style: "normal" },
        { name: "Vazirmatn", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
