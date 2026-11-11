import React from 'react';
import { colors, fonts } from '../theme';

type InstructionPanelProps = {
  kicker: string;
  title: React.ReactNode;
  steps: string[];
  active: number;
  footnote?: string;
};

export const InstructionPanel: React.FC<InstructionPanelProps> = ({
  kicker,
  title,
  steps,
  active,
  footnote,
}) => (
  <div style={{ width: 780 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          background: colors.orange,
          boxShadow: `0 0 0 6px rgba(238,120,79,0.18)`,
        }}
      />
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: 24,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: colors.orangeDark,
          fontWeight: 500,
        }}
      >
        {kicker}
      </span>
    </div>

    <div
      style={{
        fontFamily: fonts.display,
        fontWeight: 700,
        fontSize: 76,
        lineHeight: 1.02,
        letterSpacing: '-0.035em',
        color: colors.ink,
      }}
    >
      {title}
    </div>

    <div style={{ marginTop: 46, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {steps.map((step, index) => {
        const isActive = index === active;
        const isDone = index < active;
        return (
          <div
            key={step}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '18px 24px',
              borderRadius: 20,
              background: isActive ? colors.white : 'rgba(255,253,247,0.35)',
              border: `1.5px solid ${isActive ? colors.orange : 'rgba(23,63,53,0.08)'}`,
              boxShadow: isActive ? '0 18px 36px rgba(23,63,53,0.10)' : 'none',
              opacity: isActive ? 1 : isDone ? 0.72 : 0.45,
              transform: `translateX(${isActive ? 10 : 0}px)`,
            }}
          >
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: fonts.display,
                fontWeight: 700,
                fontSize: 21,
                background: isActive ? colors.orange : isDone ? colors.ink : 'rgba(23,63,53,0.10)',
                color: isActive || isDone ? colors.white : colors.soft,
              }}
            >
              {isDone ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4.5 12.5l5 5L20 6.8"
                    stroke={colors.white}
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </span>
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: 27,
                lineHeight: 1.25,
                color: colors.ink,
                fontWeight: isActive ? 500 : 400,
              }}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>

    {footnote ? (
      <div
        style={{
          marginTop: 30,
          fontFamily: fonts.body,
          fontSize: 20,
          color: colors.soft,
          opacity: 0.85,
        }}
      >
        {footnote}
      </div>
    ) : null}
  </div>
);
