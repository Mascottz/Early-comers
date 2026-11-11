import React from 'react';
import { interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import { colors } from '../../theme';
import { AdBackground, LogoLockup } from '../components/AdBackground';
import { SceneHeader } from '../components/AdScene';

const QR_CROP = { x: 908, y: 306, size: 198 };

const STEPS = [
  { n: '01', label: 'Scan the printed office pass' },
  { n: '02', label: 'Name and arrival time, recorded' },
  { n: '03', label: 'No signal? It saves offline' },
];

const QRPanel: React.FC<{ frame: number }> = ({ frame }) => {
  const enter = spring({ frame: frame - 16, fps: 30, config: { damping: 18, stiffness: 90 } });
  const qrBox = 356;
  const s = qrBox / QR_CROP.size;
  const scan = ((frame - 30) % 74) / 74;
  const scanY = interpolate(scan, [0, 1], [24, qrBox - 12]);
  const scanning = frame > 30 && frame < 190;

  return (
    <div
      style={{
        position: 'absolute',
        left: 660,
        top: 372,
        width: 440,
        height: 440,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 30}px) scale(${0.94 + 0.06 * enter})`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 30,
          background: colors.white,
          border: `1px solid ${colors.line}`,
          boxShadow: '0 44px 86px rgba(11,33,28,0.16)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 42,
          top: 42,
          width: qrBox,
          height: qrBox,
          backgroundImage: `url(${staticFile('screens/office-qr.png')})`,
          backgroundSize: `${1366 * s}px auto`,
          backgroundPosition: `-${QR_CROP.x * s}px -${QR_CROP.y * s}px`,
          backgroundRepeat: 'no-repeat',
          borderRadius: 6,
        }}
      />

      {scanning ? (
        <div
          style={{
            position: 'absolute',
            left: 30,
            right: 30,
            top: scanY + 30,
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(90deg, rgba(238,120,79,0) 0%, ${colors.orange} 22%, ${colors.orange} 78%, rgba(238,120,79,0) 100%)`,
            boxShadow: '0 0 22px 6px rgba(238,120,79,0.35)',
          }}
        />
      ) : null}

      {[
        { top: 22, left: 22, borderTop: true, borderLeft: true },
        { top: 22, right: 22, borderTop: true, borderRight: true },
        { bottom: 22, left: 22, borderBottom: true, borderLeft: true },
        { bottom: 22, right: 22, borderBottom: true, borderRight: true },
      ].map((corner, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            width: 34,
            height: 34,
            top: corner.top,
            left: corner.left,
            right: corner.right,
            bottom: corner.bottom,
            borderTop: corner.borderTop ? `3px solid ${colors.ink}` : undefined,
            borderLeft: corner.borderLeft ? `3px solid ${colors.ink}` : undefined,
            borderRight: corner.borderRight ? `3px solid ${colors.ink}` : undefined,
            borderBottom: corner.borderBottom ? `3px solid ${colors.ink}` : undefined,
            borderTopLeftRadius: corner.borderTop && corner.borderLeft ? 12 : 0,
            borderTopRightRadius: corner.borderTop && corner.borderRight ? 12 : 0,
            borderBottomLeftRadius: corner.borderBottom && corner.borderLeft ? 12 : 0,
            borderBottomRightRadius: corner.borderBottom && corner.borderRight ? 12 : 0,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
};

const CheckInCard: React.FC<{ frame: number }> = ({ frame }) => {
  const enter = spring({ frame: frame - 122, fps: 30, config: { damping: 17, stiffness: 100 } });
  const badgeIn = interpolate(frame, [150, 168], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 1180,
        top: 430,
        width: 590,
        opacity: enter,
        transform: `translateX(${(1 - enter) * 40}px)`,
      }}
    >
      <div
        style={{
          borderRadius: 26,
          background: colors.white,
          border: `1px solid ${colors.line}`,
          boxShadow: '0 44px 86px rgba(11,33,28,0.18)',
          padding: '28px 30px 26px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 15,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: colors.soft,
            }}
          >
            Check-in recorded
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(23,63,53,0.08)',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 14,
              color: colors.ink,
              opacity: badgeIn,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 4, background: colors.ink }} />
            Saved offline
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <img
            src={staticFile('staff/fundstech.jpg')}
            alt=""
            style={{
              width: 78,
              height: 78,
              borderRadius: '50%',
              objectFit: 'cover',
              border: `2px solid ${colors.paper}`,
              boxShadow: '0 8px 18px rgba(11,33,28,0.16)',
            }}
          />
          <div>
            <div
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 700,
                fontSize: 36,
                letterSpacing: '-0.02em',
                color: colors.ink,
                lineHeight: 1.1,
              }}
            >
              FundsTech
            </div>
            <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 18, color: colors.soft }}>
              Team member · Abuja HQ
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginTop: 24,
            paddingTop: 20,
            borderTop: `1px solid ${colors.line}`,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: colors.soft,
              }}
            >
              Arrival
            </div>
            <div
              style={{
                fontFamily: '"Bricolage Grotesque", sans-serif',
                fontWeight: 700,
                fontSize: 64,
                letterSpacing: '-0.04em',
                color: colors.ink,
                lineHeight: 1.05,
              }}
            >
              08:42
            </div>
          </div>
          <div
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              background: 'rgba(23,63,53,0.10)',
              color: colors.ink,
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 500,
              fontSize: 19,
            }}
          >
            On time
          </div>
        </div>
      </div>
    </div>
  );
};

export const ScanScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AdBackground accent="orange">
      <div style={{ position: 'absolute', left: 132, top: 74, opacity: 0.9 }}>
        <LogoLockup size={40} />
      </div>

      <SceneHeader
        kicker="Check-in"
        title={
          <>
            One scan
            <br />
            at the door.
          </>
        }
        width={540}
        top={252}
        size={64}
      />

      <div style={{ position: 'absolute', left: 134, top: 690, width: 500, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {STEPS.map((step, index) => {
          const appear = spring({
            frame: frame - (52 + index * 24),
            fps: 30,
            config: { damping: 18, stiffness: 100 },
          });
          return (
            <div
              key={step.n}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                opacity: appear,
                transform: `translateY(${(1 - appear) * 16}px)`,
              }}
            >
              <span
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: 16,
                  fontWeight: 500,
                  color: colors.orangeDark,
                  letterSpacing: '0.1em',
                }}
              >
                {step.n}
              </span>
              <span
                style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 22, color: colors.ink }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <QRPanel frame={frame} />
      <CheckInCard frame={frame} />
    </AdBackground>
  );
};
