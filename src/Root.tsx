import React from "react";
import { Composition, Still } from "remotion";
import { Main } from "./Main";
import { Thumbnail } from "./Thumbnail";
import timeline from "./timeline.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition
      id="Main"
      component={Main}
      durationInFrames={timeline.durationInFrames}
      fps={timeline.fps}
      width={timeline.width}
      height={timeline.height}
    />
    <Still id="Thumbnail" component={Thumbnail} width={1280} height={720} />
    </>
  );
};
