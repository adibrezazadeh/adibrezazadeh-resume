import { notFound } from "next/navigation";
import { Experience } from "@/components/Experience";
import { isLang } from "@/lib/types";

export default async function LangPage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <Experience lang={lang} />;
}
