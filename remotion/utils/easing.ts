/**
 * Easing functions for smooth animations
 */

// Linear (no easing)
export const linear = (t: number): number => t;

// Ease in quad - slow start
export const easeInQuad = (t: number): number => t * t;

// Ease out quad - slow end
export const easeOutQuad = (t: number): number => t * (2 - t);

// Ease in-out quad - slow start and end
export const easeInOutQuad = (t: number): number =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

// Ease in cubic - slower start
export const easeInCubic = (t: number): number => t * t * t;

// Ease out cubic - slower end (great for cursor deceleration)
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

// Ease in-out cubic - smooth acceleration and deceleration
export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Ease out back - overshoot then settle (playful feel)
export const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// Ease in-out back - overshoot on both ends
export const easeInOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;
  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
};

// Ease out elastic - bouncy spring effect
export const easeOutElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

// Cubic bezier curve (for custom curves)
export const cubicBezier = (
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number => {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return uuu * p0 + 3 * uu * t * p1 + 3 * u * tt * p2 + ttt * p3;
};

// Cubic bezier for 2D point interpolation
export const cubicBezier2D = (
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
): { x: number; y: number } => ({
  x: cubicBezier(p0.x, p1.x, p2.x, p3.x, t),
  y: cubicBezier(p0.y, p1.y, p2.y, p3.y, t),
});

// Spring physics simulation
export const springPhysics = (
  t: number,
  damping: number = 0.5,
  frequency: number = 10
): number => {
  return 1 - Math.exp(-damping * t) * Math.cos(frequency * t);
};

// Clamp value between min and max
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

// Map value from one range to another
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};
