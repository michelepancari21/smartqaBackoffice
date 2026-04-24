import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Search, SquarePen, Trash2, Copy, ChevronLeft, ChevronRight,
  Loader, FolderOpen, Globe, MoreVertical, List, LayoutGrid, ChevronUp, ChevronDown
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { useTemplates } from '../hooks/useTemplates';
import { Project } from '../types';
import toast from 'react-hot-toast';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../utils/permissions';
import PermissionGuard from '../components/PermissionGuard';
import { projectsApiService } from '../services/projectsApi';

const ProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  projectData: { name: string; description: string };
  setProjectData: (data: { name: string; description: string }) => void;
  isSubmitting: boolean;
  templates?: Project[];
  selectedTemplateId?: string;
  setSelectedTemplateId?: (id: string) => void;
  templatesLoading?: boolean;
}> = ({ isOpen, onClose, onSubmit, title, projectData, setProjectData, isSubmitting, templates, selectedTemplateId, setSelectedTemplateId, templatesLoading }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const isTemplate = title.includes('Template');
  const isCreateProject = title.includes('Create') && title.includes('Project');
  const entityName = isTemplate ? 'template' : 'project';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">
            {isTemplate ? 'Template Name *' : 'Project Name *'}
          </label>
          <input
            type="text"
            value={projectData.name}
            onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
            required
            disabled={isSubmitting}
            placeholder={`Enter ${entityName} name`}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            value={projectData.description}
            onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
            required
            disabled={isSubmitting}
            placeholder={`Enter ${entityName} description`}
          />
        </div>
        {isCreateProject && templates && setSelectedTemplateId && (
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">
              Default Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
              disabled={isSubmitting || templatesLoading}
            >
              <option value="">None - Create Blank Project</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            {templatesLoading && (
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Loading templates...</p>
            )}
          </div>
        )}
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                {title.includes('Create') ? 'Creating...' : title.includes('Clone') ? 'Duplicating...' : 'Updating...'}
              </>
            ) : (
              title.includes('Create') ? 'Create' : title.includes('Clone') ? 'Duplicate' : 'Update'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const CloneModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  projectData: { name: string; description: string };
  setProjectData: (data: { name: string; description: string }) => void;
  isSubmitting: boolean;
  isTemplate: boolean;
  cloneType: 'template' | 'project';
  setCloneType: (type: 'template' | 'project') => void;
}> = ({ isOpen, onClose, onSubmit, title, projectData, setProjectData, isSubmitting, isTemplate, cloneType, setCloneType }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">
            {isTemplate && cloneType === 'project' ? 'Project Name *' : isTemplate ? 'Template Name *' : 'Project Name *'}
          </label>
          <input
            type="text"
            value={projectData.name}
            onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
            required
            disabled={isSubmitting}
            placeholder={isTemplate && cloneType === 'project' ? 'Enter project name' : isTemplate ? 'Enter template name' : 'Enter project name'}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={projectData.description}
            onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
            disabled={isSubmitting}
            placeholder="Enter description"
          />
        </div>
        {isTemplate && (
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">
              Target Section *
            </label>
            <div className="mb-3 px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-gray-400 text-sm">
              Selected: {cloneType === 'template' ? 'Templates' : 'Projects'}
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg space-y-2">
              <button
                type="button"
                onClick={() => setCloneType('template')}
                disabled={isSubmitting}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  cloneType === 'template'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-gray-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                <FolderOpen className="w-5 h-5 mr-3" />
                <span className="font-medium">Templates</span>
              </button>
              <button
                type="button"
                onClick={() => setCloneType('project')}
                disabled={isSubmitting}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  cloneType === 'project'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-gray-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                <Globe className="w-5 h-5 mr-3" />
                <span className="font-medium">Projects</span>
              </button>
            </div>
          </div>
        )}
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Duplicating...
              </>
            ) : (
              'Duplicate'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const ActionMenu: React.FC<{
  project: Project;
  onDuplicate: (project: Project) => void;
  onDelete: (project: Project) => void;
  canCreate: boolean;
  canDelete: boolean;
  disabled: boolean;
}> = ({ project, onDuplicate, onDelete, canCreate, canDelete, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!canCreate && !canDelete) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={disabled}
        className="p-2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 overflow-hidden">
          {canCreate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onDuplicate(project);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
            >
              <Copy className="w-4 h-4 text-slate-400 dark:text-gray-400" />
              Duplicate Project
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onDelete(project);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Project
            </button>
          )}
        </div>
      )}
    </div>
  );
};

