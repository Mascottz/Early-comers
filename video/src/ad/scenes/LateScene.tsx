import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors } from '../../theme';
import { AdBackground, LogoLockup } from '../components/AdBackground';
import { SceneHeader } from '../components/AdScene';

const TRACK_WIDTH = 1180;

const TICKS = [
  { pct: 0, label: '08:00', strong: false },
  { pct: 50, label: '09:00', strong: false },
  { pct: 75, label: '09:30', strong: true },
  { pct: 100, label: '10:00', strong: false },
];

const Chip: React.FC<{
  pct: number;
  time: string;
  label: string;
  tone: 'ink' | 'orange';
  appear: number;
}> = ({ pct, time, label, tone, appear }) => (
  <div
    style={{
      position: 'absolute',
      left: `${pct}%`,
      top: 78,
      transform: `translate(-50%, -100%) translateY(${(1 - appear) * 12}px)`,
      opacity: appear,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '9px 16px',
      borderRadius: 999,
      background: tone === 'orange' ? 'rgba(238,120,79,0.14)' : 'rgba(255,253,247,0.95)',
      border: `1px solid ${tone === 'orange' ? 'rgba(238,120,79,0.45)' : colors.line}`,
      boxShadow: '0 14px 26px rgba(11,33,28,0.10)',
      whiteSpace: 'nowrap',
    }}
  >
    <span
      style={{
        width: 9,
        height: 9,
        borderRadius: 5,
        background: tone === 'orange' ? colors.orange : colors.ink,
      }}
    />
    <span
      style={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 19,
        fontWeight: 500,
        color: colors.ink,
      }}
    >
      {time}
    </span>
    <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 18, color: colors.soft }}>
      {label}
    </span>
  </div>
);

export const LateScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = spring({ frame: frame - 14, fps, config: { damping: 20, stiffness: 70, mass: 1 } });
  const markerIn = spring({ frame: frame - 64, fps, config: { damping: 18, stiffness: 100 } });
  const chipOnTime = interpolate(frame, [96, 116], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const chipLate = interpolate(frame, [148, 168], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cardIn = spring({ frame: frame - 118, fps, config: { damping: 18, stiffness: 90 } });

  return (
    <AdBackground accent="orange">
      <div style={{ position: 'absolute', left: 132, top: 74, opacity: 0.9 }}>
        <LogoLockup size={40} />
      </div>

      <SceneHeader
        kicker="Lateness"
        title={
          <>
            Grace ends at <span style={{ color: colors.orangeDark }}>half past nine.</span>
          </>
        }
        width={1180}
        top={186}
        size={66}
      />

      <div style={{ position: 'absolute', left: 132, top: 456, width: TRACK_WIDTH }}>
        <div style={{ position: 'relative', height: 260 }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 96,
              height: 14,
              borderRadius: 7,
              background: 'rgba(23,63,53,0.10)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 96,
              height: 14,
              borderRadius: 7,
              width: `${reveal * 75}%`,
              background: colors.ink,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '75%',
              top: 96,
              height: 14,
              width: `${Math.max(0, (reveal - 0.75) / 0.25) * 25}%`,
              borderRadius: 7,
              background: `linear-gradient(90deg, ${colors.orange}, ${colors.orangeDark})`,
            }}
          />

          {TICKS.map((tick) => (
            <div key={tick.label}>
              <div
                style={{
                  position: 'absolute',
                  left: `${tick.pct}%`,
                  top: 80,
                  width: tick.strong ? 3 : 1.5,
                  height: tick.strong ? 46 : 28,
                  marginLeft: tick.strong ? -1.5 : -0.75,
                  background: tick.strong ? colors.orangeDark : 'rgba(23,63,53,0.30)',
                  opacity: tick.strong ? markerIn : reveal,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: `${tick.pct}%`,
                  top: 140,
                  transform: 'translateX(-50%)',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: tick.strong ? 25 : 20,
                  fontWeight: tick.strong ? 500 : 400,
                  color: tick.strong ? colors.orangeDark : colors.soft,
                  opacity: tick.strong ? markerIn : reveal,
                  whiteSpace: 'nowrap',
                }}
              >
                {tick.label}
              </div>
            </div>
          ))}

          <Chip pct={22} time="08:31" label="on time" tone="ink" appear={chipOnTime} />
          <Chip pct={90} time="09:48" label="late · ₦2,000" tone="orange" appear={chipLate} />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 132,
          top: 766,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          opacity: chipLate,
          transform: `translateY(${(1 - chipLate) * 10}px)`,
        }}
      >
        <div style={{ width: 46, height: 3, background: colors.orange, borderRadius: 2 }} />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 22,
            color: colors.ink,
            letterSpacing: '-0.01em',
          }}
        >
          One grace window, one fine per late arrival.
        </span>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 132,
          top: 892,
          display: 'flex',
          alignItems: 'center',
          gap: 34,
          opacity: chipLate,
        }}
      >
        {['Once per person, per day', 'Shown on the daily wall', 'Included in every CSV export'].map(
          (item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  background: colors.orange,
                  opacity: 0.85,
                }}
              />
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 18,
                  letterSpacing: '0.05em',
                  color: colors.soft,
                }}
              >
                {item}
              </span>
            </div>
          ),
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 1392,
          top: 392,
          width: 396,
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 26}px)`,
        }}
      >
        <div
          style={{
            borderRadius: 26,
            background: colors.white,
            border: `1px solid ${colors.line}`,
            boxShadow: '0 44px 86px rgba(11,33,28,0.16)',
            padding: '30px 32px 28px',
          }}
        >
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 14,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: colors.soft,
            }}
          >
            Late fine
          </div>
          <div
            style={{
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 700,
              fontSize: 74,
              letterSpacing: '-0.045em',
              color: colors.orangeDark,
              lineHeight: 1.05,
              marginTop: 8,
            }}
          >
            ₦2,000
          </div>
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 21,
              color: colors.ink,
              marginTop: 4,
            }}
          >
            per late arrival
          </div>
          <div
            style={{
              height: 1,
              background: colors.line,
              margin: '22px 0 18px',
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 17,
              color: colors.soft,
            }}
          >
            <span>Counted automatically</span>
            <span>Shown on the daily wall</span>
            <span>Included in every CSV export</span>
          </div>
        </div>
      </div>
    </AdBackground>
  );
};
