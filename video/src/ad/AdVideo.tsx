import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { HookScene } from './scenes/HookScene';
import { TodayScene, PassScene, WallScene, TeamScene } from './scenes/FeatureScenes';
import { ScanScene } from './scenes/ScanScene';
import { LateScene } from './scenes/LateScene';
import { CloseScene } from './scenes/CloseScene';
import { AD_SCENES, AD_TOTAL_FRAMES, AD_TRANSITION, VOICE, VOICE_OFFSET } from './timeline';
import { colors } from '../theme';

const timing = linearTiming({ durationInFrames: AD_TRANSITION });

const Narration: React.FC<{ src: string }> = ({ src }) => (
  <Sequence from={VOICE_OFFSET} name="narration">
    <Audio src={staticFile(src)} />
  </Sequence>
);

const MusicBed: React.FC = () => {
  const frame = useCurrentFrame();
  const volume = interpolate(
    frame,
    [0, 40, AD_TOTAL_FRAMES - 90, AD_TOTAL_FRAMES],
    [0, 0.5, 0.5, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  return <Audio src={staticFile('audio/music-bed.mp3')} volume={volume} />;
};

export const AdVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: colors.paper }}>
    <MusicBed />
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={AD_SCENES.hook}>
        <HookScene />
        <Narration src={VOICE.hook} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fade()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={AD_SCENES.today}>
        <TodayScene />
        <Narration src={VOICE.today} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fade()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={AD_SCENES.pass}>
        <PassScene />
        <Narration src={VOICE.pass} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fade()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={AD_SCENES.scan}>
        <ScanScene />
        <Narration src={VOICE.scan} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fade()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={AD_SCENES.late}>
        <LateScene />
        <Narration src={VOICE.late} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fade()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={AD_SCENES.wall}>
        <WallScene />
        <Narration src={VOICE.wall} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fade()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={AD_SCENES.team}>
        <TeamScene />
        <Narration src={VOICE.team} />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition presentation={fade()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={AD_SCENES.close}>
        <CloseScene />
        <Narration src={VOICE.close} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
