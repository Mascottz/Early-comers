import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors } from '../../theme';
import { AdBackground, LogoLockup } from '../components/AdBackground';

const PILLS = [
  { label: "Who's here", at: 76, tone: 'ink' as const },
  { label: "Who's late", at: 108, tone: 'orange' as const },
  { label: 'Still on the way', at: 140, tone: 'soft' as const },
];

const ClockDial: React.FC<{ frame: number }> = ({ frame }) => {
  const sweep = interpolate(frame, [0, 247], [-38, 26]);
  return (
    <div
      style={{
        position: 'absolute',
        left: 1180,
        top: 236,
        width: 620,
        height: 620,
        opacity: interpolate(frame, [0, 18], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '1.5px dashed rgba(23,63,53,0.22)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 54,
          borderRadius: '50%',
          background: 'rgba(255,253,247,0.55)',
          border: '1px solid rgba(23,63,53,0.10)',
          boxShadow: '0 40px 90px rgba(11,33,28,0.10), inset 0 1px 0 rgba(255,255,255,0.8)',
        }}
      />
      {Array.from({ length: 60 }).map((_, index) => {
        const major = index % 5 === 0;
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: major ? 2 : 1,
              height: major ? 16 : 8,
              background: major ? 'rgba(23,63,53,0.45)' : 'rgba(23,63,53,0.22)',
              transformOrigin: '50% 258px',
              transform: `translate(-50%, -258px) rotate(${index * 6}deg)`,
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 2,
          height: 190,
          background: colors.orange,
          borderRadius: 2,
          transformOrigin: '50% 100%',
          transform: `translate(-50%, -100%) rotate(${sweep}deg)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 14,
          height: 14,
          marginLeft: -7,
          marginTop: -7,
          borderRadius: '50%',
          background: colors.orange,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 366,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: '"Bricolage Grotesque", sans-serif',
            fontWeight: 700,
            fontSize: 76,
            letterSpacing: '-0.04em',
            color: colors.ink,
          }}
        >
          08:42
        </div>
        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 17,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: colors.soft,
            marginTop: 2,
          }}
        >
          Abuja · WAT
        </div>
      </div>
    </div>
  );
};

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headline = spring({ frame: frame - 6, fps, config: { damping: 17, stiffness: 84, mass: 0.9 } });

  return (
    <AdBackground accent="duo">
      <div style={{ position: 'absolute', left: 132, top: 74, opacity: 0.9 }}>
        <LogoLockup size={40} />
      </div>

      <ClockDial frame={frame} />

      <div style={{ position: 'absolute', left: 132, top: 300, width: 980 }}>
        <div
          style={{
            fontFamily: '"Bricolage Grotesque", sans-serif',
            fontWeight: 700,
            fontSize: 98,
            lineHeight: 1.02,
            letterSpacing: '-0.042em',
            color: colors.ink,
            opacity: headline,
            transform: `translateY(${(1 - headline) * 34}px)`,
          }}
        >
          Every morning
          <br />
          starts <span style={{ color: colors.orange }}>the same way.</span>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 136, top: 690, display: 'flex', gap: 18 }}>
        {PILLS.map((pill) => {
          const enter = spring({
            frame: frame - pill.at,
            fps,
            config: { damping: 16, stiffness: 110, mass: 0.8 },
          });
          return (
            <div
              key={pill.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '15px 26px 15px 18px',
                borderRadius: 999,
                background: 'rgba(255,253,247,0.92)',
                border: `1px solid ${colors.line}`,
                boxShadow: '0 16px 32px rgba(11,33,28,0.08)',
                opacity: enter,
                transform: `translateY(${(1 - enter) * 22}px)`,
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background:
                    pill.tone === 'orange'
                      ? colors.orange
                      : pill.tone === 'ink'
                        ? colors.ink
                        : 'rgba(23,63,53,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {pill.tone === 'ink' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4.5 12.5l5 5L20 6.8"
                      stroke={colors.white}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </span>
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 26,
                  fontWeight: 500,
                  color: colors.ink,
                  letterSpacing: '-0.01em',
                }}
              >
                {pill.label}
              </span>
            </div>
          );
        })}
      </div>
    </AdBackground>
  );
};
