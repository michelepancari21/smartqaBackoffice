import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  FolderOpen,
  LayoutTemplate,
  Settings,
  HelpCircle
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

const HeaderNav: React.FC = () => {
  const { hasAnyPermission } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      path: '/overview',
      icon: LayoutGrid,
      label: 'Overview',
      restricted: false
    },
    {
      path: '/projects',
      icon: FolderOpen,
      label: 'Projects',
      restricted: false
    },
    {
      path: '/templates',
      icon: LayoutTemplate,
      label: 'Templates',
      restricted: false
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      restricted: true,
      permissions: [PERMISSIONS.ADMIN_PANEL.READ]
    },
    {
      path: '/documentation',
      icon: HelpCircle,
      label: 'Documentation',
      restricted: false
    }
  ];

  const visibleItems = navItems.filter(item =>
    !item.restricted || (item.permissions && hasAnyPermission(item.permissions))
  );

  return (
    <nav className="flex items-center justify-center gap-1">
      {visibleItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={(e) => {
            if (location.pathname === item.path) {
              e.preventDefault();
              navigate(item.path, { replace: false, state: { timestamp: Date.now() } });
            }
          }}
          className={({ isActive }) =>
            `flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
              isActive
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-300 hover:text-white hover:border-slate-500'
            }`
          }
        >
          <item.icon className="w-4 h-4" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default HeaderNav;
