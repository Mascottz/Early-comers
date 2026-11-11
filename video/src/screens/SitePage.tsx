import React from 'react';
import { DotsIcon, Platform, ShareIcon } from '../Phone';
import { colors, fonts } from '../theme';

type SitePageProps = {
  platform: Platform;
  url: string;
  /** Frame at which the URL is typed in (or null when it is already there). */
  typeAt?: number;
  frame: number;
  /** 0 = plain toolbar icon, 1 = glowing call-out. */
  shareGlow?: number;
  /** 0..1 press feedback on the toolbar icon. */
  sharePressed?: number;
  /** Android: 0..1 glow on the ⋮ menu button. */
  menuGlow?: number;
  /** Android: 0..1 press feedback on ⋮. */
  menuPress?: number;
};

const URL_TEXT = 'earlycomers.vercel.app';

const typedUrl = (frame: number, typeAt: number) => {
  const total = URL_TEXT.length;
  const progress = Math.max(0, Math.min(1, (frame - typeAt) / 42));
  const shown = Math.round(progress * total);
  const done = shown >= total;
  return { text: URL_TEXT.slice(0, shown), done, cursor: !done };
};

export const SitePage: React.FC<SitePageProps> = ({
  platform,
  url,
  typeAt,
  frame,
  shareGlow = 0,
  sharePressed = 0,
  menuGlow = 0,
  menuPress = 0,
}) => {
  const typed = typeAt === undefined ? { text: URL_TEXT, done: true, cursor: false } : typedUrl(frame, typeAt);

  const chromeHeight = platform === 'ios' ? 156 : 140;

  return (
    <div style={{ position: 'absolute', inset: 0, background: colors.paper }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(90% 55% at 105% -5%, rgba(238,120,79,0.20), rgba(238,120,79,0) 62%), radial-gradient(80% 40% at -10% 108%, rgba(23,63,53,0.10), rgba(23,63,53,0) 60%)',
        }}
      />

      {platform === 'ios' ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: chromeHeight,
            background: 'rgba(247,243,235,0.96)',
            borderBottom: `1px solid ${colors.line}`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 66,
              left: 24,
              right: 24,
              height: 46,
              borderRadius: 23,
              background: '#e9e4d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
            }}
          >
            <svg width="12" height="15" viewBox="0 0 12 15" fill="none">
              <rect x="1" y="6" width="10" height="8" rx="2.4" fill={colors.soft} />
              <path d="M3 6V4.2A3 3 0 0 1 9 4.2V6" stroke={colors.soft} strokeWidth="1.6" />
            </svg>
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: 20,
                color: colors.ink,
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {typed.text}
              {typed.cursor ? (
                <span style={{ width: 2, height: 21, background: colors.orange, display: 'inline-block' }} />
              ) : null}
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 3 }}>
              <path
                d="M13 8a5 5 0 1 1-1.6-3.7M13 2v3.2h-3.2"
                stroke={colors.soft}
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div
            style={{
              position: 'absolute',
              top: 126,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: fonts.body,
              fontSize: 15,
              color: colors.soft,
              opacity: typed.done ? 1 : 0,
            }}
          >
            {url}
          </div>
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: chromeHeight,
            background: '#fbf8f1',
            borderBottom: `1px solid ${colors.line}`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 58,
              left: 20,
              right: 74,
              height: 50,
              borderRadius: 25,
              background: '#eee9dd',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              gap: 8,
            }}
          >
            <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
              <rect x="1" y="7" width="12" height="8" rx="2.4" fill={colors.soft} />
              <path d="M3.6 7V4.6A3.4 3.4 0 0 1 10.4 4.6V7" stroke={colors.soft} strokeWidth="1.6" />
            </svg>
            <span
              style={{
                fontFamily: fonts.body,
                fontSize: 20,
                color: colors.ink,
                display: 'flex',
                alignItems: 'center',
                letterSpacing: '-0.01em',
              }}
            >
              {typed.text}
              {typed.cursor ? (
                <span style={{ width: 2, height: 21, background: colors.orange, display: 'inline-block' }} />
              ) : null}
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              top: 58,
              right: 18,
              width: 50,
              height: 50,
              borderRadius: 25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `rgba(238,120,79,${0.18 * (menuGlow ?? 0)})`,
              boxShadow: `0 0 0 ${2 + 6 * (menuGlow ?? 0)}px rgba(238,120,79,${0.2 * (menuGlow ?? 0)})`,
              transform: `scale(${1 + 0.1 * (menuGlow ?? 0) - 0.1 * (menuPress ?? 0)})`,
            }}
          >
            <DotsIcon color={(menuGlow ?? 0) > 0.02 ? colors.orangeDark : colors.ink} size={24} />
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', top: chromeHeight + 26, left: 30, right: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 26 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: `linear-gradient(150deg, ${colors.orange}, ${colors.orangeDark})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.white,
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 17,
              boxShadow: '0 8px 18px rgba(202,89,57,0.28)',
            }}
          >
            EC
          </div>
          <div>
            <div
              style={{
                fontFamily: fonts.display,
                fontWeight: 700,
                fontSize: 19,
                color: colors.ink,
                letterSpacing: '-0.01em',
              }}
            >
              Attendance
            </div>
            <div style={{ fontFamily: fonts.body, fontSize: 14, color: colors.soft }}>
              by ProofsTech
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: `1px solid ${colors.line}`,
              fontFamily: fonts.body,
              fontSize: 14,
              color: colors.ink,
            }}
          >
            Staff
          </div>
        </div>

        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: colors.orangeDark,
          }}
        >
          Abuja HQ
        </div>
        <div
          style={{
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 47,
            lineHeight: 1.02,
            letterSpacing: '-0.035em',
            color: colors.ink,
            marginTop: 12,
          }}
        >
          Attendance by
          <br />
          ProofsTech
        </div>
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 19,
            lineHeight: 1.45,
            color: colors.soft,
            marginTop: 16,
            maxWidth: 420,
          }}
        >
          One scan at the office door. Add it to your phone and never queue to sign in again.
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <div
            style={{
              padding: '15px 26px',
              borderRadius: 999,
              background: colors.ink,
              color: colors.white,
              fontFamily: fonts.body,
              fontWeight: 500,
              fontSize: 18,
            }}
          >
            Check in
          </div>
          <div
            style={{
              padding: '15px 24px',
              borderRadius: 999,
              border: `1.5px solid ${colors.ink}`,
              color: colors.ink,
              fontFamily: fonts.body,
              fontWeight: 500,
              fontSize: 18,
            }}
          >
            Office pass
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 26 }}>
          {[
            { label: 'Today', value: '24', note: 'check-ins' },
            { label: 'Late', value: '2', note: 'after 09:30' },
            { label: 'Fines', value: '₦4,000', note: 'this week' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                borderRadius: 18,
                background: colors.white,
                border: `1px solid ${colors.line}`,
                padding: '14px 14px 15px',
                boxShadow: '0 8px 18px rgba(23,63,53,0.05)',
              }}
            >
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: colors.soft,
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontFamily: fonts.display,
                  fontWeight: 700,
                  fontSize: 28,
                  color: colors.ink,
                  letterSpacing: '-0.03em',
                  marginTop: 4,
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.soft }}>{stat.note}</div>
            </div>
          ))}
        </div>
      </div>

      {platform === 'ios' ? (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 92,
            background: 'rgba(247,243,235,0.97)',
            borderTop: `1px solid ${colors.line}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-around',
            paddingTop: 18,
          }}
        >
          {['‹', '›', null, '▭', '⧉'].map((glyph, index) =>
            glyph === null ? (
              <div
                key={index}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `rgba(238,120,79,${0.16 * shareGlow})`,
                  boxShadow: `0 0 0 ${2 + 6 * shareGlow}px rgba(238,120,79,${0.22 * shareGlow})`,
                  transform: `scale(${1 + 0.14 * shareGlow - 0.12 * sharePressed})`,
                }}
              >
                <ShareIcon
                  size={26}
                  color={shareGlow > 0.02 ? colors.orangeDark : colors.ink}
                />
              </div>
            ) : (
              <div
                key={index}
                style={{
                  width: 46,
                  height: 46,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: fonts.body,
                  fontSize: 26,
                  color: index < 2 ? colors.soft : colors.ink,
                }}
              >
                {glyph}
              </div>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
};
