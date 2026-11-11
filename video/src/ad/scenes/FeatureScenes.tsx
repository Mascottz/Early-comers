import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { colors } from '../../theme';
import { AdScene, useSteadyProgress } from '../components/AdScene';
import { BrowserCard, FloatingNote } from '../components/BrowserCard';

type FeatureSceneProps = {
  kicker: string;
  title: React.ReactNode;
  src: string;
  imgHeight: number;
  accent?: 'orange' | 'ink' | 'duo';
  note?: { title: string; detail: string; x: number; y: number; at: number };
};

const FeatureScene: React.FC<FeatureSceneProps> = ({
  kicker,
  title,
  src,
  imgHeight,
  accent = 'orange',
  note,
}) => {
  const frame = useCurrentFrame();
  const progress = useSteadyProgress(0.1, 0.94);

  const noteIn = note
    ? interpolate(frame, [note.at, note.at + 16], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  const enter = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AdScene kicker={kicker} title={title} accent={accent} compact>
      <div
        style={{
          position: 'absolute',
          left: 235,
          top: 330,
          opacity: enter,
          transform: `translateY(${(1 - enter) * 40}px)`,
        }}
      >
        <BrowserCard
          src={src}
          imgHeight={imgHeight}
          width={1450}
          viewportHeight={604}
          progress={progress}
          rotateY={-4}
          rotateX={2}
        />
      </div>

      {note ? (
        <FloatingNote x={note.x} y={note.y} title={note.title} detail={note.detail} appear={noteIn} />
      ) : null}

      <div
        style={{
          position: 'absolute',
          right: 132,
          bottom: 54,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          opacity: 0.6,
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 17,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: colors.soft,
        }}
      >
        <span style={{ width: 26, height: 2, background: colors.soft, opacity: 0.5 }} />
        Attendance by ProofsTech
      </div>

    </AdScene>
  );
};

export const TodayScene: React.FC = () => (
  <FeatureScene
    kicker="Today"
    title={
      <>
        The whole morning, <span style={{ color: colors.orangeDark }}>on one screen.</span>
      </>
    }
    src="screens/today.png"
    imgHeight={1211}
  />
);

export const PassScene: React.FC = () => (
  <FeatureScene
    kicker="Office QR"
    title={
      <>
        A fresh pass, <span style={{ color: colors.orangeDark }}>every morning.</span>
      </>
    }
    src="screens/office-qr.png"
    imgHeight={927}
    accent="duo"
    note={{
      title: 'Valid today only',
      detail: 'It stops working at midnight',
      x: 1382,
      y: 828,
      at: 122,
    }}
  />
);

export const WallScene: React.FC = () => (
  <FeatureScene
    kicker="Daily wall"
    title={
      <>
        The morning, <span style={{ color: colors.orangeDark }}>as it happens.</span>
      </>
    }
    src="screens/daily-wall.png"
    imgHeight={909}
  />
);

export const TeamScene: React.FC = () => (
  <FeatureScene
    kicker="Team"
    title={
      <>
        Everyone, <span style={{ color: colors.orangeDark }}>in plain sight.</span>
      </>
    }
    src="screens/team.png"
    imgHeight={822}
    accent="ink"
  />
);
