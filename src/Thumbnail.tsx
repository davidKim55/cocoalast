import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONT, loadFonts, outlined } from "./theme";

// YouTube thumbnail in the reference's layout, built from the intro's beats:
// corner hook = intro scene 1 (the $50M Netflix offer), centre quote = scene 2 (the radar line),
// right photo = the intro's answer (the last Blockbuster left), left photo = Blockbuster in its prime.
export const Thumbnail: React.FC = () => {
  loadFonts();
  const crack = "M 0 0 L 18 90 L -10 170 L 22 260 L -6 350 L 16 440 L -12 530 L 14 620 L 0 720";
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 660, height: 720, overflow: "hidden" }}>
        <Img src={staticFile("images/bb_store.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.25) brightness(1.05)" }} />
      </div>
      <div style={{ position: "absolute", left: 640, top: 0, width: 640, height: 720, overflow: "hidden" }}>
        <Img src={staticFile("images/bb_last.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.75) brightness(0.62) contrast(1.15)" }} />
      </div>
      <svg width={60} height={720} viewBox="-30 0 60 720" style={{ position: "absolute", left: 620, top: 0 }}>
        <path d={crack} stroke={C.red} strokeWidth={7} fill="none" />
      </svg>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.75) 100%)" }} />
      <div style={{ position: "absolute", right: 34, top: 30, textAlign: "right", color: "#7CFF6B", fontSize: 50, fontWeight: 900, lineHeight: 1.15, ...outlined(10) }}>
        넷플릭스를 5천만 달러에
        <br />
        안 산 회사, 지금은?
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 388, textAlign: "center", color: C.white, fontSize: 80, fontWeight: 900, letterSpacing: -2, ...outlined(14) }}>
        "넷플릭스? 레이더에도 안 잡혀"
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 500, textAlign: "center", color: C.cyan, fontSize: 150, fontWeight: 900, letterSpacing: -4, lineHeight: 1.1, ...outlined(18) }}>
        시대 놓친 기업 TOP7
      </div>
    </AbsoluteFill>
  );
};
