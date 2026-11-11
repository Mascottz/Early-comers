import React from 'react';
import { colors, fonts } from './theme';

export type Platform = 'ios' | 'android';

type PhoneProps = {
  children: React.ReactNode;
  platform: Platform;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  translateY?: number;
  scale?: number;
};

export const Phone: React.FC<PhoneProps> = ({
  children,
  platform,
  rotateX = 4,
  rotateY = -10,
  rotateZ = -1.5,
  translateY = 0,
  scale = 1,
}) => {
  const transform = [
    `translateY(${translateY}px)`,
    `scale(${scale})`,
    `rotateX(${rotateX}deg)`,
    `rotateY(${rotateY}deg)`,
    `rotateZ(${rotateZ}deg)`,
  ].join(' ');

  return (
    <div
      style={{
        width: 560,
        height: 1120,
        perspective: 1700,
        perspectiveOrigin: '50% 42%',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 18,
            right: 18,
            bottom: -54,
            height: 86,
            borderRadius: '50%',
            background: 'rgba(11, 33, 28, 0.32)',
            filter: 'blur(30px)',
            transform: 'rotateX(72deg) translateZ(-60px)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 88,
            padding: 13,
            background:
              'linear-gradient(145deg, #46514b 0%, #18241f 24%, #0a120f 62%, #36443d 100%)',
            boxShadow:
              '0 70px 120px rgba(11, 33, 28, 0.32), 0 18px 34px rgba(11, 33, 28, 0.22), inset 0 0 0 2px rgba(255, 255, 255, 0.26), inset 0 0 18px rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: 76,
              overflow: 'hidden',
              background: colors.paper,
              isolation: 'isolate',
            }}
          >
            {children}

            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 60,
                pointerEvents: 'none',
                borderRadius: 76,
                boxShadow: 'inset 0 0 0 1px rgba(11, 33, 28, 0.14)',
                background:
                  'linear-gradient(122deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 22%, rgba(255,255,255,0) 72%, rgba(255,255,255,0.07) 100%)',
              }}
            />

            {platform === 'ios' ? (
              <div
                style={{
                  position: 'absolute',
                  top: 13,
                  left: '50%',
                  width: 132,
                  height: 36,
                  marginLeft: -66,
                  borderRadius: 22,
                  background: colors.black,
                  zIndex: 50,
                }}
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  top: 18,
                  left: '50%',
                  width: 20,
                  height: 20,
                  marginLeft: -10,
                  borderRadius: '50%',
                  background: colors.black,
                  zIndex: 50,
                }}
              />
            )}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            right: -3,
            top: 236,
            width: 4,
            height: 92,
            borderRadius: 3,
            background: '#2b3731',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -3,
            top: 210,
            width: 4,
            height: 52,
            borderRadius: 3,
            background: '#2b3731',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -3,
            top: 278,
            width: 4,
            height: 82,
            borderRadius: 3,
            background: '#2b3731',
          }}
        />
      </div>
    </div>
  );
};

export const StatusBar: React.FC<{ tone?: 'ink' | 'light' }> = ({ tone = 'ink' }) => {
  const color = tone === 'light' ? colors.white : colors.ink;
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 74,
        padding: '18px 34px 0',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        color,
        fontFamily: fonts.body,
        fontSize: 19,
        fontWeight: 500,
        letterSpacing: '-0.01em',
        zIndex: 40,
      }}
    >
      <span style={{ width: 70 }}>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <svg width="30" height="18" viewBox="0 0 30 18" fill="none">
          {[0, 1, 2, 3].map((index) => (
            <rect
              key={index}
              x={index * 7.5}
              y={12 - index * 3.2}
              width="5"
              height={6 + index * 3.2}
              rx="1.4"
              fill={color}
            />
          ))}
        </svg>
        <svg width="22" height="17" viewBox="0 0 22 17" fill="none">
          <path
            d="M11 14.4a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Zm0-6.4c1.9 0 3.6.7 4.9 1.9l-1.5 1.6A5.3 5.3 0 0 0 11 10c-1.3 0-2.5.5-3.4 1.4L6.1 9.9A7.3 7.3 0 0 1 11 8Zm0-4.6c3.2 0 6.1 1.2 8.3 3.2l-1.5 1.6A10.3 10.3 0 0 0 11 5.4c-2.6 0-5 .9-6.8 2.4L2.7 6.2A12.3 12.3 0 0 1 11 3.4Z"
            fill={color}
          />
        </svg>
        <svg width="34" height="17" viewBox="0 0 34 17" fill="none">
          <rect x="0.8" y="0.8" width="28" height="15.4" rx="4.4" stroke={color} strokeOpacity="0.45" />
          <rect x="3" y="3" width="22.5" height="10.8" rx="2.6" fill={color} />
          <path d="M31 6.2c2.2.5 2.2 4.1 0 4.6V6.2Z" fill={color} fillOpacity="0.45" />
        </svg>
      </div>
    </div>
  );
};

export const HomeIndicator: React.FC<{ tone?: 'ink' | 'light' }> = ({ tone = 'ink' }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 10,
      left: '50%',
      width: 150,
      height: 5,
      marginLeft: -75,
      borderRadius: 3,
      background: tone === 'light' ? 'rgba(255,253,247,0.8)' : 'rgba(23,63,53,0.72)',
      zIndex: 45,
    }}
  />
);

export const ShareIcon: React.FC<{ color?: string; size?: number }> = ({
  color = colors.ink,
  size = 28,
}) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <path
      d="M14 3.5v13M14 3.5l-4.5 4.6M14 3.5l4.5 4.6M7 11.5H4.8v11.2h18.4V11.5H21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PlusSquareIcon: React.FC<{ color?: string; size?: number }> = ({
  color = colors.ink,
  size = 28,
}) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <rect x="3" y="3" width="22" height="22" rx="6" stroke={color} strokeWidth="2" />
    <path d="M14 9v10M9 14h10" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const DotsIcon: React.FC<{ color?: string; size?: number }> = ({
  color = colors.ink,
  size = 26,
}) => (
  <svg width={size} height={size} viewBox="0 0 26 26" fill="none">
    {[5, 13, 21].map((cy) => (
      <circle key={cy} cx="13" cy={cy} r="2.2" fill={color} />
    ))}
  </svg>
);

export const LockIcon: React.FC<{ color?: string; size?: number }> = ({
  color = colors.soft,
  size = 14,
}) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <rect x="2.5" y="6" width="9" height="7" rx="2" fill={color} />
    <path d="M4.4 6V4.5a2.6 2.6 0 1 1 5.2 0V6" stroke={color} strokeWidth="1.4" />
  </svg>
);

export const CheckIcon: React.FC<{ color?: string; size?: number }> = ({
  color = colors.white,
  size = 24,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M4.5 12.5l5 5L20 6.8"
      stroke={color}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChevronIcon: React.FC<{ color?: string; size?: number }> = ({
  color = colors.soft,
  size = 18,
}) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M6.5 3.5L12 9l-5.5 5.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
