import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, outlined } from "./theme";

export type Graphic = {
  type: string;
  from: number;
  to: number;
  [k: string]: any;
};

const img = (id: string) => staticFile(`images/${id}.jpg`);

// Pop-in spring plus a short fade-out at the end of the graphic's window.
const useEnter = (g: Graphic, delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - g.from - delay;
  const s = spring({ frame: local, fps, config: { damping: 13, stiffness: 170, mass: 0.8 } });
  const out = interpolate(frame, [g.to - 8, g.to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeIn = interpolate(local, [0, 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { s, opacity: Math.min(out, fadeIn), local, frame };
};

const center: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
};

// White-bordered photo with a strip of cyan tape, as in the reference video.
export const PhotoCard: React.FC<{ g: Graphic; maxW?: number; maxH?: number; top?: number; rotate?: number; image?: string }> = ({
  g,
  maxW = 1060,
  maxH = 560,
  top = 455,
  rotate = -1.6,
  image,
}) => {
  const { s, opacity, local } = useEnter(g);
  const drift = 1 + Math.max(0, local) * 0.0004;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top,
        opacity,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${(0.82 + 0.18 * s) * drift})`,
      }}
    >
      <div style={{ background: "#fff", padding: 14, boxShadow: "0 24px 60px rgba(0,0,0,0.65)" }}>
        <Img src={img(image ?? g.image)} style={{ display: "block", maxWidth: maxW, maxHeight: maxH }} />
      </div>
      <div
        style={{
          position: "absolute",
          top: -24,
          left: "50%",
          width: 210,
          height: 48,
          background: C.cyan,
          opacity: 0.88,
          transform: "translateX(-50%) rotate(1.5deg)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        }}
      />
    </div>
  );
};

const countUp = (value: string, progress: number) => {
  const m = value.match(/^([\d,]+)(.*)$/s);
  if (!m) return value;
  const n = parseInt(m[1].replace(/,/g, ""), 10);
  const cur = Math.round(n * progress);
  const withCommas = m[1].includes(",") ? cur.toLocaleString("en-US") : String(cur);
  return withCommas + m[2];
};

// Dark rounded panel: small label + big red value (reference: "중국집 단무지 값 / 500원 따로").
export const StatBox: React.FC<{ g: Graphic; low: boolean }> = ({ g, low }) => {
  const { s, opacity, local } = useEnter(g);
  const p = interpolate(local, [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  return (
    <div
      style={{
        ...center,
        top: low ? 862 : 540,
        opacity,
        transform: `translate(-50%, -50%) scale(${0.85 + 0.15 * s})`,
        background: C.panel,
        borderRadius: 16,
        padding: "26px 80px 30px",
        textAlign: "center",
        boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
        border: "1px solid rgba(255,255,255,0.07)",
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ color: "#e9e9ec", fontSize: 38, fontWeight: 700, marginBottom: 2 }}>{g.label}</div>
      <div style={{ color: C.red, fontSize: 132, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2 }}>{countUp(g.value, p)}</div>
    </div>
  );
};

export const QuoteBox: React.FC<{ g: Graphic }> = ({ g }) => {
  const { s, opacity } = useEnter(g);
  return (
    <div
      style={{
        ...center,
        opacity,
        transform: `translate(-50%, -50%) scale(${0.88 + 0.12 * s})`,
        background: C.panel,
        borderRadius: 18,
        padding: "40px 90px 46px",
        textAlign: "center",
        boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
        whiteSpace: "pre",
      }}
    >
      <div style={{ color: "#d4d4d8", fontSize: 36, fontWeight: 700, marginBottom: 16 }}>{g.label}</div>
      <div style={{ color: C.white, fontSize: 96, fontWeight: 900, lineHeight: 1.18 }}>{g.value}</div>
    </div>
  );
};

export const TitleCard: React.FC<{ g: Graphic }> = ({ g }) => {
  const { s, opacity } = useEnter(g);
  const { s: s2 } = useEnter(g, 6);
  return (
    <div style={{ ...center, opacity, transform: "translate(-50%, -50%)", textAlign: "center", whiteSpace: "nowrap" }}>
      <div style={{ color: C.white, fontSize: 70, fontWeight: 900, ...outlined(12), transform: `translateY(${(1 - s) * 30}px)` }}>{g.kicker}</div>
      <div style={{ color: C.cyan, fontSize: 250, fontWeight: 900, lineHeight: 1, letterSpacing: -4, ...outlined(18), transform: `scale(${0.7 + 0.3 * s2})` }}>
        {g.value}
      </div>
    </div>
  );
};

export const RankCard: React.FC<{ g: Graphic }> = ({ g }) => {
  const { s, opacity, local } = useEnter(g);
  const wipe = interpolate(local, [4, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ ...center, opacity, transform: "translate(-50%, -50%)", textAlign: "center", whiteSpace: "nowrap" }}>
      <div style={{ color: C.cyan, fontSize: 260, fontWeight: 900, lineHeight: 1, ...outlined(18), transform: `scale(${0.6 + 0.4 * s})` }}>{g.rank}</div>
      <div style={{ height: 8, width: 520 * wipe, background: C.white, margin: "18px auto 22px", borderRadius: 4 }} />
      <div style={{ color: C.white, fontSize: 140, fontWeight: 900, lineHeight: 1, ...outlined(14), opacity: wipe }}>{g.name}</div>
    </div>
  );
};

export const Donut: React.FC<{ g: Graphic }> = ({ g }) => {
  const { s, opacity, local } = useEnter(g);
  const p = interpolate(local, [4, 34], [0, g.value / 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  const r = 170;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ ...center, top: 445, opacity, transform: `translate(-50%, -50%) scale(${0.85 + 0.15 * s})`, textAlign: "center" }}>
      <div style={{ color: C.white, fontSize: 48, fontWeight: 800, marginBottom: 16, ...outlined(8), whiteSpace: "nowrap" }}>{g.label}</div>
      <div style={{ position: "relative", width: 420, height: 420, margin: "0 auto" }}>
        <svg width={420} height={420} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={210} cy={210} r={r} fill="rgba(15,15,18,0.75)" stroke="rgba(255,255,255,0.18)" strokeWidth={48} />
          <circle cx={210} cy={210} r={r} fill="none" stroke={C.red} strokeWidth={48} strokeDasharray={`${circ * p} ${circ}`} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontSize: 120, fontWeight: 900 }}>
          {Math.round(p * 100)}%
        </div>
      </div>
      <div style={{ color: C.cyan, fontSize: 70, fontWeight: 900, marginTop: 14, ...outlined(10) }}>{g.caption}</div>
    </div>
  );
};

export const Bars: React.FC<{ g: Graphic }> = ({ g }) => {
  const { s, opacity, local } = useEnter(g);
  const bars: { k: string; v: number }[] = g.bars;
  const max = Math.max(...bars.map((b) => b.v));
  return (
    <div
      style={{
        ...center,
        top: 450,
        opacity,
        transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * s})`,
        background: C.panel,
        borderRadius: 18,
        padding: "34px 70px 30px",
        width: 1120,
        boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
      }}
    >
      <div style={{ color: "#e9e9ec", fontSize: 40, fontWeight: 800, textAlign: "center", marginBottom: 26 }}>{g.label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: 380 }}>
        {bars.map((b, i) => {
          const p = interpolate(local, [6 + i * 8, 26 + i * 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
          const last = i === bars.length - 1;
          return (
            <div key={b.k} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 170 }}>
              <div style={{ color: last ? C.red : C.white, fontSize: 52, fontWeight: 900, opacity: p }}>{Math.round(b.v * p)}%</div>
              <div style={{ width: 130, height: (300 * b.v * p) / max, background: last ? C.red : C.cyan, borderRadius: "10px 10px 0 0" }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", borderTop: "3px solid rgba(255,255,255,0.35)", paddingTop: 12 }}>
        {bars.map((b) => (
          <div key={b.k} style={{ width: 170, textAlign: "center", color: "#d4d4d8", fontSize: 40, fontWeight: 800 }}>
            {b.k}
          </div>
        ))}
      </div>
    </div>
  );
};

export const Timeline: React.FC<{ g: Graphic }> = ({ g }) => {
  const { opacity, local } = useEnter(g);
  const line = interpolate(local, [6, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const { s: pop } = useEnter(g, 26);
  const node = (year: string, label: string, color: string, show: number) => (
    <div style={{ textAlign: "center", opacity: show, width: 360 }}>
      <div style={{ color: C.white, fontSize: 110, fontWeight: 900, ...outlined(12) }}>{year}</div>
      <div style={{ color, fontSize: 58, fontWeight: 900, ...outlined(9) }}>{label}</div>
    </div>
  );
  return (
    <div style={{ ...center, top: 430, opacity, transform: "translate(-50%, -50%)", width: 1400 }}>
      <div style={{ textAlign: "center", color: C.red, fontSize: 170, fontWeight: 900, ...outlined(14), transform: `scale(${pop})`, height: 200 }}>
        {g.value}
      </div>
      <div style={{ position: "relative", height: 40, margin: "10px 180px" }}>
        <div style={{ position: "absolute", top: 14, left: 0, height: 12, width: `${line * 100}%`, background: C.white, borderRadius: 6 }} />
        <div style={{ position: "absolute", top: 0, left: -20, width: 40, height: 40, borderRadius: 20, background: C.cyan, border: "6px solid #fff" }} />
        <div style={{ position: "absolute", top: 0, right: -20, width: 40, height: 40, borderRadius: 20, background: C.red, border: "6px solid #fff", opacity: line >= 1 ? 1 : 0 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", margin: "0 0" }}>
        {node(g.fromYear, g.fromLabel, C.cyan, 1)}
        {node(g.toYear, g.toLabel, C.red, line >= 1 ? 1 : 0)}
      </div>
    </div>
  );
};

export const Subscribe: React.FC<{ g: Graphic }> = ({ g }) => {
  const { s, opacity, local } = useEnter(g);
  const clicked = local > 22;
  const press = interpolate(local, [18, 22, 26], [1, 0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const handX = interpolate(local, [4, 18], [260, 70], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const handY = interpolate(local, [4, 18], [200, 40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ ...center, top: 560, opacity, transform: `translate(-50%, -50%) scale(${(0.8 + 0.2 * s) * press})` }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          background: clicked ? "#3f3f46" : C.red,
          color: C.white,
          fontSize: 72,
          fontWeight: 900,
          padding: "22px 64px",
          borderRadius: 999,
          boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
          whiteSpace: "nowrap",
        }}
      >
        <svg width={64} height={64} viewBox="0 0 24 24" fill="#fff">
          <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3a1.5 1.5 0 0 0-3 0v1.16A7 7 0 0 0 5 11v5l-2 2v1h18v-1Z" />
        </svg>
        {clicked ? "구독중" : "구독"}
      </div>
      <svg width={90} height={90} viewBox="0 0 24 24" style={{ position: "absolute", left: handX + 120, top: handY + 30 }}>
        <path
          d="M9 11V4.5a1.5 1.5 0 0 1 3 0V10h.5V8.5a1.5 1.5 0 0 1 3 0V10h.5V9.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-.6a6 6 0 0 1-4.6-2.2L3.3 15.4a1.5 1.5 0 0 1 2.2-2L9 16Z"
          fill="#fff"
          stroke="#111"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
};

export const Recap: React.FC<{ g: Graphic }> = ({ g }) => {
  const { opacity, local } = useEnter(g);
  const { fps } = useVideoConfig();
  const items: { rank: string; name: string; image: string }[] = g.items;
  return (
    <div style={{ ...center, top: 440, opacity, transform: "translate(-50%, -50%)", display: "flex", gap: 60 }}>
      {items.map((it, i) => {
        const s = spring({ frame: local - i * 7, fps, config: { damping: 13, stiffness: 160 } });
        const x = spring({ frame: local - 30 - i * 10, fps, config: { damping: 10, stiffness: 220 } });
        return (
          <div key={it.name} style={{ textAlign: "center", transform: `translateY(${(1 - s) * 80}px) rotate(${[-2.5, 1.5, -1][i]}deg)`, opacity: s }}>
            <div style={{ color: C.cyan, fontSize: 56, fontWeight: 900, ...outlined(9) }}>
              {it.rank} <span style={{ color: C.white }}>{it.name}</span>
            </div>
            <div style={{ position: "relative", background: "#fff", padding: 12, marginTop: 14, boxShadow: "0 20px 50px rgba(0,0,0,0.6)" }}>
              <Img src={img(it.image)} style={{ display: "block", width: 460, height: 320, objectFit: "cover", filter: `grayscale(${x})` }} />
              <svg width={300} height={300} viewBox="0 0 100 100" style={{ position: "absolute", left: 92, top: 22, opacity: x, transform: `scale(${1.6 - 0.6 * x})` }}>
                <path d="M15 15 L85 85 M85 15 L15 85" stroke={C.red} strokeWidth={12} strokeLinecap="round" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
};
