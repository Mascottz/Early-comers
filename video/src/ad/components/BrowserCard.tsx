import React from 'react';
import { staticFile } from 'remotion';
import { colors } from '../../theme';

type BrowserCardProps = {
  src: string;
  /** Natural height of the screenshot at 1366px wide. */
  imgHeight: number;
  width?: number;
  viewportHeight?: number;
  /** 0 = top of the page, 1 = fully scrolled. */
  progress: number;
  rotateY?: number;
  rotateX?: number;
  url?: string;
};

export const BrowserCard: React.FC<BrowserCardProps> = ({
  src,
  imgHeight,
  width = 1250,
  viewportHeight = 668,
  progress,
  rotateY = -7,
  rotateX = 3,
  url = 'earlycomers.vercel.app',
}) => {
  const scale = width / 1366;
  const renderedHeight = imgHeight * scale;
  const panRange = Math.max(0, renderedHeight - viewportHeight);
  const pan = panRange * progress;

  return (
    <div
      style={{
        width,
        perspective: 2400,
        perspectiveOrigin: '50% 50%',
      }}
    >
      <div
        style={{
          width: '100%',
          borderRadius: 24,
          overflow: 'hidden',
          background: '#fbf8f1',
          border: '1px solid rgba(23,63,53,0.10)',
          boxShadow:
            '0 60px 110px rgba(11,33,28,0.20), 0 18px 34px rgba(11,33,28,0.10), inset 0 1px 0 rgba(255,255,255,0.7)',
          transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          style={{
            height: 46,
            background: '#f1ece1',
            borderBottom: '1px solid rgba(23,63,53,0.10)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 18px',
          }}
        >
          {['#e3796b', '#e6bd72', '#a9c39a'].map((dot) => (
            <span
              key={dot}
              style={{ width: 11, height: 11, borderRadius: 6, background: dot, opacity: 0.9 }}
            />
          ))}
          <div
            style={{
              flex: 1,
              maxWidth: 460,
              margin: '0 auto',
              height: 26,
              borderRadius: 8,
              background: '#e6e0d3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 14,
              color: colors.soft,
            }}
          >
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
              <rect x="0.8" y="5" width="8.4" height="6.4" rx="1.8" fill={colors.soft} />
              <path d="M2.6 5V3.6a2.4 2.4 0 0 1 4.8 0V5" stroke={colors.soft} strokeWidth="1.3" />
            </svg>
            {url}
          </div>
          <div style={{ width: 34 }} />
        </div>

        <div
          style={{
            height: viewportHeight,
            overflow: 'hidden',
            position: 'relative',
            background: colors.paper,
          }}
        >
          <img
            src={staticFile(src)}
            alt=""
            style={{
              display: 'block',
              width: '100%',
              transform: `translateY(${-pan}px)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'linear-gradient(180deg, rgba(11,33,28,0.05) 0%, rgba(11,33,28,0) 12%, rgba(11,33,28,0) 88%, rgba(11,33,28,0.06) 100%)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

/** Small floating annotation attached to a screenshot corner. */
export const FloatingNote: React.FC<{
  x: number;
  y: number;
  title: string;
  detail?: string;
  appear: number;
}> = ({ x, y, title, detail, appear }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      opacity: appear,
      transform: `translateY(${(1 - appear) * 16}px)`,
      padding: '16px 22px',
      borderRadius: 16,
      background: 'rgba(255,253,247,0.97)',
      border: `1px solid ${colors.line}`,
      boxShadow: '0 24px 44px rgba(11,33,28,0.14)',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}
  >
    <span
      style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: colors.ink,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M4.5 12.5l5 5L20 6.8"
          stroke={colors.white}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
    <div>
      <div
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 21,
          fontWeight: 500,
          color: colors.ink,
          lineHeight: 1.2,
        }}
      >
        {title}
      </div>
      {detail ? (
        <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 16, color: colors.soft }}>
          {detail}
        </div>
      ) : null}
    </div>
  </div>
);
