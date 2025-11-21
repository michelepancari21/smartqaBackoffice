import React, { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeDebug: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    console.log('ThemeDebug mounted. Theme:', theme);
    console.log('HTML element classes:', document.documentElement.className);
  }, [theme]);

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-xl bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-yellow-500">
      <div className="space-y-2">
        <div className="text-sm font-mono text-gray-900 dark:text-white">
          Theme: <strong>{theme}</strong>
        </div>
        <div className="w-20 h-20 bg-red-500 dark:bg-green-500 rounded flex items-center justify-center text-white font-bold">
          {theme === 'dark' ? 'DARK' : 'LIGHT'}
        </div>
        <button
          onClick={toggleTheme}
          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white rounded"
        >
          Toggle
        </button>
        <div className="text-xs text-gray-600 dark:text-gray-300">
          Box should be red in light, green in dark
        </div>
      </div>
    </div>
  );
};

export default ThemeDebug;
