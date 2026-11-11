import React from 'react';
import { Composition } from 'remotion';
import { Fonts } from './Fonts';
import { InstallVideo } from './InstallVideo';
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from './timeline';

export const RemotionRoot: React.FC = () => (
  <Fonts>
    <Composition
      id="InstallVideo"
      component={InstallVideo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  </Fonts>
);
