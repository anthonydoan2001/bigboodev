import { easeInOutCubic, easeOutCubic, cubicBezier2D, clamp } from './easing';

/**
 * Keyframe types
 */
export interface CursorKeyframe {
  frame: number;
  x: number;
  y: number;
  click?: boolean;
  // Control points for bezier curves (optional)
  controlX1?: number;
  controlY1?: number;
  controlX2?: number;
  controlY2?: number;
}

export interface ZoomKeyframe {
  frame: number;
  scale: number;
  originX: number; // percentage 0-100
  originY: number; // percentage 0-100
}

export interface KenBurnsConfig {
  startFrame: number;
  endFrame: number;
  startScale: number;
  endScale: number;
  startOriginX: number;
  startOriginY: number;
  endOriginX: number;
  endOriginY: number;
}

/**
 * Interpolate between cursor keyframes with bezier curves
 */
export function interpolateCursor(
  keyframes: CursorKeyframe[],
  frame: number
): { x: number; y: number; isClicking: boolean; clickProgress: number } {
  if (keyframes.length === 0) {
    return { x: 0, y: 0, isClicking: false, clickProgress: 0 };
  }

  // Handle before first keyframe
  if (frame <= keyframes[0].frame) {
    return { x: keyframes[0].x, y: keyframes[0].y, isClicking: false, clickProgress: 0 };
  }

  // Handle after last keyframe
  if (frame >= keyframes[keyframes.length - 1].frame) {
    const last = keyframes[keyframes.length - 1];
    return { x: last.x, y: last.y, isClicking: false, clickProgress: 0 };
  }

  // Find surrounding keyframes
  let prevIdx = 0;
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (frame >= keyframes[i].frame && frame < keyframes[i + 1].frame) {
      prevIdx = i;
      break;
    }
  }

  const prev = keyframes[prevIdx];
  const next = keyframes[prevIdx + 1];

  // Calculate progress between keyframes
  const duration = next.frame - prev.frame;
  const progress = duration > 0 ? clamp((frame - prev.frame) / duration, 0, 1) : 1;

  // Apply easing for smooth deceleration
  const easedProgress = easeOutCubic(progress);

  let x: number, y: number;

  // Check if NEXT keyframe has control points (they define the curve TO that point)
  if (next.controlX1 !== undefined && next.controlY1 !== undefined) {
    const p0 = { x: prev.x, y: prev.y };
    const p1 = { x: next.controlX1, y: next.controlY1 };
    const p2 = { x: next.controlX2 ?? next.x, y: next.controlY2 ?? next.y };
    const p3 = { x: next.x, y: next.y };
    const point = cubicBezier2D(p0, p1, p2, p3, easedProgress);
    x = point.x;
    y = point.y;
  } else {
    // Linear interpolation with easing
    x = prev.x + (next.x - prev.x) * easedProgress;
    y = prev.y + (next.y - prev.y) * easedProgress;
  }

  // Check for click animation
  let isClicking = false;
  let clickProgress = 0;
  const clickDuration = 15; // frames

  for (const kf of keyframes) {
    if (kf.click && frame >= kf.frame && frame < kf.frame + clickDuration) {
      isClicking = true;
      clickProgress = (frame - kf.frame) / clickDuration;
      break;
    }
  }

  return { x, y, isClicking, clickProgress };
}

/**
 * Interpolate Ken Burns zoom effect
 */
export function interpolateKenBurns(
  configs: KenBurnsConfig[],
  frame: number
): { scale: number; originX: number; originY: number } {
  // Find active Ken Burns config
  let activeConfig: KenBurnsConfig | null = null;
  for (const config of configs) {
    if (frame >= config.startFrame && frame <= config.endFrame) {
      activeConfig = config;
      break;
    }
  }

  if (!activeConfig) {
    return { scale: 1, originX: 50, originY: 50 };
  }

  const duration = activeConfig.endFrame - activeConfig.startFrame;
  const progress = clamp((frame - activeConfig.startFrame) / duration, 0, 1);
  const easedProgress = easeInOutCubic(progress);

  return {
    scale: activeConfig.startScale + (activeConfig.endScale - activeConfig.startScale) * easedProgress,
    originX: activeConfig.startOriginX + (activeConfig.endOriginX - activeConfig.startOriginX) * easedProgress,
    originY: activeConfig.startOriginY + (activeConfig.endOriginY - activeConfig.startOriginY) * easedProgress,
  };
}

/**
 * Interpolate between zoom keyframes
 */
export function interpolateZoom(
  keyframes: ZoomKeyframe[],
  frame: number
): { scale: number; originX: number; originY: number } {
  let prevIdx = 0;
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (frame >= keyframes[i].frame && frame < keyframes[i + 1].frame) {
      prevIdx = i;
      break;
    }
    if (frame >= keyframes[keyframes.length - 1].frame) {
      prevIdx = keyframes.length - 1;
    }
  }

  const prev = keyframes[prevIdx];
  const next = keyframes[Math.min(prevIdx + 1, keyframes.length - 1)];

  const duration = next.frame - prev.frame;
  const progress = duration > 0 ? clamp((frame - prev.frame) / duration, 0, 1) : 1;
  const easedProgress = easeInOutCubic(progress);

  return {
    scale: prev.scale + (next.scale - prev.scale) * easedProgress,
    originX: prev.originX + (next.originX - prev.originX) * easedProgress,
    originY: prev.originY + (next.originY - prev.originY) * easedProgress,
  };
}

/**
 * Get crossfade opacity for transitions
 */
export function getCrossfadeOpacity(
  frame: number,
  featureStart: number,
  featureEnd: number,
  transitionDuration: number
): { current: number; entering: boolean; exiting: boolean } {
  const entering = frame < featureStart + transitionDuration;
  const exiting = frame > featureEnd - transitionDuration;

  let opacity = 1;

  if (entering) {
    const progress = (frame - featureStart) / transitionDuration;
    opacity = easeOutCubic(clamp(progress, 0, 1));
  }

  if (exiting) {
    const progress = (frame - (featureEnd - transitionDuration)) / transitionDuration;
    opacity = 1 - easeInOutCubic(clamp(progress, 0, 1));
  }

  return { current: opacity, entering, exiting };
}
