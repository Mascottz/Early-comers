import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors } from '../../theme';
import { AdBackground, LogoLockup } from '../components/AdBackground';
import { Phone } from '../../Phone';
import { HomeScreenContent } from '../../screens/HomeScreen';

export const CloseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = (delay: number) =>
    spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 86, mass: 0.9 } });

  const kicker = rise(6);
  const headline = rise(12);
  const sub = rise(24);
  const url = rise(96);
  const phoneIn = rise(10);
  const footer = interpolate(frame, [120, 140], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const drift = Math.sin(frame / 34) * 7;

  return (
    <AdBackground accent="duo">
      <div style={{ position: 'absolute', left: 132, top: 74, opacity: 0.92 }}>
        <LogoLockup size={40} />
      </div>

      <div style={{ position: 'absolute', left: 132, top: 250, width: 900 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            opacity: kicker,
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
            Get started
          </span>
        </div>

        <div
          style={{
            fontFamily: '"Bricolage Grotesque", sans-serif',
            fontWeight: 700,
            fontSize: 96,
            lineHeight: 1.02,
            letterSpacing: '-0.042em',
            color: colors.ink,
            marginTop: 20,
            opacity: headline,
            transform: `translateY(${(1 - headline) * 30}px)`,
          }}
        >
          Install it once.
          <br />
          <span style={{ color: colors.orangeDark }}>Open it every morning.</span>
        </div>

        <div
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 28,
            lineHeight: 1.45,
            color: colors.soft,
            marginTop: 26,
            maxWidth: 760,
            opacity: sub,
            transform: `translateY(${(1 - sub) * 20}px)`,
          }}
        >
          iPhone or Android — add it to your home screen straight from the browser. No App Store, no
          downloads, no account to create.
        </div>

        <div
          style={{
            marginTop: 42,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 18,
            padding: '18px 30px 18px 22px',
            borderRadius: 999,
            background: colors.ink,
            boxShadow: '0 26px 50px rgba(11,33,28,0.26)',
            opacity: url,
            transform: `translateY(${(1 - url) * 18}px)`,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: `linear-gradient(150deg, ${colors.orange}, ${colors.orangeDark})`,
              color: colors.white,
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 700,
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            EC
          </div>
          <span
            style={{
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontWeight: 600,
              fontSize: 38,
              letterSpacing: '-0.02em',
              color: colors.paper,
            }}
          >
            earlycomers.vercel.app
          </span>
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 15,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(245,241,232,0.6)',
              borderLeft: '1px solid rgba(245,241,232,0.24)',
              paddingLeft: 16,
            }}
          >
            Save it
          </span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 1236,
          top: 156,
          transform: `scale(0.72) translateY(${(1 - phoneIn) * 60 + drift}px)`,
          transformOrigin: 'top left',
          opacity: phoneIn,
        }}
      >
        <Phone platform="ios" rotateX={3} rotateY={11} rotateZ={1} scale={1}>
          <HomeScreenContent
            platform="ios"
            caption="Installed"
            appearFrame={36}
            label="Attendance is one tap away on your home screen."
          />
        </Phone>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 132,
          bottom: 62,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          opacity: footer * 0.85,
        }}
      >
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 17,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: colors.soft,
          }}
        >
          Attendance by ProofsTech · Abuja HQ
        </span>
        <span style={{ width: 40, height: 2, background: colors.orange, opacity: 0.7 }} />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 17,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: colors.soft,
          }}
        >
          Grace ends 09:30
        </span>
      </div>
    </AdBackground>
  );
};
