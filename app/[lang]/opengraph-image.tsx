import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { person } from "@/lib/profile";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${person.name}, ${person.roleLine.en}`;

// Latin text only: the bundled OG font has no Persian or Arabic glyphs, and Emkan ships as woff2.
export default async function OpenGraphImage() {
  let photo: string | null = null;
  try {
    photo = `data:image/jpeg;base64,${(await readFile(join(process.cwd(), "public", "me.jpg"))).toString("base64")}`;
  } catch {
    // No portrait: the card is text only.
  }
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 64, padding: "0 88px", background: "#1c1b19", color: "#f3f0ea" }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- rendered by satori, not the browser.
          <img src={photo} width={300} height={300} style={{ borderRadius: 150, objectFit: "cover" }} alt="" />
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, width: photo ? 660 : 1024 }}>
          <div style={{ fontSize: 30, letterSpacing: 4, textTransform: "uppercase", opacity: 0.6 }}>{person.location.en}</div>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>{person.name}</div>
          <div style={{ fontSize: 38, opacity: 0.85 }}>{person.roleLine.en}</div>
          <div style={{ fontSize: 28, opacity: 0.6 }}>React · Next.js · TypeScript · Node.js</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
