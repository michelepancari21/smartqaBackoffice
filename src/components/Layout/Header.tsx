import React from 'react';
import { User, Hexagon, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../UI/ThemeToggle';
import NotificationsBell from './NotificationsBell';
import HeaderNav from './HeaderNav';

const Header: React.FC = () => {
  const { state, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-30">
      {/* Top bar: logo + user controls */}
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <Link
            to="/projects"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity group"
            title="Go to projects"
          >
            <div className="relative">
              <Hexagon className="w-7 h-7 text-cyan-600 dark:text-cyan-400 fill-cyan-600/20 dark:fill-cyan-400/20 group-hover:text-cyan-500 dark:group-hover:text-cyan-300 transition-colors" />
            </div>
            <span className="text-xl font-bold text-cyan-600 dark:text-cyan-400 group-hover:text-cyan-500 dark:group-hover:text-cyan-300 transition-colors">
              SMARTQA
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <NotificationsBell />
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-600"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-600 dark:from-cyan-400 dark:to-teal-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-900 dark:text-white leading-tight">
                  {state.user?.name || 'User'}
                </span>
                <span className="text-xs text-slate-500 dark:text-gray-400 leading-tight">
                  {state.user?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <HeaderNav />
    </header>
  );
};

export default Header;
