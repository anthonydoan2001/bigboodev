import { Img, staticFile } from 'remotion';
import { LiquidGlassBorder } from './LiquidGlassBorder';
import { CSSProperties } from 'react';

interface GlassWindowProps {
  imagePath: string;
  scale?: number;
  opacity?: number;
  zoom?: number;
  zoomOriginX?: number; // 0-100 percentage
  zoomOriginY?: number; // 0-100 percentage
}

// Window dimensions (smaller than 1920x1080 to show background)
const WINDOW_WIDTH = 1400;
const WINDOW_HEIGHT = 850;
const TITLE_BAR_HEIGHT = 32;

export const GlassWindow = ({
  imagePath,
  scale = 1,
  opacity = 1,
  zoom = 1,
  zoomOriginX = 50,
  zoomOriginY = 50,
}: GlassWindowProps) => {
  // macOS-style title bar
  const titleBarStyle: CSSProperties = {
    height: TITLE_BAR_HEIGHT,
    background: 'rgba(40, 40, 50, 0.95)',
    borderTopLeftRadius: 21,
    borderTopRightRadius: 21,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 16,
    gap: 8,
  };

  const trafficLight = (color: string): CSSProperties => ({
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: color,
  });

  const contentStyle: CSSProperties = {
    width: '100%',
    height: WINDOW_HEIGHT - TITLE_BAR_HEIGHT,
    overflow: 'hidden',
    borderBottomLeftRadius: 21,
    borderBottomRightRadius: 21,
    background: '#1a1a2e',
  };

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity,
        transformOrigin: 'center center',
      }}
    >
      <LiquidGlassBorder width={WINDOW_WIDTH} height={WINDOW_HEIGHT}>
        {/* macOS Title Bar */}
        <div style={titleBarStyle}>
          <div style={trafficLight('#ff5f57')} /> {/* Close */}
          <div style={trafficLight('#febc2e')} /> {/* Minimize */}
          <div style={trafficLight('#28c840')} /> {/* Maximize */}
        </div>

        {/* Content Area */}
        <div style={contentStyle}>
          <Img
            src={staticFile(imagePath)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center',
              transform: `scale(${zoom})`,
              transformOrigin: `${zoomOriginX}% ${zoomOriginY}%`,
            }}
          />
        </div>
      </LiquidGlassBorder>
    </div>
  );
};
