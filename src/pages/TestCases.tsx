import React, { useState, useCallback } from 'react';
import { Plus, Search, Filter, Edit, Trash2, ChevronLeft, ChevronRight, Loader, FolderPlus, X } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import FolderTree from '../components/FolderTree/FolderTree';
import CreateTestCaseModal from '../components/TestCase/CreateTestCaseModal';
import UpdateTestCaseModal from '../components/TestCase/UpdateTestCaseModal';
import TagSelector from '../components/UI/TagSelector';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTestCases } from '../hooks/useTestCases';
import { useFolders } from '../hooks/useFolders';
import { useTags } from '../hooks/useTags';
import { testCasesApiService } from '../services/testCasesApi';
import { TestCase, AUTOMATION_STATUS_LABELS, TEST_CASE_TYPES } from '../types';
import { Tag } from '../services/tagsApi';
import toast from 'react-hot-toast';

const TestCases: React.FC = () => {
  const { getSelectedProject } = useApp();
  const { state: authState } = useAuth();
  const { tags, createTag } = useTags();
  const selectedProject = getSelectedProject();
  
  const { 
    folderTree, 
    loading: foldersLoading, 
    selectedFolderId, 
    selectFolder,
    getSelectedFolder,
    updateFoldersFromTestCases
  } = useFolders(selectedProject?.id);
  
  const { 
    testCases, // This will be filtered by selected folder
    allTestCases, // All test cases for counting
    loading, 
    error, 
    pagination, 
    currentFilterMode,
    setCurrentFilterMode,
    fetchAllTestCasesAndExtractFolders,
    filterTestCasesByFolder,
    fetchTestCases, 
    searchTestCases,
    filterTestCasesByAutomation,
    filterTestCasesByPriority,
    filterTestCasesByType,
    filterTestCasesByState,
    filterTestCasesByTags,
    filterTestCasesWithMultipleFilters,
    createTestCase, 
    updateTestCase, 
    deleteTestCase 
  } = useTestCases(selectedProject?.id, selectedFolderId, updateFoldersFromTestCases);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    automationStatus: 'all',
    priority: 'all',
    type: 'all' as 'all' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11',
    state: 'all' as 'all' | '1' | '2' | '3' | '4' | '5',
    tags: [] as Tag[]
  });
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFiltersSidebarOpen, setIsFiltersSidebarOpen] = useState(false);

  const selectedFolder = getSelectedFolder();

  const handleCreateFolder = useCallback(() => {
    toast('Create folder functionality will be implemented soon');
  }, []);

  const handleSearch = useCallback(async (term: string) => {
    setCurrentSearchTerm(term);
    // Reset filters when searching
    setFilters({
      automationStatus: 'all',
      priority: 'all',
      type: 'all',
      state: 'all',
      tags: []
    });
    if (term.trim()) {
      // Search across all folders in the project (omitting folder parameter)
      await searchTestCases(term, 1);
    } else {
      // If search is cleared, go back to folder-specific view
      setCurrentFilterMode('folder');
      if (selectedFolderId) {
        await fetchTestCases(1);
      }
    }
  }, [searchTestCases, fetchTestCases, setCurrentFilterMode, selectedFolderId]);

  const applyFilters = useCallback(async () => {
    setCurrentSearchTerm(''); // Reset search when filtering
    setSearchTerm('');
    
    // Check if any filters are active
    const hasActiveFilters = filters.automationStatus !== 'all' || 
                            filters.priority !== 'all' || 
                            filters.type !== 'all' || 
                            filters.state !== 'all' ||
                            (filters.tags && filters.tags.length > 0);
    
    if (!hasActiveFilters) {
      // No filters active, go back to folder view
      setCurrentFilterMode('folder');
      await fetchTestCases(1);
    } else {
      // Apply single filter - only one filter at a time
      if (filters.automationStatus !== 'all') {
        const automationStatus = parseInt(filters.automationStatus) as 1 | 2 | 3 | 4 | 5;
        console.log('🔍 Applying automation filter:', automationStatus);
        await filterTestCasesByAutomation(automationStatus, 1);
      } else if (filters.priority !== 'all') {
        const priorityValue = getPriorityNumber(filters.priority as 'low' | 'medium' | 'high' | 'critical');
        console.log('🔍 Applying priority filter:', priorityValue);
        await filterTestCasesByPriority(priorityValue, 1);
      } else if (filters.type !== 'all') {
        const typeValue = parseInt(filters.type);
        console.log('🔍 Applying type filter:', typeValue);
        await filterTestCasesByType(typeValue, 1);
      } else if (filters.state !== 'all' && filters.state) {
        const stateValue = parseInt(filters.state);
        console.log('🔍 Applying state filter:', stateValue);
        await filterTestCasesByState(stateValue, 1);
      } else if (filters.tags && filters.tags.length > 0) {
        const tagIds = (filters.tags || []).map(tag => tag.id);
        console.log('🔍 Applying tags filter:', tagIds);
        await filterTestCasesByTags(tagIds, 1);
      }
    }
  }, [filters, filterTestCasesWithMultipleFilters, fetchTestCases, setCurrentFilterMode, filterTestCasesByAutomation, filterTestCasesByPriority, filterTestCasesByType, filterTestCasesByTags, filterTestCasesByState]);

  const updateFilter = useCallback((filterType: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({
      automationStatus: 'all',
      priority: 'all',
      type: 'all',
      state: 'all',
      tags: []
    });
    setSearchTerm('');
    setCurrentSearchTerm('');
    setCurrentFilterMode('folder');
    fetchTestCases(1);
  }, [fetchTestCases, setCurrentFilterMode]);

  const handleCreateTag = useCallback(async (label: string): Promise<Tag> => {
    return await createTag(label);
  }, [createTag]);

  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(searchTerm);
    }
  }, [searchTerm, handleSearch]);

  const handleCreateTestCase = useCallback(async (data: any) => {
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    if (!selectedFolderId) {
      toast.error('Please select a folder first');
      return;
    }

    if (!authState.user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Transform the rich form data to the format expected by the API
      await createTestCase({
        title: data.title,
        description: data.description,
        priority: getPriorityString(data.priority),
        testType: getTestTypeString(data.testCaseType),
        status: getStatusString(data.state),
        automationStatus: data.automationStatus,
        template: data.template,
        preconditions: data.preconditions,
        tags: (data.tags || []).map((tag: Tag) => ({ id: tag.id, label: tag.label })),
        projectId: selectedProject.id,
        folderId: selectedFolderId,
        creatorId: authState.user.id,
        testSteps: data.testSteps || []
      });
      
      setIsCreateModalOpen(false);
      
      // Refresh the test cases list to show the new test case
      await fetchTestCases(1);
      
      toast.success('Test case created successfully');
      
    } catch (error) {
      console.error('Failed to create test case:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create test case';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [createTestCase, selectedProject, selectedFolderId, authState.user?.id, fetchTestCases]);

  // Helper functions to convert numeric values to string values
  const getPriorityString = (priority: number): 'low' | 'medium' | 'high' | 'critical' => {
    const priorityMap = { 1: 'low', 2: 'medium', 3: 'high', 4: 'critical' } as const;
    return priorityMap[priority as keyof typeof priorityMap] || 'medium';
  };

  const getTestTypeString = (type: number): 'functional' | 'regression' | 'smoke' | 'integration' | 'performance' => {
    const typeMap = {
      1: 'functional', // Other -> functional
      2: 'functional', // Acceptance -> functional  
      3: 'functional', // Accessibility -> functional
      4: 'integration', // Compatibility -> integration
      5: 'functional', // Destructive -> functional
      6: 'functional', // Functional -> functional
      7: 'performance', // Performance -> performance
      8: 'regression', // Regression -> regression
      9: 'functional', // Security -> functional
      10: 'smoke', // Smoke & Sanity -> smoke
      11: 'functional' // Usability -> functional
    } as const;
    return typeMap[type as keyof typeof typeMap] || 'functional';
  };

  const getStatusString = (state: number): 'draft' | 'active' | 'deprecated' => {
    const stateMap = { 1: 'active', 2: 'draft', 4: 'deprecated' } as const;
    return stateMap[state as keyof typeof stateMap] || 'draft';
  };

  const getPriorityNumber = (priority: 'low' | 'medium' | 'high' | 'critical'): number => {
    const priorityMap = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return priorityMap[priority];
  };

  const getTestTypeNumber = (type: 'functional' | 'regression' | 'smoke' | 'integration' | 'performance'): number => {
    const typeMap = { 'functional': 6, 'regression': 8, 'smoke': 10, 'integration': 4, 'performance': 7 };
    return typeMap[type];
  };

  const getStateNumber = (state: 'draft' | 'active' | 'deprecated'): number => {
    const stateMap = { 'active': 1, 'draft': 2, 'deprecated': 4 };
    return stateMap[state];
  };

  const handleEditTestCase = useCallback(async (data: any) => {
    if (!selectedTestCase || !selectedProject || !authState.user?.id) {
      toast.error('Missing required data for update');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Handle new tags creation first
      const processedTags = [];
      for (const tag of data.tags || []) {
        if (tag && tag.id && typeof tag.id === 'string' && tag.id.startsWith('temp-')) {
          // Create new tag
          try {
            const newTag = await createTag(tag.label);
            processedTags.push(newTag);
          } catch (error) {
            console.error('Failed to create tag:', error);
            toast.error(`Failed to create tag: ${tag.label}`);
            return;
          }
        } else if (tag && tag.id && tag.label) {
          // Find the actual tag by label to get the proper ID
          const actualTag = tags.find(t => t.label === tag.label);
          if (actualTag) {
            processedTags.push(actualTag);
          } else {
            // If not found by label, try by ID
            const tagById = tags.find(t => t.id === tag.id);
            if (tagById) {
              processedTags.push(tagById);
            } else {
              // If still not found, create it as a new tag
              try {
                const newTag = await createTag(tag.label);
                processedTags.push(newTag);
              } catch (error) {
                console.error('Failed to create tag:', error);
                toast.error(`Failed to create tag: ${tag.label}`);
                return;
              }
            }
          }
        }
      }
      
      // Transform the rich form data to the format expected by the API
      const updateData = {
        title: data.title,
        description: data.description,
        priority: data.priority === 1 ? 'low' : data.priority === 2 ? 'medium' : data.priority === 3 ? 'high' : data.priority === 4 ? 'critical' : 'medium',
        testType: data.testCaseType === 6 ? 'functional' : data.testCaseType === 8 ? 'regression' : data.testCaseType === 10 ? 'smoke' : data.testCaseType === 4 ? 'integration' : data.testCaseType === 7 ? 'performance' : 'functional',
        status: data.state === 1 ? 'active' : 
                data.state === 2 ? 'draft' : 
                data.state === 3 ? 'in_review' :
                data.state === 4 ? 'outdated' : 
                data.state === 5 ? 'rejected' : 'draft',
        automationStatus: data.automationStatus,
        template: data.template,
        preconditions: data.preconditions,
        tags: processedTags, // Pass the processed tags (only selected ones)
        testSteps: data.testSteps || [], // Pass the test steps to the hook for processing
        userId: authState.user.id // Pass user ID for step result creation
      };
      
      console.log('🔧 Converted updateData for API:', updateData);
      console.log('🔧 Status being sent to API:', updateData.status);
      
      await updateTestCase(selectedTestCase.id, updateData);
      
      setIsEditModalOpen(false);
      setSelectedTestCase(null);
      
      // Refresh the test cases list to show the updated test case
      await fetchTestCases(1);
      
      toast.success('Test case updated successfully');
      
    } catch (error) {
      console.error('Failed to update test case:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update test case';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [updateTestCase, selectedTestCase, selectedProject, authState.user?.id, fetchTestCases, createTag, tags]);

  const handleDeleteTestCase = useCallback(async () => {
    if (!selectedTestCase) return;
    
    try {
      setIsSubmitting(true);
      await deleteTestCase(selectedTestCase.id);
      setSelectedTestCase(null);
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteTestCase, selectedTestCase]);

  const openEditModal = useCallback((testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setIsEditModalOpen(true);
  }, []);

  const openDeleteDialog = useCallback((testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setIsDeleteDialogOpen(true);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    // Check if we have active filters
    const hasActiveFilters = filters.automationStatus !== 'all' || 
                            filters.priority !== 'all' || 
                            filters.type !== 'all' || 
                            (filters.tags && filters.tags.length > 0);
    
    if (currentSearchTerm.trim()) {
      searchTestCases(currentSearchTerm, page);
    } else if (hasActiveFilters) {
      // Apply single filter for pagination
      if (filters.automationStatus !== 'all') {
        const automationStatus = parseInt(filters.automationStatus) as 1 | 2 | 3 | 4 | 5;
        filterTestCasesByAutomation(automationStatus, page);
      } else if (filters.priority !== 'all') {
        const priorityValue = getPriorityNumber(filters.priority as 'low' | 'medium' | 'high' | 'critical');
        filterTestCasesByPriority(priorityValue, page);
      } else if (filters.type !== 'all') {
        const typeValue = parseInt(filters.type);
        filterTestCasesByType(typeValue, page);
      } else if (filters.tags && filters.tags.length > 0) {
        const tagIds = (filters.tags || []).map(tag => tag.id);
        filterTestCasesByTags(tagIds, page);
      } else if (filters.state !== 'all') {
        const stateValue = parseInt(filters.state);
        filterTestCasesByState(stateValue, page);
      }
    } else {
      fetchTestCases(page);
    }
  }, [filters, currentSearchTerm, searchTestCases, filterTestCasesByAutomation, filterTestCasesByPriority, filterTestCasesByType, filterTestCasesByTags, fetchTestCases, filterTestCasesByState]);

  if (loading && testCases.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading test cases...</p>
        </div>
      </div>
    );
  }

  if (error && testCases.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="p-8 text-center">
          <div className="text-red-400 mb-4">
            <p className="text-lg font-medium">Failed to load test cases</p>
            <p className="text-sm text-gray-400 mt-2">{error}</p>
          </div>
          <Button onClick={() => fetchTestCases(1)}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Test Cases</h2>
          <p className="text-gray-400">
            {selectedProject 
              ? `Manage test cases for ${selectedProject.name} (${pagination.totalItems} total)` 
              : `Please select a project to view test cases`
            }
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedProject && (
              <div className="inline-flex items-center px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-sm text-cyan-400">
                📁 Project: {selectedProject.name}
              </div>
            )}
            {selectedFolder && (
              <div className="inline-flex items-center px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-purple-400">
                📂 Folder: {selectedFolder.name}
              </div>
            )}
          </div>
        </div>
        <Button 
          icon={Plus} 
          onClick={() => setIsCreateModalOpen(true)}
          disabled={!selectedProject || !selectedFolderId}
          title={!selectedProject ? 'Please select a project first' : !selectedFolderId ? 'Please select a folder first' : 'Create new test case'}
        >
          New Test Case
        </Button>
      </div>

      {/* Show message if no project selected */}
      {!selectedProject && (
        <Card className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No project selected</p>
            <p className="text-sm">Please select a project from the sidebar to view and manage test cases.</p>
          </div>
        </Card>
      )}

      {/* Only show content if project is selected */}
      {selectedProject && (
        <div className="flex gap-6">
          {/* Folder Tree Sidebar */}
          <div className="w-80 flex-shrink-0">
            <Card className="h-fit">
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Folders</h3>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={FolderPlus}
                    onClick={handleCreateFolder}
                    className="p-2"
                    title="Create new folder"
                  >
                  </Button>
                </div>
                <p className="text-sm text-gray-400">Select a folder to view test cases</p>
              </div>
              <div className="p-4">
                <FolderTree
                  folders={folderTree}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={selectFolder}
                  loading={foldersLoading}
                />
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Show message if no folder selected */}
            {!selectedFolderId && (
              <Card className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No folder selected</p>
                  <p className="text-sm">Please select a folder from the tree to view test cases.</p>
                </div>
              </Card>
            )}

            {/* Only show filters and table if folder is selected */}
            {selectedFolderId && (
              <>
                {/* Filters */}
                <Card className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                        <input
                          type="text"
                          placeholder="Search test cases by ID or title (press Enter to search)..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyPress={handleSearchKeyPress}
                          className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="secondary"
                        icon={Filter}
                        onClick={() => setIsFiltersSidebarOpen(true)}
                        className="px-4 py-2"
                      >
                        Filters
                        {(filters.automationStatus !== 'all' || filters.priority !== 'all' || filters.type !== 'all' || (filters.tags && filters.tags.length > 0)) && (
                          <span className="ml-2 px-2 py-0.5 bg-cyan-500 text-white text-xs rounded-full">
                            {[
                              filters.automationStatus !== 'all' ? 1 : 0,
                              filters.priority !== 'all' ? 1 : 0,
                              filters.type !== 'all' ? 1 : 0,
                              (filters.tags && filters.tags.length > 0) ? 1 : 0
                            ].reduce((a, b) => a + b, 0)}
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Active filters display */}
                  {(currentSearchTerm || filters.automationStatus !== 'all' || filters.priority !== 'all' || filters.type !== 'all' || (filters.tags && filters.tags.length > 0)) && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-400">Active filters:</span>
                      {currentSearchTerm && (
                        <span className="inline-flex items-center px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-sm text-cyan-400">
                          Search: "{currentSearchTerm}"
                        </span>
                      )}
                      {filters.automationStatus !== 'all' && (
                        <span className="inline-flex items-center px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-purple-400">
                          Automation: {AUTOMATION_STATUS_LABELS[parseInt(filters.automationStatus) as keyof typeof AUTOMATION_STATUS_LABELS]}
                        </span>
                      )}
                      {filters.priority !== 'all' && (
                        <span className="inline-flex items-center px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-sm text-green-400">
                          Priority: {filters.priority}
                        </span>
                      )}
                      {filters.type !== 'all' && (
                        <span className="inline-flex items-center px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm text-blue-400">
                          State: {filters.state === '1' ? 'Active' : filters.state === '2' ? 'Draft' : filters.state === '3' ? 'In Review' : filters.state === '4' ? 'Outdated' : filters.state === '5' ? 'Rejected' : filters.state}
                        </span>
                      )}
                      {filters.tags && filters.tags.length > 0 && (
                        <span className="inline-flex items-center px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-sm text-yellow-400">
                          Tags: {filters.tags?.length || 0} selected
                        </span>
                      )}
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-gray-400 hover:text-white underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </Card>

                {/* Test Cases Table */}
                <Card className="overflow-hidden">
                  {loading && (
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center z-10">
                      <Loader className="w-6 h-6 text-cyan-400 animate-spin" />
                    </div>
                  )}
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800/50 border-b border-slate-700">
                        <tr>
                          <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">ID</th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Title</th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Type</th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Priority</th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Tags</th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Automation Status</th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testCases.map((testCase) => (
                          <tr key={testCase.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 px-6 text-sm text-gray-300 font-mono">
                              #{testCase.id}
                            </td>
                            <td className="py-4 px-6">
                              <h3 className="font-semibold text-white">{testCase.title}</h3>
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/50">
                                {TEST_CASE_TYPES[getTestTypeNumber(testCase.type)] || testCase.type}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <StatusBadge status={testCase.priority} type="priority" />
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(testCase.tags) && testCase.tags.length > 0 ? (
                                  testCase.tags.slice(0, 2).map((tag, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                    >
                                      {tag}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-500 text-xs">No tags</span>
                                )}
                                {Array.isArray(testCase.tags) && testCase.tags.length > 2 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                    +{testCase.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <StatusBadge status={testCase.automationStatus} type="automation" />
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => openEditModal(testCase)}
                                  className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors"
                                  title="Edit"
                                  disabled={isSubmitting}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteDialog(testCase)}
                                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                                  title="Delete"
                                  disabled={isSubmitting}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {testCases.length === 0 && !loading && (
                      <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">No test cases found</p>
                          <p className="text-sm">
                            {currentSearchTerm
                              ? currentSearchTerm 
                                ? `No test cases found matching "${currentSearchTerm}" across all folders in this project.`
                               : `No test cases found matching your filters${selectedFolder ? ` in ${selectedFolder.name}` : ''}.`
                              : selectedFolder
                                ? `No test cases found in ${selectedFolder?.name}. Create your first test case to get started.`
                                : `Select a folder to view test cases.`
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="border-t border-slate-700 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                          Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                          {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                          {pagination.totalItems} test cases
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
                          <span className="text-sm text-gray-400">
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
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filters Sidebar */}
      {isFiltersSidebarOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsFiltersSidebarOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-96 bg-gradient-to-b from-slate-800 to-slate-900 border-l border-purple-500/30 shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h3 className="text-xl font-semibold text-white">Filters</h3>
                <button
                  onClick={() => setIsFiltersSidebarOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filters Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Automation Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Automation Status
                  </label>
                  <select
                    value={filters.automationStatus}
                    onChange={(e) => updateFilter('automationStatus', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="all">All Automation Status</option>
                    <option value="1">{AUTOMATION_STATUS_LABELS[1]}</option>
                    <option value="2">{AUTOMATION_STATUS_LABELS[2]}</option>
                    <option value="3">{AUTOMATION_STATUS_LABELS[3]}</option>
                    <option value="4">{AUTOMATION_STATUS_LABELS[4]}</option>
                    <option value="5">{AUTOMATION_STATUS_LABELS[5]}</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Priority
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => updateFilter('priority', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Test Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => updateFilter('type', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="all">All Types</option>
                    {Object.entries(TEST_CASE_TYPES).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Tags Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Tags
                  </label>
                  <TagSelector
                    availableTags={tags}
                    selectedTags={filters.tags}
                    onTagsChange={(selectedTags) => updateFilter('tags', selectedTags)}
                    onCreateTag={handleCreateTag}
                    placeholder="Search or create tags..."
                  />
                </div>

                {/* State Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    State
                  </label>
                  <select
                    value={filters.state}
                    onChange={(e) => updateFilter('state', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="all">All States</option>
                    <option value="1">Active</option>
                    <option value="2">Draft</option>
                    <option value="3">In Review</option>
                    <option value="4">Outdated</option>
                    <option value="5">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-700 p-6">
                <div className="flex space-x-3">
                  <Button
                    variant="secondary"
                    onClick={clearAllFilters}
                    className="flex-1"
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={() => {
                      applyFilters();
                      setIsFiltersSidebarOpen(false);
                    }}
                    className="flex-1"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateTestCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTestCase}
        isSubmitting={isSubmitting}
      />

      <UpdateTestCaseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditTestCase}
        testCase={selectedTestCase}
        isSubmitting={isSubmitting}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteTestCase}
        title="Delete Test Case"
        message={`Are you sure you want to delete the test case "${selectedTestCase?.title}"? This action is irreversible.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default TestCases;