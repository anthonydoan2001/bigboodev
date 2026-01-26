import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { CSSProperties } from 'react';
import { interpolateCursor, CursorKeyframe } from '../utils/keyframes';
import { THEME } from '../config';

interface AnimatedCursorProps {
  keyframes: CursorKeyframe[];
}

export const AnimatedCursor = ({ keyframes }: AnimatedCursorProps) => {
  const frame = useCurrentFrame();

  // Get current cursor position and click state
  const { x, y, isClicking, clickProgress } = interpolateCursor(keyframes, frame);

  // Click animation scale - smooth pulse
  const clickScale = isClicking
    ? interpolate(
        clickProgress,
        [0, 0.15, 0.4, 1],
        [1, 0.8, 1.1, 1],
        { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
      )
    : 1;

  // Ripple effect
  const rippleScale = isClicking
    ? interpolate(clickProgress, [0, 1], [0.3, 3], {
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic)
      })
    : 0;

  const rippleOpacity = isClicking
    ? interpolate(clickProgress, [0, 0.2, 1], [0.7, 0.5, 0], {
        extrapolateRight: 'clamp'
      })
    : 0;

  const cursorStyle: CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width: 28,
    height: 28,
    transform: `scale(${clickScale})`,
    transformOrigin: 'top left',
    pointerEvents: 'none',
    zIndex: 9999,
    filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))',
  };

  const rippleStyle: CSSProperties = {
    position: 'absolute',
    left: x + 4,
    top: y + 4,
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${THEME.primary}50 0%, transparent 70%)`,
    transform: `scale(${rippleScale})`,
    opacity: rippleOpacity,
    pointerEvents: 'none',
    zIndex: 9998,
  };

  return (
    <>
      {/* Click ripple */}
      {isClicking && <div style={rippleStyle} />}

      {/* Main cursor */}
      <div style={cursorStyle}>
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shadow layer */}
          <path
            d="M5.5 3.21V20.8l5.67-5.43h8.55L5.5 3.21z"
            fill="rgba(0,0,0,0.2)"
            transform="translate(0.6, 0.6)"
          />
          {/* Main cursor */}
          <path
            d="M5.5 3.21V20.8l5.67-5.43h8.55L5.5 3.21z"
            fill={THEME.cursor.fill}
            stroke={THEME.cursor.stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  );
};
