import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, fonts } from '../theme';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = (delay: number) =>
    spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 90, mass: 0.9 } });

  const titleIn = rise(6);
  const subIn = rise(18);
  const chipsIn = rise(30);
  const iconIn = rise(10);

  const drift = Math.sin(frame / 34) * 10;
  const rotate = interpolate(frame, [0, 130], [-24, -12]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(118deg, ${colors.paper} 0%, #f7f0e2 48%, ${colors.paperDeep} 100%)`,
        fontFamily: fonts.body,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(50% 60% at 82% 46%, rgba(238,120,79,0.30), rgba(238,120,79,0) 68%), radial-gradient(40% 40% at 8% 90%, rgba(23,63,53,0.14), rgba(23,63,53,0) 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(23,63,53,0.14) 1.4px, rgba(23,63,53,0) 1.4px)',
          backgroundSize: '36px 36px',
          opacity: 0.4,
          maskImage: 'radial-gradient(60% 60% at 25% 50%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(60% 60% at 25% 50%, black, transparent)',
        }}
      />

      <div style={{ position: 'absolute', left: 140, top: 540, transform: 'translateY(-50%)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 24}px)`,
            marginBottom: 30,
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              background: `linear-gradient(150deg, ${colors.orange}, ${colors.orangeDark})`,
              color: colors.white,
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 21,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 24px rgba(202,89,57,0.30)',
            }}
          >
            EC
          </div>
          <div>
            <div
              style={{
                fontFamily: fonts.display,
                fontWeight: 700,
                fontSize: 22,
                color: colors.ink,
                letterSpacing: '-0.01em',
              }}
            >
              Attendance
            </div>
            <div style={{ fontSize: 16, color: colors.soft, letterSpacing: '0.08em' }}>
              by ProofsTech
            </div>
          </div>
        </div>

        <div
          style={{
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 108,
            lineHeight: 0.98,
            letterSpacing: '-0.045em',
            color: colors.ink,
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 40}px)`,
          }}
        >
          Install the
          <br />
          <span style={{ color: colors.orangeDark }}>attendance app</span>
        </div>

        <div
          style={{
            marginTop: 30,
            fontFamily: fonts.body,
            fontSize: 30,
            lineHeight: 1.4,
            color: colors.soft,
            maxWidth: 720,
            opacity: subIn,
            transform: `translateY(${(1 - subIn) * 24}px)`,
          }}
        >
          A one-minute guide for iPhone and Android. No App Store, no downloads — just your browser.
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 40,
            opacity: chipsIn,
            transform: `translateY(${(1 - chipsIn) * 24}px)`,
          }}
        >
          {['iPhone · Safari', 'Android · Chrome'].map((chip) => (
            <div
              key={chip}
              style={{
                padding: '14px 24px',
                borderRadius: 999,
                background: colors.white,
                border: `1px solid ${colors.line}`,
                fontFamily: fonts.body,
                fontSize: 21,
                color: colors.ink,
                boxShadow: '0 10px 24px rgba(23,63,53,0.07)',
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 1390,
          top: 540,
          transform: `translate(-50%, -50%) translateY(${drift}px) scale(${0.85 + 0.15 * iconIn})`,
          opacity: iconIn,
          perspective: 1400,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 520,
            height: 520,
            transformStyle: 'preserve-3d',
            transform: `rotateY(${rotate}deg) rotateX(8deg) rotateZ(-4deg)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 40,
              borderRadius: 120,
              background: 'rgba(23,63,53,0.16)',
              transform: 'translateZ(-150px) translateX(-40px) translateY(40px)',
              filter: 'blur(2px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 20,
              borderRadius: 110,
              background: 'rgba(255,253,247,0.85)',
              border: `1px solid ${colors.line}`,
              transform: 'translateZ(-70px) translateX(-20px) translateY(20px)',
              boxShadow: '0 30px 60px rgba(23,63,53,0.10)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 112,
              background: `linear-gradient(152deg, #f5936c 0%, ${colors.orange} 36%, ${colors.orangeDark} 100%)`,
              boxShadow:
                '0 60px 110px rgba(202,89,57,0.36), inset 0 2px 0 rgba(255,255,255,0.55), inset 0 -18px 40px rgba(120,45,25,0.24)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 52,
                borderRadius: 76,
                border: '3px solid rgba(255,253,247,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.white,
                fontFamily: fonts.display,
                fontWeight: 700,
                fontSize: 132,
                letterSpacing: '-0.05em',
              }}
            >
              EC
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: -34,
                left: '50%',
                transform: 'translateX(-50%) translateZ(40px)',
                padding: '12px 26px',
                borderRadius: 999,
                background: colors.ink,
                color: colors.paper,
                fontFamily: fonts.body,
                fontSize: 19,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                boxShadow: '0 18px 36px rgba(11,33,28,0.34)',
              }}
            >
              On your Home screen
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
