import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useUser } from '@clerk/clerk-react';

/**
 * Theme options
 */
export type Theme = 'light' | 'dark';

/**
 * User role types
 */
export type UserRole = 'manager' | 'cashier' | 'employee' | 'customer';

/**
 * Role to theme mapping configuration
 * Maps each role to its default theme
 */
const ROLE_THEME_MAP: Record<UserRole, Theme> = {
  manager: 'dark',
  cashier: 'light',
  employee: 'light',
  customer: 'light',
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  role: UserRole | null;
  isAutoTheme: boolean;
  toggleAutoTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Get user role from Clerk user metadata
 * Checks publicMetadata.role first, then falls back to organization roles
 */
function getUserRole(user: ReturnType<typeof useUser>['user']): UserRole | null {
  if (!user) return null;

  // Check publicMetadata for role
  const roleFromMetadata = user.publicMetadata?.role as string;
  if (roleFromMetadata && Object.keys(ROLE_THEME_MAP).includes(roleFromMetadata)) {
    return roleFromMetadata as UserRole;
  }

  // Check organization memberships for role
  if (user.organizationMemberships && user.organizationMemberships.length > 0) {
    const orgRole = user.organizationMemberships[0].role;
    if (orgRole && Object.keys(ROLE_THEME_MAP).includes(orgRole)) {
      return orgRole as UserRole;
    }
  }

  // Default to employee if no role found
  return 'employee';
}

/**
 * Theme Provider component
 * Manages theme state based on user role with optional manual override
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const [isAutoTheme, setIsAutoTheme] = useState<boolean>(() => {
    // Load auto theme preference from localStorage
    const saved = localStorage.getItem('autoTheme');
    return saved !== null ? saved === 'true' : true;
  });
  const [manualTheme, setManualTheme] = useState<Theme | null>(() => {
    // Load manual theme override from localStorage
    const saved = localStorage.getItem('manualTheme');
    return (saved as Theme) || null;
  });

  // Get user role
  const role = isLoaded && user ? getUserRole(user) : null;

  // Determine current theme
  const theme: Theme = (() => {
    // If manual override exists and auto theme is disabled, use manual theme
    if (!isAutoTheme && manualTheme) {
      return manualTheme;
    }
    // Otherwise, use role-based theme
    if (role && ROLE_THEME_MAP[role]) {
      return ROLE_THEME_MAP[role];
    }
    // Default to light theme
    return 'light';
  })();

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Update theme when role changes (if auto theme is enabled)
  useEffect(() => {
    if (isAutoTheme && role && ROLE_THEME_MAP[role]) {
      // Theme will be automatically set by the theme calculation above
      // Clear manual override when switching to auto
      if (manualTheme) {
        setManualTheme(null);
        localStorage.removeItem('manualTheme');
      }
    }
  }, [role, isAutoTheme, manualTheme]);

  const setTheme = (newTheme: Theme) => {
    setManualTheme(newTheme);
    setIsAutoTheme(false);
    localStorage.setItem('manualTheme', newTheme);
    localStorage.setItem('autoTheme', 'false');
  };

  const toggleAutoTheme = () => {
    const newAutoTheme = !isAutoTheme;
    setIsAutoTheme(newAutoTheme);
    localStorage.setItem('autoTheme', String(newAutoTheme));
    if (newAutoTheme) {
      // Clear manual override when enabling auto theme
      setManualTheme(null);
      localStorage.removeItem('manualTheme');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        role,
        isAutoTheme,
        toggleAutoTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * @throws Error if used outside ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

