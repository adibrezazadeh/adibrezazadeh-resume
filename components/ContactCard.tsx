import { person, ui } from "@/lib/profile";
import type { Lang } from "@/lib/types";

export function ContactCard({ lang }: { lang: Lang }) {
  const t = ui[lang];
  const rows = [
    { label: t.email, value: person.email, href: `mailto:${person.email}` },
    { label: t.phone, value: person.phone, href: person.phoneHref },
    { label: t.linkedin, value: person.linkedinLabel, href: person.linkedin },
    { label: t.github, value: "github.com/adibrezazadeh", href: person.github },
  ];
  return (
    <div className="contact-card">
      <p className="kicker">{person.location[lang]}</p>
      <p className="relocation">{person.relocation[lang]}</p>
      <ul>
        {rows.map((row) => (
          <li key={row.label}>
            <span>{row.label}</span>
            <a href={row.href} dir="ltr" target={row.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              {row.value}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
