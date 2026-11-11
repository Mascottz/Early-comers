import React from 'react';
import { colors, fonts } from '../theme';

type CalloutProps = {
  x: number;
  y: number;
  label: string;
  step: number;
  appear: number;
  bob: number;
  pointer?: 'up' | 'down' | 'left' | 'none';
};

export const Callout: React.FC<CalloutProps> = ({
  x,
  y,
  label,
  step,
  appear,
  bob,
  pointer = 'down',
}) => {
  const scale = 0.86 + 0.14 * appear;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translateY(${bob}px) scale(${scale})`,
        opacity: appear,
        zIndex: 120,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      {pointer === 'up' ? <Pointer direction="up" /> : null}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '13px 22px 13px 14px',
          borderRadius: 999,
          background: `linear-gradient(140deg, ${colors.orange} 0%, ${colors.orangeDark} 100%)`,
          color: colors.white,
          fontFamily: fonts.body,
          fontWeight: 500,
          fontSize: 30,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          boxShadow: '0 20px 38px rgba(202,89,57,0.34), inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
      >
        <span
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: 'rgba(255,253,247,0.95)',
            color: colors.orangeDark,
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {step}
        </span>
        {label}
      </div>
      {pointer === 'down' ? <Pointer direction="down" /> : null}
    </div>
  );
};

const Pointer: React.FC<{ direction: 'up' | 'down' }> = ({ direction }) => (
  <svg
    width="34"
    height="22"
    viewBox="0 0 34 22"
    fill="none"
    style={{
      transform: direction === 'up' ? 'rotate(180deg)' : 'none',
      filter: 'drop-shadow(0 8px 12px rgba(202,89,57,0.28))',
    }}
  >
    <path d="M17 21L2.5 2.5H31.5L17 21Z" fill={colors.orangeDark} />
  </svg>
);
