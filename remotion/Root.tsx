import { Composition } from 'remotion';
import { WebsiteWalkthrough } from './WebsiteWalkthrough';
import { VIDEO_CONFIG, TOTAL_FRAMES } from './config';

export const RemotionRoot = () => {
  return (
    <Composition
      id="WebsiteWalkthrough"
      component={WebsiteWalkthrough}
      durationInFrames={TOTAL_FRAMES}
      fps={VIDEO_CONFIG.fps}
      width={VIDEO_CONFIG.width}
      height={VIDEO_CONFIG.height}
    />
  );
};
