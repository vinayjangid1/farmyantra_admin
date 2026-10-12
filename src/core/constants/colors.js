/**
 * FarmYantra brand design tokens (same structure as the Raddiwalla admin).
 *
 * Primary: #2874F0 (marketplace blue) — buttons, headers, active states.
 * Accent: #FFE11B (sunflower yellow) — highlights, active nav, primary CTAs.
 * Sidebar: #172337 (deep navy). Matches the storefront palette.
 *
 * This is the SINGLE SOURCE OF TRUTH for all colors in the admin panel.
 */
export const brandColors = {
  light: {
    primary: {
      main: '#2874F0',
      light: '#4F8FF7',
      dark: '#1C5FD6',
      contrast: '#FFFFFF',
      subtle: 'rgba(40, 116, 240, 0.08)',
    },
    secondary: {
      main: '#6B7280',
      light: '#9CA3AF',
      dark: '#4B5563',
      contrast: '#FFFFFF',
    },
    accent: {
      main: '#FFE11B',
      light: '#FFEB6B',
      dark: '#F0B400',
      contrast: '#000000',
    },
    black: {
      main: '#212121',
      light: '#2D3748',
      muted: '#616161',
      contrast: '#FFFFFF',
    },
    background: {
      default: '#F1F3F6',
      paper: '#FFFFFF',
      elevated: '#FFFFFF',
    },
    text: {
      primary: '#212121',
      secondary: '#616161',
      disabled: '#A3A3A3',
    },
    divider: '#E5E5EA',
    sidebar: '#FFFFFF',
    sidebarText: '#1C1C1E',
    sidebarActive: '#1C1C1E',
    sidebarActiveText: '#FFFFFF',
    sidebarHover: 'rgba(0, 0, 0, 0.04)',
  },
  dark: {
    primary: {
      main: '#5AA2FF',
      light: '#82BAFF',
      dark: '#4F8FF7',
      contrast: '#172337',
      subtle: 'rgba(90, 162, 255, 0.12)',
    },
    secondary: {
      main: '#8E8E93',
      light: '#AEAEB2',
      dark: '#636366',
      contrast: '#000000',
    },
    accent: {
      main: '#FFE11B',
      light: '#FFEB6B',
      dark: '#F0B400',
      contrast: '#000000',
    },
    black: {
      main: '#000000',
      light: '#1C1C1E',
      muted: '#8E8E93',
      contrast: '#FFFFFF',
    },
    background: {
      default: '#0F1523',
      paper: '#161E2E',
      elevated: '#1D2739',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#8E8E93',
      disabled: '#636366',
    },
    divider: 'rgba(255, 255, 255, 0.1)',
    sidebar: '#1C1C1E',
    sidebarText: '#FFFFFF',
    sidebarActive: '#FFFFFF',
    sidebarActiveText: '#000000',
    sidebarHover: 'rgba(255, 255, 255, 0.06)',
  },
}

export const getBrandColors = (mode = 'light') => brandColors[mode] || brandColors.light
