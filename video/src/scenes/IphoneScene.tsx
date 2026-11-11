import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Phone } from '../Phone';
import { SceneShell } from '../components/SceneShell';
import { Callout } from '../components/Callout';
import { SitePage } from '../screens/SitePage';
import { IosShareSheet, IosAddDialog } from '../screens/IosShareSheet';
import { HomeScreenContent } from '../screens/HomeScreen';

const STEPS = [
  'Open earlycomers.vercel.app in Safari',
  'Tap Share, then “Add to Home Screen”',
  'Tap Add — the app lands on your Home Screen',
];

export const IphoneScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  const range = (from: number, to: number) => clamp((frame - from) / (to - from));

  const shareGlow = range(66, 80) * (1 - range(108, 118));
  const sharePress = range(100, 104) * (1 - range(106, 112));
  const sheetLift = spring({
    frame: frame - 112,
    fps,
    config: { damping: 18, stiffness: 110, mass: 0.85 },
  });
  const rowGlow = range(150, 162);
  const rowPress = range(192, 196) * (1 - range(198, 206));
  const dialog = spring({
    frame: frame - 204,
    fps,
    config: { damping: 20, stiffness: 140, mass: 0.7 },
  });
  const addPress = range(258, 262) * (1 - range(266, 276));
  const dialogGone = 1 - range(266, 280);
  const homeIn = spring({
    frame: frame - 272,
    fps,
    config: { damping: 18, stiffness: 90, mass: 0.9 },
  });
  const showHome = frame >= 272;

  const activeStep = frame < 64 ? 0 : frame < 192 ? 1 : frame < 266 ? 2 : 3;

  const rotateY = interpolate(frame, [0, 360], [-15, -6]);
  const rotateX = interpolate(frame, [0, 360], [6, 2]);
  const float = Math.sin(frame / 26) * 8;

  return (
    <SceneShell
      kicker="iPhone · Safari"
      title={
        <>
          Add it to your
          <br />
          Home Screen
        </>
      }
      steps={STEPS}
      active={activeStep}
      footnote="No App Store. No download. It opens like any other app."
    >
      <Phone platform="ios" rotateX={rotateX} rotateY={rotateY} rotateZ={-1.2} translateY={float} scale={1}>
        <AbsoluteFill style={{ background: '#faf7ef' }}>
          {!showHome ? (
            <AbsoluteFill>
              <SitePage
                platform="ios"
                url="earlycomers.vercel.app"
                frame={frame}
                typeAt={8}
                shareGlow={shareGlow}
                sharePressed={sharePress}
              />

              <IosShareSheet
                lift={sheetLift * (1 - range(266, 276))}
                highlight={rowGlow}
                press={rowPress}
              />

              {dialog > 0.01 ? (
                <div style={{ opacity: dialogGone }}>
                  <IosAddDialog appear={dialog} press={addPress} />
                </div>
              ) : null}

              <Callout
                x={267}
                y={938}
                label="Tap Share"
                step={1}
                appear={range(66, 80) * (1 - range(106, 116))}
                bob={Math.sin(frame / 7) * 5}
                pointer="down"
              />

              <Callout
                x={356}
                y={708}
                label="Add to Home Screen"
                step={2}
                appear={range(150, 164) * (1 - range(194, 204))}
                bob={Math.sin(frame / 8) * 4}
                pointer="down"
              />

              <Callout
                x={267}
                y={806}
                label="Tap Add"
                step={3}
                appear={range(224, 238) * (1 - range(258, 268))}
                bob={Math.sin(frame / 7) * 4}
                pointer="up"
              />
            </AbsoluteFill>
          ) : null}

          <AbsoluteFill style={{ opacity: homeIn }}>
            <HomeScreenContent
              platform="ios"
              caption="Installed"
              appearFrame={278}
              label="Attendance is now one tap away on your Home Screen."
            />
          </AbsoluteFill>
        </AbsoluteFill>
      </Phone>
    </SceneShell>
  );
};
