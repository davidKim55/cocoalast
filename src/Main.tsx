import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Board, BottomSub, Callout, Media, NumCard, PhotoCard, RankBoard, RankTitle, TextItem, Visual } from "./Graphics";
import { C, FONT, loadFonts, outlined } from "./theme";
import timeline from "./timeline.json";

type Caption = { from: number; to: number; text: string };
type SceneData = {
  id: string;
  from: number;
  duration: number;
  audioOffset: number;
  visuals: Visual[];
  texts: TextItem[];
  captions: Caption[];
};

const board = timeline.board as unknown as Board;
const credits = timeline.credits as Record<string, { artist: string; license: string; kind?: string }>;
const XFADE = 4;

const VisualLayer: React.FC<{ v: Visual; first: boolean }> = ({ v, first }) => {
  const frame = useCurrentFrame();
  const opacity = first ? 1 : interpolate(frame - v.from, [0, XFADE], [0, 1], { extrapolateRight: "clamp" });
  let body: React.ReactNode = null;
  if (v.type === "bg") body = <Media v={v} />;
  if (v.type === "card") body = <PhotoCard v={v} />;
  if (v.type === "rank") body = <RankTitle v={v} />;
  if (v.type === "board") body = <RankBoard v={v} board={board} />;
  return <AbsoluteFill style={{ opacity }}>{body}</AbsoluteFill>;
};

const ChapterLabel: React.FC<{ rank: string; name: string }> = ({ rank, name }) => (
  <div style={{ position: "absolute", left: 44, top: 34, fontSize: 36, fontWeight: 900, ...outlined(7) }}>
    <span style={{ color: C.cyan }}>{rank}</span>
    <span style={{ color: C.white }}> {name}</span>
  </div>
);

const Credit: React.FC<{ id?: string }> = ({ id }) => {
  const c = id ? credits[id] : undefined;
  if (!c || c.kind === "generated") return null;
  return (
    <div style={{ position: "absolute", left: 26, bottom: 14, fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.72)", textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}>
      {c.kind === "video" ? "영상" : "사진"}: {c.artist} · {c.license} · Wikimedia Commons
    </div>
  );
};

const Scene: React.FC<{ sc: SceneData }> = ({ sc }) => {
  const frame = useCurrentFrame();
  const vIdx = sc.visuals.findIndex((v) => frame >= v.from && frame < v.to);
  const v = sc.visuals[vIdx === -1 ? sc.visuals.length - 1 : vIdx];
  const tx = sc.texts.find((t) => frame >= t.from && frame < t.to);
  const cap = sc.captions.find((c) => frame >= c.from && frame < c.to);
  const fullScreen = v.type === "board" || v.type === "rank";
  const low = v.type === "card";
  const rankV = sc.visuals.find((x) => x.type === "rank");
  const showLabel = rankV && frame >= rankV.to && v.type !== "board";

  return (
    <AbsoluteFill>
      {sc.visuals.map((vv, i) =>
        frame >= vv.from && frame < vv.to + XFADE ? (
          <Sequence key={i} from={vv.from} durationInFrames={vv.to - vv.from + XFADE} layout="none">
            <VisualLayer v={{ ...vv, from: 0, to: vv.to - vv.from }} first={i === 0} />
          </Sequence>
        ) : null,
      )}
      {!fullScreen && tx && (tx.type === "num" ? <NumCard tx={tx} low={low} /> : <Callout tx={tx} low={low} />)}
      {!fullScreen && !tx && cap && <BottomSub text={cap.text} />}
      {showLabel && <ChapterLabel rank={rankV!.rank!} name={rankV!.name!} />}
      {v.type !== "board" && <Credit id={v.image} />}
      <Sequence from={sc.audioOffset}>
        <Audio src={staticFile(`audio/${sc.id}.mp3`)} />
      </Sequence>
    </AbsoluteFill>
  );
};

const Music: React.FC<{ track: string; len: number }> = ({ track, len }) => (
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

const MusicCredit: React.FC = () => (
  <div style={{ position: "absolute", right: 26, bottom: 14, fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.72)", textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}>
    음악: "Investigations", "Deliberate Thought" – Kevin MacLeod (incompetech.com) · CC BY 4.0
  </div>
);

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
