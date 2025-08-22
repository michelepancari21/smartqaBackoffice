import React, { useState, useCallback } from 'react';
import { Search, Loader } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import TestCasesHeader from '../components/TestCase/TestCasesHeader';
import TestCasesFilters from '../components/TestCase/TestCasesFilters';
import TestCasesTable from '../components/TestCase/TestCasesTable';
import TestCasesFolderSidebar from '../components/TestCase/TestCasesFolderSidebar';
import TestCasesFiltersSidebar from '../components/TestCase/TestCasesFiltersSidebar';
import CreateTestCaseModal from '../components/TestCase/CreateTestCaseModal';
import UpdateTestCaseModal from '../components/TestCase/UpdateTestCaseModal';
import CreateFolderModal from '../components/Folder/CreateFolderModal';
import TestCaseDetailsSidebar from '../components/TestCase/TestCaseDetailsSidebar';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTestCases } from '../hooks/useTestCases';
import { useFolders } from '../hooks/useFolders';
import { useTestCasesFilters } from '../hooks/useTestCasesFilters';
import { useTestCasesNavigation } from '../hooks/useTestCasesNavigation';
import { foldersApiService } from '../services/foldersApi';
import { TestCase } from '../types';
import { Tag } from '../services/tagsApi';
import { getPriorityString, getTestTypeString, getStatusString } from '../utils/testCaseHelpers';
import toast from 'react-hot-toast';

