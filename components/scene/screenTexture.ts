import * as THREE from "three";
import { localeTag, person, ui } from "@/lib/profile";
import type { Lang } from "@/lib/types";

// A painted picture of AdibOS's opening state for the 3D monitor. The live DOM desktop is
// only shown, as a flat overlay, once the camera has arrived at the screen: drawing a
// 1600×900 DOM tree through a CSS 3D transform every frame was the scene's main cost.
// Coordinates mirror the CSS in globals.css (.os-embedded is 17px based).

const W = 1600;
const H = 900;
const SCALE = 0.64;

function cssFont(variable: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value ? `${value}, ${fallback}` : fallback;
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function glyph(ctx: CanvasRenderingContext2D, kind: number, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s / 24, s / 24);
  ctx.translate(-12, -12);
  ctx.strokeStyle = "#f3ede3";
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (kind === 0) {
    ctx.arc(12, 8.5, 3.5, 0, Math.PI * 2);
    ctx.moveTo(5, 20);
    ctx.quadraticCurveTo(12, 9, 19, 20);
  } else if (kind === 1) {
    ctx.roundRect(3.5, 5.5, 17, 14, 2);
  } else if (kind === 2) {
    ctx.roundRect(6, 3.5, 12, 17, 1.5);
    ctx.moveTo(9, 11);
    ctx.lineTo(15, 11);
    ctx.moveTo(9, 14);
    ctx.lineTo(15, 14);
  } else if (kind === 3) {
    ctx.roundRect(3, 4.5, 18, 15, 2);
    ctx.moveTo(7, 10);
    ctx.lineTo(10, 12.5);
    ctx.lineTo(7, 15);
  } else if (kind === 4) {
    ctx.moveTo(4, 20);
    ctx.lineTo(4, 9);
    ctx.moveTo(9, 20);
    ctx.lineTo(9, 5);
    ctx.moveTo(14, 20);
    ctx.lineTo(14, 12);
    ctx.moveTo(19, 20);
    ctx.lineTo(19, 7);
  } else if (kind === 5) {
    ctx.roundRect(3, 5.5, 18, 13, 2);
    ctx.moveTo(4, 7);
    ctx.lineTo(12, 13);
    ctx.lineTo(20, 7);
  } else {
    ctx.moveTo(12, 3.5);
    ctx.lineTo(13.8, 9);
    ctx.lineTo(19.5, 10.8);
    ctx.lineTo(13.8, 12.6);
    ctx.lineTo(12, 18);
    ctx.lineTo(10.2, 12.6);
    ctx.lineTo(4.5, 10.8);
    ctx.lineTo(10.2, 9);
    ctx.closePath();
  }
  ctx.stroke();
  ctx.restore();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number, maxLines: number) {
  const words = text.split(" ");
  let line = "";
  let lines = 0;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      ctx.fillText(line, x, y + lines * lh);
      lines += 1;
      line = word;
      if (lines >= maxLines) return;
    } else {
      line = next;
    }
  }
  if (line) ctx.fillText(line, x, y + lines * lh);
}

