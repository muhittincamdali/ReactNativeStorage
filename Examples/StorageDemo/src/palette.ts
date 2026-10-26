/** Colours from the repository palette (.github/brand), light and dark. */
export const palettes = {
  light: {
    background: '#FFFFFF',
    surface: '#F5F9FF',
    border: '#D0E2F7',
    text: '#0B1F33',
    muted: '#5A6B80',
    accent: '#0071E3',
    accentText: '#FFFFFF',
    chip: '#EAF4FF',
    chipText: '#0058D4',
  },
  dark: {
    background: '#0D1117',
    surface: '#0B1626',
    border: '#1C3557',
    text: '#E6EDF3',
    muted: '#8FA3BC',
    accent: '#0A84FF',
    accentText: '#FFFFFF',
    chip: '#0B2E5C',
    chipText: '#64D2FF',
  },
} as const;

export type Palette = (typeof palettes)[keyof typeof palettes];
