export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/**
 * Scene lengths are audio-first: each scene holds its narration clip
 * (measured from public/voice/ad-0N.mp3) plus a short breath before the cut.
 */
export const AD_SCENES = {
  hook: 247,
  today: 203,
  pass: 318,
  scan: 336,
  late: 281,
  wall: 251,
  team: 294,
  close: 342,
} as const;

export const AD_TRANSITION = 15;

export const AD_TOTAL_FRAMES =
  AD_SCENES.hook +
  AD_SCENES.today +
  AD_SCENES.pass +
  AD_SCENES.scan +
  AD_SCENES.late +
  AD_SCENES.wall +
  AD_SCENES.team +
  AD_SCENES.close -
  AD_TRANSITION * 7;

/** Narration starts a moment after each cut so it never bleeds into a transition. */
export const VOICE_OFFSET = 22;

export const VOICE = {
  hook: 'audio/ad-01.mp3',
  today: 'audio/ad-02.mp3',
  pass: 'audio/ad-03.mp3',
  scan: 'audio/ad-04.mp3',
  late: 'audio/ad-05.mp3',
  wall: 'audio/ad-06.mp3',
  team: 'audio/ad-07.mp3',
  close: 'audio/ad-08.mp3',
} as const;
