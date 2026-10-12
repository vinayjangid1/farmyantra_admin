/**
 * FarmYantra brand design tokens (same structure as the Raddiwalla admin).
 *
 * Primary: #1F4D2B (field green) — buttons, headers, active states.
 * Accent: #E8A317 (harvest amber) — highlights only (badges, indicators).
 *
 * This is the SINGLE SOURCE OF TRUTH for all colors in the admin panel.
 */
export const brandColors = {
  light: {
    primary: {
      main: '#1F4D2B',
      light: '#2F6B3A',
      dark: '#12301B',
      contrast: '#FFFFFF',
      subtle: 'rgba(31, 77, 43, 0.07)',
    },
    secondary: {
      main: '#6B7280',
      light: '#9CA3AF',
      dark: '#4B5563',
      contrast: '#FFFFFF',
    },
    accent: {
      main: '#E8A317',
      light: '#F2C15B',
      dark: '#C98A0C',
      contrast: '#000000',
    },
    black: {
      main: '#1C1C1E',
      light: '#2C2C2E',
      muted: '#6B7280',
      contrast: '#FFFFFF',
    },
    background: {
      default: '#F6F4EE',
      paper: '#FFFFFF',
      elevated: '#FFFFFF',
    },
    text: {
      primary: '#1C1C1E',
      secondary: '#6B7280',
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
      main: '#FFFFFF',
      light: '#F5F5F7',
      dark: '#E5E5EA',
      contrast: '#000000',
      subtle: 'rgba(255, 255, 255, 0.08)',
    },
    secondary: {
      main: '#8E8E93',
      light: '#AEAEB2',
      dark: '#636366',
      contrast: '#000000',
    },
    accent: {
      main: '#E8A317',
      light: '#F2C15B',
      dark: '#C98A0C',
      contrast: '#000000',
    },
    black: {
      main: '#000000',
      light: '#1C1C1E',
      muted: '#8E8E93',
      contrast: '#FFFFFF',
    },
    background: {
      default: '#000000',
      paper: '#1C1C1E',
      elevated: '#2C2C2E',
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