const TestCases: React.FC = () => {
  const { getSelectedProject, state: appState, createTag } = useApp();
  const { state: authState } = useAuth();
  const selectedProject = getSelectedProject();
  
  // Use tags from app context
  const tags = appState.tags;
  const tagsLoading = appState.isLoadingTags;
  
  const { 
    folderTree, 
    loading: foldersLoading, 
    selectedFolderId, 
    selectFolder,
    getSelectedFolder,
    updateFoldersFromTestCases
  } = useFolders(selectedProject?.id);

  const {
    filters,
    updateFilter,
    clearAllFilters: clearFilters,
    hasActiveFilters,
    buildMultipleFilters
  } = useTestCasesFilters();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFiltersSidebarOpen, setIsFiltersSidebarOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [filtersCleared, setFiltersCleared] = useState(false);
  const [isDetailsSidebarOpen, setIsDetailsSidebarOpen] = useState(false);
  const [selectedTestCaseForDetails, setSelectedTestCaseForDetails] = useState<TestCase | null>(null);
  
  const { 
    testCases,
    allTestCases,
    loading, 
    error, 
    pagination, 
    currentFilterMode,
    setCurrentFilterMode,
    isInitialLoadComplete,
    fetchAllTestCasesAndExtractFolders,
    filterTestCasesByFolder,
    showFolderTestCases, 
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
  } = useTestCases(selectedProject?.id, selectedFolderId, updateFoldersFromTestCases, false);

  const { hasPendingNavigationFilter, isApplyingNavigationFilter } = useTestCasesNavigation(
    selectedProject,
    fetchAllTestCasesAndExtractFolders,
    updateFilter
  );

  const selectedFolder = getSelectedFolder();

  const handleSearch = useCallback(async (term: string) => {
    setCurrentSearchTerm(term);
    if (term.trim()) {
      await searchTestCases(term, 1);
    } else {
      if (hasActiveFilters()) {
        applyFilters();
      } else {
        setCurrentFilterMode('folder');
        showFolderTestCases();
      }
    }
  }, [searchTestCases, showFolderTestCases, setCurrentFilterMode, hasActiveFilters]);

  const applyFilters = useCallback(async () => {
    setCurrentSearchTerm('');
    setSearchTerm('');
    
    if (!hasActiveFilters()) {
      setCurrentFilterMode('folder');
      showFolderTestCases();
    } else {
      const multipleFilters = buildMultipleFilters();
      console.log('🔍 Applying multiple filters:', multipleFilters);
      await filterTestCasesWithMultipleFilters(multipleFilters, 1);
    }
  }, [filters, hasActiveFilters, setCurrentFilterMode, showFolderTestCases, buildMultipleFilters, filterTestCasesWithMultipleFilters]);

  const clearAllFilters = useCallback(() => {
    clearFilters();
    setSearchTerm('');
    setCurrentSearchTerm('');
    setCurrentFilterMode('folder');
    setFiltersCleared(true);
    showFolderTestCases();
  }, [clearFilters, setCurrentFilterMode, showFolderTestCases]);

  const clearIndividualFilter = useCallback(async (filterType: keyof typeof filters, value?: any) => {
    // Handle search clearing
    if (filterType === 'search') {
      setSearchTerm('');
      setCurrentSearchTerm('');
      // Check if we still have other active filters
      if (hasActiveFilters()) {
        applyFilters();
      } else {
        setCurrentFilterMode('folder');
        showFolderTestCases();
      }
      return;
    }
    
    // Update the specific filter
    if (filterType === 'tags') {
      updateFilter('tags', []);
    } else {
      updateFilter(filterType, 'all');
    }
    
    // Wait a bit for state to update, then check if we still have active filters
    setTimeout(() => {
      // Build the updated filters manually to avoid stale closure
      const updatedFilters = {
        ...filters,
        [filterType]: filterType === 'tags' ? [] : 'all'
      };
      
      const hasRemainingFilters = updatedFilters.automationStatus !== 'all' || 
                                  updatedFilters.priority !== 'all' || 
                                  updatedFilters.type !== 'all' || 
                                  updatedFilters.state !== 'all' ||
                                  (updatedFilters.tags && updatedFilters.tags.length > 0);
      
      if (hasRemainingFilters) {
        // Still have filters, apply them
        // Re-apply all remaining filters
        applyFilters();
      } else {
        // No more filters, show folder test cases
        setCurrentFilterMode('folder');
        showFolderTestCases();
      }
    }, 100); // Increase timeout to ensure state updates
  }, [filters, updateFilter, buildMultipleFilters, filterTestCasesWithMultipleFilters, setCurrentFilterMode, showFolderTestCases]);

  // Effect to handle folder changes while preserving filters
  React.useEffect(() => {
    if (selectedProject && !hasPendingNavigationFilter) {
      const hasActiveSearch = currentSearchTerm.trim() !== '';
      
      if (filtersCleared) {
        console.log('🧹 Filters were explicitly cleared, not re-applying');
        setFiltersCleared(false);
        setCurrentFilterMode('folder');
        showFolderTestCases();
        return;
      }
      
      if (hasActiveSearch) {
        console.log('🔍 Folder changed with active search, re-running search:', currentSearchTerm);
        searchTestCases(currentSearchTerm, 1);
      } else if (hasActiveFilters()) {
        console.log('🔧 Folder changed with active filters, re-applying filters');
        applyFilters();
      } else {
        console.log('📁 Folder changed with no filters, fetching test cases');
        setCurrentFilterMode('folder');
        showFolderTestCases();
      }
    }
  }, [selectedFolderId]);

  const handleCreateFolder = useCallback(() => {
    setIsCreateFolderModalOpen(true);
  }, []);

  const handleCreateFolderSubmit = useCallback(async (data: {
    name: string;
    description: string;
    parentId?: string;
    childrenIds: string[];
  }) => {
    if (!selectedProject || !authState.user?.id) {
      toast.error('Missing required data');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await foldersApiService.createFolder({
        name: data.name,
        description: data.description,
        projectId: selectedProject.id,
        parentId: data.parentId,
        childrenIds: data.childrenIds,
        userId: authState.user.id
      });
      
      setIsCreateFolderModalOpen(false);
      toast.success('Folder created successfully');
      await fetchAllTestCasesAndExtractFolders(selectedProject.id);
      
    } catch (error) {
      console.error('Failed to create folder:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create folder';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedProject, authState.user?.id, fetchAllTestCasesAndExtractFolders]);

  const handleTestCaseTitleClick = useCallback((testCase: TestCase) => {
    console.log('📋 Test case title clicked:', testCase.title, 'ID:', testCase.id);
    setSelectedTestCaseForDetails(testCase);
    setIsDetailsSidebarOpen(true);
  }, []);

  const closeDetailsSidebar = useCallback(() => {
    setIsDetailsSidebarOpen(false);
    setSelectedTestCaseForDetails(null);
  }, []);

  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(searchTerm);
    }
  }, [searchTerm, handleSearch]);

  const handleCreateTestCase = useCallback(async (data: any) => {
    if (!data || !selectedProject || !selectedFolderId || !authState.user?.id) {
      toast.error('Missing required data');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Handle new tags creation first
      const processedTags = [];
      for (const tag of data.tags || []) {
        if (tag && tag.id && typeof tag.id === 'string' && tag.id.startsWith('temp-')) {
          try {
            const newTag = await createTag(tag.label);
            processedTags.push(newTag);
          } catch (error) {
            console.error('Failed to create tag:', error);
            toast.error(`Failed to create tag: ${tag.label}`);
            return;
          }
        } else if (tag && tag.id && tag.label) {
          processedTags.push(tag);
        }
      }
      
      await createTestCase({
        title: data.title,
        description: data.description,
        priority: data.priority,
        testCaseType: data.testCaseType,
        state: data.state,
        automationStatus: data.automationStatus,
        template: data.template,
        preconditions: data.preconditions,
        tags: processedTags,
        projectId: selectedProject.id,
        folderId: selectedFolderId,
        creatorId: authState.user.id,
        testSteps: data.testSteps || [],
        stepResultsRelationships: data.stepResultsRelationships || [],
        sharedStepsRelationships: data.sharedStepsRelationships || [],
        createdAttachments: data.createdAttachments || []
      });
      
      await fetchAllTestCasesAndExtractFolders(selectedProject.id);
      setIsCreateModalOpen(false);
      toast.success('Test case created successfully');
      
    } catch (error) {
      console.error('Failed to create test case:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create test case';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [createTestCase, selectedProject, selectedFolderId, authState.user?.id, fetchAllTestCasesAndExtractFolders]);

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
          try {
            const newTag = await createTag(tag.label);
            processedTags.push(newTag);
          } catch (error) {
            console.error('Failed to create tag:', error);
            toast.error(`Failed to create tag: ${tag.label}`);
            return;
          }
        } else if (tag && tag.id && tag.label) {
          const actualTag = tags.find(t => t.label === tag.label);
          if (actualTag) {
            processedTags.push(actualTag);
          } else {
            const tagById = tags.find(t => t.id === tag.id);
            if (tagById) {
              processedTags.push(tagById);
            } else {
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
      
      const updateData = {
        title: data.title,
        description: data.description,
        priority: data.priority === 1 ? 'low' : data.priority === 2 ? 'medium' : data.priority === 3 ? 'high' : data.priority === 4 ? 'critical' : 'medium',
        testType: getTestTypeString(data.testCaseType),
        status: data.state === 1 ? 'active' : 
                data.state === 2 ? 'draft' : 
                data.state === 3 ? 'in_review' :
                data.state === 4 ? 'outdated' : 
                data.state === 5 ? 'rejected' : 'draft',
        automationStatus: data.automationStatus,
        template: data.template,
        preconditions: data.preconditions,
        tags: processedTags,
        testSteps: data.testSteps || [],
        userId: authState.user.id,
        stepResultsRelationships: data.stepResultsRelationships,
        sharedStepsRelationships: data.sharedStepsRelationships || [],
        createdAttachments: data.createdAttachments || []
      };
      
      await updateTestCase(selectedTestCase.id, updateData);
      
      setIsEditModalOpen(false);
      setSelectedTestCase(null);
      toast.success('Test case updated successfully');
      await fetchAllTestCasesAndExtractFolders(selectedProject.id);
      
    } catch (error) {
      console.error('Failed to update test case:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update test case';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [updateTestCase, selectedTestCase, selectedProject, authState.user?.id, fetchAllTestCasesAndExtractFolders, createTag, tags, getTestTypeString]);

  const handleDeleteTestCase = useCallback(async () => {
    if (!selectedTestCase) return;
    
    try {
      setIsSubmitting(true);
      await deleteTestCase(selectedTestCase.id);
      
      if (selectedProject) {
        await fetchAllTestCasesAndExtractFolders(selectedProject.id);
      }
      
      setSelectedTestCase(null);
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteTestCase, selectedTestCase, selectedProject, fetchAllTestCasesAndExtractFolders]);

  const openEditModal = useCallback((testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setIsEditModalOpen(true);
  }, []);

  const openDeleteDialog = useCallback((testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setIsDeleteDialogOpen(true);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    if (currentSearchTerm.trim()) {
      searchTestCases(currentSearchTerm, page);
    } else if (hasActiveFilters()) {
      const multipleFilters = buildMultipleFilters();
      filterTestCasesWithMultipleFilters(multipleFilters, page);
    } else {
      console.log('📄 Paginating folder view - client-side pagination, page:', page);
      showFolderTestCases(undefined, page);
    }
  }, [filters, currentSearchTerm, searchTestCases, showFolderTestCases, hasActiveFilters, buildMultipleFilters, filterTestCasesWithMultipleFilters]);

  const handleCreateTag = useCallback(async (label: string): Promise<Tag> => {
    return await createTag(label);
  }, [createTag]);

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
          <Button onClick={() => fetchAllTestCasesAndExtractFolders(selectedProject?.id || '')}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TestCasesHeader
        selectedProject={selectedProject}
        totalItems={pagination.totalItems}
        selectedFolder={selectedFolder}
        onCreateTestCase={() => setIsCreateModalOpen(true)}
        disabled={!selectedProject || !selectedFolderId}
      />

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
          <TestCasesFolderSidebar
            folderTree={folderTree}
            selectedFolderId={selectedFolderId}
            onSelectFolder={selectFolder}
            foldersLoading={foldersLoading}
            onCreateFolder={handleCreateFolder}
            onClearIndividualFilter={clearIndividualFilter}
          />

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <TestCasesFilters
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              onSearchKeyPress={handleSearchKeyPress}
              currentSearchTerm={currentSearchTerm}
              filters={filters}
              onFilterChange={updateFilter}
              onApplyFilters={applyFilters}
              onClearAllFilters={clearAllFilters}
              onClearIndividualFilter={clearIndividualFilter}
              onOpenFiltersSidebar={() => setIsFiltersSidebarOpen(true)}
              availableTags={tags}
              onCreateTag={handleCreateTag}
            />

            <TestCasesTable
              testCases={testCases}
              loading={loading}
              isApplyingNavigationFilter={isApplyingNavigationFilter}
              currentSearchTerm={currentSearchTerm}
              selectedFolder={selectedFolder}
              pagination={pagination}
              onTestCaseTitleClick={handleTestCaseTitleClick}
              onEditTestCase={openEditModal}
              onDeleteTestCase={openDeleteDialog}
              onPageChange={handlePageChange}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      <TestCasesFiltersSidebar
        isOpen={isFiltersSidebarOpen}
        onClose={() => setIsFiltersSidebarOpen(false)}
        filters={filters}
        onFilterChange={updateFilter}
        onApplyFilters={applyFilters}
        onClearAllFilters={clearAllFilters}
        availableTags={tags}
        onCreateTag={handleCreateTag}
      />

      {/* Modals */}
      <CreateTestCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTestCase}
        isSubmitting={isSubmitting}
        availableTags={tags}
        onCreateTag={handleCreateTag}
        tagsLoading={tagsLoading}
        selectedProject={selectedProject}
      />

      <UpdateTestCaseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditTestCase}
        testCase={selectedTestCase}
        isSubmitting={isSubmitting}
        availableTags={tags}
        onCreateTag={handleCreateTag}
        tagsLoading={tagsLoading}
        selectedProject={selectedProject}
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

      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onSubmit={handleCreateFolderSubmit}
        isSubmitting={isSubmitting}
        availableFolders={folderTree}
      />

      <TestCaseDetailsSidebar
        isOpen={isDetailsSidebarOpen}
        onClose={closeDetailsSidebar}
        testCase={selectedTestCaseForDetails}
        context="test-cases"
      />
    </div>
  );
};

export default TestCases;