import React from "react";
import { Composition, Still } from "remotion";
import { Main } from "./Main";
import { Thumbnail } from "./Thumbnail";
import timeline from "./timeline.json";
import timeline20 from "./timeline20.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition
      id="Main"
      component={Main}
      defaultProps={{ tl: timeline }}
      durationInFrames={timeline.durationInFrames}
      fps={timeline.fps}
      width={timeline.width}
      height={timeline.height}
    />
    <Composition
      id="Main20"
      component={Main}
      defaultProps={{ tl: timeline20 }}
      durationInFrames={timeline20.durationInFrames}
      fps={timeline20.fps}
      width={timeline20.width}
      height={timeline20.height}
    />
    <Still id="Thumbnail" component={Thumbnail} width={1280} height={720} />
    </>
  );
};
