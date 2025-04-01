// Export tất cả contexts và providers từ một file
import AuthContext, { AuthProvider } from './AuthContext';
import NotificationContext, { NotificationProvider } from './NotificationContext';
import ThemeContext, { ThemeProvider } from './ThemeContext';
import VMContext, { VMProvider } from './VMContext';
import SettingsContext, { SettingsProvider } from './SettingsContext';
import TerminalContext, { TerminalProvider } from './TerminalContext';

// Tạo một component bao bọc tất cả providers
export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider>
          <SettingsProvider>
            <VMProvider>
              <TerminalProvider>
                {children}
              </TerminalProvider>
            </VMProvider>
          </SettingsProvider>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

// Export tất cả contexts để có thể import riêng lẻ
export {
  AuthContext,
  AuthProvider,
  NotificationContext,
  NotificationProvider,
  ThemeContext,
  ThemeProvider,
  VMContext,
  VMProvider,
  SettingsContext,
  SettingsProvider,
  TerminalContext,
  TerminalProvider
};