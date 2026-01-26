import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { ReactNode } from 'react';
import { easeOutBack, easeInCubic } from '../utils/easing';

type SlideDirection = 'left' | 'right' | 'up' | 'down';

interface SlideTransitionProps {
  children: ReactNode;
  startFrame: number;
  endFrame: number;
  transitionDuration?: number;
  enterFrom?: SlideDirection;
  exitTo?: SlideDirection;
}

/**
 * SlideTransition component - slides content in and out
 * Uses easeOutBack for playful overshoot on entry
 */
export const SlideTransition = ({
  children,
  startFrame,
  endFrame,
  transitionDuration = 25,
  enterFrom = 'right',
  exitTo = 'left',
}: SlideTransitionProps) => {
  const frame = useCurrentFrame();

  // Get translation values based on direction
  const getTranslation = (direction: SlideDirection, progress: number) => {
    const distance = 100; // percentage
    switch (direction) {
      case 'left':
        return { x: -distance * (1 - progress), y: 0 };
      case 'right':
        return { x: distance * (1 - progress), y: 0 };
      case 'up':
        return { x: 0, y: -distance * (1 - progress) };
      case 'down':
        return { x: 0, y: distance * (1 - progress) };
    }
  };

  // Entry animation progress
  const entryProgress = interpolate(
    frame,
    [startFrame, startFrame + transitionDuration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Exit animation progress
  const exitProgress = interpolate(
    frame,
    [endFrame - transitionDuration, endFrame],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Apply easing
  const easedEntry = easeOutBack(entryProgress);
  const easedExit = easeInCubic(1 - exitProgress);

  // Calculate transforms
  const isEntering = frame < startFrame + transitionDuration;
  const isExiting = frame > endFrame - transitionDuration;

  let translateX = 0;
  let translateY = 0;
  let opacity = 1;

  if (isEntering) {
    const { x, y } = getTranslation(enterFrom, easedEntry);
    translateX = x;
    translateY = y;
    opacity = entryProgress;
  }

  if (isExiting) {
    const { x, y } = getTranslation(exitTo, exitProgress);
    translateX = x * easedExit;
    translateY = y * easedExit;
    opacity = exitProgress;
  }

  // Only render if visible
  if (frame < startFrame - 5 || frame > endFrame + 5) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${translateX}%, ${translateY}%)`,
        opacity,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
