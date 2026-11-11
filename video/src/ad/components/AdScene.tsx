import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors } from '../../theme';
import { AdBackground, LogoLockup } from './AdBackground';

type SceneHeaderProps = {
  kicker: string;
  title: React.ReactNode;
  width?: number;
  left?: number;
  top?: number;
  size?: number;
};

export const SceneHeader: React.FC<SceneHeaderProps> = ({
  kicker,
  title,
  width = 1180,
  left = 132,
  top = 190,
  size = 68,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = (delay: number) =>
    spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 88, mass: 0.9 } });

  const kick = rise(3);
  const head = rise(9);
  const rule = rise(16);

  return (
    <div style={{ position: 'absolute', left, top, width }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          opacity: kick,
          transform: `translateY(${(1 - kick) * 12}px)`,
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: 5,
            background: colors.orange,
            boxShadow: '0 0 0 5px rgba(238,120,79,0.18)',
          }}
        />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 20,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: colors.orangeDark,
            fontWeight: 500,
          }}
        >
          {kicker}
        </span>
      </div>

      <div
        style={{
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.04,
          letterSpacing: '-0.035em',
          color: colors.ink,
          marginTop: 18,
          opacity: head,
          transform: `translateY(${(1 - head) * 26}px)`,
        }}
      >
        {title}
      </div>

      <div
        style={{
          height: 3,
          width: 132,
          marginTop: 24,
          borderRadius: 2,
          background: colors.orange,
          transformOrigin: 'left center',
          transform: `scaleX(${rule})`,
          opacity: 0.9,
        }}
      />
    </div>
  );
};

type AdSceneProps = {
  kicker: string;
  title: React.ReactNode;
  children: React.ReactNode;
  accent?: 'orange' | 'ink' | 'duo';
  size?: number;
  compact?: boolean;
};

export const AdScene: React.FC<AdSceneProps> = ({
  kicker,
  title,
  children,
  accent = 'orange',
  size,
  compact = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const body = spring({ frame: frame - 22, fps, config: { damping: 20, stiffness: 80, mass: 1 } });

  return (
    <AdBackground accent={accent}>
      <div
        style={{
          position: 'absolute',
          left: 132,
          top: 74,
          opacity: interpolate(frame, [0, 10], [0, 0.9], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <LogoLockup size={40} />
      </div>

      <SceneHeader
        kicker={kicker}
        title={title}
        top={compact ? 168 : 190}
        size={size ?? (compact ? 62 : 68)}
      />

      <AbsoluteFill style={{ opacity: body }}>{children}</AbsoluteFill>
    </AdBackground>
  );
};

/** Slow, eased camera move used for every screenshot and detail shot. */
export const useSteadyProgress = (startFraction = 0.12, endFraction = 0.92) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const from = durationInFrames * startFraction;
  const to = durationInFrames * endFraction;
  const raw = Math.max(0, Math.min(1, (frame - from) / (to - from)));
  const eased = raw * raw * (3 - 2 * raw);
  return eased;
};
