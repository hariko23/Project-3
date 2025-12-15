import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

/**
 * Text size options for accessibility
 */
export type TextSize = 'normal' | 'large' | 'xlarge';

interface AccessibilityContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  getTextSizeClass: (baseClass?: string) => string;
  isHighContrast: boolean;
  setIsHighContrast: (enabled: boolean) => void;
}

export const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

/**
 * Accessibility Provider component
 * Manages text size state for accessibility features
 */
export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [textSize, setTextSize] = useState<TextSize>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('textSize');
    return (saved as TextSize) || 'normal';
  });

  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('isHighContrast');
    return saved === 'true';
  });

  // Apply text size class to body element
  useEffect(() => {
    document.body.classList.remove('accessibility-large', 'accessibility-xlarge');
    if (textSize === 'large') {
      document.body.classList.add('accessibility-large');
    } else if (textSize === 'xlarge') {
      document.body.classList.add('accessibility-xlarge');
    }
  }, [textSize]);

  // Apply high contrast mode
  useEffect(() => {
    if (isHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    localStorage.setItem('isHighContrast', isHighContrast.toString());
  }, [isHighContrast]);

  const updateTextSize = (size: TextSize) => {
    setTextSize(size);
    localStorage.setItem('textSize', size);
  };

  /**
   * Get text size class based on current text size setting
   * @param baseClass - Optional base class to apply
   * @returns Combined class string with text size modifier
   */
  const getTextSizeClass = (baseClass: string = '') => {
    const sizeClasses = {
      normal: '',
      large: 'text-lg',
      xlarge: 'text-xl'
    };
    
    const sizeClass = sizeClasses[textSize];
    return baseClass ? `${baseClass} ${sizeClass}` : sizeClass;
  };

  return (
    <AccessibilityContext.Provider value={{ 
      textSize, 
      setTextSize: updateTextSize, 
      getTextSizeClass, 
      isHighContrast, 
      setIsHighContrast 
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

/**
 * Hook to access accessibility context
 * @throws Error if used outside AccessibilityProvider
 */
export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

