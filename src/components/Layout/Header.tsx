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
    <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-slate-600/40 dark:border-slate-700/50 shadow-lg sticky top-0 z-30">
      <div className="px-6 h-14 flex items-center">
        {/* Left: Logo */}
        <Link
          to="/projects"
          className="flex items-center space-x-2.5 hover:opacity-80 transition-opacity group shrink-0"
          title="Go to projects"
        >
          <Hexagon className="w-7 h-7 text-cyan-400 fill-cyan-400/20 group-hover:text-cyan-300 transition-colors" />
          <span className="text-lg font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors tracking-wide">
            SMARTQA
          </span>
        </Link>

        {/* Center: Navigation */}
        <div className="flex-1 flex justify-center">
          <HeaderNav />
        </div>

        {/* Right: User controls */}
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
          <NotificationsBell />
          <div className="h-5 w-px bg-slate-600/60"></div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-200 hidden lg:block max-w-[120px] truncate">
              {state.user?.name || 'User'}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-md hover:bg-slate-700/50"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
