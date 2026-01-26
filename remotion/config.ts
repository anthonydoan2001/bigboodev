// Video configuration
export const VIDEO_CONFIG = {
  fps: 30,
  durationInSeconds: 15,
  width: 1920,
  height: 1080,
};

export const TOTAL_FRAMES = VIDEO_CONFIG.fps * VIDEO_CONFIG.durationInSeconds;

// Window configuration
export const WINDOW_CONFIG = {
  width: 1400,
  height: 850,
  offsetX: (VIDEO_CONFIG.width - 1400) / 2, // 260
  offsetY: (VIDEO_CONFIG.height - 850) / 2, // 115
  titleBarHeight: 32,
  borderRadius: 24,
};

// Feature timing (frames)
// Using single image per feature to avoid jarring jumps - Ken Burns handles visual interest
export const FEATURES = [
  {
    name: 'Dashboard',
    startFrame: 0,
    endFrame: 120,
    images: ['screenshots/dashboard/frame-001.png'],
  },
  {
    name: 'Manga',
    startFrame: 120,
    endFrame: 210,
    images: ['screenshots/manga-reader/frame-001.png'],
  },
  {
    name: 'Watchlist',
    startFrame: 210,
    endFrame: 300,
    images: ['screenshots/watchlist/frame-001.png'],
  },
  {
    name: 'Sports',
    startFrame: 300,
    endFrame: 375,
    images: ['screenshots/sports/frame-001.png'],
  },
  {
    name: 'Notes',
    startFrame: 375,
    endFrame: 450,
    images: ['screenshots/notes/frame-001.png'],
  },
];

// Transition duration in frames
export const TRANSITION_DURATION = 20;

// Audio configuration
export const AUDIO_CONFIG = {
  file: 'audio/background.mp3',
  fadeInFrames: 30,
  fadeOutFrames: 30,
  maxVolume: 0.4,
};

// Theme colors
export const THEME = {
  primary: '#1e90ff',
  background: {
    gradientStart: '#7CB9E8',
    gradientEnd: '#F0F9FF',
  },
  cursor: {
    fill: '#ffffff',
    stroke: '#1e90ff',
  },
};
