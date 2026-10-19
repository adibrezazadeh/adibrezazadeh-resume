import { leadership, stack, ui } from "@/lib/profile";
import type { Lang } from "@/lib/types";

export function SkillsList({ lang }: { lang: Lang }) {
  const t = ui[lang];
  return (
    <div className="skills">
      <section>
        <h3>{t.stackTitle}</h3>
        <ul className="shelf">
          {stack.map((item, index) => (
            <li key={item} style={{ background: spineColor(index) }}>
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>{t.leadershipTitle}</h3>
        <ul className="leadership">
          {leadership[lang].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function spineColor(index: number): string {
  const colors = ["#8d2f2f", "#1e6d68", "#243056", "#c4622d", "#6b3a5d", "#355c7d", "#3f6b3a", "#8a6232"];
  return colors[index % colors.length];
}
