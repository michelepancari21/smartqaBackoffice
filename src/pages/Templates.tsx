import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Search, SquarePen, Trash2, Copy, ChevronLeft, ChevronRight,
  Loader, FolderOpen, Globe, MoreVertical, List, LayoutGrid, ChevronUp, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTemplates } from '../hooks/useTemplates';
import { Project } from '../types';
import toast from 'react-hot-toast';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../utils/permissions';
import PermissionGuard from '../components/PermissionGuard';

const TemplateFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  templateData: { name: string; description: string };
  setTemplateData: (data: { name: string; description: string }) => void;
  isSubmitting: boolean;
}> = ({ isOpen, onClose, onSubmit, title, templateData, setTemplateData, isSubmitting }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">
            Template Name *
          </label>
          <input
            type="text"
            value={templateData.name}
            onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
            required
            disabled={isSubmitting}
            placeholder="Enter template name"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            value={templateData.description}
            onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
            required
            disabled={isSubmitting}
            placeholder="Enter template description"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                {title.includes('Create') ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              title.includes('Create') ? 'Create' : 'Update'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const CloneTemplateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  templateData: { name: string; description: string };
  setTemplateData: (data: { name: string; description: string }) => void;
  isSubmitting: boolean;
  cloneType: 'template' | 'project';
  setCloneType: (type: 'template' | 'project') => void;
}> = ({ isOpen, onClose, onSubmit, title, templateData, setTemplateData, isSubmitting, cloneType, setCloneType }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">
            {cloneType === 'project' ? 'Project Name *' : 'Template Name *'}
          </label>
          <input
            type="text"
            value={templateData.name}
            onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
            required
            disabled={isSubmitting}
            placeholder={cloneType === 'project' ? 'Enter project name' : 'Enter template name'}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={templateData.description}
            onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
            disabled={isSubmitting}
            placeholder="Enter description"
          />
        </div>
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

const TemplateActionMenu: React.FC<{
  template: Project;
  onDuplicate: (t: Project) => void;
  onDelete: (t: Project) => void;
  canCreate: boolean;
  canDelete: boolean;
  disabled: boolean;
}> = ({ template, onDuplicate, onDelete, canCreate, canDelete, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!canCreate && !canDelete) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        disabled={disabled}
        className="p-2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 overflow-hidden">
          {canCreate && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDuplicate(template); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
            >
              <Copy className="w-4 h-4 text-slate-400 dark:text-gray-400" />
              Duplicate Template
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDelete(template); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Template
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

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch, loadProjects } = useApp();
  const { state: authState } = useAuth();
  const { hasPermission } = usePermissions();
  const hasFetchedRef = useRef(false);

  const hasAnyAction = hasPermission(PERMISSIONS.PROJECT.UPDATE) ||
                       hasPermission(PERMISSIONS.PROJECT.DELETE) ||
                       hasPermission(PERMISSIONS.PROJECT.CREATE);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [columnSort, setColumnSort] = useState<{ field: SortField; direction: SortDirection }>({ field: 'updatedAt', direction: 'desc' });

  const {
    templates,
    loading,
    error,
    pagination,
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

  const [searchTerm, setSearchTerm] = useState('');
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'my-templates'>('all');
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToManage, setTemplateToManage] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cloneType, setCloneType] = useState<'template' | 'project'>('template');
  const [formData, setFormData] = useState({ name: '', description: '' });

  const SORT_OPTIONS = useMemo(() => [
    { value: 'createdAt-desc', label: 'Creation Date (New to Old)', param: 'order[createdAt]=desc' },
    { value: 'createdAt-asc', label: 'Creation Date (Old to New)', param: 'order[createdAt]=asc' },
    { value: 'id-asc', label: 'ID (Ascending)', param: 'order[id]=asc' },
    { value: 'id-desc', label: 'ID (Descending)', param: 'order[id]=desc' },
    { value: 'updatedAt-desc', label: 'Last Modified', param: 'order[updatedAt]=desc' },
    { value: 'title-asc', label: 'Title (A-Z)', param: 'order[title]=asc' },
    { value: 'title-desc', label: 'Title (Z-A)', param: 'order[title]=desc' }
  ], []);

  const handleSearch = useCallback(async (term: string) => {
    setCurrentSearchTerm(term);
    const sortOption = SORT_OPTIONS.find(o => o.value === sortBy);

    if (term.trim()) {
      if (filterMode === 'my-templates') {
        await searchTemplatesCreatedByUser(term, authState.user?.id?.toString() || '', 1, sortOption?.param);
      } else {
        await searchTemplates(term, 1, sortOption?.param);
      }
    } else {
      await handleFilterChange(filterMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTemplates, searchTemplatesCreatedByUser, filterMode, sortBy]);

  const handleFilterChange = useCallback(async (mode: 'all' | 'my-templates') => {
    setFilterMode(mode);
    setSearchTerm('');
    setCurrentSearchTerm('');
    const sortOption = SORT_OPTIONS.find(o => o.value === sortBy);

    if (mode === 'my-templates') {
      await fetchTemplatesCreatedByUser(authState.user?.id?.toString() || '', 1, sortOption?.param);
    } else {
      await fetchTemplatesWithSort(1, sortOption?.param);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTemplatesCreatedByUser, fetchTemplatesWithSort, sortBy, authState]);

  const handleSortChange = useCallback(async (newSortBy: string) => {
    setSortBy(newSortBy);
    const sortOption = SORT_OPTIONS.find(o => o.value === newSortBy);

    if (currentSearchTerm.trim()) {
      if (filterMode === 'my-templates') {
        await searchTemplatesCreatedByUser(currentSearchTerm, authState.user?.id?.toString() || '', 1, sortOption?.param);
      } else {
        await searchTemplates(currentSearchTerm, 1, sortOption?.param);
      }
    } else {
      if (filterMode === 'my-templates') {
        await fetchTemplatesCreatedByUser(authState.user?.id?.toString() || '', 1, sortOption?.param);
      } else {
        await fetchTemplatesWithSort(1, sortOption?.param);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTemplates, searchTemplatesCreatedByUser, fetchTemplatesCreatedByUser, fetchTemplatesWithSort, currentSearchTerm, filterMode]);

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
      'id-asc': 'id-asc', 'id-desc': 'id-desc',
      'updatedAt-asc': 'createdAt-asc', 'updatedAt-desc': 'updatedAt-desc',
    };
    handleSortChange(sortMap[`${field}-${newDirection}`] || 'createdAt-desc');
  }, [columnSort, handleSortChange]);

  const handleCreateTemplate = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await createTemplate(formData);
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '' });
    } catch {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  }, [createTemplate, formData]);

  const handleEditTemplate = useCallback(async () => {
    if (!templateToManage) return;
    try {
      setIsSubmitting(true);
      await updateTemplate(templateToManage.id, formData);
      setIsEditModalOpen(false);
      setTemplateToManage(null);
      setFormData({ name: '', description: '' });
    } catch {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  }, [updateTemplate, templateToManage, formData]);

  const handleCloneTemplate = useCallback(async () => {
    if (!templateToManage) return;
    try {
      setIsSubmitting(true);
      if (cloneType === 'project') {
        await cloneTemplateToProject(templateToManage.id, {
          title: formData.name,
          description: formData.description
        });
        await loadProjects(true);
        toast.success('Template cloned to Projects');
        navigate('/projects');
      } else {
        await cloneTemplate(templateToManage.id, {
          title: formData.name,
          description: formData.description
        });
      }
    } catch (err) {
      console.error('Error cloning template:', err);
    } finally {
      setIsSubmitting(false);
      setIsCloneModalOpen(false);
      setTemplateToManage(null);
      setFormData({ name: '', description: '' });
      setCloneType('template');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloneTemplate, cloneTemplateToProject, templateToManage, formData, cloneType, navigate]);

  const handleDeleteTemplate = useCallback(async () => {
    if (!templateToManage) return;
    try {
      setIsSubmitting(true);
      await deleteTemplate(templateToManage.id);
      setTemplateToManage(null);
    } catch {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteTemplate, templateToManage]);

  const openEditModal = useCallback((t: Project) => {
    setTemplateToManage(t);
    setFormData({ name: t.name, description: t.description });
    setIsEditModalOpen(true);
  }, []);

  const openCloneModal = useCallback((t: Project) => {
    setTemplateToManage(t);
    setFormData({ name: `${t.name} (copy)`, description: t.description });
    setCloneType('template');
    setIsCloneModalOpen(true);
  }, []);

  const openDeleteDialog = useCallback((t: Project) => {
    setTemplateToManage(t);
    setIsDeleteDialogOpen(true);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    const sortOption = SORT_OPTIONS.find(o => o.value === sortBy);

    if (currentSearchTerm.trim()) {
      if (filterMode === 'my-templates') {
        searchTemplatesCreatedByUser(currentSearchTerm, authState.user?.id?.toString() || '', page, sortOption?.param);
      } else {
        searchTemplates(currentSearchTerm, page, sortOption?.param);
      }
    } else {
      if (filterMode === 'my-templates') {
        fetchTemplatesCreatedByUser(authState.user?.id?.toString() || '', page, sortOption?.param);
      } else {
        fetchTemplatesWithSort(page, sortOption?.param);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSearchTerm, filterMode, sortBy, searchTemplates, searchTemplatesCreatedByUser, fetchTemplatesCreatedByUser, fetchTemplatesWithSort]);

  const handleTemplateClick = useCallback((template: Project) => {
    dispatch({ type: 'SET_NAVIGATING_TO_PROJECT', payload: true });
    dispatch({ type: 'UPDATE_PROJECT', payload: template });
    dispatch({ type: 'SET_SELECTED_PROJECT_ID', payload: template.id });

    setTimeout(() => {
      toast.success(`Selected template: ${template.name}`);
      navigate('/dashboard');
    }, 50);
  }, [dispatch, navigate]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    const sortOption = SORT_OPTIONS.find(o => o.value === sortBy);
    fetchTemplatesWithSort(1, sortOption?.param);
    hasFetchedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-cyan-600 dark:text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (error && templates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="p-8 text-center bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <p className="text-lg font-medium">Failed to load templates</p>
            <p className="text-sm text-slate-600 dark:text-gray-400 mt-2">{error}</p>
          </div>
          <Button onClick={() => fetchTemplates(1)}>Try Again</Button>
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

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Templates</h1>
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span><span className="font-semibold text-slate-700 dark:text-gray-200">{pagination.totalItems}</span> templates total</span>
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search for template..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-gray-400">View</span>
            <select
              value={filterMode}
              onChange={(e) => handleFilterChange(e.target.value as 'all' | 'my-templates')}
              className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all cursor-pointer"
            >
              <option value="all">All Templates</option>
              <option value="my-templates">My Templates</option>
            </select>
          </div>

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

        <PermissionGuard permission={PERMISSIONS.PROJECT.CREATE}>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create new template
          </button>
        </PermissionGuard>
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
              My Templates
            </span>
          )}
          <button
            onClick={() => {
              setSearchTerm('');
              setCurrentSearchTerm('');
              setFilterMode('all');
              setSortBy('createdAt-desc');
              fetchTemplatesWithSort(1, SORT_OPTIONS.find(o => o.value === 'createdAt-desc')?.param);
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
                  <span className="flex items-center">ID <SortIcon field="id" /></span>
                </th>
                <th className="text-left py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-500">
                  Template Name
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
                  <span className="flex items-center">Modified <SortIcon field="updatedAt" /></span>
                </th>
                {hasAnyAction && (
                  <th className="text-center py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-500 w-28">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
              {templates.map((template) => (
                <tr
                  key={template.id}
                  onClick={() => handleTemplateClick(template)}
                  className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                >
                  <td className="py-4 px-6 text-sm font-mono text-slate-500 dark:text-gray-400">
                    #{template.id || 'N/A'}
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5 line-clamp-1">{template.description}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                      {template.testCasesCount} Test cases
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400 whitespace-nowrap">
                      {template.testRunsCount > 0 ? `${template.testRunsCount} test run${template.testRunsCount !== 1 ? 's' : ''}` : 'No test run'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500 dark:text-gray-400">
                    {formatModifiedDate(template.updatedAt)}
                  </td>
                  {hasAnyAction && (
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {hasPermission(PERMISSIONS.PROJECT.UPDATE) && (
                          <button
                            onClick={() => openEditModal(template)}
                            className="p-2 text-slate-400 dark:text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Edit"
                            disabled={isSubmitting}
                          >
                            <SquarePen className="w-4 h-4" />
                          </button>
                        )}
                        <TemplateActionMenu
                          template={template}
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

          {templates.length === 0 && !loading && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-gray-600" />
              <p className="text-lg font-medium text-slate-500 dark:text-gray-400">No templates found</p>
              <p className="text-sm text-slate-400 dark:text-gray-500 mt-1">
                {currentSearchTerm || filterMode !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first template to get started.'}
              </p>
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="border-t border-slate-200 dark:border-slate-700/60 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500 dark:text-gray-400">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                {pagination.totalItems} templates
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
      <TemplateFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTemplate}
        title="Create New Template"
        templateData={formData}
        setTemplateData={setFormData}
        isSubmitting={isSubmitting}
      />

      <TemplateFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditTemplate}
        title="Edit Template"
        templateData={formData}
        setTemplateData={setFormData}
        isSubmitting={isSubmitting}
      />

      <CloneTemplateModal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        onSubmit={handleCloneTemplate}
        title="Clone Template"
        templateData={formData}
        setTemplateData={setFormData}
        isSubmitting={isSubmitting}
        cloneType={cloneType}
        setCloneType={setCloneType}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteTemplate}
        title="Delete Template"
        message={`Are you sure you want to delete the template "${templateToManage?.name}"? This action is irreversible and will delete all associated test cases and data.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default Templates;