export function paintDesktop(canvas: HTMLCanvasElement, lang: Lang, portrait: HTMLImageElement | null = null) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const t = ui[lang];
  const rtl = lang !== "en";
  const sans = rtl ? cssFont("--font-vazir", "sans-serif") : cssFont("--font-outfit", "sans-serif");
  const display = rtl ? sans : cssFont("--font-fraunces", "serif");
  const mono = cssFont("--font-plex", "monospace");

  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Wallpaper
  const bg = ctx.createLinearGradient(0, 0, W * 0.6, H * 1.2);
  bg.addColorStop(0, "#2a2420");
  bg.addColorStop(0.55, "#1a1714");
  bg.addColorStop(1, "#12161a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const warm = ctx.createRadialGradient(W * 0.18, H * 0.12, 0, W * 0.18, H * 0.12, W * 0.6);
  warm.addColorStop(0, "rgba(214,170,120,0.28)");
  warm.addColorStop(1, "rgba(214,170,120,0)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, W, H);
  const cool = ctx.createRadialGradient(W * 0.9, H, 0, W * 0.9, H, W * 0.55);
  cool.addColorStop(0, "rgba(94,120,140,0.32)");
  cool.addColorStop(1, "rgba(94,120,140,0)");
  ctx.fillStyle = cool;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(233,220,196,0.07)";
  ctx.lineWidth = 1;
  for (let y = 40; y < H; y += 96) {
    for (let x = 0; x < W; x += 96) {
      ctx.strokeRect(x + 30, y + 30, 36, 36);
      ctx.save();
      ctx.translate(x + 48, y + 48);
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-18, -18, 36, 36);
      ctx.restore();
    }
  }
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.7);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(244,236,220,0.07)";
  ctx.font = `180px ${cssFont("--font-fraunces", "serif")}`;
  ctx.textAlign = "right";
  ctx.fillText(person.names.en, W * 0.96, H * 0.91);
  ctx.textAlign = "left";

  // Menu bar
  ctx.fillStyle = "rgba(16,14,12,0.86)";
  ctx.fillRect(0, 0, W, 40);
  ctx.fillStyle = "#f3ede3";
  ctx.font = `500 14.6px ${mono}`;
  ctx.fillText("AdibOS", 42, 25);
  ctx.beginPath();
  ctx.arc(28, 20, 6, 0, Math.PI * 2);
  ctx.strokeStyle = "#f3ede3";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.font = `600 14.6px ${sans}`;
  ctx.fillText(t.aboutTitle, 128, 25);
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  const local = now.toLocaleTimeString(localeTag(lang), opts);
  const shiraz = now.toLocaleTimeString(localeTag(lang), { ...opts, timeZone: "Asia/Tehran" });
  ctx.font = `14.6px ${sans}`;
  const leave = t.osLeave;
  const leaveW = ctx.measureText(leave).width + 22;
  round(ctx, W - 10 - leaveW, 6, leaveW, 28, 6);
  ctx.strokeStyle = "rgba(244,236,220,0.2)";
  ctx.stroke();
  ctx.fillText(leave, W - 10 - leaveW + 11, 25);
  ctx.font = `14.6px ${mono}`;
  ctx.fillText(local, W - 30 - leaveW - ctx.measureText(local).width, 25);
  ctx.globalAlpha = 0.6;
  const city = `${t.shirazTime} ${shiraz}`;
  ctx.fillText(city, W - 44 - leaveW - ctx.measureText(local).width - ctx.measureText(city).width, 25);
  ctx.globalAlpha = 1;

  // Desktop icons
  const labels = [t.aboutTitle, t.projectsTitle, t.resumeTitle, "Terminal", t.skillsTitle, t.contactTitle, t.assistantTitle];
  labels.forEach((label, i) => {
    const x = 12 + 6 + 24;
    const y = 40 + 18 + i * 100 + 8;
    const tile = ctx.createLinearGradient(x, y, x + 56, y + 56);
    tile.addColorStop(0, "rgba(244,236,220,0.22)");
    tile.addColorStop(1, "rgba(244,236,220,0.06)");
    round(ctx, x, y, 56, 56, 16);
    ctx.fillStyle = tile;
    ctx.fill();
    ctx.strokeStyle = "rgba(244,236,220,0.18)";
    ctx.stroke();
    glyph(ctx, i, x + 28, y + 28, 28);
    ctx.fillStyle = "#f3ede3";
    ctx.font = `13.2px ${sans}`;
    ctx.textAlign = "center";
    ctx.fillText(label, x + 28, y + 76, 100);
    ctx.textAlign = "left";
  });

  // About window
  const wx = (W - 760) / 2;
  const wy = 40 + 70;
  const ww = 760;
  const wh = 430;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  round(ctx, wx, wy, ww, wh, 14);
  ctx.fillStyle = "#f3f0ea";
  ctx.fill();
  ctx.restore();
  ctx.save();
  round(ctx, wx, wy, ww, wh, 14);
  ctx.clip();
  const head = ctx.createLinearGradient(0, wy, 0, wy + 42);
  head.addColorStop(0, "#2c2620");
  head.addColorStop(1, "#231e19");
  ctx.fillStyle = head;
  ctx.fillRect(wx, wy, ww, 42);
  ctx.restore();
  glyph(ctx, 0, wx + 24, wy + 21, 18);
  ctx.fillStyle = "#f3f0ea";
  ctx.font = `600 15.6px ${sans}`;
  ctx.fillText(t.aboutTitle, wx + 42, wy + 26);
  ctx.strokeStyle = "#f3f0ea";
  ctx.lineWidth = 1.4;
  [ww - 94, ww - 60, ww - 26].forEach((bx, i) => {
    ctx.beginPath();
    if (i === 0) {
      ctx.moveTo(wx + bx - 4, wy + 21);
      ctx.lineTo(wx + bx + 4, wy + 21);
    } else if (i === 1) {
      ctx.strokeRect(wx + bx - 4, wy + 17, 8, 8);
    } else {
      ctx.moveTo(wx + bx - 4, wy + 17);
      ctx.lineTo(wx + bx + 4, wy + 25);
      ctx.moveTo(wx + bx + 4, wy + 17);
      ctx.lineTo(wx + bx - 4, wy + 25);
    }
    ctx.stroke();
  });

  const left = wx + 18;
  const right = wx + ww - 18;
  const body = wy + 42 + 16;
  // Avatar
  const ax = rtl ? right - 84 : left;
  const avatar = ctx.createLinearGradient(ax, body, ax + 84, body + 84);
  avatar.addColorStop(0, "#3a3029");
  avatar.addColorStop(1, "#1c1916");
  round(ctx, ax, body, 84, 84, 22);
  ctx.fillStyle = avatar;
  ctx.fill();
  if (portrait) {
    ctx.save();
    round(ctx, ax, body, 84, 84, 22);
    ctx.clip();
    const side = Math.min(portrait.naturalWidth, portrait.naturalHeight);
    ctx.drawImage(portrait, (portrait.naturalWidth - side) / 2, (portrait.naturalHeight - side) / 2, side, side, ax, body, 84, 84);
    ctx.restore();
  } else {
    ctx.fillStyle = "#f0e4cf";
    ctx.font = `44px ${cssFont("--font-fraunces", "serif")}`;
    ctx.textAlign = "center";
    ctx.fillText(person.nickname.slice(0, 1), ax + 42, body + 58);
  }

  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = rtl ? "right" : "left";
  const tx = rtl ? right - 84 - 18 : left + 84 + 18;
  ctx.fillStyle = "#8d7356";
  ctx.font = `12px ${mono}`;
  ctx.fillText(person.location[lang], tx, body + 6);
  ctx.fillStyle = "#1e1c19";
  ctx.font = `${rtl ? "700" : "560"} 37px ${display}`;
  ctx.fillText(person.names[lang], tx, body + 42);
  ctx.font = `600 17px ${sans}`;
  ctx.fillText(person.roleLine[lang], tx, body + 68);
  ctx.fillStyle = "#5e5850";
  ctx.font = `15px ${sans}`;
  ctx.fillText(`${person.location[lang]} · ${person.years[lang]} · ${person.relocation[lang]}`, tx, body + 90);

  const tx2 = rtl ? right : left;
  ctx.fillStyle = "#1e1c19";
  ctx.font = `17px ${sans}`;
  wrap(ctx, t.welcomeLead, tx2, body + 128, ww - 36, 24, 2);

  // Chips
  const chips = [t.projectsTitle, t.resumeTitle, "Terminal", t.contactTitle];
  ctx.font = `600 15px ${sans}`;
  let cx = rtl ? right : left;
  chips.forEach((chip) => {
    const cw = ctx.measureText(chip).width + 54;
    const x = rtl ? cx - cw : cx;
    round(ctx, x, body + 170, cw, 38, 19);
    ctx.fillStyle = "#fffaf1";
    ctx.fill();
    ctx.strokeStyle = "rgba(30,28,25,0.12)";
    ctx.stroke();
    ctx.fillStyle = "#1e1c19";
    ctx.textAlign = "left";
    ctx.direction = "ltr";
    ctx.fillText(chip, x + 38, body + 194);
    ctx.direction = rtl ? "rtl" : "ltr";
    cx = rtl ? x - 8 : x + cw + 8;
  });
  ctx.textAlign = rtl ? "right" : "left";

  // Tips
  round(ctx, left, body + 226, ww - 36, 96, 12);
  ctx.fillStyle = "#ebe5da";
  ctx.fill();
  ctx.fillStyle = "#5e5850";
  ctx.font = `15px ${sans}`;
  [t.typeHint, t.skyHint, t.osHint].forEach((tip, i) => ctx.fillText(tip, rtl ? right - 14 : left + 14, body + 254 + i * 26));

  // Dock
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  const dw = 7 * 52 + 6 * 6 + 16;
  const dx = (W - dw) / 2;
  const dy = H - 12 - 68;
  round(ctx, dx, dy, dw, 68, 20);
  ctx.fillStyle = "rgba(24,21,18,0.8)";
  ctx.fill();
  ctx.strokeStyle = "rgba(244,236,220,0.12)";
  ctx.stroke();
  for (let i = 0; i < 7; i += 1) {
    const bx = dx + 8 + i * 58;
    round(ctx, bx, dy + 8, 52, 52, 14);
    ctx.fillStyle = "rgba(244,236,220,0.08)";
    ctx.fill();
    glyph(ctx, i, bx + 26, dy + 34, 26);
  }
  ctx.fillStyle = "#e9dcc4";
  ctx.beginPath();
  ctx.arc(dx + 8 + 26, dy + 68 + 1, 2, 0, Math.PI * 2);
  ctx.fill();
}

export function createDesktopTexture(lang: Lang, photo: string | null) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(W * SCALE);
  canvas.height = Math.round(H * SCALE);
  let portrait: HTMLImageElement | null = null;
  paintDesktop(canvas, lang, portrait);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const repaint = () => {
    paintDesktop(canvas, lang, portrait);
    tex.needsUpdate = true;
  };
  if (photo) {
    const img = new Image();
    img.onload = () => {
      portrait = img;
      repaint();
    };
    img.src = photo;
  }
  // Webfonts may land after the first paint; the menu-bar clock moves once a minute.
  void document.fonts?.ready.then(repaint);
  const id = window.setInterval(repaint, 30000);
  return { tex, dispose: () => window.clearInterval(id) };
}
