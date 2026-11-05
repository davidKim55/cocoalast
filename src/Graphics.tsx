import React from "react";
import { AbsoluteFill, Img, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, colorOf, outlined, parseMarkup } from "./theme";

export type Visual = {
  type: "bg" | "card" | "board" | "rank";
  from: number;
  to: number;
  image?: string;
  kind?: string;
  aspect?: number;
  current?: number;
  rank?: string;
  name?: string;
};
export type TextItem = {
  type: "callout" | "quote" | "num";
  from: number;
  to: number;
  text?: string;
  who?: string;
  label?: string;
  value?: string;
  color?: string;
  tag?: string;
};
export type Board = {
  title: string;
  note: string;
  finalImage: string;
  ranks: { rank: string; name: string; result: string; image: string }[];
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const imgSrc = (id: string) => staticFile(`images/${id}.jpg`);

// ---------- visuals ----------

// Full-bleed photo or video with a slow push-in. Portrait photos sit on a blurred copy of themselves.
export const Media: React.FC<{ v: Visual; zoom?: [number, number]; filter?: string }> = ({ v, zoom = [1.02, 1.1], filter }) => {
  const frame = useCurrentFrame();
  const len = Math.max(1, v.to - v.from);
  const z = interpolate(frame - v.from, [0, len], zoom, clamp);
  const style: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})` };
  if (v.kind === "video") {
    return (
      <AbsoluteFill style={{ filter }}>
        <OffthreadVideo src={staticFile(`videos/${v.image}.mp4`)} muted style={style} />
      </AbsoluteFill>
    );
  }
  const src = imgSrc(v.image!);
  if ((v.aspect ?? 1.6) < 1.2) {
    return (
      <AbsoluteFill style={{ filter }}>
        <Img src={src} style={{ ...style, filter: "blur(36px) brightness(0.5)", transform: "scale(1.2)" }} />
        <Img src={src} style={{ ...style, position: "absolute", objectFit: "contain" }} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ filter }}>
      <Img src={src} style={style} />
    </AbsoluteFill>
  );
};

// Photo card: white border + strip of sky-blue tape, the same photo blurred behind it.
export const PhotoCard: React.FC<{ v: Visual }> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - v.from, fps, config: { damping: 15, stiffness: 160 } });
  const fade = interpolate(frame - v.from, [0, 6], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: "scale(1.15)" }}>
        <Img src={imgSrc(v.image!)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(22px) brightness(0.5)" }} />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 360,
          opacity: fade,
          transform: `translate(-50%, -50%) rotate(-1.2deg) scale(${0.9 + 0.1 * s})`,
        }}
      >
        <div style={{ background: "#fff", padding: 12, boxShadow: "0 22px 50px rgba(0,0,0,0.6)" }}>
          <Img src={imgSrc(v.image!)} style={{ display: "block", maxWidth: 960, maxHeight: 520, minWidth: 560 }} />
        </div>
        <div
          style={{
            position: "absolute",
            top: -20,
            left: "50%",
            width: 190,
            height: 42,
            background: C.cyan,
            opacity: 0.88,
            transform: "translateX(-50%) rotate(1.2deg)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Rank title: representative photo, big yellow "N위" and the sky-blue name settling in.
export const RankTitle: React.FC<{ v: Visual }> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - v.from;
  const s1 = spring({ frame: local, fps, config: { damping: 12, stiffness: 180 } });
  const s2 = spring({ frame: local - 7, fps, config: { damping: 14, stiffness: 160 } });
  return (
    <AbsoluteFill>
      <Media v={v} zoom={[1.0, 1.08]} filter="brightness(0.85)" />
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center" }}>
        <div style={{ color: C.yellow, fontSize: 300, fontWeight: 900, lineHeight: 1, ...outlined(20), transform: `scale(${1.5 - 0.5 * s1})`, opacity: s1 }}>
          {v.rank}
        </div>
        <div style={{ color: C.cyan, fontSize: 140, fontWeight: 900, marginTop: 10, ...outlined(16), transform: `translateY(${(1 - s2) * 50}px)`, opacity: s2 }}>
          {v.name}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Ranking board: a column per rank; finished ranks keep their result, the next one gets a yellow underline.
export const RankBoard: React.FC<{ v: Visual; board: Board }> = ({ v, board }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - v.from;
  const cur = v.current ?? 0;
  const bgImage = cur < board.ranks.length ? board.ranks[cur].image : board.finalImage;
  const n = board.ranks.length;
  const tileW = n <= 3 ? 330 : 222;
  const gap = n <= 3 ? 46 : 22;
  const k = tileW / 330; // shrink type with the tiles
  const startX = (1920 - (board.ranks.length * tileW + (board.ranks.length - 1) * gap)) / 2;
  const prev = Math.max(0, cur - 1);
  const ux = interpolate(local, [10, 26], [prev, Math.min(cur, board.ranks.length - 1)], clamp);
  const showLine = cur < board.ranks.length;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${interpolate(local, [0, 200], [1.04, 1.1], clamp)})` }}>
        <Img src={imgSrc(bgImage)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.45)" }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 70, top: 64, display: "flex", alignItems: "center", gap: 18, opacity: interpolate(local, [0, 8], [0, 1], clamp) }}>
        <div style={{ width: 9, height: 56, background: C.cyan, borderRadius: 3 }} />
        <div style={{ color: C.white, fontSize: 52, fontWeight: 900, ...outlined(8) }}>{board.title}</div>
      </div>
      {board.ranks.map((r, i) => {
        const s = spring({ frame: local - 3 - i * 4, fps, config: { damping: 14, stiffness: 170 } });
        const done = i < cur;
        return (
          <div
            key={r.rank}
            style={{
              position: "absolute",
              left: startX + i * (tileW + gap),
              top: 250,
              width: tileW,
              height: 470,
              borderRadius: 18,
              background: "rgba(20, 30, 44, 0.9)",
              border: "2px solid rgba(255,255,255,0.12)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
              textAlign: "center",
              opacity: s,
              transform: `translateY(${(1 - s) * 60}px)`,
            }}
          >
            <div style={{ color: C.cyan, fontSize: 62 * Math.max(k, 0.8), fontWeight: 900, marginTop: 28 }}>{r.rank}</div>
            {done ? (
              <>
                <div style={{ color: C.white, fontSize: 58 * Math.max(k, 0.72), fontWeight: 900, marginTop: 70, letterSpacing: -1 }}>{r.name}</div>
                <div style={{ color: C.red, fontSize: 42 * Math.max(k, 0.8), fontWeight: 900, marginTop: 26, lineHeight: 1.2, padding: "0 10px" }}>{r.result}</div>
              </>
            ) : (
              <>
                <div style={{ color: C.cyan, fontSize: 220 * Math.max(k, 0.8), fontWeight: 900, lineHeight: 1.05, marginTop: 6 }}>?</div>
                <div style={{ color: "#9aa4b2", fontSize: 40, fontWeight: 800 }}>???</div>
              </>
            )}
          </div>
        );
      })}
      {showLine && (
        <div style={{ position: "absolute", top: 738, left: startX + ux * (tileW + gap) + 30, width: tileW - 60, height: 10, borderRadius: 5, background: C.yellow, opacity: interpolate(local, [8, 14], [0, 1], clamp) }} />
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center", color: "#e4e7ec", fontSize: 30, fontWeight: 700, ...outlined(5) }}>{board.note}</div>
    </AbsoluteFill>
  );
};

