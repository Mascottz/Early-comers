import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, fonts } from '../theme';

const CARDS = [
  {
    step: '1',
    title: 'Open the site',
    body: 'Safari on iPhone, Chrome on Android. Type earlycomers.vercel.app.',
  },
  {
    step: '2',
    title: 'Add to Home screen',
    body: 'Share icon on iPhone, ⋮ menu on Android, then Add.',
  },
  {
    step: '3',
    title: 'Sign in once',
    body: 'Team email, team password, then your 6-digit PIN.',
  },
];

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = (delay: number) =>
    spring({ frame: frame - delay, fps, config: { damping: 17, stiffness: 90, mass: 0.9 } });

  const head = rise(4);
  const url = rise(70);
  const foot = rise(84);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(150deg, ${colors.paper} 0%, #f6efe1 52%, ${colors.paperDeep} 100%)`,
        fontFamily: fonts.body,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(48% 52% at 50% 8%, rgba(238,120,79,0.24), rgba(238,120,79,0) 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(23,63,53,0.13) 1.3px, rgba(23,63,53,0) 1.3px)',
          backgroundSize: '34px 34px',
          opacity: 0.35,
          maskImage: 'radial-gradient(60% 60% at 50% 62%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(60% 60% at 50% 62%, black, transparent)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 96,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: head,
        }}
      >
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 22,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: colors.orangeDark,
            fontWeight: 500,
          }}
        >
          You are set
        </div>
        <div
          style={{
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 96,
            letterSpacing: '-0.04em',
            color: colors.ink,
            marginTop: 12,
            transform: `translateY(${(1 - head) * 26}px)`,
          }}
        >
          Check in with one tap
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 372,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 26,
        }}
      >
        {CARDS.map((card, index) => {
          const cardIn = rise(22 + index * 12);
          return (
            <div
              key={card.step}
              style={{
                width: 492,
                minHeight: 262,
                borderRadius: 30,
                background: colors.white,
                border: `1px solid ${colors.line}`,
                padding: '30px 30px 28px',
                boxShadow: '0 26px 52px rgba(23,63,53,0.10)',
                opacity: cardIn,
                transform: `translateY(${(1 - cardIn) * 46}px)`,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: colors.orange,
                  color: colors.white,
                  fontFamily: fonts.display,
                  fontWeight: 700,
                  fontSize: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 12px 22px rgba(202,89,57,0.28)',
                }}
              >
                {card.step}
              </div>
              <div
                style={{
                  fontFamily: fonts.display,
                  fontWeight: 700,
                  fontSize: 34,
                  letterSpacing: '-0.02em',
                  color: colors.ink,
                  marginTop: 22,
                }}
              >
                {card.title}
              </div>
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: 21,
                  lineHeight: 1.42,
                  color: colors.soft,
                  marginTop: 10,
                }}
              >
                {card.body}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 706,
          left: '50%',
          transform: `translateX(-50%) translateY(${(1 - url) * 26}px)`,
          opacity: url,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            padding: '20px 34px 20px 26px',
            borderRadius: 999,
            background: colors.ink,
            boxShadow: '0 26px 52px rgba(11,33,28,0.30)',
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: `linear-gradient(150deg, ${colors.orange}, ${colors.orangeDark})`,
              color: colors.white,
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 17,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            EC
          </div>
          <span
            style={{
              fontFamily: fonts.display,
              fontWeight: 600,
              fontSize: 40,
              letterSpacing: '-0.02em',
              color: colors.paper,
            }}
          >
            earlycomers.vercel.app
          </span>
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 17,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(245,241,232,0.6)',
              borderLeft: '1px solid rgba(245,241,232,0.24)',
              paddingLeft: 18,
            }}
          >
            Bookmark it
          </span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 830,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: fonts.body,
          fontSize: 21,
          color: colors.soft,
          opacity: foot,
        }}
      >
        Check-in is by the office QR at the door. Grace ends at 09:30 — late arrivals carry a ₦2,000 fine.
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 54,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: fonts.body,
          fontSize: 18,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: colors.soft,
          opacity: foot * 0.8,
        }}
      >
        Attendance by ProofsTech · Abuja HQ
      </div>
    </AbsoluteFill>
  );
};
