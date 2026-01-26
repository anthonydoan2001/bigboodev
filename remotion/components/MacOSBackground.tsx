import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const MacOSBackground = () => {
  const frame = useCurrentFrame();

  // Subtle animated movement for cloud-like effect
  const cloudX1 = interpolate(frame, [0, 450], [30, 40], {
    extrapolateRight: 'clamp',
  });
  const cloudX2 = interpolate(frame, [0, 450], [70, 60], {
    extrapolateRight: 'clamp',
  });
  const cloudY = interpolate(frame, [0, 225, 450], [20, 25, 20]);

  return (
    <AbsoluteFill
      style={{
        background: `
          /* Soft cloud highlights */
          radial-gradient(
            ellipse 120% 40% at ${cloudX1}% ${cloudY}%,
            rgba(255, 255, 255, 0.15) 0%,
            transparent 50%
          ),
          radial-gradient(
            ellipse 100% 35% at ${cloudX2}% ${cloudY + 10}%,
            rgba(200, 230, 255, 0.2) 0%,
            transparent 45%
          ),
          /* Main gradient - macOS Sierra style with light blue */
          linear-gradient(
            180deg,
            #7CB9E8 0%,
            #89CFF0 15%,
            #A7D8F0 30%,
            #B8E2F8 45%,
            #C9E9FC 60%,
            #E0F2FE 80%,
            #F0F9FF 100%
          )
        `,
      }}
    />
  );
};
