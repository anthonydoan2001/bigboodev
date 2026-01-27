import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
} from 'remotion';
import { GlassWindow } from './GlassWindow';
import { AnimatedCursor } from './AnimatedCursor';
import { FEATURES, TRANSITION_DURATION, WINDOW_CONFIG } from '../config';
import { CursorKeyframe, KenBurnsConfig } from '../utils/keyframes';
import { interpolateKenBurns } from '../utils/keyframes';

// Window offset for cursor positioning
const WINDOW_OFFSET_X = WINDOW_CONFIG.offsetX;
const WINDOW_OFFSET_Y = WINDOW_CONFIG.offsetY;

// Cursor keyframes - simpler, smoother paths
const cursorKeyframes: CursorKeyframe[] = [
  // Dashboard (0-120)
  { frame: 0, x: -50, y: 400 },
  { frame: 30, x: WINDOW_OFFSET_X + 700, y: WINDOW_OFFSET_Y + 150 },
  { frame: 60, x: WINDOW_OFFSET_X + 500, y: WINDOW_OFFSET_Y + 300 },
  { frame: 90, x: WINDOW_OFFSET_X + 100, y: WINDOW_OFFSET_Y + 280 },
  { frame: 115, x: WINDOW_OFFSET_X + 100, y: WINDOW_OFFSET_Y + 300, click: true },

  // Manga (120-210)
  { frame: 135, x: WINDOW_OFFSET_X + 400, y: WINDOW_OFFSET_Y + 300 },
  { frame: 165, x: WINDOW_OFFSET_X + 700, y: WINDOW_OFFSET_Y + 320 },
  { frame: 190, x: WINDOW_OFFSET_X + 100, y: WINDOW_OFFSET_Y + 350 },
  { frame: 205, x: WINDOW_OFFSET_X + 100, y: WINDOW_OFFSET_Y + 350, click: true },

  // Watchlist (210-300)
  { frame: 230, x: WINDOW_OFFSET_X + 400, y: WINDOW_OFFSET_Y + 350 },
  { frame: 260, x: WINDOW_OFFSET_X + 800, y: WINDOW_OFFSET_Y + 350 },
  { frame: 280, x: WINDOW_OFFSET_X + 100, y: WINDOW_OFFSET_Y + 400 },
  { frame: 295, x: WINDOW_OFFSET_X + 100, y: WINDOW_OFFSET_Y + 400, click: true },

  // Sports (300-375)
  { frame: 320, x: WINDOW_OFFSET_X + 500, y: WINDOW_OFFSET_Y + 280 },
  { frame: 350, x: WINDOW_OFFSET_X + 600, y: WINDOW_OFFSET_Y + 350 },
  { frame: 365, x: WINDOW_OFFSET_X + 100, y: WINDOW_OFFSET_Y + 450, click: true },

  // Notes (375-450)
  { frame: 395, x: WINDOW_OFFSET_X + 300, y: WINDOW_OFFSET_Y + 300 },
  { frame: 420, x: WINDOW_OFFSET_X + 700, y: WINDOW_OFFSET_Y + 350 },
  { frame: 450, x: WINDOW_OFFSET_X + 700, y: WINDOW_OFFSET_Y + 400 },
];

