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
  const colors = ["#3a3835", "#514e49", "#5a554f", "#6a655e", "#6e675f", "#7d756b", "#857864", "#8a8178"];
  return colors[index % colors.length];
}
