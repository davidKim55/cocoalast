import { continueRender, delayRender, staticFile } from "remotion";

// Colours sampled from the reference video's captions and labels.
export const C = {
  cyan: "#3FC8F2",
  red: "#F2403A",
  yellow: "#FFD43B",
  white: "#FFFFFF",
  panel: "rgba(18, 18, 20, 0.84)",
  stroke: "#141416",
};

// "[r:text]" red, "[y:text]" yellow, "[b:text]" sky blue — everything else plain.
export type Seg = { t: string; c: string | null };
export const parseMarkup = (s: string): Seg[] => {
  const out: Seg[] = [];
  const re = /\[([ryb]):([^\]]+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: s.slice(last, m.index), c: null });
    out.push({ t: m[2], c: m[1] });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: s.slice(last), c: null });
  return out;
};
export const colorOf = (c: string | null, base: string) =>
  c === "r" ? C.red : c === "y" ? C.yellow : c === "b" ? C.cyan : base;

export const FONT = "Pretendard";

const weights: [string, number][] = [
  ["Pretendard-SemiBold.woff2", 600],
  ["Pretendard-Bold.woff2", 700],
  ["Pretendard-ExtraBold.woff2", 800],
  ["Pretendard-Black.woff2", 900],
];

let loaded = false;
export const loadFonts = () => {
  if (loaded) return;
  loaded = true;
  const handle = delayRender("fonts");
  Promise.all(
    weights.map(([file, weight]) => {
      const face = new FontFace(FONT, `url(${staticFile(`fonts/${file}`)}) format("woff2")`, {
        weight: String(weight),
      });
      document.fonts.add(face);
      return face.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
};

// Heavy outlined text like the reference captions: white fill, dark stroke, soft drop shadow.
// The outline is built from a ring of hard text-shadows (works reliably on HTML text),
// followed by a soft drop shadow underneath.
export const outlined = (strokePx: number): React.CSSProperties => {
  const r = strokePx / 2;
  const ring: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ring.push(`${(Math.cos(a) * r).toFixed(1)}px ${(Math.sin(a) * r).toFixed(1)}px 0 ${C.stroke}`);
  }
  ring.push(`0 ${r * 1.4}px ${r * 1.6}px rgba(0,0,0,0.6)`);
  return { textShadow: ring.join(", ") };
};
