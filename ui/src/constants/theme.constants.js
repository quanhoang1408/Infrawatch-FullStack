/**
 * Constants for theme management
 */

// Theme types
export const THEME_TYPES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Local storage keys for theme settings
export const LOCAL_STORAGE_KEYS = {
  THEME: 'theme',
  THEME_PREFERENCE: 'themePreference'
};

// Default theme settings
export const DEFAULT_THEME = THEME_TYPES.LIGHT;

// Theme colors
export const THEME_COLORS = {
  LIGHT: {
    primary: '#2463EB',
    secondary: '#38BDF8',
    background: '#FFFFFF',
    surface: '#F7FAFC',
    text: '#1A202C',
    border: '#E2E8F0'
  },
  DARK: {
    primary: '#3B82F6',
    secondary: '#38BDF8',
    background: '#1A202C',
    surface: '#2D3748',
    text: '#F7FAFC',
    border: '#4A5568'
  }
};

// Theme transition duration
export const THEME_TRANSITION_DURATION = '0.3s';