// ---------- text overlays (one at a time) ----------

const useTextIn = (tx: TextItem) => {
  const frame = useCurrentFrame();
  const local = frame - tx.from;
  const fadeIn = interpolate(local, [0, 5], [0, 1], clamp);
  const fadeOut = interpolate(frame, [tx.to - 5, tx.to], [1, 0], clamp);
  return { o: Math.min(fadeIn, fadeOut), s: interpolate(local, [0, 6], [0.92, 1], clamp) };
};

const Rich: React.FC<{ text: string; base: string }> = ({ text, base }) => (
  <>
    {parseMarkup(text).map((sg, i) => (
      <span key={i} style={{ color: colorOf(sg.c, base) }}>
        {sg.t}
      </span>
    ))}
  </>
);

// Centre callout (판정·요약) or a quote in big quotation marks.
export const Callout: React.FC<{ tx: TextItem; low: boolean }> = ({ tx, low }) => {
  const { o, s } = useTextIn(tx);
  const isQuote = tx.type === "quote";
  const base = isQuote && tx.who === "guest" ? C.cyan : C.white;
  const allRed = /^\[r:[^\]]+\]$/.test(tx.text ?? "");
  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        right: 40,
        top: low ? 760 : 440,
        transform: `translateY(-50%) scale(${s})`,
        opacity: o,
        textAlign: "center",
        fontSize: allRed ? 104 : isQuote ? 84 : 90,
        fontWeight: 900,
        lineHeight: 1.22,
        letterSpacing: -1,
        whiteSpace: "pre-line",
        ...outlined(allRed ? 16 : 14),
      }}
    >
      {isQuote && <span style={{ color: base }}>"</span>}
      <Rich text={tx.text ?? ""} base={base} />
      {isQuote && <span style={{ color: base }}>"</span>}
    </div>
  );
};

// Number card: dark translucent box, small grey label, big yellow (peak) or red (loss) value, optional red tag.
export const NumCard: React.FC<{ tx: TextItem; low: boolean }> = ({ tx, low }) => {
  const { o, s } = useTextIn(tx);
  const color = tx.color === "y" ? C.yellow : tx.color === "b" ? C.cyan : C.red;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: low ? 790 : 420,
        transform: `translate(-50%, -50%) scale(${s})`,
        opacity: o,
        background: C.panel,
        borderRadius: 12,
        padding: "18px 54px 22px",
        textAlign: "center",
        whiteSpace: "nowrap",
        boxShadow: "0 14px 36px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ color: "#e3e3e6", fontSize: 30, fontWeight: 700 }}>{tx.label}</div>
      <div style={{ color, fontSize: 118, fontWeight: 900, lineHeight: 1.08, letterSpacing: -2 }}>{tx.value}</div>
      {tx.tag && (
        <div style={{ display: "inline-block", marginTop: 8, background: C.red, color: "#fff", fontSize: 28, fontWeight: 800, padding: "4px 16px", borderRadius: 5 }}>
          {tx.tag}
        </div>
      )}
    </div>
  );
};

// Bottom one-line subtitle.
export const BottomSub: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 960,
      transform: "translateY(-50%)",
      textAlign: "center",
      color: C.white,
      fontSize: 56,
      fontWeight: 900,
      letterSpacing: -0.5,
      whiteSpace: "nowrap",
      ...outlined(10),
    }}
  >
    {text}
  </div>
);
