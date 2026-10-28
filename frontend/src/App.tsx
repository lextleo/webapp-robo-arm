import { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<'login' | 'dashboard'>(() => {
    if (window.location.hash === '#/login' || window.location.pathname === '/login') {
      return 'login';
    }
    return 'dashboard';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#/login') {
        setCurrentRoute('login');
      } else if (window.location.hash === '#/dashboard') {
        setCurrentRoute('dashboard');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: 'login' | 'dashboard') => {
    setCurrentRoute(route);
    window.location.hash = `#/${route}`;
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      {/* Floating View Switcher to preview both Screen 1 (/login) and Screen 2 (/dashboard) */}
      <div className="fixed bottom-3 left-3 z-50 flex items-center gap-1.5 p-1 bg-white/90 backdrop-blur-md rounded-full border border-slate-300 shadow-lg text-[11px] font-semibold">
        <button
          onClick={() => navigateTo('login')}
          className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
            currentRoute === 'login'
              ? 'bg-[#D62828] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Screen 1: Login
        </button>
        <button
          onClick={() => navigateTo('dashboard')}
          className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
            currentRoute === 'dashboard'
              ? 'bg-[#D62828] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Screen 2: Dashboard
        </button>
      </div>

      {currentRoute === 'login' ? (
        <LoginPage
          onLogin={() => navigateTo('dashboard')}
          theme={theme}
          setTheme={setTheme}
        />
      ) : (
        <DashboardPage
          theme={theme}
          setTheme={setTheme}
        />
      )}
    </div>
  );
}

export default App;
