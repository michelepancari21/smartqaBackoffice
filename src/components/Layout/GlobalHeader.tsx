import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  FolderOpen,
  FileText,
  Settings,
  BookOpen,
  Hexagon,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';
import ThemeToggle from '../UI/ThemeToggle';
import NotificationsBell from './NotificationsBell';

const GlobalHeader: React.FC = () => {
  const { state, logout } = useAuth();
  const { hasAnyPermission } = usePermissions();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/overview', icon: LayoutGrid, label: 'Overview', permissions: [PERMISSIONS.ADMIN_PANEL.READ] },
    { path: '/projects', icon: FolderOpen, label: 'Projects', permissions: [] },
    { path: '/test-plans', icon: FileText, label: 'Templates', permissions: [PERMISSIONS.TEST_PLAN.READ] },
    { path: '/settings', icon: Settings, label: 'Settings', permissions: [PERMISSIONS.ADMIN_PANEL.READ] },
    { path: '/reports', icon: BookOpen, label: 'Documentation', permissions: [] },
  ];

  const visibleNavItems = navItems.filter(
    (item) => item.permissions.length === 0 || hasAnyPermission(item.permissions)
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-slate-200 via-purple-100 to-slate-200 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 border-b border-purple-300/30 dark:border-purple-500/20 shadow-2xl">
      <div className="flex items-center justify-between h-14 px-6">
        {/* Left: Logo */}
        <Link
          to="/projects"
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity shrink-0 group"
        >
          <div className="relative">
            <Hexagon className="w-8 h-8 text-cyan-600 dark:text-cyan-400 fill-cyan-600/20 dark:fill-cyan-400/20 group-hover:text-cyan-500 dark:group-hover:text-cyan-300 transition-colors" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-600 dark:from-cyan-400 dark:to-purple-500 opacity-20 rounded-lg blur-sm group-hover:opacity-30 transition-opacity"></div>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 dark:from-cyan-400 dark:to-purple-400 bg-clip-text text-transparent group-hover:from-cyan-500 group-hover:to-purple-500 dark:group-hover:from-cyan-300 dark:group-hover:to-purple-300 transition-all">
            SMARTQA
          </span>
        </Link>

        {/* Center: Navigation */}
        <nav className="flex items-center space-x-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-200/60 dark:bg-white/15 text-purple-900 dark:text-white border border-purple-300/50 dark:border-white/10 shadow-sm'
                    : 'text-slate-600 dark:text-purple-200 hover:text-purple-900 dark:hover:text-white hover:bg-purple-100/50 dark:hover:bg-white/10'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center space-x-4 shrink-0">
          <ThemeToggle />
          <NotificationsBell />

          <div className="flex items-center space-x-2 pl-3 border-l border-purple-300/30 dark:border-white/10">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-600 to-purple-600 dark:from-cyan-400 dark:to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-white max-w-[140px] truncate">
              {state.user?.name || 'User'}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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

export default GlobalHeader;
