import React, { useState, useEffect } from 'react';
import { X, Loader, Calendar, User, Tag as TagIcon, Clock, CheckCircle, Edit, Eye, XCircle, AlertTriangle, Target, Shield, Flame, ZoomIn } from 'lucide-react';
import { format } from 'date-fns';
import { testCasesApiService } from '../../services/testCasesApi';
import { sharedStepsApiService } from '../../services/sharedStepsApi';
import { apiService } from '../../services/api';
import { TestCase } from '../../types';
import { TEST_RESULTS, TestResultId } from '../../types';
import toast from 'react-hot-toast';

interface TestCaseDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  testCase: TestCase | null;
  context?: 'test-cases' | 'test-run-details' | 'test-runs-overview';
  testRunId?: string;
  currentExecutionResult?: TestResultId;
  onExecutionResultChange?: (testCaseId: string, testRunId: string, newResultId: TestResultId) => void;
}

interface StepResult {
  id: string;
  step: string;
  result: string;
  order: number;
}

interface SharedStepWithDetails {
  id: string;
  title: string;
  description?: string;
  order: number;
  stepResults: StepResult[];
}

interface TestCaseDetails {
  id: string;
  title: string;
  description: string;
  preconditions?: string;
  priority: string;
  type: string;
  status: string;
  automationStatus: number;
  tags: string[];
  stepResults: StepResult[];
  sharedSteps: SharedStepWithDetails[];
  attachments: Array<{
    id: string;
    url: string;
    fileName: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const STATES = {
  1: { label: 'Active', icon: CheckCircle, color: 'text-green-400' },
  2: { label: 'Draft', icon: Edit, color: 'text-orange-400' },
  3: { label: 'In Review', icon: Eye, color: 'text-blue-400' },
  4: { label: 'Outdated', icon: Clock, color: 'text-gray-400' },
  5: { label: 'Rejected', icon: XCircle, color: 'text-red-400' }
} as const;

// Image Modal Component
const ImageModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
}> = ({ isOpen, onClose, imageSrc, imageAlt }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="absolute inset-4 flex items-center justify-center">
        <div className="relative max-w-[90vw] max-h-[90vh] bg-slate-800 rounded-lg border border-slate-600 shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">Image Viewer</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced HTML Content Component with clickable images
const ClickableHtmlContent: React.FC<{
  content: string;
  className?: string;
  onImageClick: (src: string, alt: string) => void;
}> = ({ content, className = '', onImageClick }) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (contentRef.current) {
      // Find all images in the content and make them clickable
      const images = contentRef.current.querySelectorAll('img');
      
      images.forEach((img) => {
        // Add click handler
        const handleClick = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          onImageClick(img.src, img.alt || 'Image');
        };
        
        // Style the image to indicate it's clickable with standardized dimensions
        img.style.cursor = 'pointer';
        img.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
        img.style.maxWidth = '200px';
        img.style.maxHeight = '120px';
        img.style.width = 'auto';
        img.style.height = 'auto';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '6px';
        img.style.border = '1px solid #475569';
        img.title = 'Click to view larger';
        
        // Add hover effects
        const handleMouseEnter = () => {
          img.style.transform = 'scale(1.05)';
          img.style.boxShadow = '0 8px 25px rgba(6, 182, 212, 0.4)';
        };
        
        const handleMouseLeave = () => {
          img.style.transform = 'scale(1)';
          img.style.boxShadow = '0 4px 12px rgba(6, 182, 212, 0.3)';
        };
        
        img.addEventListener('click', handleClick);
        img.addEventListener('mouseenter', handleMouseEnter);
        img.addEventListener('mouseleave', handleMouseLeave);
        
        // Cleanup function
        return () => {
          img.removeEventListener('click', handleClick);
          img.removeEventListener('mouseenter', handleMouseEnter);
          img.removeEventListener('mouseleave', handleMouseLeave);
        };
      });
    }
  }, [content, onImageClick]);

  return (
    <div 
      ref={contentRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

const PRIORITIES = {
  1: { label: 'Low', icon: Shield, color: 'text-green-400' },
  2: { label: 'Medium', icon: Target, color: 'text-yellow-400' },
  3: { label: 'High', icon: Flame, color: 'text-orange-500' },
  4: { label: 'Critical', icon: AlertTriangle, color: 'text-red-500' }
} as const;

// Test Result Dropdown Component
const TestResultDropdown: React.FC<{
  value: TestResultId;
  onChange: (value: TestResultId) => void;
  disabled?: boolean;
  isUpdating?: boolean;
}> = ({
  value,
  onChange,
  disabled = false,
  isUpdating = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedResult = TEST_RESULTS[value];

  const getResultColor = (resultId: TestResultId): string => {
    switch (resultId) {
      case 1: return 'bg-green-400';
      case 2: return 'bg-red-400';
      case 3: return 'bg-yellow-400';
      case 4: return 'bg-orange-400';
      case 5: return 'bg-purple-400';
      case 6: return 'bg-gray-400';
      case 7: return 'bg-blue-400';
      case 8: return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && !isUpdating && setIsOpen(!isOpen)}
        disabled={disabled || isUpdating}
        className={`w-full px-3 py-2 text-sm font-medium rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-400 text-left flex items-center justify-between bg-slate-700 border-slate-600 text-white ${
          disabled || isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
        }`}
      >
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${getResultColor(value)}`}></div>
          <span>{selectedResult}</span>
        </div>
        {isUpdating ? (
          <Loader className="w-4 h-4 animate-spin text-gray-400" />
        ) : (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && !disabled && !isUpdating && (
        <>
          <div 
            className="fixed inset-0 z-[70]" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-[71] max-h-60 overflow-y-auto">
            {Object.entries(TEST_RESULTS).map(([resultId, label]) => (
              <button
                key={resultId}
                type="button"
                onClick={() => {
                  onChange(parseInt(resultId) as TestResultId);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors flex items-center text-sm"
              >
                <div className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${getResultColor(parseInt(resultId) as TestResultId)}`}></div>
                <span className="text-white">{label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const TestCaseDetailsSidebar: React.FC<TestCaseDetailsSidebarProps> = ({
  isOpen,
  onClose,
  testCase,
  context = 'test-cases',
  testRunId,
  currentExecutionResult,
  onExecutionResultChange
}) => {
  const [testCaseDetails, setTestCaseDetails] = useState<TestCaseDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingResult, setIsUpdatingResult] = useState(false);

  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    src: string;
    alt: string;
  }>({
    isOpen: false,
    src: '',
    alt: ''
  });

  const handleImageClick = (src: string, alt: string) => {
    setImageModal({
      isOpen: true,
      src,
      alt
    });
  };

  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      src: '',
      alt: ''
    });
  };

  useEffect(() => {
    if (isOpen && testCase) {
      fetchTestCaseDetails(testCase.id);
    } else {
      setTestCaseDetails(null);
      setError(null);
    }
  }, [isOpen, testCase]);

  const fetchTestCaseDetails = async (testCaseId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching test case details for sidebar:', testCaseId);
      
      // Fetch test case with includes
      const response = await testCasesApiService.getTestCaseWithIncludes(testCaseId);
      
      console.log('✅ Received test case details:', response);
      
      // Process included data to extract step results and shared steps
      const stepResults: StepResult[] = [];
      const sharedSteps: SharedStepWithDetails[] = [];
      const attachments: Array<{ id: string; url: string; fileName: string }> = [];
      
      if (response.included) {
        // Separate step results and shared steps from included data
        const stepResultsData = response.included.filter(item => item.type === 'StepResult');
        const sharedStepsData = response.included.filter(item => item.type === 'SharedStep');
        
        // Process step results
        stepResultsData.forEach(stepResult => {
          stepResults.push({
            id: stepResult.id.split('/').pop() || stepResult.attributes.id.toString(),
            step: stepResult.attributes.step || '',
            result: stepResult.attributes.result || '',
            order: stepResult.attributes.order || 0
          });
        });
        
        // Process shared steps - we'll fetch full details separately
        sharedStepsData.forEach(sharedStep => {
          sharedSteps.push({
            id: sharedStep.id.split('/').pop() || sharedStep.attributes.id.toString(),
            title: sharedStep.attributes.title || 'Shared Step',
            description: sharedStep.attributes.description || '',
            order: sharedStep.attributes.order || 0,
            stepResults: [] // Will be populated below
          });
        });
        
        // Fetch full details for each shared step
        if (sharedSteps.length > 0) {
          console.log('🔄 Fetching full details for', sharedSteps.length, 'shared steps');
          
          const sharedStepPromises = sharedSteps.map(async (sharedStep) => {
            try {
              console.log('🔄 Fetching shared step details for ID:', sharedStep.id);
              const sharedStepResponse = await sharedStepsApiService.getSharedStep(sharedStep.id);
              const fullSharedStep = sharedStepsApiService.transformApiSharedStep(sharedStepResponse.data, sharedStepResponse.included);
              
              // Fetch step results for this shared step
              if (fullSharedStep.stepResults && fullSharedStep.stepResults.length > 0) {
                console.log('🔄 Fetching step results for shared step:', sharedStep.id);
                
                const stepResultPromises = fullSharedStep.stepResults.map(stepResultId => 
                  sharedStepsApiService.getStepResult(stepResultId)
                );
                
                const stepResultResponses = await Promise.all(stepResultPromises);
                
                const stepResultsData = stepResultResponses
                  .map(response => ({
                    id: response.data.attributes.id.toString(),
                    step: response.data.attributes.step,
                    result: response.data.attributes.result,
                    order: response.data.attributes.order
                  }))
                  .sort((a, b) => a.order - b.order);
                
                // Update the shared step with full step results
                sharedStep.stepResults = stepResultsData;
                console.log('✅ Loaded', stepResultsData.length, 'step results for shared step:', sharedStep.title);
              }
              
              // Update other details
              sharedStep.title = fullSharedStep.title;
              sharedStep.description = fullSharedStep.description;
              
            } catch (error) {
              console.error('❌ Failed to fetch shared step details for ID:', sharedStep.id, error);
              // Keep the basic shared step info if fetch fails
            }
          });
          
          await Promise.all(sharedStepPromises);
          console.log('✅ Finished fetching all shared step details');
        }
      }
      
      // Process attachments from relationships
      if (response.data.relationships.attachments?.data) {
        console.log('📎 Processing attachments from relationships...');
        
        const attachmentPromises = response.data.relationships.attachments.data.map(async (attachmentRef) => {
          try {
            const attachmentId = attachmentRef.id.split('/').pop();
            console.log('📎 Fetching attachment details for ID:', attachmentId);
            
            const attachmentResponse = await apiService.authenticatedRequest(`/attachments/${attachmentId}`);
            
            if (attachmentResponse?.data?.attributes) {
              const url = attachmentResponse.data.attributes.url;
              const fileName = url.split('/').pop() || 'Unknown file';
              
              return {
                id: attachmentId || '',
                url: url,
                fileName: fileName
              };
            }
            return null;
          } catch (error) {
            console.error('❌ Failed to fetch attachment details:', error);
            return null;
          }
        });
        
        const attachmentResults = await Promise.all(attachmentPromises);
        attachments.push(...attachmentResults.filter(Boolean) as Array<{ id: string; url: string; fileName: string }>);
        
        console.log('✅ Processed', attachments.length, 'attachments');
      }
      
      // Sort by order
      stepResults.sort((a, b) => a.order - b.order);
      sharedSteps.sort((a, b) => a.order - b.order);
      
      // Convert API values to display values
      const priorityMap = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
      const typeMap = {
        1: 'Other', 2: 'Acceptance', 3: 'Accessibility', 4: 'Compatibility',
        5: 'Destructive', 6: 'Functional', 7: 'Performance', 8: 'Regression',
        9: 'Security', 10: 'Smoke & Sanity', 11: 'Usability'
      };
      const statusMap = { 1: 'Active', 2: 'Draft', 3: 'In Review', 4: 'Outdated', 5: 'Rejected' };
      
      const details: TestCaseDetails = {
        id: response.data.attributes.id.toString(),
        title: response.data.attributes.title,
        description: response.data.attributes.description,
        preconditions: response.data.attributes.preconditions || '',
        priority: priorityMap[response.data.attributes.priority as keyof typeof priorityMap] || 'Medium',
        type: typeMap[response.data.attributes.type as keyof typeof typeMap] || 'Functional',
        status: statusMap[response.data.attributes.state as keyof typeof statusMap] || 'Draft',
        automationStatus: response.data.attributes.automation,
        tags: response.data.attributes.tags || [],
        stepResults,
        sharedSteps,
        attachments,
        createdAt: new Date(response.data.attributes.createdAt),
        updatedAt: new Date(response.data.attributes.updatedAt)
      };
      
      setTestCaseDetails(details);
      
    } catch (err) {
      console.error('❌ Failed to fetch test case details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load test case details');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityNumber = (priority: string): number => {
    const priorityMap = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
    return priorityMap[priority as keyof typeof priorityMap] || 2;
  };

  const getStateNumber = (status: string): number => {
    const stateMap = { 'Active': 1, 'Draft': 2, 'In Review': 3, 'Outdated': 4, 'Rejected': 5 };
    return stateMap[status as keyof typeof stateMap] || 2;
  };

  const isImageUrl = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const urlLower = url.toLowerCase();
    return imageExtensions.some(ext => urlLower.includes(ext));
  };

  const getFileNameFromUrl = (url: string): string => {
    try {
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      // Remove query parameters if any
      return fileName.split('?')[0] || 'Unknown file';
    } catch {
      return 'Unknown file';
    }
  };

  const handleExecutionResultChange = async (newResultId: TestResultId) => {
    if (!testCase || !testRunId) return;

    const newResultLabel = TEST_RESULTS[newResultId];
    
    try {
      setIsUpdatingResult(true);

      console.log(`🔄 Updating execution result for test case ${testCase.id} in test run ${testRunId} to: ${newResultId} (${newResultLabel})`);

      // Get the current test case data to preserve ALL existing relationships
      const testCaseResponse = await testCasesApiService.getTestCase(testCase.id);
      const currentTestCase = testCaseResponse.data;

      // Build the complete PATCH payload preserving ALL relationships
      const patchPayload = {
        data: {
          type: "TestCase",
          attributes: {
            title: currentTestCase.attributes.title,
            description: currentTestCase.attributes.description,
            priority: currentTestCase.attributes.priority,
            type: currentTestCase.attributes.type,
            state: currentTestCase.attributes.state,
            automation: currentTestCase.attributes.automation,
            template: currentTestCase.attributes.template || 1,
            preconditions: currentTestCase.attributes.preconditions || ''
          },
          relationships: {
            project: currentTestCase.relationships.project,
            ...(currentTestCase.relationships.folder && {
              folder: currentTestCase.relationships.folder
            }),
            ...(currentTestCase.relationships.tags && {
              tags: currentTestCase.relationships.tags
            }),
            ...(currentTestCase.relationships.stepResults && {
              step_results: currentTestCase.relationships.stepResults
            }),
            ...(currentTestCase.relationships.sharedSteps && {
              shared_steps: currentTestCase.relationships.sharedSteps
            }),
            ...(currentTestCase.relationships.attachments && {
              attachments: currentTestCase.relationships.attachments
            }),
            creator: currentTestCase.relationships.creator,
            editor: currentTestCase.relationships.editor,
            test_runs: {
              data: (() => {
                const existingTestRuns = currentTestCase.relationships?.testRuns?.data || [];
                const otherTestRuns = existingTestRuns.filter((tr: any) => {
                  const trId = tr.id.split('/').pop();
                  return trId !== testRunId;
                });
                
                return [
                  ...otherTestRuns,
                  {
                    type: "TestRun",
                    id: `/api/test_runs/${testRunId}`,
                    meta: {
                      result: newResultId
                    }
                  }
                ];
              })()
            }
          }
        }
      };

      await apiService.authenticatedRequest(`/test_cases/${testCase.id}`, {
        method: 'PATCH',
        body: JSON.stringify(patchPayload),
      });

      // Notify parent component of the change
      if (onExecutionResultChange) {
        onExecutionResultChange(testCase.id, testRunId, newResultId);
      }


    } catch (error) {
      console.error('❌ Failed to update execution result:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update execution result';
      toast.error(errorMessage);
    } finally {
      setIsUpdatingResult(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
        <div className="fixed top-0 right-0 bottom-0 w-[33vw] bg-gradient-to-b from-slate-800 to-slate-900 border-l border-purple-500/30 shadow-2xl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h3 className="text-xl font-semibold text-white">TEST CASE DETAILS</h3>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading test case details...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-400 mb-4">
                    <p className="text-lg font-medium">Failed to load details</p>
                    <p className="text-sm text-gray-400 mt-2">{error}</p>
                  </div>
                </div>
              ) : testCaseDetails ? (
                <div className="space-y-6">
                  {/* Test Case ID and Title */}
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-cyan-400">TC-{testCaseDetails.id}</span>
                    </div>
                    <h2 className="text-lg font-semibold text-white mb-4">{testCaseDetails.title}</h2>
                  </div>

                  {/* Description */}
                  {testCaseDetails.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
                      <ClickableHtmlContent
                        content={testCaseDetails.description}
                        className="text-sm text-gray-300 bg-slate-700/50 border border-slate-600 rounded-lg p-3"
                        onImageClick={handleImageClick}
                      />
                    </div>
                  )}

                  {/* Preconditions */}
                  {testCaseDetails.preconditions && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Preconditions</h4>
                      <ClickableHtmlContent
                        content={testCaseDetails.preconditions}
                        className="text-sm text-gray-300 bg-slate-700/50 border border-slate-600 rounded-lg p-3"
                        onImageClick={handleImageClick}
                      />
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-medium text-gray-400 mb-2">Priority</h4>
                      <div className="flex items-center">
                        {(() => {
                          const priorityNum = getPriorityNumber(testCaseDetails.priority);
                          const priorityConfig = PRIORITIES[priorityNum as keyof typeof PRIORITIES];
                          return (
                            <>
                              <priorityConfig.icon className={`w-4 h-4 mr-2 ${priorityConfig.color}`} />
                              <span className="text-sm text-white">{priorityConfig.label}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-400 mb-2">Status</h4>
                      <div className="flex items-center">
                        {(() => {
                          const stateNum = getStateNumber(testCaseDetails.status);
                          const stateConfig = STATES[stateNum as keyof typeof STATES];
                          return (
                            <>
                              <stateConfig.icon className={`w-4 h-4 mr-2 ${stateConfig.color}`} />
                              <span className="text-sm text-white">{stateConfig.label}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Type and Automation */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <h4 className="text-xs font-medium text-gray-400 mb-2">Type</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/50">
                        {testCaseDetails.type}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-gray-400 mb-2">Automation Status</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/50">
                        {testCaseDetails.automationStatus === 1 ? 'Not automated' :
                         testCaseDetails.automationStatus === 2 ? 'Automated' :
                         testCaseDetails.automationStatus === 3 ? 'Not required' :
                         testCaseDetails.automationStatus === 4 ? 'Cannot automate' :
                         testCaseDetails.automationStatus === 5 ? 'Obsolete' : 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {testCaseDetails.tags && testCaseDetails.tags.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-400 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {testCaseDetails.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                          >
                            <TagIcon className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Steps & Results */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-300">All Steps & Results:</h4>
                    </div>

                    <div className="space-y-4">
                      {/* Render step results and shared steps in order */}
                      {[...testCaseDetails.stepResults, ...testCaseDetails.sharedSteps]
                        .sort((a, b) => a.order - b.order)
                        .map((item, index) => {
                          const isSharedStep = 'stepResults' in item;
                          
                          return (
                            <div key={`${isSharedStep ? 'shared' : 'step'}-${item.id}`} className="border border-slate-600 rounded-lg">
                              <div className="bg-slate-700/50 px-4 py-2 border-b border-slate-600">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-sm font-medium text-white flex items-center">
                                    <span className="w-6 h-6 bg-cyan-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                                      {String(index + 1).padStart(2, '0')}
                                    </span>
                                    Step {String(index + 1).padStart(2, '0')}
                                    {isSharedStep && (
                                      <span className="ml-2 text-xs text-purple-400">- Shared Step</span>
                                    )}
                                  </h5>
                                </div>
                              </div>
                              
                              <div className="p-4">
                                {isSharedStep ? (
                                  <div>
                                    <h6 className="font-medium text-purple-200 mb-2">{(item as SharedStepWithDetails).title}</h6>
                                    {(item as SharedStepWithDetails).description && (
                                      <p className="text-sm text-purple-300/80 mb-3">{(item as SharedStepWithDetails).description}</p>
                                    )}
                                    
                                    {/* Display shared step's step results */}
                                    {(item as SharedStepWithDetails).stepResults.length > 0 ? (
                                      <div className="space-y-3 mt-3">
                                        {(item as SharedStepWithDetails).stepResults.map((stepResult, stepIndex) => (
                                          <div key={stepResult.id} className="bg-purple-900/20 border border-purple-500/30 rounded p-3">
                                            <div className="text-xs text-purple-300 font-medium mb-2">
                                              Shared Step {stepIndex + 1}
                                            </div>
                                            <div className="space-y-2">
                                              <div>
                                                <div className="text-xs text-purple-400 mb-1">Step</div>
                                                <ClickableHtmlContent
                                                  content={stepResult.step}
                                                  className="text-sm text-purple-200"
                                                  onImageClick={handleImageClick}
                                                />
                                              </div>
                                              <div>
                                                <div className="text-xs text-purple-400 mb-1">Result</div>
                                                <ClickableHtmlContent
                                                  content={stepResult.result}
                                                  className="text-sm text-purple-200"
                                                  onImageClick={handleImageClick}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-purple-300/60 mt-3">
                                        No step details available for this shared step
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div>
                                      <h6 className="text-xs font-medium text-gray-400 mb-1">Step</h6>
                                      <ClickableHtmlContent
                                        content={(item as StepResult).step}
                                        className="text-sm text-gray-300"
                                        onImageClick={handleImageClick}
                                      />
                                    </div>
                                    <div>
                                      <h6 className="text-xs font-medium text-gray-400 mb-1">Result</h6>
                                      <ClickableHtmlContent
                                        content={(item as StepResult).result}
                                        className="text-sm text-gray-300"
                                        onImageClick={handleImageClick}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {testCaseDetails.stepResults.length === 0 && testCaseDetails.sharedSteps.length === 0 && (
                      <div className="text-center py-8 text-gray-400 border-2 border-dashed border-slate-600 rounded-lg">
                        <p>No steps defined for this test case.</p>
                      </div>
                    )}
                  </div>

                  {/* Test Execution Result - Only show for test run contexts */}
                  {context !== 'test-cases' && testRunId && currentExecutionResult && (
                    <div className="pt-4 border-t border-slate-700">
                      <h4 className="text-sm font-medium text-gray-300 mb-3">Test Execution Result</h4>
                      <TestResultDropdown
                        value={currentExecutionResult}
                        onChange={handleExecutionResultChange}
                        disabled={isUpdatingResult}
                        isUpdating={isUpdatingResult}
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Update the execution result for this test case in the current test run
                      </p>
                    </div>
                  )}

                  {/* Attachments */}
                  {testCaseDetails.attachments && testCaseDetails.attachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Attachments ({testCaseDetails.attachments.length})</h4>
                      <div className="space-y-2">
                        {testCaseDetails.attachments.map((attachment) => (
                          <div key={attachment.id} className="bg-slate-700/50 border border-slate-600 rounded-lg p-3">
                            {isImageUrl(attachment.url) ? (
                              <div className="space-y-2">
                                <div className="text-xs text-gray-400">{getFileNameFromUrl(attachment.url)}</div>
                                <img
                                  src={attachment.url}
                                  alt={attachment.fileName}
                                  className="max-w-full h-auto max-h-32 object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => handleImageClick(attachment.url, attachment.fileName)}
                                  title="Click to view larger"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  <div className="text-sm text-gray-300 truncate">{getFileNameFromUrl(attachment.url)}</div>
                                </div>
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                                >
                                  Download
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata Footer */}
                  <div className="pt-4 border-t border-slate-700 space-y-3">
                    <div className="flex items-center text-xs text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Created: {format(testCaseDetails.createdAt, 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                    {testCaseDetails.updatedAt.getTime() !== testCaseDetails.createdAt.getTime() && (
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Updated: {format(testCaseDetails.updatedAt, 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
        imageSrc={imageModal.src}
        imageAlt={imageModal.alt}
      />
    </>
  );
};

export default TestCaseDetailsSidebar;