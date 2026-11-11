import React from 'react';
import { colors, fonts } from '../theme';

const MENU_ROWS = [
  { name: 'New tab', glyph: '＋' },
  { name: 'History', glyph: '◷' },
  { name: 'Downloads', glyph: '↓' },
  { name: 'Add to Home screen', glyph: 'install' },
  { name: 'Translate…', glyph: 'A' },
  { name: 'Settings', glyph: '⚙' },
];

type ChromeMenuProps = {
  lift: number;
  highlight: number;
  press: number;
};

export const ChromeMenu: React.FC<ChromeMenuProps> = ({ lift, highlight, press }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 470,
      transform: `translateY(${(1 - lift) * 520}px)`,
      zIndex: 90,
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '28px 28px 0 0',
        background: 'rgba(253,251,246,0.99)',
        boxShadow: '0 -24px 56px rgba(11,33,28,0.28)',
        padding: '22px 22px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 6px 16px' }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            background: `linear-gradient(150deg, ${colors.orange}, ${colors.orangeDark})`,
            color: colors.white,
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          EC
        </div>
        <span style={{ fontFamily: fonts.body, fontSize: 16, color: colors.soft }}>
          earlycomers.vercel.app
        </span>
      </div>

      {MENU_ROWS.map((row, index) => {
        const isTarget = row.glyph === 'install';
        const glow = isTarget ? highlight : 0;
        const targetPress = isTarget ? press : 0;
        return (
          <React.Fragment key={row.name}>
            {index === 3 ? (
              <div style={{ height: 1, background: 'rgba(23,63,53,0.12)', margin: '8px 4px' }} />
            ) : null}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                height: 58,
                padding: '0 12px',
                borderRadius: 14,
                background: `rgba(238,120,79,${0.14 * glow})`,
                boxShadow: glow > 0.02 ? `inset 0 0 0 2px rgba(238,120,79,${0.7 * glow})` : 'none',
                transform: `scale(${1 - 0.02 * targetPress})`,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isTarget && glow > 0.02 ? colors.orange : 'rgba(23,63,53,0.07)',
                }}
              >
                {isTarget ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="5.5"
                      y="2.5"
                      width="13"
                      height="19"
                      rx="3"
                      stroke={glow > 0.02 ? colors.white : colors.ink}
                      strokeWidth="1.9"
                    />
                    <path
                      d="M12 8.5v6M9 11.5h6"
                      stroke={glow > 0.02 ? colors.white : colors.ink}
                      strokeWidth="1.9"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <span style={{ fontFamily: fonts.body, fontSize: 18, color: colors.ink }}>
                    {row.glyph}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: 21,
                  color: colors.ink,
                  fontWeight: isTarget ? 500 : 400,
                }}
              >
                {row.name}
              </span>
              {isTarget ? (
                <span
                  style={{
                    marginLeft: 'auto',
                    opacity: glow,
                    fontFamily: fonts.body,
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: colors.orangeDark,
                    background: 'rgba(238,120,79,0.16)',
                    padding: '5px 10px',
                    borderRadius: 999,
                  }}
                >
                  Tap here
                </span>
              ) : null}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

type AndroidDialogProps = {
  appear: number;
  press: number;
};

export const AndroidDialog: React.FC<AndroidDialogProps> = ({ appear, press }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `rgba(11,33,28,${0.28 * appear})`,
      opacity: appear,
    }}
  >
    <div
      style={{
        width: 430,
        borderRadius: 26,
        background: colors.white,
        padding: '28px 26px 20px',
        boxShadow: '0 40px 80px rgba(11,33,28,0.34)',
        transform: `scale(${0.93 + 0.07 * appear})`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 15,
            background: `linear-gradient(150deg, ${colors.orange}, ${colors.orangeDark})`,
            color: colors.white,
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 21,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          EC
        </div>
        <div
          style={{
            fontFamily: fonts.display,
            fontWeight: 600,
            fontSize: 26,
            lineHeight: 1.15,
            color: colors.ink,
            letterSpacing: '-0.02em',
          }}
        >
          Add to Home screen
        </div>
      </div>

      <div
        style={{
          fontFamily: fonts.body,
          fontSize: 18,
          lineHeight: 1.4,
          color: colors.soft,
          marginTop: 16,
        }}
      >
        Adds a shortcut for earlycomers.vercel.app so you can scan in with one tap.
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginTop: 26 }}>
        <div
          style={{
            padding: '12px 20px',
            borderRadius: 999,
            fontFamily: fonts.body,
            fontSize: 19,
            color: colors.soft,
          }}
        >
          Cancel
        </div>
        <div
          style={{
            padding: '12px 30px',
            borderRadius: 999,
            fontFamily: fonts.body,
            fontSize: 19,
            fontWeight: 500,
            color: colors.white,
            background: colors.orange,
            boxShadow: `0 10px 22px rgba(238,120,79,${0.34 * (0.6 + press)})`,
            transform: `scale(${1 - 0.04 * press})`,
          }}
        >
          Add
        </div>
      </div>
    </div>
  </div>
);
