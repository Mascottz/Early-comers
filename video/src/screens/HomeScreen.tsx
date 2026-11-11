import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Platform, StatusBar, HomeIndicator } from '../Phone';
import { colors, fonts } from '../theme';

const PLACEHOLDER_APPS = [
  { name: 'Mail', color: '#8fbcd8', glyph: '✉' },
  { name: 'Calendar', color: '#f3f0e6', glyph: '11' },
  { name: 'Photos', color: '#f0c9b4', glyph: '✿' },
  { name: 'Notes', color: '#f4e2a8', glyph: '≡' },
  { name: 'Maps', color: '#cfe0cd', glyph: '➤' },
  { name: 'Clock', color: '#1d2f28', glyph: '◷' },
  { name: 'Files', color: '#e3ddcd', glyph: '▤' },
  { name: 'Wallet', color: '#d9c2a6', glyph: '▭' },
];

const AppIcon: React.FC<{ size?: number; label?: string }> = ({ size = 104, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        background: `linear-gradient(155deg, ${colors.orange} 0%, #f08a5e 46%, ${colors.orangeDark} 100%)`,
        boxShadow:
          '0 14px 26px rgba(202, 89, 57, 0.32), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -8px 18px rgba(120,45,25,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: size * 0.13,
          borderRadius: size * 0.16,
          border: `2px solid rgba(255,253,247,0.55)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.white,
          fontFamily: fonts.display,
          fontWeight: 700,
          fontSize: size * 0.3,
          letterSpacing: '-0.03em',
        }}
      >
        EC
      </div>
      <div
        style={{
          position: 'absolute',
          top: -2,
          right: -2,
          width: size * 0.34,
          height: size * 0.34,
          borderRadius: '50%',
          background: colors.yellow,
          color: colors.ink,
          fontFamily: fonts.body,
          fontWeight: 500,
          fontSize: size * 0.19,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `3px solid ${colors.paper}`,
        }}
      >
        NEW
      </div>
    </div>
    {label ? (
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 17,
          color: colors.ink,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          textShadow: '0 1px 2px rgba(255,253,247,0.6)',
        }}
      >
        {label}
      </span>
    ) : null}
  </div>
);

type HomeScreenProps = {
  platform: Platform;
  caption: string;
  appearFrame: number;
  label: string;
};

export const HomeScreenContent: React.FC<HomeScreenProps> = ({
  platform,
  caption,
  appearFrame,
  label,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const iconIn = spring({
    frame: frame - appearFrame,
    fps,
    config: { damping: 12, stiffness: 130, mass: 0.7 },
  });

  const captionOut = interpolate(frame, [appearFrame + 40, appearFrame + 66], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(120% 80% at 20% 0%, #fdf3e2 0%, #f4e9d8 40%, #eadbc6 78%, #e2cfb6 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -120,
          left: -80,
          width: 520,
          height: 420,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(238,120,79,0.28), rgba(238,120,79,0))',
        }}
      />

      <StatusBar />

      <div style={{ position: 'absolute', top: 110, left: 0, right: 0, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 16,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: colors.soft,
          }}
        >
          {platform === 'ios' ? 'Home Screen' : 'Home screen'}
        </div>
        <div
          style={{
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 34,
            color: colors.ink,
            letterSpacing: '-0.02em',
            marginTop: 6,
          }}
        >
          {caption}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 230,
          left: 44,
          right: 44,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: 36,
        }}
      >
        <div
          style={{
            transform: `scale(${iconIn}) translateY(${(1 - iconIn) * 26}px)`,
            opacity: iconIn,
          }}
        >
          <AppIcon label={platform === 'ios' ? 'Attendance' : undefined} />
        </div>
        {PLACEHOLDER_APPS.slice(0, 7).map((app) => (
          <div
            key={app.name}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
          >
            <div
              style={{
                width: 104,
                height: 104,
                borderRadius: 25,
                background: app.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.inkDeep,
                fontFamily: fonts.display,
                fontWeight: 600,
                fontSize: 38,
                boxShadow: '0 10px 22px rgba(23,63,53,0.12), inset 0 1px 0 rgba(255,255,255,0.55)',
                opacity: 0.85,
              }}
            >
              {app.glyph}
            </div>
            {platform === 'ios' ? (
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: 17,
                  color: colors.ink,
                  opacity: 0.7,
                  fontWeight: 500,
                }}
              >
                {app.name}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 30,
          right: 30,
          bottom: 54,
          height: 132,
          borderRadius: 38,
          background: 'rgba(255,253,247,0.55)',
          border: '1px solid rgba(255,253,247,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 16px',
          boxShadow: '0 18px 40px rgba(23,63,53,0.12)',
          backdropFilter: 'blur(14px)',
        }}
      >
        {[
          { name: 'Phone', color: '#bfd8bd' },
          { name: 'Mail', color: '#9ec6e2' },
          { name: 'Maps', color: '#d9e6cf' },
          { name: 'Music', color: '#efb3a0' },
        ].map((app) => (
          <div
            key={app.name}
            style={{
              width: 84,
              height: 84,
              borderRadius: 22,
              background: app.color,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 26,
          right: 26,
          bottom: 210,
          padding: '22px 26px',
          borderRadius: 22,
          background: 'rgba(255,253,247,0.94)',
          border: `1px solid ${colors.line}`,
          boxShadow: '0 22px 40px rgba(23,63,53,0.16)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          opacity: captionOut,
          transform: `translateY(${(1 - captionOut) * 12}px)`,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: colors.ink,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M4.5 12.5l5 5L20 6.8"
              stroke={colors.white}
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 22,
            lineHeight: 1.25,
            color: colors.ink,
            fontWeight: 500,
          }}
        >
          {label}
        </div>
      </div>

      <HomeIndicator />
    </div>
  );
};
