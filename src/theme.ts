import { continueRender, delayRender, staticFile } from "remotion";

// Colours sampled from the reference video's captions and labels.
export const C = {
  cyan: "#45D4F2",
  red: "#F23A3C",
  white: "#FFFFFF",
  panel: "rgba(24, 24, 27, 0.9)",
  stroke: "#1b1b1f",
};

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
