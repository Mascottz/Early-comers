import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { IntroScene } from './scenes/IntroScene';
import { IphoneScene } from './scenes/IphoneScene';
import { AndroidScene } from './scenes/AndroidScene';
import { OutroScene } from './scenes/OutroScene';
import { SCENES, TRANSITION } from './timeline';
import { colors } from './theme';

const timing = linearTiming({ durationInFrames: TRANSITION });

export const InstallVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: colors.paper }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENES.intro}>
        <IntroScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fade()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={SCENES.iphone}>
        <IphoneScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-right' })}
        timing={timing}
      />

      <TransitionSeries.Sequence durationInFrames={SCENES.android}>
        <AndroidScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fade()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={SCENES.outro}>
        <OutroScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
