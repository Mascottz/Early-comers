import React from 'react';
import { AbsoluteFill } from 'remotion';
import { colors } from '../../theme';

type AdBackgroundProps = {
  accent?: 'orange' | 'ink' | 'duo';
  children?: React.ReactNode;
};

export const AdBackground: React.FC<AdBackgroundProps> = ({ accent = 'orange', children }) => {
  const orange = accent === 'orange' || accent === 'duo';
  const ink = accent === 'ink' || accent === 'duo';

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(128deg, ${colors.paper} 0%, #f7f1e4 44%, ${colors.paperDeep} 100%)`,
        overflow: 'hidden',
      }}
    >
      {orange ? (
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(46% 52% at 84% 12%, rgba(238,120,79,0.26), rgba(238,120,79,0) 68%), radial-gradient(38% 40% at 6% 96%, rgba(238,120,79,0.16), rgba(238,120,79,0) 70%)',
          }}
        />
      ) : null}
      {ink ? (
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(48% 52% at 12% 6%, rgba(23,63,53,0.16), rgba(23,63,53,0) 66%), radial-gradient(40% 44% at 92% 92%, rgba(23,63,53,0.12), rgba(23,63,53,0) 70%)',
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(23,63,53,0.16) 1.3px, rgba(23,63,53,0) 1.3px)',
          backgroundSize: '32px 32px',
          opacity: 0.55,
          maskImage: 'radial-gradient(64% 64% at 50% 46%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(64% 64% at 50% 46%, black, transparent)',
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

export const LogoLockup: React.FC<{ tone?: 'ink' | 'light'; size?: number }> = ({
  tone = 'ink',
  size = 46,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: `linear-gradient(150deg, ${colors.orange}, ${colors.orangeDark})`,
        color: colors.white,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Bricolage Grotesque", sans-serif',
        fontWeight: 700,
        fontSize: size * 0.4,
        boxShadow: '0 10px 22px rgba(202,89,57,0.26)',
      }}
    >
      EC
    </div>
    <div>
      <div
        style={{
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontWeight: 700,
          fontSize: size * 0.42,
          letterSpacing: '-0.01em',
          color: tone === 'ink' ? colors.ink : colors.paper,
          lineHeight: 1.1,
        }}
      >
        attendance
      </div>
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: size * 0.25,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: tone === 'ink' ? colors.soft : 'rgba(245,241,232,0.7)',
        }}
      >
        by ProofsTech
      </div>
    </div>
  </div>
);