// Ken Burns configurations for cinematic zoom/pan
const kenBurnsConfigs: KenBurnsConfig[] = [
  // Dashboard
  {
    startFrame: 15,
    endFrame: 60,
    startScale: 1,
    endScale: 1.15,
    startOriginX: 50,
    startOriginY: 30,
    endOriginX: 50,
    endOriginY: 45,
  },
  {
    startFrame: 60,
    endFrame: 115,
    startScale: 1.15,
    endScale: 1,
    startOriginX: 50,
    startOriginY: 45,
    endOriginX: 50,
    endOriginY: 50,
  },

  // Manga
  {
    startFrame: 130,
    endFrame: 175,
    startScale: 1,
    endScale: 1.2,
    startOriginX: 35,
    startOriginY: 40,
    endOriginX: 55,
    endOriginY: 45,
  },
  {
    startFrame: 175,
    endFrame: 205,
    startScale: 1.2,
    endScale: 1,
    startOriginX: 55,
    startOriginY: 45,
    endOriginX: 50,
    endOriginY: 50,
  },

  // Watchlist
  {
    startFrame: 220,
    endFrame: 265,
    startScale: 1,
    endScale: 1.15,
    startOriginX: 30,
    startOriginY: 45,
    endOriginX: 70,
    endOriginY: 45,
  },
  {
    startFrame: 265,
    endFrame: 295,
    startScale: 1.15,
    endScale: 1,
    startOriginX: 70,
    startOriginY: 45,
    endOriginX: 50,
    endOriginY: 50,
  },

  // Sports
  {
    startFrame: 310,
    endFrame: 350,
    startScale: 1,
    endScale: 1.2,
    startOriginX: 45,
    startOriginY: 35,
    endOriginX: 50,
    endOriginY: 45,
  },
  {
    startFrame: 350,
    endFrame: 370,
    startScale: 1.2,
    endScale: 1,
    startOriginX: 50,
    startOriginY: 45,
    endOriginX: 50,
    endOriginY: 50,
  },

  // Notes
  {
    startFrame: 385,
    endFrame: 430,
    startScale: 1,
    endScale: 1.15,
    startOriginX: 40,
    startOriginY: 45,
    endOriginX: 60,
    endOriginY: 50,
  },
  {
    startFrame: 430,
    endFrame: 450,
    startScale: 1.15,
    endScale: 1,
    startOriginX: 60,
    startOriginY: 50,
    endOriginX: 50,
    endOriginY: 50,
  },
];

// Single feature layer component
const FeatureLayer = ({
  feature,
  frame,
  kenBurnsConfigs,
}: {
  feature: typeof FEATURES[0];
  frame: number;
  kenBurnsConfigs: KenBurnsConfig[];
}) => {
  // Calculate opacity for smooth fade in/out
  const fadeIn = interpolate(
    frame,
    [feature.startFrame, feature.startFrame + TRANSITION_DURATION],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
  );

  const fadeOut = interpolate(
    frame,
    [feature.endFrame - TRANSITION_DURATION, feature.endFrame],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  // Scale animation
  const scaleIn = interpolate(
    frame,
    [feature.startFrame, feature.startFrame + TRANSITION_DURATION],
    [0.95, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
  );

  const scaleOut = interpolate(
    frame,
    [feature.endFrame - TRANSITION_DURATION, feature.endFrame],
    [1, 0.95],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) }
  );

  const scale = scaleIn * scaleOut;

  // Use single image per feature (no cycling to avoid jarring jumps)
  const imageIndex = 0;

  // Ken Burns zoom/pan
  const { scale: zoomScale, originX: zoomOriginX, originY: zoomOriginY } =
    interpolateKenBurns(kenBurnsConfigs, frame);

  // Don't render if completely invisible
  if (opacity <= 0) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
    >
      <GlassWindow
        imagePath={feature.images[Math.max(0, imageIndex)]}
        scale={scale}
        opacity={1}
        zoom={zoomScale}
        zoomOriginX={zoomOriginX}
        zoomOriginY={zoomOriginY}
      />
    </AbsoluteFill>
  );
};

export const FeatureSequence = () => {
  const frame = useCurrentFrame();

  // Get active features (current and potentially overlapping during transitions)
  const activeFeatures = FEATURES.filter((f) => {
    const isVisible = frame >= f.startFrame - 5 && frame <= f.endFrame + 5;
    return isVisible;
  });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Render all active features (handles crossfade automatically via opacity) */}
      {activeFeatures.map((feature) => (
        <FeatureLayer
          key={feature.name}
          feature={feature}
          frame={frame}
          kenBurnsConfigs={kenBurnsConfigs}
        />
      ))}

      {/* Animated cursor on top */}
      <AnimatedCursor keyframes={cursorKeyframes} />
    </AbsoluteFill>
  );
};
