import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  LayoutGrid,
  TestTube,
  Play,
  Calendar,
  BarChart3,
  Settings,
  Layers,
  ChevronDown,
  Loader,
  Search,
  X,
  FolderOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { projectsApiService } from '../../services/projectsApi';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';
import { Project } from '../../types';

const HeaderNav: React.FC = () => {
  const { state, dispatch, getSelectedProject, loadProjects } = useApp();
  const { state: authState } = useAuth();
  const { hasAnyPermission } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreProjects, setHasMoreProjects] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const allNavItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      permissions: [PERMISSIONS.TEST_CASE.READ, PERMISSIONS.TEST_RUN.READ]
    },
    {
      path: '/test-cases',
      icon: TestTube,
      label: 'Test Cases',
      permissions: [PERMISSIONS.TEST_CASE.READ]
    },
    {
      path: '/shared-steps',
      icon: Layers,
      label: 'Shared Steps',
      permissions: [PERMISSIONS.SHARED_STEP.READ]
    },
    {
      path: '/test-runs',
      icon: Play,
      label: 'Test Runs',
      permissions: [PERMISSIONS.TEST_RUN.READ]
    },
    {
      path: '/test-plans',
      icon: Calendar,
      label: 'Test Plans',
      permissions: [PERMISSIONS.TEST_PLAN.READ]
    },
    {
      path: '/reports',
      icon: BarChart3,
      label: 'Reports',
      permissions: [PERMISSIONS.TEST_RUN.READ]
    },
    {
      path: '/overview',
      icon: LayoutGrid,
      label: 'Overview',
      permissions: [PERMISSIONS.ADMIN_PANEL.READ]
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      permissions: [PERMISSIONS.ADMIN_PANEL.READ]
    }
  ];

  const navItems = allNavItems.filter(item =>
    item.permissions.length === 0 || hasAnyPermission(item.permissions)
  );

  const projectsToShow = allProjects.length > 0 ? allProjects : state.projects;

  const filteredProjects = projectsToShow
    .filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const searchProjects = useCallback(async (term: string) => {
    if (!term.trim()) {
      setAllProjects([]);
      return;
    }

    if (term.length < 3 || state.projects.length < 100) {
      return;
    }

    try {
      setIsSearching(true);
      const firstPageResponse = await projectsApiService.getProjectsForSidebarPage(1, term);
      const totalItems = firstPageResponse.meta.totalItems;

      if (totalItems === 0) {
        setAllProjects([]);
        return;
      }

      const searchResults = firstPageResponse.data.map(project =>
        projectsApiService.transformApiProject(project)
      );
      setAllProjects(searchResults);
    } catch (error) {
      console.error('Failed to search projects:', error);
      setAllProjects([]);
    } finally {
      setIsSearching(false);
    }
  }, [state.projects.length]);

  const loadMoreProjects = useCallback(async () => {
    if (isLoadingMore || !hasMoreProjects || searchTerm) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;

      const response = await projectsApiService.getProjectsForSidebarPage(nextPage);
      const newProjects = response.data.map(project =>
        projectsApiService.transformApiProject(project)
      );

      setAllProjects(prev => [...prev, ...newProjects]);
      setCurrentPage(nextPage);
      setHasMoreProjects(newProjects.length === response.meta.itemsPerPage);
    } catch (error) {
      console.error('Failed to load more projects:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreProjects, currentPage, searchTerm]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;

    if (bottom && hasMoreProjects && !isLoadingMore && !searchTerm) {
      loadMoreProjects();
    }
  }, [hasMoreProjects, isLoadingMore, searchTerm, loadMoreProjects]);

  const handleProjectSelect = (value: string) => {
    setIsDropdownOpen(false);
    setSearchTerm('');

    if (value === 'all') {
      dispatch({ type: 'SET_SELECTED_PROJECT_ID', payload: null });
      navigate('/projects');
    } else {
      dispatch({ type: 'SET_SELECTED_PROJECT_ID', payload: value });

      const selectedProject = allProjects.find(p => p.id === value);
      if (selectedProject) {
        dispatch({ type: 'UPDATE_PROJECT', payload: selectedProject });
      }

      navigate('/dashboard');
    }
  };

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchProjects(value);
    }, 300);
  }, [searchProjects]);

  const clearSearch = () => {
    setSearchTerm('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    setAllProjects([]);
  };

  const handleDropdownClose = () => {
    setIsDropdownOpen(false);
    setSearchTerm('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    setAllProjects([]);
    setCurrentPage(1);
    setHasMoreProjects(false);
    setIsLoadingMore(false);
  };

  const getSelectedProjectName = () => {
    if (location.pathname === '/projects') {
      return 'All Projects';
    }

    const selectedProject = getSelectedProject();
    if (selectedProject) {
      return selectedProject.name;
    }

    if (state.isLoadingProjects) {
      return 'Loading...';
    }

    if (state.projects.length === 0) {
      return 'No projects';
    }

    return 'Select Project';
  };

  useEffect(() => {
    if (state.projects.length === 0 && !state.isLoadingProjects && authState.isAuthenticated && location.pathname !== '/projects') {
      loadProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.projects.length, state.isLoadingProjects, authState.isAuthenticated, location.pathname]);

  useEffect(() => {
    if (state.projects.length > 0 && allProjects.length > 0 && state.projects.length !== allProjects.length) {
      setAllProjects([]);
    }
  }, [state.projects.length, allProjects.length]);

  useEffect(() => {
    const initializeDropdown = async () => {
      if (!isDropdownOpen || searchTerm || allProjects.length > 0) {
        return;
      }

      try {
        const { projects, meta } = await projectsApiService.getProjectsForSidebar();
        setAllProjects(projects);
        setTotalProjects(meta.totalItems);
        setCurrentPage(meta.currentPage);
        setHasMoreProjects(projects.length < meta.totalItems);
      } catch (error) {
        console.error('Failed to initialize dropdown:', error);
      }
    };

    initializeDropdown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDropdownOpen, searchTerm]);

  return (
    <div className="border-t border-slate-300/30 dark:border-slate-700/50">
      <div className="px-6">
        <div className="flex items-center gap-1">
          {/* Project Selector */}
          <div className="relative mr-2">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                location.pathname === '/projects'
                  ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-500'
              }`}
              disabled={state.isLoadingProjects}
            >
              <FolderOpen className="w-4 h-4" />
              <span className="max-w-[140px] truncate">{getSelectedProjectName()}</span>
              {state.isLoadingProjects ? (
                <Loader className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              )}
            </button>

            {isDropdownOpen && (
              <div
                ref={dropdownRef}
                onScroll={handleScroll}
                className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto"
              >
                <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-400 w-4 h-4" />
                    {isSearching && (
                      <Loader className="absolute right-8 top-1/2 transform -translate-y-1/2 text-cyan-600 dark:text-cyan-400 w-4 h-4 animate-spin" />
                    )}
                    <input
                      type="text"
                      placeholder="Search all projects..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-8 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-transparent"
                      autoFocus
                    />
                    {searchTerm && (
                      <button
                        onClick={clearSearch}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => handleProjectSelect('all')}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-200 dark:border-slate-700 ${
                      location.pathname === '/projects'
                        ? 'bg-slate-100 dark:bg-slate-700 text-cyan-600 dark:text-cyan-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    View all projects
                  </button>

                  {filteredProjects.length > 0 && (
                    <>
                      {searchTerm && (
                        <div className="px-4 py-2 text-xs text-cyan-600 dark:text-cyan-400 bg-slate-50 dark:bg-slate-700/50">
                          {isSearching ? 'Searching...' : `Found ${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''}`}
                        </div>
                      )}

                      {filteredProjects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => handleProjectSelect(project.id)}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors truncate ${
                            state.selectedProjectId === project.id
                              ? 'bg-slate-100 dark:bg-slate-700 text-cyan-600 dark:text-cyan-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                          title={project.name}
                        >
                          {state.selectedProjectId === project.id && (
                            <span className="text-cyan-500 mr-1.5">&#10003;</span>
                          )}
                          {project.name}
                        </button>
                      ))}
                    </>
                  )}

                  {allProjects.length === 0 && !searchTerm && !isSearching && (
                    <div className="px-4 py-3 text-slate-500 dark:text-gray-400 text-sm">
                      No projects available
                    </div>
                  )}

                  {filteredProjects.length === 0 && searchTerm && !isSearching && (
                    <div className="px-4 py-3 text-slate-500 dark:text-gray-400 text-sm">
                      No projects found matching "{searchTerm}"
                    </div>
                  )}

                  {isSearching && (
                    <div className="px-4 py-3 text-slate-500 dark:text-gray-400 text-sm flex items-center">
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Searching projects...
                    </div>
                  )}

                  {isLoadingMore && !searchTerm && (
                    <div className="px-4 py-3 text-slate-500 dark:text-gray-400 text-sm flex items-center justify-center border-t border-slate-200 dark:border-slate-700">
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Loading more...
                    </div>
                  )}

                  {!searchTerm && !isSearching && !isLoadingMore && allProjects.length > 0 && (
                    <div className="px-4 py-2 text-xs text-slate-400 dark:text-gray-500 text-center border-t border-slate-200 dark:border-slate-700">
                      {hasMoreProjects ? (
                        <>Showing {allProjects.length} of {totalProjects} - Scroll for more</>
                      ) : (
                        <>All {allProjects.length} projects loaded</>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {isDropdownOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={handleDropdownClose}
              />
            )}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-slate-300/50 dark:bg-slate-600/50 mr-1"></div>

          {/* Navigation Items */}
          {navItems.map((item) => (
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
                `flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-500'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeaderNav;
