import { alpha, createTheme } from '@mui/material/styles'
import { getBrandColors } from '@/core/constants/colors'

const DISPLAY = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

export const getTheme = (mode = 'light') => {
  const colors = getBrandColors(mode)
  const isLight = mode === 'light'
  const softBorder = isLight ? 'rgba(23, 35, 55, 0.08)' : 'rgba(255, 255, 255, 0.09)'
  const elevatedShadow = isLight
    ? '0 24px 60px -18px rgba(23, 35, 55, 0.22)'
    : '0 18px 50px rgba(0, 0, 0, 0.34)'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: colors.primary.main,
        light: colors.primary.light,
        dark: colors.primary.dark,
        contrastText: colors.primary.contrast,
        50: colors.primary.subtle,
      },
      secondary: {
        main: colors.secondary.main,
        light: colors.secondary.light,
        dark: colors.secondary.dark,
        contrastText: colors.secondary.contrast,
      },
      success: { main: '#22A06B', light: '#4FC38D', dark: '#147D54' },
      warning: { main: '#F0A202', light: '#FFC247', dark: '#C47F00' },
      info: { main: '#3972E6', light: '#6B96EE', dark: '#2457B8' },
      error: { main: '#E5484D', light: '#EC6F73', dark: '#B92D33' },
      background: {
        default: isLight ? '#F1F3F6' : '#0F1523',
        paper: isLight ? '#FFFFFF' : '#161E2E',
      },
      text: {
        primary: colors.text.primary,
        secondary: colors.text.secondary,
        disabled: colors.text.disabled,
      },
      divider: softBorder,
      grey: isLight
        ? {
            50: '#F8F9F6',
            100: '#F0F2EC',
            200: '#E2E5DD',
            300: '#CED2C7',
            400: '#9EA59A',
            500: '#737A70',
            600: '#555C52',
            700: '#3D433A',
            800: '#272C25',
            900: '#161E2E',
          }
        : {
            50: '#161E2E',
            100: '#1D2739',
            200: '#292E26',
            300: '#3B4237',
            400: '#555D50',
            500: '#788174',
            600: '#9EA69A',
            700: '#C8CEC3',
            800: '#E4E8E0',
            900: '#F5F7F2',
          },
      custom: {
        sidebar: '#172337',
        sidebarText: '#EEF2F8',
        sidebarActive: colors.accent.main,
        sidebarActiveText: '#172337',
        sidebarHover: 'rgba(255, 255, 255, 0.065)',
        accent: colors.accent.main,
        accentLight: colors.accent.light,
        accentDark: colors.accent.dark,
        black: colors.black.main,
        softBorder,
        elevatedShadow,
        glass: isLight ? 'rgba(255, 255, 255, 0.78)' : 'rgba(22, 30, 46, 0.82)',
        mutedSurface: isLight ? '#F5F7FA' : '#1D2739',
        heroGradient: isLight
          ? 'linear-gradient(125deg, #172337 0%, #1C5FD6 60%, #2874F0 120%)'
          : 'linear-gradient(125deg, #172337 0%, #1E2D45 60%, #1C5FD6 120%)',
      },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 13,
      h1: { fontFamily: DISPLAY, fontWeight: 700, letterSpacing: '-0.04em' },
      h2: { fontFamily: DISPLAY, fontWeight: 700, letterSpacing: '-0.035em' },
      h3: { fontFamily: DISPLAY, fontWeight: 700, letterSpacing: '-0.03em' },
      h4: { fontFamily: DISPLAY, fontWeight: 700, fontSize: '1.6rem', letterSpacing: '-0.03em' },
      h5: { fontFamily: DISPLAY, fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.025em' },
      h6: { fontFamily: DISPLAY, fontWeight: 650, fontSize: '1.02rem', letterSpacing: '-0.015em' },
      subtitle1: { fontWeight: 700, fontSize: '0.9rem' },
      subtitle2: { fontWeight: 650, fontSize: '0.8rem' },
      body1: { fontSize: '0.875rem', lineHeight: 1.65 },
      body2: { fontSize: '0.8rem', lineHeight: 1.6 },
      caption: { fontSize: '0.7rem', lineHeight: 1.5 },
      button: {
        fontWeight: 700,
        fontSize: '0.78rem',
        textTransform: 'none',
        letterSpacing: '-0.01em',
      },
    },
    shadows: [
      'none',
      isLight ? '0 2px 5px rgba(23, 35, 55, 0.04)' : '0 2px 5px rgba(0, 0, 0, 0.2)',
      isLight ? '0 8px 24px rgba(23, 35, 55, 0.06)' : '0 8px 24px rgba(0, 0, 0, 0.28)',
      elevatedShadow,
      ...Array(21).fill(elevatedShadow),
    ],
    transitions: {
      easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
        easeIn: 'cubic-bezier(0.7, 0, 0.84, 0)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
      duration: {
        shortest: 120,
        shorter: 180,
        short: 240,
        standard: 320,
        complex: 450,
        enteringScreen: 360,
        leavingScreen: 240,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: `${alpha(colors.accent.main, 0.5)} transparent`,
            backgroundColor: isLight ? '#F1F3F6' : '#0F1523',
          },
          '::selection': {
            backgroundColor: alpha(colors.accent.main, 0.45),
            color: isLight ? '#172337' : '#FFFFFF',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            color: colors.text.primary,
            backgroundColor: isLight ? 'rgba(255, 255, 255, 0.76)' : 'rgba(15, 21, 35, 0.76)',
            backgroundImage: 'none',
            borderBottom: `1px solid ${softBorder}`,
            boxShadow: 'none',
            backdropFilter: 'blur(18px) saturate(140%)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            color: colors.text.primary,
            backgroundColor: isLight ? '#FFFFFF' : '#161E2E',
            backgroundImage: 'none',
            borderRight: `1px solid ${softBorder}`,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: isLight ? '#FFFFFF' : '#161E2E',
            backgroundImage: isLight
              ? 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(250,251,248,0.92))'
              : 'linear-gradient(145deg, rgba(26,34,52,0.98), rgba(20,28,44,0.96))',
            border: `1px solid ${softBorder}`,
            borderRadius: 20,
            boxShadow: isLight
              ? '0 1px 2px rgba(23, 35, 55, 0.04), 0 8px 24px -10px rgba(23, 35, 55, 0.12)'
              : '0 8px 28px rgba(0, 0, 0, 0.24)',
            transition:
              'transform 260ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 260ms ease, border-color 260ms ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          outlined: { borderColor: softBorder },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            minHeight: 40,
            borderRadius: 12,
            padding: '8px 16px',
            boxShadow: 'none',
            transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: isLight ? '0 6px 16px rgba(23,35,55,.1)' : '0 6px 16px rgba(0,0,0,.26)',
            },
            '&:active': { transform: 'translateY(0) scale(0.98)' },
          },
          containedPrimary: {
            color: '#172337',
            backgroundColor: colors.accent.main,
            backgroundImage: 'none',
            '&:hover': {
              color: '#172337',
              backgroundColor: colors.accent.dark,
            },
            '&.Mui-disabled': {
              color: alpha('#172337', 0.48),
              backgroundColor: alpha(colors.accent.main, 0.42),
            },
          },
          outlined: {
            borderColor: softBorder,
            backgroundColor: isLight ? '#FFFFFF' : alpha('#FFFFFF', 0.025),
            '&:hover': { borderColor: alpha(colors.text.primary, 0.28) },
          },
          text: {
            '&:hover': { boxShadow: 'none', backgroundColor: alpha(colors.text.primary, 0.055) },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'transform 180ms ease, background-color 180ms ease, color 180ms ease',
            '&:hover': { transform: 'translateY(-1px)' },
            '&:active': { transform: 'scale(0.94)' },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: isLight ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.025)',
            transition: 'box-shadow 180ms ease, background-color 180ms ease',
            '&:hover': { backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,.045)' },
            '&.Mui-focused': { boxShadow: `0 0 0 4px ${alpha(colors.accent.main, 0.14)}` },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: softBorder },
          },
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? 'rgba(23, 35, 55, 0.42)' : 'rgba(0, 0, 0, 0.68)',
            backdropFilter: 'blur(3px)',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 22,
            color: colors.text.primary,
            backgroundColor: isLight ? '#FFFFFF' : '#161E2E',
            backgroundImage: 'none',
            border: `1px solid ${softBorder}`,
            boxShadow: elevatedShadow,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            padding: '18px 20px 14px',
            color: colors.text.primary,
            backgroundColor: isLight ? '#FFFFFF' : '#161E2E',
            fontSize: '1rem',
            fontWeight: 800,
            borderBottom: `1px solid ${softBorder}`,
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: '20px',
            color: colors.text.primary,
            backgroundColor: isLight ? '#FFFFFF' : '#161E2E',
            borderColor: `${softBorder} !important`,
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            gap: 8,
            padding: '14px 20px 18px',
            backgroundColor: isLight ? '#F7F8F5' : '#1D2739',
            borderTop: `1px solid ${softBorder}`,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            marginTop: 8,
            borderRadius: 10,
            border: `1px solid ${softBorder}`,
            boxShadow: elevatedShadow,
          },
          list: { padding: 6 },
        },
      },
      MuiMenuItem: {
        styleOverrides: { root: { minHeight: 40, borderRadius: 8, marginBlock: 2 } },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              color: colors.text.secondary,
              backgroundColor: isLight ? '#F5F7F2' : '#1D2739',
              fontWeight: 750,
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              letterSpacing: '0.075em',
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 160ms ease, transform 160ms ease',
            '&:hover': { backgroundColor: alpha(colors.accent.main, isLight ? 0.07 : 0.055) },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { height: 28, borderRadius: 7, fontWeight: 700 },
          outlined: { borderColor: softBorder },
        },
      },
      MuiAlert: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { borderRadius: 7, padding: '7px 10px', fontWeight: 650 },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { height: 7, borderRadius: 999 },
          bar: { borderRadius: 999, transition: 'transform 700ms cubic-bezier(0.16, 1, 0.3, 1)' },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px !important',
            border: '0 !important',
            fontWeight: 700,
            color: colors.text.secondary,
            backgroundColor: 'transparent',
            '&:hover': {
              color: colors.text.primary,
              backgroundColor: alpha(colors.text.primary, isLight ? 0.05 : 0.08),
            },
            '&.Mui-selected': {
              color: '#172337',
              backgroundColor: `${colors.accent.main} !important`,
              boxShadow: `0 6px 16px ${alpha(colors.accent.main, 0.26)}`,
              '&:hover': { backgroundColor: `${colors.accent.dark} !important` },
            },
          },
        },
      },
    },
  })
}

export default getTheme
