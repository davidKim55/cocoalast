import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Bars, Donut, Graphic, PhotoCard, QuoteBox, RankCard, Recap, StatBox, Subscribe, TitleCard, Timeline } from "./Graphics";
import { C, FONT, loadFonts, outlined } from "./theme";
import timeline from "./timeline.json";

type Seg = { t: string; red: boolean };
type Caption = { from: number; to: number; segs: Seg[] };
type Bg = { image: string; from: number; to: number };
type SceneData = {
  id: string;
  from: number;
  duration: number;
  audioOffset: number;
  chapter: { rank: string; name: string } | null;
  captions: Caption[];
  graphics: Graphic[];
  backgrounds: Bg[];
};

const credits = timeline.credits as Record<string, { artist: string; license: string }>;
const FADE = 14;

// Graphics that take over the centre of the screen push the caption to the bottom;
// graphics that already spell out the line (stat, quote, title, rank) hide it.
const HIDE_CAPTION = new Set(["stat", "quote", "title", "rank"]);
const BLUR_BG = new Set(["photo", "quote", "title", "rank", "donut", "bars", "timeline", "recap"]);

const active = (gs: Graphic[], f: number) => gs.filter((g) => f >= g.from && f < g.to);

const Background: React.FC<{ bgs: Bg[]; blur: number; dim: number }> = ({ bgs, blur, dim }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ filter: `blur(${blur * 16}px) brightness(${1 - dim})`, transform: `scale(${1 + blur * 0.04})` }}>
      {bgs.map((b, i) => {
        const len = b.to - b.from + FADE;
        const local = frame - b.from;
        if (local < 0 || local > len) return null;
        const opacity = i === 0 ? 1 : interpolate(local, [0, FADE], [0, 1], { extrapolateRight: "clamp" });
        const zoom = interpolate(local, [0, len], [1.06, 1.16]);
        const dir = i % 2 === 0 ? 1 : -1;
        const pan = interpolate(local, [0, len], [-18 * dir, 18 * dir]);
        return (
          <AbsoluteFill key={i} style={{ opacity }}>
            <Img
              src={staticFile(`images/${b.image}.jpg`)}
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom}) translateX(${pan}px)` }}
            />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

const Captions: React.FC<{ caps: Caption[]; mode: "center" | "bottom" | "hidden" }> = ({ caps, mode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cap = caps.find((c) => frame >= c.from && frame < c.to);
  if (!cap || mode === "hidden") return null;
  const s = spring({ frame: frame - cap.from, fps, config: { damping: 16, stiffness: 300 } });
  const bottom = mode === "bottom";
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: bottom ? 965 : 505,
        transform: `translateY(-50%) scale(${0.94 + 0.06 * s})`,
        textAlign: "center",
        fontSize: bottom ? 66 : 92,
        fontWeight: 900,
        letterSpacing: -1,
        whiteSpace: "nowrap",
        ...outlined(bottom ? 12 : 15),
      }}
    >
      {cap.segs.map((sg, i) => (
        <span key={i} style={{ color: sg.red ? C.red : C.white }}>
          {sg.t}
        </span>
      ))}
    </div>
  );
};

const ChapterLabel: React.FC<{ chapter: SceneData["chapter"]; hidden: boolean }> = ({ chapter, hidden }) => {
  if (!chapter) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        top: 48,
        fontSize: 44,
        fontWeight: 900,
        opacity: hidden ? 0 : 1,
        textShadow: "0 3px 8px rgba(0,0,0,0.7)",
        WebkitTextStroke: "6px rgba(10,10,12,0.85)",
        paintOrder: "stroke fill",
      }}
    >
      <span style={{ color: C.cyan }}>{chapter.rank}</span>
      <span style={{ color: C.white }}> {chapter.name}</span>
    </div>
  );
};

const Credit: React.FC<{ image: string | undefined }> = ({ image }) => {
  const c = image ? credits[image] : undefined;
  if (!c) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 30,
        bottom: 18,
        fontSize: 21,
        fontWeight: 600,
        color: "rgba(255,255,255,0.78)",
        textShadow: "0 1px 3px rgba(0,0,0,0.9)",
      }}
    >
      사진: {c.artist} · {c.license} · Wikimedia Commons
    </div>
  );
};

const renderGraphic = (g: Graphic, all: Graphic[], key: number) => {
  switch (g.type) {
    case "photo":
      return <PhotoCard key={key} g={g} />;
    case "stat": {
      const withPhoto = all.some((o) => o.type === "photo" && o.from <= g.from && o.to > g.from);
      return <StatBox key={key} g={g} low={withPhoto} />;
    }
    case "quote":
      return <QuoteBox key={key} g={g} />;
    case "title":
      return <TitleCard key={key} g={g} />;
    case "rank":
      return <RankCard key={key} g={g} />;
    case "donut":
      return <Donut key={key} g={g} />;
    case "bars":
      return <Bars key={key} g={g} />;
    case "timeline":
      return <Timeline key={key} g={g} />;
    case "subscribe":
      return <Subscribe key={key} g={g} />;
    case "recap":
      return <Recap key={key} g={g} />;
    default:
      return null;
  }
};

const Scene: React.FC<{ sc: SceneData }> = ({ sc }) => {
  const frame = useCurrentFrame();
  const now = active(sc.graphics, frame);

  // Smoothly blend background blur/dim in and out around graphics.
  const level = (types: Set<string>) =>
    Math.max(
      0,
      ...sc.graphics
        .filter((g) => types.has(g.type))
        .map((g) => Math.min(interpolate(frame, [g.from - 2, g.from + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), interpolate(frame, [g.to - 8, g.to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))),
    );
  const blur = level(BLUR_BG);
  const statDim = level(new Set(["stat", "subscribe"]));
  const dim = Math.max(blur * 0.5, statDim * 0.35);

  let mode: "center" | "bottom" | "hidden" = "center";
  if (now.some((g) => HIDE_CAPTION.has(g.type))) mode = "hidden";
  else if (now.length > 0) mode = "bottom";

  const photo = now.find((g) => g.type === "photo");
  const bg = sc.backgrounds.find((b) => frame >= b.from && frame < b.to) ?? sc.backgrounds[sc.backgrounds.length - 1];
  const rankShowing = now.some((g) => g.type === "rank");

  return (
    <AbsoluteFill>
      <Background bgs={sc.backgrounds} blur={blur} dim={dim} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)" }} />
      {sc.graphics.map((g, i) => (frame >= g.from && frame < g.to ? renderGraphic(g, sc.graphics, i) : null))}
      <Captions caps={sc.captions} mode={mode} />
      <ChapterLabel chapter={sc.chapter} hidden={rankShowing} />
      <Credit image={photo?.image ?? bg?.image} />
      <Sequence from={sc.audioOffset}>
        <Audio src={staticFile(`audio/${sc.id}.mp3`)} />
      </Sequence>
    </AbsoluteFill>
  );
};

const Music: React.FC<{ track: string; len: number }> = ({ track, len }) => {
  return (
    <Audio
      src={staticFile(`music/bgm_${track}.mp3`)}
      loop
      volume={(f) =>
        0.16 *
        Math.min(
          interpolate(f, [0, 30], [0, 1], { extrapolateRight: "clamp" }),
          interpolate(f, [len - 30, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        )
      }
    />
  );
};

const MusicCredit: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        right: 30,
        bottom: 18,
        fontSize: 21,
        fontWeight: 600,
        color: "rgba(255,255,255,0.78)",
        textShadow: "0 1px 3px rgba(0,0,0,0.9)",
        opacity,
      }}
    >
      음악: "Investigations", "Deliberate Thought" – Kevin MacLeod (incompetech.com) · CC BY 4.0
    </div>
  );
};

export const Main: React.FC = () => {
  loadFonts();
  const scenes = timeline.scenes as unknown as SceneData[];
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      {scenes.map((sc) => (
        <Sequence key={sc.id} from={sc.from} durationInFrames={sc.duration}>
          <Scene sc={sc} />
        </Sequence>
      ))}
      {timeline.music.map((m, i) => (
        <Sequence key={i} from={m.from} durationInFrames={m.to - m.from}>
          <Music track={m.track} len={m.to - m.from} />
        </Sequence>
      ))}
      <Sequence from={timeline.durationInFrames - 8 * timeline.fps}>
        <MusicCredit />
      </Sequence>
    </AbsoluteFill>
  );
};
