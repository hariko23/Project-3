import { useState, useEffect } from 'react';

/**
 * Language Toggle Component
 * Displays a button that toggles between English and Spanish
 */
function Translator() {
  const [currentLang, setCurrentLang] = useState<'en' | 'es'>('en');

  useEffect(() => {
    // Check current language from URL hash or cookie
    const checkLanguage = () => {
      const hash = window.location.hash;
      const cookie = document.cookie;
      
      if (hash.includes('/es/') || cookie.includes('googtrans=/en/es')) {
        setCurrentLang('es');
      } else {
        setCurrentLang('en');
      }
    };

    checkLanguage();
    
    // Check periodically for language changes
    const interval = setInterval(checkLanguage, 500);
    return () => clearInterval(interval);
  }, []);

  const toggleLanguage = () => {
    if (currentLang === 'en') {
      // Switch to Spanish
      setCookie('googtrans', '/en/es');
      window.location.reload();
    } else {
      // Switch to English
      deleteCookie('googtrans');
      const url = window.location.href.split('#')[0];
      window.location.href = url;
      window.location.reload();
    }
  };

  const setCookie = (name: string, value: string) => {
    document.cookie = `${name}=${value}; path=/`;
  };

  const deleteCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors notranslate"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" 
        />
      </svg>
      <span className="notranslate">{currentLang === 'en' ? 'Español' : 'English'}</span>
    </button>
  );
}

export default Translator;
