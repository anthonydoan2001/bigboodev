import { interpolate, useCurrentFrame } from 'remotion';
import { CSSProperties, ReactNode } from 'react';

interface LiquidGlassBorderProps {
  children: ReactNode;
  width: number;
  height: number;
}

export const LiquidGlassBorder = ({
  children,
  width,
  height,
}: LiquidGlassBorderProps) => {
  const frame = useCurrentFrame();

  // Animate gradient position for liquid effect (2 full rotations over 15s)
  const gradientRotation = interpolate(frame, [0, 450], [0, 720]);

  // Pulsing glow intensity (pulse every 2 seconds = 60 frames)
  const glowIntensity = interpolate(frame % 60, [0, 30, 60], [0.4, 0.7, 0.4]);

  const borderWidth = 3;

  const containerStyle: CSSProperties = {
    position: 'relative',
    width,
    height,
    borderRadius: 24,
    overflow: 'visible',
  };

  // Animated conic gradient border - light blue theme
  const borderStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 24,
    padding: borderWidth,
    background: `
      conic-gradient(
        from ${gradientRotation}deg at 50% 50%,
        rgba(255, 255, 255, 0.95) 0%,
        rgba(135, 206, 250, 0.9) 25%,
        rgba(100, 180, 255, 0.85) 50%,
        rgba(173, 216, 230, 0.9) 75%,
        rgba(255, 255, 255, 0.95) 100%
      )
    `,
    WebkitMask: `
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0)
    `,
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
  };

  // Outer glow effect - light blue
  const glowStyle: CSSProperties = {
    position: 'absolute',
    inset: -20,
    borderRadius: 44,
    background: `
      radial-gradient(
        ellipse at 50% 50%,
        rgba(135, 206, 250, ${glowIntensity * 0.4}) 0%,
        transparent 70%
      )
    `,
    filter: 'blur(20px)',
    pointerEvents: 'none',
  };

  // Glass background
  const glassStyle: CSSProperties = {
    position: 'absolute',
    inset: borderWidth,
    borderRadius: 24 - borderWidth,
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    overflow: 'hidden',
  };

  return (
    <div style={containerStyle}>
      <div style={glowStyle} />
      <div style={borderStyle} />
      <div style={glassStyle}>{children}</div>
    </div>
  );
};
