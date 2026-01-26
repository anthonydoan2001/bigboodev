import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { ReactNode } from 'react';
import { easeInOutCubic } from '../utils/easing';

interface CrossFadeProps {
  children: ReactNode;
  startFrame: number;
  endFrame: number;
  transitionDuration?: number;
}

/**
 * CrossFade component - handles smooth opacity transitions
 * Fades in at the start, fades out at the end
 */
export const CrossFade = ({
  children,
  startFrame,
  endFrame,
  transitionDuration = 20,
}: CrossFadeProps) => {
  const frame = useCurrentFrame();

  // Calculate fade in (at start of feature)
  const fadeInProgress = interpolate(
    frame,
    [startFrame, startFrame + transitionDuration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Calculate fade out (at end of feature)
  const fadeOutProgress = interpolate(
    frame,
    [endFrame - transitionDuration, endFrame],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Apply easing for smooth transitions
  const easedFadeIn = easeInOutCubic(fadeInProgress);
  const easedFadeOut = easeInOutCubic(fadeOutProgress);

  // Combined opacity (minimum of fade in and fade out)
  const opacity = Math.min(easedFadeIn, easedFadeOut);

  // Only render if visible
  if (frame < startFrame - 5 || frame > endFrame + 5) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        opacity,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
