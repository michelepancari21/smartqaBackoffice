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
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-[#1e1040] via-[#352463] to-[#1e1040] border-b border-purple-500/20 shadow-lg">
      <div className="flex items-center justify-between h-14 px-6">
        {/* Left: Logo */}
        <Link
          to="/projects"
          className="flex items-center space-x-2.5 hover:opacity-90 transition-opacity shrink-0 group"
        >
          <div className="relative">
            <Hexagon className="w-7 h-7 text-cyan-400 fill-cyan-400/20 group-hover:text-cyan-300 transition-colors" />
          </div>
          <span className="text-lg font-bold tracking-wide text-white">
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
                    ? 'bg-white/15 text-white shadow-inner'
                    : 'text-purple-200 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3 shrink-0">
          <ThemeToggle />
          <NotificationsBell />

          <div className="flex items-center space-x-2.5 pl-3 border-l border-white/10">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center ring-2 ring-white/20">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-white max-w-[120px] truncate">
              {state.user?.name || 'User'}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 text-purple-300 hover:text-red-400 transition-colors rounded-lg hover:bg-white/10"
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
