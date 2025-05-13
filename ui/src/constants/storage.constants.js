/**
 * Constants for localStorage keys
 */

// Authentication
export const ACCESS_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';

// User preferences
export const THEME_KEY = 'theme';
export const LANGUAGE_KEY = 'language';
export const SIDEBAR_COLLAPSED_KEY = 'sidebarCollapsed';

// Settings
export const NOTIFICATION_SETTINGS_KEY = 'notificationSettings';
export const DISPLAY_SETTINGS_KEY = 'displaySettings';

// Application state
export const LAST_VISITED_VM_KEY = 'lastVisitedVM';
export const DASHBOARD_LAYOUT_KEY = 'dashboardLayout';

// Export as a group for convenience
export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: ACCESS_TOKEN_KEY,
  REFRESH_TOKEN: REFRESH_TOKEN_KEY,
  THEME: THEME_KEY,
  LANGUAGE: LANGUAGE_KEY,
  SIDEBAR_COLLAPSED: SIDEBAR_COLLAPSED_KEY,
  NOTIFICATION_SETTINGS: NOTIFICATION_SETTINGS_KEY,
  DISPLAY_SETTINGS: DISPLAY_SETTINGS_KEY,
  LAST_VISITED_VM: LAST_VISITED_VM_KEY,
  DASHBOARD_LAYOUT: DASHBOARD_LAYOUT_KEY
};
