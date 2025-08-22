import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import { TestRun } from '../../services/testRunsApi';

interface CloneTestRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    includeAllTestCases: boolean;
    includeByResults: boolean;
    selectedResults: string[];
    copyTestCaseAssignee: boolean;
    copyTags: boolean;
    copyLinkedIssues: boolean;
  }) => Promise<void>;
  testRun: TestRun | null;
  isSubmitting: boolean;
}

const CloneTestRunModal: React.FC<CloneTestRunModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  testRun,
  isSubmitting
}) => {
  const [formData, setFormData] = useState({
    name: '',
    includeAllTestCases: true,
    includeByResults: false,
    selectedResults: [] as string[],
    copyTestCaseAssignee: true,
    copyTags: true,
    copyLinkedIssues: false
  });

  // Mock test case results data for the second screenshot
  const testCaseResults = [
    { id: 'passed', label: 'Passed', count: 48, color: 'text-green-400' },
    { id: 'failed', label: 'Failed', count: 20, color: 'text-red-400' },
    { id: 'blocked', label: 'Blocked', count: 5, color: 'text-purple-400' },
    { id: 'retest', label: 'Retest', count: 4, color: 'text-yellow-400' },
    { id: 'skipped', label: 'Skipped', count: 7, color: 'text-gray-400' },
    { id: 'untested', label: 'Untested', count: 14, color: 'text-gray-500' },
    { id: 'in_progress', label: 'In Progress', count: 0, color: 'text-blue-400' },
    { id: 'unknown', label: 'Unknown', count: 0, color: 'text-gray-600' }
  ];

  // Reset form when modal opens/closes or testRun changes
  useEffect(() => {
    if (isOpen && testRun) {
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      
      setFormData({
        name: `${testRun.name} - ${dateStr} - Copy`,
        includeAllTestCases: true,
        includeByResults: false,
        selectedResults: [],
        copyTestCaseAssignee: true,
        copyTags: true,
        copyLinkedIssues: false
      });
    }
  }, [isOpen, testRun]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestCaseSelectionChange = (type: 'all' | 'results') => {
    if (type === 'all') {
      setFormData(prev => ({
        ...prev,
        includeAllTestCases: true,
        includeByResults: false,
        selectedResults: []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        includeAllTestCases: false,
        includeByResults: true
      }));
    }
  };

  const handleResultToggle = (resultId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedResults: prev.selectedResults.includes(resultId)
        ? prev.selectedResults.filter(id => id !== resultId)
        : [...prev.selectedResults, resultId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  if (!testRun) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Clone Test Run"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Test Run Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Test Run Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            required
            disabled={isSubmitting}
            placeholder="Enter test run name"
          />
        </div>

        {/* Select Test Cases */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Select Test Cases:
          </label>
          
          <div className="space-y-3">
            {/* All test cases option */}
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="testCaseSelection"
                checked={formData.includeAllTestCases}
                onChange={() => handleTestCaseSelectionChange('all')}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500 focus:ring-2"
                disabled={isSubmitting}
              />
              <span className="ml-3 text-white">All test cases</span>
            </label>

            {/* By test case results option */}
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="testCaseSelection"
                checked={formData.includeByResults}
                onChange={() => handleTestCaseSelectionChange('results')}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500 focus:ring-2"
                disabled={isSubmitting}
              />
              <span className="ml-3 text-white">By test case results</span>
            </label>
          </div>

          {/* Info message for all test cases */}
          {formData.includeAllTestCases && (
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start">
                <Info className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-300">
                  All {testRun.testCasesCount} test cases from previous test run will be added in this test run
                </p>
              </div>
            </div>
          )}

          {/* Test case results selection */}
          {formData.includeByResults && (
            <div className="mt-4 p-4 bg-slate-800 border border-slate-600 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Select by results:</h4>
              <div className="grid grid-cols-2 gap-3">
                {testCaseResults.map((result) => (
                  <label key={result.id} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.selectedResults.includes(result.id)}
                      onChange={() => handleResultToggle(result.id)}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500 focus:ring-2 rounded"
                      disabled={isSubmitting}
                    />
                    <div className="ml-3 flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        result.id === 'passed' ? 'bg-green-400' :
                        result.id === 'failed' ? 'bg-red-400' :
                        result.id === 'blocked' ? 'bg-purple-400' :
                        result.id === 'retest' ? 'bg-yellow-400' :
                        result.id === 'skipped' ? 'bg-gray-400' :
                        result.id === 'untested' ? 'bg-gray-500' :
                        result.id === 'in_progress' ? 'bg-blue-400' :
                        'bg-gray-600'
                      }`}></div>
                      <span className={`text-sm ${result.color}`}>
                        {result.label} ({result.count})
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Copy options */}
        <div className="space-y-3">
          {/* Copy Test Case Assignee */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.copyTestCaseAssignee}
              onChange={(e) => handleInputChange('copyTestCaseAssignee', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500 focus:ring-2 rounded"
              disabled={isSubmitting}
            />
            <span className="ml-3 text-white">Copy Test Case Assignee to new test run</span>
          </label>

          {/* Copy Tags */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.copyTags}
              onChange={(e) => handleInputChange('copyTags', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500 focus:ring-2 rounded"
              disabled={isSubmitting}
            />
            <span className="ml-3 text-white">Copy Tags to new test run</span>
          </label>

          {/* Copy Linked Issues */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.copyLinkedIssues}
              onChange={(e) => handleInputChange('copyLinkedIssues', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500 focus:ring-2 rounded"
              disabled={isSubmitting}
            />
            <span className="ml-3 text-white">Copy Linked Issues to new test run</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-700">
          <Button 
            variant="secondary" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            Clone
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CloneTestRunModal;