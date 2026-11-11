export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const SCENES = {
  intro: 130,
  iphone: 360,
  android: 360,
  outro: 240,
} as const;

export const TRANSITION = 15;

export const TOTAL_FRAMES =
  SCENES.intro + SCENES.iphone + SCENES.android + SCENES.outro - TRANSITION * 3;