function formatModifiedDate(date: Date): string {
  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

type SortField = 'id' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getSelectedProject, state: appState } = useApp();
  const { state: authState } = useAuth();
  const { dispatch, loadProjects } = useApp();
  const { hasPermission } = usePermissions();
  const _selectedProject = getSelectedProject();
  const hasFetchedRef = useRef(false);

  const hasAnyAction = hasPermission(PERMISSIONS.PROJECT.UPDATE) ||
                       hasPermission(PERMISSIONS.PROJECT.DELETE) ||
                       hasPermission(PERMISSIONS.PROJECT.CREATE);

  const [activeTab, setActiveTab] = useState<'projects' | 'templates'>('projects');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [columnSort, setColumnSort] = useState<{ field: SortField; direction: SortDirection }>({ field: 'updatedAt', direction: 'desc' });

  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    pagination: projectsPagination,
    fetchProjects,
    searchProjects,
    fetchProjectsCreatedByUser,
    searchProjectsCreatedByUser,
    fetchProjectsWithSort,
    createProject,
    updateProject,
    deleteProject,
    cloneProject
  } = useProjects();

  const {
    templates,
    loading: templatesLoading,
    error: templatesError,
    pagination: templatesPagination,
    fetchTemplates,
    searchTemplates,
    fetchTemplatesCreatedByUser,
    searchTemplatesCreatedByUser,
    fetchTemplatesWithSort,
    cloneTemplate,
    cloneTemplateToProject,
    createTemplate,
    updateTemplate,
    deleteTemplate
  } = useTemplates();

  const items = activeTab === 'projects' ? projects : templates;
  const loading = activeTab === 'projects' ? projectsLoading : templatesLoading;
  const error = activeTab === 'projects' ? projectsError : templatesError;
  const pagination = activeTab === 'projects' ? projectsPagination : templatesPagination;

  const [searchTerm, setSearchTerm] = useState('');
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'my-projects'>('all');
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToManage, setProjectToManage] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cloneType, setCloneType] = useState<'template' | 'project'>('template');
  const [newProject, setNewProject] = useState({
    name: '',
    description: ''
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [modalTemplates, setModalTemplates] = useState<Project[]>([]);
  const [templatesLoadingForModal, setTemplatesLoadingForModal] = useState(false);

  const SORT_OPTIONS = useMemo(() => [
    { value: 'createdAt-desc', label: 'Creation Date (New → Old)', param: 'order[createdAt]=desc' },
    { value: 'createdAt-asc', label: 'Creation Date (Old → New)', param: 'order[createdAt]=asc' },
    { value: 'id-asc', label: 'ID (Ascending)', param: 'order[id]=asc' },
    { value: 'id-desc', label: 'ID (Descending)', param: 'order[id]=desc' },
    { value: 'updatedAt-desc', label: 'Last Modified', param: 'order[updatedAt]=desc' },
    { value: 'title-asc', label: 'Title (A-Z)', param: 'order[title]=asc' },
    { value: 'title-desc', label: 'Title (Z-A)', param: 'order[title]=desc' }
  ], []);

  const handleSearch = useCallback(async (term: string) => {
    setCurrentSearchTerm(term);
    const sortOption = SORT_OPTIONS.find(option => option.value === sortBy);

    if (term.trim()) {
      if (filterMode === 'my-projects') {
        if (activeTab === 'projects') {
          await searchProjectsCreatedByUser(term, authState.user?.id?.toString() || '', 1, sortOption?.param);
        } else {
          await searchTemplatesCreatedByUser(term, authState.user?.id?.toString() || '', 1, sortOption?.param);
        }
      } else {
        if (activeTab === 'projects') {
          await searchProjects(term, 1, sortOption?.param);
        } else {
          await searchTemplates(term, 1, sortOption?.param);
        }
      }
    } else {
      await handleFilterChange(filterMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchProjects, searchProjectsCreatedByUser, searchTemplates, searchTemplatesCreatedByUser, filterMode, sortBy, activeTab]);

  const handleFilterChange = useCallback(async (mode: 'all' | 'my-projects') => {
    setFilterMode(mode);
    setSearchTerm('');
    setCurrentSearchTerm('');

    const sortOption = SORT_OPTIONS.find(option => option.value === sortBy);

    if (mode === 'my-projects') {
      const userId = authState.user?.id?.toString() || '';
      if (activeTab === 'projects') {
        await fetchProjectsCreatedByUser(userId || '', 1, sortOption?.param);
      } else {
        await fetchTemplatesCreatedByUser(userId || '', 1, sortOption?.param);
      }
    } else {
      if (activeTab === 'projects') {
        await fetchProjectsWithSort(1, sortOption?.param);
      } else {
        await fetchTemplatesWithSort(1, sortOption?.param);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProjectsCreatedByUser, fetchProjectsWithSort, fetchTemplatesCreatedByUser, fetchTemplatesWithSort, sortBy, authState, activeTab]);

  const handleSortChange = useCallback(async (newSortBy: string) => {
    setSortBy(newSortBy);
    const sortOption = SORT_OPTIONS.find(option => option.value === newSortBy);

    if (currentSearchTerm.trim()) {
      if (filterMode === 'my-projects') {
        const userId = authState.user?.id?.toString() || '';
        if (activeTab === 'projects') {
          await searchProjectsCreatedByUser(currentSearchTerm, userId, 1, sortOption?.param);
        } else {
          await searchTemplatesCreatedByUser(currentSearchTerm, userId, 1, sortOption?.param);
        }
      } else {
        if (activeTab === 'projects') {
          await searchProjects(currentSearchTerm, 1, sortOption?.param);
        } else {
          await searchTemplates(currentSearchTerm, 1, sortOption?.param);
        }
      }
    } else {
      if (filterMode === 'my-projects') {
        const userId = authState.user?.id?.toString() || '';
        if (activeTab === 'projects') {
          await fetchProjectsCreatedByUser(userId, 1, sortOption?.param);
        } else {
          await fetchTemplatesCreatedByUser(userId, 1, sortOption?.param);
        }
      } else {
        if (activeTab === 'projects') {
          await fetchProjectsWithSort(1, sortOption?.param);
        } else {
          await fetchTemplatesWithSort(1, sortOption?.param);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchProjects, searchProjectsCreatedByUser, searchTemplates, searchTemplatesCreatedByUser, fetchProjectsCreatedByUser, fetchProjectsWithSort, fetchTemplatesCreatedByUser, fetchTemplatesWithSort, currentSearchTerm, filterMode, activeTab]);

  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(searchTerm);
    }
  }, [searchTerm, handleSearch]);

  const handleColumnSort = useCallback((field: SortField) => {
    const newDirection: SortDirection = columnSort.field === field && columnSort.direction === 'asc' ? 'desc' : 'asc';
    setColumnSort({ field, direction: newDirection });

    const sortMap: Record<string, string> = {
      'id-asc': 'id-asc',
      'id-desc': 'id-desc',
      'updatedAt-asc': 'createdAt-asc',
      'updatedAt-desc': 'updatedAt-desc',
    };
    const key = `${field}-${newDirection}`;
    handleSortChange(sortMap[key] || 'createdAt-desc');
  }, [columnSort, handleSortChange]);

  const handleCreateProject = useCallback(async () => {
    try {
      setIsSubmitting(true);

      if (selectedTemplateId) {
        await cloneTemplateToProject(selectedTemplateId, {
          title: newProject.name,
          description: newProject.description
        });
      } else {
        await createProject({
          ...newProject,
          userId: authState.user?.id
        });
      }

      await loadProjects(true);
      setIsCreateModalOpen(false);
      setNewProject({ name: '', description: '' });
      setSelectedTemplateId('');
    } catch {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createProject, cloneTemplateToProject, newProject, authState.user?.id, selectedTemplateId]);

  const handleCreateTemplate = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await createTemplate(newProject);
      setIsCreateModalOpen(false);
      setNewProject({ name: '', description: '' });
    } catch {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  }, [createTemplate, newProject]);

  const handleEditProject = useCallback(async () => {
    if (!projectToManage) return;

    try {
      setIsSubmitting(true);
      if (activeTab === 'templates') {
        await updateTemplate(projectToManage.id, newProject);
      } else {
        await updateProject(projectToManage.id, newProject);
        await loadProjects(true);
      }
      setIsEditModalOpen(false);
      setProjectToManage(null);
      setNewProject({ name: '', description: '' });
    } catch {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateProject, updateTemplate, projectToManage, newProject, activeTab]);

  const handleCloneProject = useCallback(async () => {
    if (!projectToManage) return;

    try {
      setIsSubmitting(true);

      if (activeTab === 'templates') {
        if (cloneType === 'project') {
          await cloneTemplateToProject(projectToManage.id, {
            title: newProject.name,
            description: newProject.description
          });
          await loadProjects(true);
          setActiveTab('projects');
          const sortOption = SORT_OPTIONS.find(option => option.value === sortBy);
          if (filterMode === 'my-projects') {
            await fetchProjectsCreatedByUser(authState.user?.id?.toString() || '', 1, sortOption?.param);
          } else {
            await fetchProjectsWithSort(1, sortOption?.param);
          }
        } else {
          await cloneTemplate(projectToManage.id, {
            title: newProject.name,
            description: newProject.description
          });
        }
      } else {
        await cloneProject(projectToManage.id, {
          title: newProject.name,
          description: newProject.description
        });
        await loadProjects(true);
      }
    } catch (error) {
      console.error('Error cloning:', error);
    } finally {
      setIsSubmitting(false);
      setIsCloneModalOpen(false);
      setProjectToManage(null);
      setNewProject({ name: '', description: '' });
      setCloneType('template');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloneProject, cloneTemplate, cloneTemplateToProject, projectToManage, newProject, activeTab, cloneType, sortBy, fetchProjectsWithSort, fetchProjectsCreatedByUser, filterMode]);

  const handleDeleteProject = useCallback(async () => {
    if (!projectToManage) return;

    try {
      setIsSubmitting(true);
      if (activeTab === 'templates') {
        await deleteTemplate(projectToManage.id);
      } else {
        await deleteProject(projectToManage.id);
        await loadProjects(true);
      }
      setProjectToManage(null);
    } catch {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteProject, deleteTemplate, projectToManage, activeTab]);

  const openEditModal = useCallback((project: Project) => {
    setProjectToManage(project);
    setNewProject({
      name: project.name,
      description: project.description
    });
    setIsEditModalOpen(true);
  }, []);

  const openCloneModal = useCallback((project: Project) => {
    setProjectToManage(project);
    setNewProject({
      name: `${project.name} (copy)`,
      description: project.description
    });
    setCloneType(activeTab === 'templates' ? 'template' : 'project');
    setIsCloneModalOpen(true);
  }, [activeTab]);

  const openDeleteDialog = useCallback((project: Project) => {
    setProjectToManage(project);
    setIsDeleteDialogOpen(true);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    const sortOption = SORT_OPTIONS.find(option => option.value === sortBy);

    if (currentSearchTerm.trim()) {
      if (filterMode === 'my-projects') {
        const userId = authState.user?.id?.toString() || '';
        if (activeTab === 'projects') {
          searchProjectsCreatedByUser(currentSearchTerm, userId, page, sortOption?.param);
        } else {
          searchTemplatesCreatedByUser(currentSearchTerm, userId, page, sortOption?.param);
        }
      } else {
        if (activeTab === 'projects') {
          searchProjects(currentSearchTerm, page, sortOption?.param);
        } else {
          searchTemplates(currentSearchTerm, page, sortOption?.param);
        }
      }
    } else {
      if (filterMode === 'my-projects') {
        const userId = authState.user?.id?.toString() || '';
        if (activeTab === 'projects') {
          fetchProjectsCreatedByUser(userId, page, sortOption?.param);
        } else {
          fetchTemplatesCreatedByUser(userId, page, sortOption?.param);
        }
      } else {
        if (activeTab === 'projects') {
          fetchProjectsWithSort(page, sortOption?.param);
        } else {
          fetchTemplatesWithSort(page, sortOption?.param);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSearchTerm, filterMode, sortBy, activeTab, searchProjects, searchProjectsCreatedByUser, searchTemplates, searchTemplatesCreatedByUser, fetchProjectsCreatedByUser, fetchProjectsWithSort, fetchTemplatesCreatedByUser, fetchTemplatesWithSort]);

  const handleProjectClick = useCallback((project: Project) => {
    dispatch({ type: 'SET_NAVIGATING_TO_PROJECT', payload: true });

    const contextProject = getSelectedProject();
    if (!contextProject || contextProject.id !== project.id) {
      dispatch({ type: 'UPDATE_PROJECT', payload: project });
    }

    dispatch({ type: 'SET_SELECTED_PROJECT_ID', payload: project.id });

    setTimeout(() => {
      toast.success(`Selected project: ${project.name}`);
      navigate('/dashboard');
    }, 50);
  }, [dispatch, navigate, getSelectedProject]);

  const handleTabChange = useCallback((tab: 'projects' | 'templates') => {
    setActiveTab(tab);
    setSearchTerm('');
    setCurrentSearchTerm('');
    setFilterMode('all');
    setSortBy('createdAt-desc');
    hasFetchedRef.current = false;
  }, []);

  useEffect(() => {
    if (location.pathname !== '/projects') {
      hasFetchedRef.current = false;
      if (appState.isNavigatingToProject) {
        dispatch({ type: 'SET_NAVIGATING_TO_PROJECT', payload: false });
      }
      return;
    }

    if (appState.isNavigatingToProject) {
      dispatch({ type: 'SET_NAVIGATING_TO_PROJECT', payload: false });
      hasFetchedRef.current = false;
      return;
    }

    if (hasFetchedRef.current) {
      return;
    }

    const sortOption = SORT_OPTIONS.find(option => option.value === sortBy);
    if (activeTab === 'projects') {
      fetchProjectsWithSort(1, sortOption?.param);
    } else {
      fetchTemplatesWithSort(1, sortOption?.param);
    }
    hasFetchedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, sortBy, appState.isNavigatingToProject, activeTab]);

  useEffect(() => {
    const fetchTemplatesForModal = async () => {
      if (isCreateModalOpen && activeTab === 'projects') {
        setTemplatesLoadingForModal(true);
        try {
          const response = await projectsApiService.getTemplates(1);
          const transformedTemplates = response.data.map(apiTemplate =>
            projectsApiService.transformApiProject(apiTemplate)
          );
          setModalTemplates(transformedTemplates);
        } catch (error) {
          console.error('Error fetching templates for modal:', error);
        } finally {
          setTemplatesLoadingForModal(false);
        }
      }
    };

    fetchTemplatesForModal();
  }, [isCreateModalOpen, activeTab]);

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-cyan-600 dark:text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400">Loading {activeTab}...</p>
        </div>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="p-8 text-center bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <p className="text-lg font-medium">Failed to load {activeTab}</p>
            <p className="text-sm text-slate-600 dark:text-gray-400 mt-2">{error}</p>
          </div>
          <Button onClick={() => activeTab === 'projects' ? fetchProjects(1) : fetchTemplates(1)}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    const isActive = columnSort.field === field;
    return (
      <span className="inline-flex flex-col ml-1 -space-y-1">
        <ChevronUp className={`w-3 h-3 ${isActive && columnSort.direction === 'asc' ? 'text-cyan-400' : 'text-slate-500 dark:text-gray-600'}`} />
        <ChevronDown className={`w-3 h-3 ${isActive && columnSort.direction === 'desc' ? 'text-cyan-400' : 'text-slate-500 dark:text-gray-600'}`} />
      </span>
    );
  };

  const entityLabel = activeTab === 'projects' ? 'Project' : 'Template';

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {activeTab === 'projects' ? 'Projects' : 'Templates'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span><span className="font-semibold text-slate-700 dark:text-gray-200">{pagination.totalItems}</span> {activeTab} total</span>
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search for project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40 transition-all"
            />
          </div>

          {/* View filter dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-gray-400">View</span>
            <select
              value={filterMode}
              onChange={(e) => handleFilterChange(e.target.value as 'all' | 'my-projects')}
              className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all cursor-pointer"
            >
              <option value="all">All {entityLabel}</option>
              <option value="my-projects">My {entityLabel}s</option>
            </select>
          </div>

          {/* View mode toggles */}
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Create button */}
        <PermissionGuard permission={PERMISSIONS.PROJECT.CREATE}>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create new {activeTab === 'projects' ? 'project' : 'template'}
          </button>
        </PermissionGuard>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => handleTabChange('projects')}
          className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'projects'
              ? 'text-cyan-600 dark:text-cyan-400 border-cyan-600 dark:border-cyan-400'
              : 'text-slate-500 dark:text-gray-400 border-transparent hover:text-slate-700 dark:hover:text-gray-200'
          }`}
        >
          Projects
        </button>
        <button
          onClick={() => handleTabChange('templates')}
          className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'templates'
              ? 'text-cyan-600 dark:text-cyan-400 border-cyan-600 dark:border-cyan-400'
              : 'text-slate-500 dark:text-gray-400 border-transparent hover:text-slate-700 dark:hover:text-gray-200'
          }`}
        >
          Templates
        </button>
      </div>

      {/* Active filters */}
      {(currentSearchTerm || filterMode !== 'all') && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-gray-400">Active filters:</span>
          {currentSearchTerm && (
            <span className="inline-flex items-center px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs text-cyan-600 dark:text-cyan-400">
              Search: &ldquo;{currentSearchTerm}&rdquo;
            </span>
          )}
          {filterMode !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-600 dark:text-blue-400">
              My {entityLabel}s
            </span>
          )}
          <button
            onClick={() => {
              setSearchTerm('');
              setCurrentSearchTerm('');
              setFilterMode('all');
              setSortBy('createdAt-desc');
              const sortOption = SORT_OPTIONS.find(option => option.value === 'createdAt-desc');
              if (activeTab === 'projects') {
                fetchProjectsWithSort(1, sortOption?.param);
              } else {
                fetchTemplatesWithSort(1, sortOption?.param);
              }
            }}
            className="text-xs text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Table */}
      <div className="relative bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10">
            <Loader className="w-6 h-6 text-cyan-600 dark:text-cyan-400 animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/60">
                <th
                  className="text-left py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-500 cursor-pointer select-none hover:text-slate-700 dark:hover:text-gray-300 transition-colors w-20"
                  onClick={() => handleColumnSort('id')}
                >
                  <span className="flex items-center">
                    ID <SortIcon field="id" />
                  </span>
                </th>
                <th className="text-left py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-500">
                  {entityLabel} Name
                </th>
                <th className="text-center py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-500 w-32">
                  Test Case
                </th>
                <th className="text-center py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-500 w-32">
                  Test Runs
                </th>
                <th
                  className="text-left py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-500 cursor-pointer select-none hover:text-slate-700 dark:hover:text-gray-300 transition-colors w-44"
                  onClick={() => handleColumnSort('updatedAt')}
                >
                  <span className="flex items-center">
                    Modified <SortIcon field="updatedAt" />
                  </span>
                </th>
                {hasAnyAction && (
                  <th className="text-center py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-500 w-28">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
              {items.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                >
                  <td className="py-4 px-6 text-sm font-mono text-slate-500 dark:text-gray-400">
                    #{project.id || 'N/A'}
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5 line-clamp-1">{project.description}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'SET_SELECTED_PROJECT_ID', payload: project.id });
                        dispatch({ type: 'UPDATE_PROJECT', payload: project });
                        navigate('/test-cases');
                        toast.success(`Viewing test cases for ${project.name}`);
                      }}
                      className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors"
                    >
                      {project.testCasesCount} Test cases
                    </button>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'SET_SELECTED_PROJECT_ID', payload: project.id });
                        dispatch({ type: 'UPDATE_PROJECT', payload: project });
                        navigate('/test-runs');
                        toast.success(`Viewing test runs for ${project.name}`);
                      }}
                      className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors"
                    >
                      {project.testRunsCount > 0 ? `${project.testRunsCount} test run${project.testRunsCount !== 1 ? 's' : ''}` : 'No test run'}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500 dark:text-gray-400">
                    {formatModifiedDate(project.updatedAt)}
                  </td>
                  {hasAnyAction && (
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {hasPermission(PERMISSIONS.PROJECT.UPDATE) && (
                          <button
                            onClick={() => openEditModal(project)}
                            className="p-2 text-slate-400 dark:text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Edit"
                            disabled={isSubmitting}
                          >
                            <SquarePen className="w-4 h-4" />
                          </button>
                        )}
                        <ActionMenu
                          project={project}
                          onDuplicate={openCloneModal}
                          onDelete={openDeleteDialog}
                          canCreate={hasPermission(PERMISSIONS.PROJECT.CREATE)}
                          canDelete={hasPermission(PERMISSIONS.PROJECT.DELETE)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {items.length === 0 && !loading && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-gray-600" />
              <p className="text-lg font-medium text-slate-500 dark:text-gray-400">No {activeTab} found</p>
              <p className="text-sm text-slate-400 dark:text-gray-500 mt-1">
                {currentSearchTerm || filterMode !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : activeTab === 'projects' ? 'Create your first project to get started.' : 'No templates available.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="border-t border-slate-200 dark:border-slate-700/60 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500 dark:text-gray-400">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                {pagination.totalItems} {activeTab}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1 || loading}
                  icon={ChevronLeft}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-500 dark:text-gray-400">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages || loading}
                  icon={ChevronRight}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedTemplateId('');
        }}
        onSubmit={activeTab === 'templates' ? handleCreateTemplate : handleCreateProject}
        title={activeTab === 'templates' ? 'Create New Template' : 'Create New Project'}
        projectData={newProject}
        setProjectData={setNewProject}
        isSubmitting={isSubmitting}
        templates={activeTab === 'projects' ? modalTemplates : undefined}
        selectedTemplateId={selectedTemplateId}
        setSelectedTemplateId={setSelectedTemplateId}
        templatesLoading={templatesLoadingForModal}
      />

      <ProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditProject}
        title={activeTab === 'templates' ? 'Edit Template' : 'Edit Project'}
        projectData={newProject}
        setProjectData={setNewProject}
        isSubmitting={isSubmitting}
      />

      <CloneModal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        onSubmit={handleCloneProject}
        title={activeTab === 'templates' ? 'Clone Template' : 'Clone Project'}
        projectData={newProject}
        setProjectData={setNewProject}
        isSubmitting={isSubmitting}
        isTemplate={activeTab === 'templates'}
        cloneType={cloneType}
        setCloneType={setCloneType}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteProject}
        title={activeTab === 'templates' ? 'Delete Template' : 'Delete Project'}
        message={
          activeTab === 'templates'
            ? `Are you sure you want to delete the template "${projectToManage?.name}"? This action is irreversible and will delete all associated test cases and data.`
            : `Are you sure you want to delete the project "${projectToManage?.name}"? This action is irreversible and will delete all associated test cases, test runs, and data.`
        }
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default Projects;
