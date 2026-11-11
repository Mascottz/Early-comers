import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Phone } from '../Phone';
import { SceneShell } from '../components/SceneShell';
import { Callout } from '../components/Callout';
import { SitePage } from '../screens/SitePage';
import { ChromeMenu, AndroidDialog } from '../screens/AndroidSheet';
import { HomeScreenContent } from '../screens/HomeScreen';

const STEPS = [
  'Open earlycomers.vercel.app in Chrome',
  'Tap ⋮, then “Add to Home screen”',
  'Tap Add — the app appears on your Home screen',
];

export const AndroidScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  const range = (from: number, to: number) => clamp((frame - from) / (to - from));

  const menuGlow = range(64, 78) * (1 - range(102, 112));
  const menuPress = range(96, 100) * (1 - range(102, 108));
  const sheetLift = spring({
    frame: frame - 106,
    fps,
    config: { damping: 18, stiffness: 110, mass: 0.85 },
  });
  const rowGlow = range(146, 158);
  const rowPress = range(188, 192) * (1 - range(194, 202));
  const dialog = spring({
    frame: frame - 200,
    fps,
    config: { damping: 20, stiffness: 140, mass: 0.7 },
  });
  const addPress = range(252, 256) * (1 - range(260, 270));
  const dialogGone = 1 - range(260, 272);
  const homeIn = spring({
    frame: frame - 266,
    fps,
    config: { damping: 18, stiffness: 90, mass: 0.9 },
  });
  const showHome = frame >= 266;

  const activeStep = frame < 62 ? 0 : frame < 188 ? 1 : frame < 258 ? 2 : 3;

  const rotateY = interpolate(frame, [0, 360], [14, 6]);
  const rotateX = interpolate(frame, [0, 360], [6, 2]);
  const float = Math.sin(frame / 24 + 1.4) * 8;

  return (
    <SceneShell
      kicker="Android · Chrome"
      title={
        <>
          Install it in
          <br />
          three taps
        </>
      }
      steps={STEPS}
      active={activeStep}
      footnote="Works on any Android phone. The icon sits beside your other apps."
      tint="rgba(23,63,53,0.12)"
    >
      <Phone platform="android" rotateX={rotateX} rotateY={rotateY} rotateZ={1.4} translateY={float} scale={1}>
        <AbsoluteFill style={{ background: '#faf7ef' }}>
          {!showHome ? (
            <AbsoluteFill>
              <SitePage
                platform="android"
                url="earlycomers.vercel.app"
                frame={frame}
                typeAt={8}
                menuGlow={menuGlow}
                menuPress={menuPress}
              />

              <ChromeMenu
                lift={sheetLift * (1 - range(258, 268))}
                highlight={rowGlow}
                press={rowPress}
              />

              {dialog > 0.01 ? (
                <div style={{ opacity: dialogGone }}>
                  <AndroidDialog appear={dialog} press={addPress} />
                </div>
              ) : null}

              <Callout
                x={267}
                y={190}
                label="Tap the ⋮ menu"
                step={1}
                appear={range(64, 78) * (1 - range(100, 110))}
                bob={Math.sin(frame / 7) * 5}
                pointer="up"
              />

              <Callout
                x={330}
                y={748}
                label="Add to Home screen"
                step={2}
                appear={range(146, 160) * (1 - range(190, 200))}
                bob={Math.sin(frame / 8) * 4}
                pointer="down"
              />

              <Callout
                x={300}
                y={792}
                label="Tap Add"
                step={3}
                appear={range(218, 232) * (1 - range(252, 262))}
                bob={Math.sin(frame / 7) * 4}
                pointer="up"
              />
            </AbsoluteFill>
          ) : null}

          <AbsoluteFill style={{ opacity: homeIn }}>
            <HomeScreenContent
              platform="android"
              caption="Installed"
              appearFrame={272}
              label="Attendance now opens like a regular Android app."
            />
          </AbsoluteFill>
        </AbsoluteFill>
      </Phone>
    </SceneShell>
  );
};
