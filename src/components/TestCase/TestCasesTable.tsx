import React from 'react';
import { Edit, Trash2, Search, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import StatusBadge from '../UI/StatusBadge';
import { TestCase, TEST_CASE_TYPES } from '../../types';

interface TestCasesTableProps {
  testCases: TestCase[];
  loading: boolean;
  isApplyingNavigationFilter: boolean;
  currentSearchTerm: string;
  selectedFolder: any;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  onTestCaseTitleClick: (testCase: TestCase) => void;
  onEditTestCase: (testCase: TestCase) => void;
  onDeleteTestCase: (testCase: TestCase) => void;
  onPageChange: (page: number) => void;
  isSubmitting: boolean;
}

const TestCasesTable: React.FC<TestCasesTableProps> = ({
  testCases,
  loading,
  isApplyingNavigationFilter,
  currentSearchTerm,
  selectedFolder,
  pagination,
  onTestCaseTitleClick,
  onEditTestCase,
  onDeleteTestCase,
  onPageChange,
  isSubmitting
}) => {
  return (
    <Card className="overflow-hidden">
      {/* Loader overlay - positioned at top of card for visibility */}
      {(loading || isApplyingNavigationFilter) && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex items-start justify-center z-20 pt-8">
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <Loader className="w-5 h-5 text-cyan-400 animate-spin" />
              <span className="text-white font-medium">
                {isApplyingNavigationFilter ? 'Applying filters...' : 
                 testCases.length === 0 ? 'Loading test cases...' : 'Applying filters...'}
              </span>
            </div>
          </div>
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
                  <button
                    onClick={() => onTestCaseTitleClick(testCase)}
                    className="text-left w-full group"
                  >
                    <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors cursor-pointer">
                      {testCase.title}
                    </h3>
                  </button>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/50">
                    {(() => {
                      // Map our internal type strings to TEST_CASE_TYPES keys
                      const typeMapping = {
                        'other': 1,
                        'acceptance': 2,
                        'accessibility': 3,
                        'compatibility': 4,
                        'destructive': 5,
                        'functional': 6,
                        'performance': 7,
                        'regression': 8,
                        'security': 9,
                        'smoke': 10,
                        'usability': 11
                      };
                      const typeKey = typeMapping[testCase.type as keyof typeof typeMapping] || 6;
                      return TEST_CASE_TYPES[typeKey as keyof typeof TEST_CASE_TYPES] || testCase.type;
                    })()}
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
                      onClick={() => onEditTestCase(testCase)}
                      className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Edit"
                      disabled={isSubmitting}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTestCase(testCase)}
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
                  ? `No test cases found matching "${currentSearchTerm}" across all folders in this project.`
                  : `No test cases found matching your filters${selectedFolder ? ` in ${selectedFolder.name}` : ' in this project'}.`
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="border-t border-slate-700 px-6 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="text-sm text-gray-400">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
              {pagination.totalItems} test cases
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage - 1)}
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
                onClick={() => onPageChange(pagination.currentPage + 1)}
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
  );
};

export default TestCasesTable;