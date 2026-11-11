import React from 'react';
import { colors, fonts } from '../theme';
import { PlusSquareIcon } from '../Phone';

const SHEET_APPS = [
  { name: 'AirDrop', glyph: '◔', color: '#d9e6f0' },
  { name: 'Messages', glyph: '✆', color: '#cfe6c9' },
  { name: 'Mail', glyph: '✉', color: '#b9d7ec' },
  { name: 'Copy', glyph: '⧉', color: '#e6dfcd' },
];

const ACTIONS = [
  { name: 'Copy Link', glyph: '⧉' },
  { name: 'Add to Home Screen', glyph: 'plus' },
  { name: 'Markup', glyph: '✎' },
  { name: 'Print', glyph: '⎙' },
];

type IosShareSheetProps = {
  lift: number;
  highlight: number;
  press: number;
};

export const IosShareSheet: React.FC<IosShareSheetProps> = ({ lift, highlight, press }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 560,
      transform: `translateY(${(1 - lift) * 600}px)`,
      zIndex: 90,
    }}
  >
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '34px 34px 0 0',
        background: 'rgba(247,244,238,0.985)',
        borderTop: `1px solid rgba(255,255,255,0.9)`,
        boxShadow: '0 -26px 60px rgba(11,33,28,0.28)',
        padding: '18px 26px 0',
      }}
    >
      <div
        style={{
          width: 62,
          height: 6,
          borderRadius: 3,
          background: 'rgba(23,63,53,0.22)',
          margin: '0 auto 20px',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 6px' }}>
        {SHEET_APPS.map((app) => (
          <div
            key={app.name}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 96 }}
          >
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: 20,
                background: app.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 30,
                color: colors.ink,
              }}
            >
              {app.glyph}
            </div>
            <span style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink }}>{app.name}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: 'rgba(23,63,53,0.12)', margin: '22px 4px' }} />

      {ACTIONS.map((action) => {
        const isTarget = action.glyph === 'plus';
        const glow = isTarget ? highlight : 0;
        const pressed = isTarget ? press : 0;
        return (
          <div
            key={action.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 16px',
              borderRadius: 16,
              marginBottom: 6,
              background: `rgba(238,120,79,${0.13 * glow})`,
              boxShadow: glow > 0.02 ? `inset 0 0 0 2px rgba(238,120,79,${0.75 * glow})` : 'none',
              transform: `scale(${1 - 0.02 * pressed})`,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: isTarget && glow > 0.02 ? colors.orange : 'rgba(23,63,53,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isTarget ? (
                <PlusSquareIcon size={24} color={glow > 0.02 ? colors.white : colors.ink} />
              ) : (
                <span style={{ fontFamily: fonts.body, fontSize: 20, color: colors.ink }}>
                  {action.glyph}
                </span>
              )}
            </div>
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: 23,
                color: colors.ink,
                fontWeight: isTarget ? 500 : 400,
              }}
            >
              {action.name}
            </span>
            {isTarget ? (
              <div style={{ marginLeft: 'auto', opacity: glow }}>
                <span
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: colors.orangeDark,
                    background: 'rgba(238,120,79,0.16)',
                    padding: '6px 12px',
                    borderRadius: 999,
                  }}
                >
                  Tap here
                </span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  </div>
);

type IosAddDialogProps = {
  appear: number;
  press: number;
};

export const IosAddDialog: React.FC<IosAddDialogProps> = ({ appear, press }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `rgba(11,33,28,${0.24 * appear})`,
      opacity: appear,
    }}
  >
    <div
      style={{
        width: 410,
        borderRadius: 26,
        background: 'rgba(250,247,241,0.99)',
        boxShadow: '0 40px 80px rgba(11,33,28,0.32)',
        overflow: 'hidden',
        transform: `scale(${0.92 + 0.08 * appear})`,
      }}
    >
      <div style={{ padding: '24px 24px 18px', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: fonts.body,
            fontWeight: 500,
            fontSize: 24,
            color: colors.ink,
            marginBottom: 6,
          }}
        >
          Add to Home Screen
        </div>
        <div style={{ fontFamily: fonts.body, fontSize: 16, color: colors.soft }}>
          This website will appear as an app on your Home Screen.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '0 20px 22px',
          padding: '12px 14px',
          borderRadius: 12,
          background: colors.white,
          border: `1px solid ${colors.line}`,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            background: `linear-gradient(150deg, ${colors.orange}, ${colors.orangeDark})`,
            color: colors.white,
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          EC
        </div>
        <span style={{ fontFamily: fonts.body, fontSize: 20, color: colors.ink }}>Attendance</span>
      </div>

      <div
        style={{
          borderTop: `1px solid ${colors.line}`,
          display: 'flex',
          height: 66,
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: fonts.body,
            fontSize: 21,
            color: colors.ink,
            borderRight: `1px solid ${colors.line}`,
          }}
        >
          Cancel
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: fonts.body,
            fontSize: 21,
            fontWeight: 500,
            color: colors.orangeDark,
            background: `rgba(238,120,79,${0.22 * press})`,
            transform: `scale(${1 - 0.03 * press})`,
          }}
        >
          Add
        </div>
      </div>
    </div>
  </div>
);
