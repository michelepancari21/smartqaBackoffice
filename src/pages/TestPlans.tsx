import React, { useState, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, Loader, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import CreateTestPlanModal from '../components/TestPlan/CreateTestPlanModal';
import EditTestPlanModal from '../components/TestPlan/EditTestPlanModal';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTestPlans } from '../hooks/useTestPlans';
import { TestPlan } from '../services/testPlansApi';
import toast from 'react-hot-toast';

const TestPlans: React.FC = () => {
  const { getSelectedProject } = useApp();
  const { state: authState } = useAuth();
  const selectedProject = getSelectedProject();
  
  const { 
    testPlans, 
    loading, 
    error, 
    pagination, 
    fetchTestPlans, 
    searchTestPlans,
    createTestPlan, 
    updateTestPlan, 
    deleteTestPlan 
  } = useTestPlans(selectedProject?.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTestPlan, setSelectedTestPlan] = useState<TestPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = useCallback(async (term: string) => {
    setCurrentSearchTerm(term);
    if (term.trim()) {
      await searchTestPlans(term);
    } else {
      await fetchTestPlans(1);
    }
  }, [searchTestPlans, fetchTestPlans]);

  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(searchTerm);
    }
  }, [searchTerm, handleSearch]);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleCreateTestPlan = useCallback(async (data: any) => {
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    if (!authState.user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await createTestPlan({
        title: data.title,
        creatorId: authState.user.id
      });
      
      setIsCreateModalOpen(false);
      
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  }, [createTestPlan, selectedProject, authState.user?.id]);

  const handleEditTestPlan = useCallback(async (data: any) => {
    if (!selectedTestPlan) {
      toast.error('No test plan selected');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await updateTestPlan(selectedTestPlan.id, {
        title: data.title
      });
      
      setIsEditModalOpen(false);
      setSelectedTestPlan(null);
      
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  }, [updateTestPlan, selectedTestPlan]);

  const handleDeleteTestPlan = useCallback(async () => {
    if (!selectedTestPlan) return;
    
    try {
      setIsSubmitting(true);
      await deleteTestPlan(selectedTestPlan.id);
      setSelectedTestPlan(null);
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteTestPlan, selectedTestPlan]);

  const openEditModal = useCallback((testPlan: TestPlan) => {
    setSelectedTestPlan(testPlan);
    setIsEditModalOpen(true);
  }, []);

  const openDeleteDialog = useCallback((testPlan: TestPlan) => {
    setSelectedTestPlan(testPlan);
    setIsDeleteDialogOpen(true);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    if (currentSearchTerm.trim()) {
      searchTestPlans(currentSearchTerm, page);
    } else {
      fetchTestPlans(page);
    }
  }, [currentSearchTerm, searchTestPlans, fetchTestPlans]);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedTestPlan(null);
  }, []);

  if (loading && testPlans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading test plans...</p>
        </div>
      </div>
    );
  }

  if (error && testPlans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="p-8 text-center">
          <div className="text-red-400 mb-4">
            <p className="text-lg font-medium">Failed to load test plans</p>
            <p className="text-sm text-gray-400 mt-2">{error}</p>
          </div>
          <Button onClick={() => fetchTestPlans(1)}>
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
          <h2 className="text-2xl font-bold text-white">Test Plans</h2>
          <p className="text-gray-400">
            {selectedProject 
              ? `Manage test plans for ${selectedProject.name} (${pagination.totalItems} total)` 
              : `Manage test plans across all projects (${pagination.totalItems} total)`
            }
          </p>
          {selectedProject && (
            <div className="mt-2">
              <div className="inline-flex items-center px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-sm text-cyan-400">
                📁 Project: {selectedProject.name}
              </div>
            </div>
          )}
        </div>
        <Button 
          icon={Plus} 
          onClick={() => setIsCreateModalOpen(true)}
          disabled={!selectedProject}
          title={!selectedProject ? 'Please select a project first' : 'Create new test plan'}
        >
          New Test Plan
        </Button>
      </div>

      {/* Show message if no project selected */}
      {!selectedProject && (
        <Card className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No project selected</p>
            <p className="text-sm">Please select a project from the sidebar to view and manage test plans.</p>
          </div>
        </Card>
      )}

      {/* Only show content if project is selected */}
      {selectedProject && (
        <>
          {/* Search */}
          <Card className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search test plans by title..."
                value={searchTerm}
                onChange={handleSearchInputChange}
                onKeyPress={handleSearchKeyPress}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              {currentSearchTerm && (
                <div className="mt-2 text-sm text-cyan-400">
                  Searching for: "{currentSearchTerm}"
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setCurrentSearchTerm('');
                      fetchTestPlans(1);
                    }}
                    className="ml-2 text-gray-400 hover:text-white underline"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Test Plans Table */}
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
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Created</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Last Updated</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testPlans.map((testPlan) => (
                    <tr key={testPlan.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 text-sm text-gray-300 font-mono">
                        #{testPlan.id}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <h3 className="font-semibold text-white mb-1">{testPlan.title}</h3>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-sm text-gray-300">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{format(testPlan.createdAt, 'MMM dd, yyyy')}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-sm text-gray-300">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{format(testPlan.updatedAt, 'MMM dd, yyyy')}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(testPlan)}
                            className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Edit"
                            disabled={isSubmitting}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteDialog(testPlan)}
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
              
              {testPlans.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No test plans found</p>
                    <p className="text-sm">
                      {currentSearchTerm 
                        ? `No test plans found matching "${currentSearchTerm}". Try a different search term or create a new test plan.`
                        : 'No test plans found for this project. Create your first test plan to get started.'
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
                    {pagination.totalItems} test plans
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

      {/* Modals */}
      <CreateTestPlanModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateTestPlan}
        isSubmitting={isSubmitting}
      />

      <EditTestPlanModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleEditTestPlan}
        testPlan={selectedTestPlan}
        isSubmitting={isSubmitting}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteTestPlan}
        title="Delete Test Plan"
        message={`Are you sure you want to delete the test plan "${selectedTestPlan?.title}"? This action is irreversible.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default TestPlans;