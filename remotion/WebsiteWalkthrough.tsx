import { AbsoluteFill } from 'remotion';
import { MacOSBackground } from './components/MacOSBackground';
import { FeatureSequence } from './components/FeatureSequence';
import { AudioLayer } from './components/AudioLayer';

export const WebsiteWalkthrough = () => {
  return (
    <AbsoluteFill>
      <MacOSBackground />
      <FeatureSequence />
      <AudioLayer />
    </AbsoluteFill>
  );
};
