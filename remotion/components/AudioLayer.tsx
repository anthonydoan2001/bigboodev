import { Audio, interpolate, useCurrentFrame, staticFile } from 'remotion';
import { AUDIO_CONFIG, TOTAL_FRAMES } from '../config';

/**
 * AudioLayer component - handles background music with fade in/out
 */
export const AudioLayer = () => {
  const frame = useCurrentFrame();

  // Calculate volume with fade in and fade out
  const volume = interpolate(
    frame,
    [
      0,
      AUDIO_CONFIG.fadeInFrames,
      TOTAL_FRAMES - AUDIO_CONFIG.fadeOutFrames,
      TOTAL_FRAMES,
    ],
    [0, AUDIO_CONFIG.maxVolume, AUDIO_CONFIG.maxVolume, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <Audio
      src={staticFile(AUDIO_CONFIG.file)}
      volume={volume}
      loop
    />
  );
};
