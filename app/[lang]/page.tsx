import { existsSync } from "node:fs";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { Experience } from "@/components/Experience";
import { isLang } from "@/lib/types";

export default async function LangPage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const photo = existsSync(join(process.cwd(), "public", "me.jpg")) ? "/me.jpg" : null;
  return <Experience lang={lang} photo={photo} />;
}
