import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, fonts } from '../theme';
import { InstructionPanel } from './InstructionPanel';

type SceneShellProps = {
  kicker: string;
  title: React.ReactNode;
  steps: string[];
  active: number;
  footnote?: string;
  children: React.ReactNode;
  enterAt?: number;
  phoneX?: number;
  phoneY?: number;
  phoneScale?: number;
  tint?: string;
};

export const SceneShell: React.FC<SceneShellProps> = ({
  kicker,
  title,
  steps,
  active,
  footnote,
  children,
  enterAt = 0,
  phoneX = 1372,
  phoneY = 552,
  phoneScale = 0.9,
  tint = 'rgba(238,120,79,0.16)',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - enterAt,
    fps,
    config: { damping: 16, stiffness: 90, mass: 0.9 },
  });

  const panelIn = interpolate(frame, [enterAt, enterAt + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(122deg, ${colors.paper} 0%, #f7f2e7 46%, ${colors.paperDeep} 100%)`,
        fontFamily: fonts.body,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(58% 64% at 76% 46%, ${tint}, rgba(238,120,79,0) 70%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(23,63,53,0.13) 1.4px, rgba(23,63,53,0) 1.4px)',
          backgroundSize: '34px 34px',
          opacity: 0.45,
          maskImage: 'radial-gradient(70% 70% at 30% 40%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(70% 70% at 30% 40%, black, transparent)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 540,
          transform: `translateY(-50%) translateY(${(1 - panelIn) * 26}px)`,
          opacity: panelIn,
        }}
      >
        <InstructionPanel
          kicker={kicker}
          title={title}
          steps={steps}
          active={active}
          footnote={footnote}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: phoneX,
          top: phoneY,
          transform: `translate(-50%, -50%) translateY(${(1 - enter) * 90}px) scale(${phoneScale})`,
          opacity: Math.min(1, enter * 1.4),
        }}
      >
        {children}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 120,
          bottom: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          opacity: 0.75,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: colors.ink,
            color: colors.paper,
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          EC
        </div>
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: 18,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: colors.soft,
          }}
        >
          Attendance by ProofsTech
        </span>
      </div>
    </AbsoluteFill>
  );
};
