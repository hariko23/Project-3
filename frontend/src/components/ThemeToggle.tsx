import { useTheme } from '../contexts/ThemeContext';
import Button from './ui/Button';

/**
 * Theme Toggle component
 * Allows users to manually toggle between light and dark themes
 * Shows current theme and role-based auto theme status
 */
function ThemeToggle() {
  const { theme, setTheme, role, isAutoTheme, toggleAutoTheme } = useTheme();

  return (
    <div className="flex items-center gap-1">
      <Button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        variant="outline"
        size="sm"
        className="px-2"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </Button>
      <Button
        onClick={toggleAutoTheme}
        variant={isAutoTheme ? 'default' : 'outline'}
        size="sm"
        className="px-2 text-xs"
        title={isAutoTheme ? 'Disable auto theme (role-based)' : 'Enable auto theme (role-based)'}
      >
        {isAutoTheme ? 'Auto' : 'Manual'}
      </Button>
      {role && (
        <span className="text-xs text-muted-foreground px-2" title={`Current role: ${role}`}>
          {role}
        </span>
      )}
    </div>
  );
}

export default ThemeToggle;

