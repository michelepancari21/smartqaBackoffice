import React, { useState, useEffect } from 'react';
import { Plus, Loader, CheckCircle, Edit, Eye, Clock, XCircle, AlertTriangle, Zap, Target, Shield, Flame } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import TagSelector from '../UI/TagSelector';
import FileUpload from '../UI/FileUpload';
import WysiwygEditor from '../UI/WysiwygEditor';
import DraggableTestStep from './DraggableTestStep';
import { useUsers } from '../../hooks/useUsers';
import { useTags } from '../../hooks/useTags';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { testCasesApiService } from '../../services/testCasesApi';
import { Tag } from '../../services/tagsApi';
import { TestCase } from '../../types';

// Mappings constants
const TEMPLATES = {
  1: 'Test Case Steps',
  2: 'Test Case Bdd'
} as const;

const STATES = {
  1: { label: 'Active', icon: CheckCircle, color: 'text-green-400' },
  2: { label: 'Draft', icon: Edit, color: 'text-orange-400' },
  3: { label: 'In Review', icon: Eye, color: 'text-blue-400' },
  4: { label: 'Outdated', icon: Clock, color: 'text-gray-400' },
  5: { label: 'Rejected', icon: XCircle, color: 'text-red-400' }
} as const;

const PRIORITIES = {
  1: { label: 'Low', icon: Shield, color: 'text-green-400' },
  2: { label: 'Medium', icon: Target, color: 'text-yellow-400' },
  3: { label: 'High', icon: Flame, color: 'text-orange-500' },
  4: { label: 'Critical', icon: AlertTriangle, color: 'text-red-500' }
} as const;

const TEST_CASE_TYPES = {
  1: 'Other',
  2: 'Acceptance',
  3: 'Accessibility',
  4: 'Compatibility',
  5: 'Destructive',
  6: 'Functional',
  7: 'Performance',
  8: 'Regression',
  9: 'Security',
  10: 'Smoke & Sanity',
  11: 'Usability'
} as const;

const AUTOMATION_STATUS = {
  1: 'Not automated',
  2: 'Automated',
  3: 'Automation not required',
  4: 'Cannot be automated',
  5: 'Obsolete'
} as const;

interface TestStep {
  id: string;
  step: string;
  result: string;
  originalId?: string;
}

interface UpdateTestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  testCase: TestCase | null;
  isSubmitting: boolean;
}

// Custom Select Component with Icons
const IconSelect: React.FC<{
  value: number;
  onChange: (value: number) => void;
  options: Record<number, { label: string; icon: any; color: string }>;
  disabled?: boolean;
  placeholder?: string;
}> = ({ value, onChange, options, disabled = false, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options[value];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm text-left flex items-center justify-between"
      >
        <div className="flex items-center">
          {selectedOption && (
            <>
              <selectedOption.icon className={`w-4 h-4 mr-2 ${selectedOption.color}`} />
              <span>{selectedOption.label}</span>
            </>
          )}
          {!selectedOption && placeholder && (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {console.log('IconSelect options being rendered:', Object.entries(options))}
            {Object.entries(options).map(([optionValue, { label, icon: Icon, color }]) => (
              <button
                key={optionValue}
                type="button"
                onClick={() => {
                  console.log('IconSelect: option clicked, value:', optionValue, 'parsed:', parseInt(optionValue));
                  onChange(parseInt(optionValue));
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-slate-700 transition-colors flex items-center text-sm"
              >
                <Icon className={`w-4 h-4 mr-2 ${color}`} />
                <span className="text-white">{label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Helper functions to convert between UI and API values

const UpdateTestCaseModal: React.FC<UpdateTestCaseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  testCase,
  isSubmitting
}) => {
  const { state: authState } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const { tags, createTag } = useTags();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    template: 1,
    description: '',
    preconditions: '',
    owner: '',
    state: 2, // Draft by default
    priority: 2, // Medium by default
    testCaseType: 6, // Functional by default
    automationStatus: 1 // Not automated by default
  });

  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Set current user as default owner when users are loaded
  useEffect(() => {
    if (users.length > 0 && authState.user && !formData.owner) {
      const currentUser = users.find(user => user.email === authState.user?.email);
      if (currentUser) {
        setFormData(prev => ({ ...prev, owner: currentUser.id }));
      }
    }
  }, [users, authState.user, formData.owner]);

  // Populate form when testCase changes
  useEffect(() => {
    if (isOpen && testCase) {
      const fetchTagDetails = async () => {
        // Fetch actual tag details if the test case has tag labels
        let existingTags: Tag[] = [];
        
        if (testCase.tags && testCase.tags.length > 0) {
          try {
            console.log('🏷️ Fetching tag details for test case:', testCase.id);
            console.log('🏷️ Test case tags:', testCase.tags);
            
            // The testCase.tags should now contain tag labels (strings) from the API transformation
            // Create Tag objects using the labels
            existingTags = testCase.tags
              .filter(tagLabel => tagLabel && typeof tagLabel === 'string')
              .map(tagLabel => {
                // Find the actual tag by label to get the proper ID
                const foundTag = tags.find(availableTag => availableTag.label === tagLabel);
                return foundTag || {
                  id: tagLabel, // Use label as ID for display purposes
                  label: tagLabel
                };
              })
              .filter(tag => tag !== null && tag !== undefined);
            
            console.log('✅ Processed existing tags:', existingTags);
            
          } catch (error) {
            console.error('❌ Failed to fetch tags:', error);
          }
        }
        
        setSelectedTags(existingTags);
      };

      const fetchStepResults = async () => {
        let existingSteps: (TestStep & { originalId?: string })[] = [];
        
        if (testCase.stepResults && testCase.stepResults.length > 0) {
          try {
            console.log('🔄 Fetching step results for test case:', testCase.id);
            
            // Fetch all step results in parallel
            const stepResultPromises = testCase.stepResults.map(stepResultId => 
              testCasesApiService.getStepResult(stepResultId)
            );
            
            const stepResultResponses = await Promise.all(stepResultPromises);
            
            // Transform and sort by order
            existingSteps = stepResultResponses
              .map(response => ({
                id: response.data.attributes.id.toString(), // Keep as display ID
                originalId: response.data.attributes.id.toString(), // Store original API ID
                step: response.data.attributes.step,
                result: response.data.attributes.result,
                order: response.data.attributes.order
              }))
              .sort((a, b) => a.order - b.order) // Sort by order: 1, 2, 3, etc.
              .map(step => ({
                id: step.id,
                originalId: step.originalId,
                step: step.step,
                result: step.result
              }));
            
            console.log('✅ Fetched and sorted step results:', existingSteps);
            
          } catch (error) {
            console.error('❌ Failed to fetch step results:', error);
            // Fallback to empty steps if fetch fails
            existingSteps = [];
          }
        }
        
        setTestSteps(existingSteps);
      };

      // Add debug logging to see what the testCase.status actually contains
      console.log('🔍 TestCase status from API:', testCase.status, 'type:', typeof testCase.status);
      console.log('🔍 Mapping to state number:', testCase.status === 'active' ? 1 : testCase.status === 'draft' ? 2 : testCase.status === 'in_review' ? 3 : testCase.status === 'outdated' ? 4 : testCase.status === 'rejected' ? 5 : 2);
      
      // Populate form with existing test case data
      setFormData({
        title: testCase.title,
        template: 1, // Default template
        description: testCase.description,
        preconditions: testCase.preconditions || '', // Use existing preconditions or empty string
        owner: '', // Will be set by the user effect above
        state: testCase.status === 'active' ? 1 : testCase.status === 'draft' ? 2 : testCase.status === 'in_review' ? 3 : testCase.status === 'outdated' ? 4 : testCase.status === 'rejected' ? 5 : 2,
        priority: testCase.priority === 'low' ? 1 : testCase.priority === 'medium' ? 2 : testCase.priority === 'high' ? 3 : testCase.priority === 'critical' ? 4 : 2,
        testCaseType: testCase.type === 'functional' ? 6 : testCase.type === 'regression' ? 8 : testCase.type === 'smoke' ? 10 : testCase.type === 'integration' ? 4 : testCase.type === 'performance' ? 7 : 6,
        automationStatus: testCase.automationStatus
      });

      fetchTagDetails();
      fetchStepResults();
      setAttachments([]);
    } else if (isOpen && !testCase) {
      // Reset form for new test case
      setFormData({
        title: '',
        template: 1,
        description: '',
        preconditions: '',
        owner: '',
        state: 2,
        priority: 2,
        testCaseType: 6,
        automationStatus: 1
      });
      setTestSteps([]);
      setSelectedTags([]);
      setAttachments([]);
    }
  }, [isOpen, testCase, tags]);

  const handleInputChange = (field: string, value: any) => {
    console.log('handleInputChange called:', field, '=', value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTestStep = () => {
    const newStep: TestStep = {
      id: Date.now().toString(),
      step: '',
      result: ''
    };
    setTestSteps(prev => [...prev, newStep]);
  };

  const updateTestStep = (id: string, field: 'step' | 'result', value: string) => {
    setTestSteps(prev => prev.map(step => 
      step.id === id ? { ...step, [field]: value } : step
    ));
  };

  const removeTestStep = (id: string) => {
    setTestSteps(prev => prev.filter(step => step.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTestSteps((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission - current formData.state:', formData.state);
    
    const submitData = {
      title: formData.title,
      template: formData.template,
      description: formData.description,
      preconditions: formData.preconditions,
      owner: formData.owner,
      state: formData.state, // Use the numeric state value directly
      priority: formData.priority, // Use the numeric priority value directly
      testCaseType: formData.testCaseType, // Use the numeric type value directly
      automationStatus: formData.automationStatus, // Use the numeric automation status directly
      testSteps, // Keep for the component's handleEditTestCase
      tags: selectedTags, // Pass the actual Tag objects with IDs
      attachments
    };

    console.log('🚀 Final submitData being sent:', submitData);
    console.log('🚀 State value being sent:', submitData.state, 'type:', typeof submitData.state);
    await onSubmit(submitData);
  };

  const handleCreateTag = async (label: string): Promise<Tag> => {
    return await createTag(label);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Update Test Case"
      size="full"
    >
      <div className="h-[calc(95vh-8rem)] flex flex-col">
        <form onSubmit={handleSubmit} className="flex-1 flex overflow-hidden">
          {/* Main Content - 3/4 width */}
          <div className="flex-1 pr-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Title and Template on same line */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-1">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-0 min-w-0"
                    required
                    disabled={isSubmitting}
                    placeholder="Enter test case title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Template
                  </label>
                  <select
                    value={formData.template}
                    onChange={(e) => handleInputChange('template', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    disabled={isSubmitting}
                  >
                    {Object.entries(TEMPLATES).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="px-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <WysiwygEditor
                  value={formData.description}
                  onChange={(value) => handleInputChange('description', value)}
                  placeholder="Enter test case description"
                  disabled={isSubmitting}
                />
              </div>

              {/* Preconditions */}
              <div className="px-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preconditions
                </label>
                <WysiwygEditor
                  value={formData.preconditions}
                  onChange={(value) => handleInputChange('preconditions', value)}
                  placeholder="Enter preconditions for this test case"
                  disabled={isSubmitting}
                />
              </div>

              {/* Steps and Results with Drag & Drop */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-300">
                    Steps and Results
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                    onClick={addTestStep}
                    disabled={isSubmitting}
                  >
                    Add Step
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {testSteps.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={testSteps.map(step => step.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {testSteps.map((step, index) => (
                          <DraggableTestStep
                            key={step.id}
                            step={step}
                            index={index}
                            onUpdate={updateTestStep}
                            onRemove={removeTestStep}
                            disabled={isSubmitting}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-slate-600 rounded-lg">
                      <p>No test steps added yet.</p>
                      <p className="text-sm">Click "Add Step" to create your first test step.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Attachments
                </label>
                <FileUpload
                  files={attachments}
                  onFilesChange={setAttachments}
                  disabled={isSubmitting}
                  accept="*/*"
                  multiple={true}
                  maxSize={10}
                />
              </div>
            </div>
          </div>

          {/* Sidebar - 1/4 width */}
          <div className="w-80 border-l border-slate-700 pl-6 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4 pl-2 pr-2">
                {/* Owner */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Owner
                  </label>
                  {usersLoading ? (
                    <div className="flex items-center text-gray-400 text-sm">
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Loading users...
                    </div>
                  ) : (
                    <select
                      value={formData.owner}
                      onChange={(e) => handleInputChange('owner', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm max-w-full"
                      disabled={isSubmitting}
                      required
                    >
                      <option value="">Select owner</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    State
                  </label>
                  <IconSelect
                    value={formData.state}
                    onChange={(value) => {
                      console.log('State IconSelect onChange called with value:', value);
                      console.log('State changed to:', value);
                      handleInputChange('state', value);
                    }}
                    options={STATES}
                    disabled={isSubmitting}
                    placeholder="Select state"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority
                  </label>
                  <IconSelect
                    value={formData.priority}
                    onChange={(value) => handleInputChange('priority', value)}
                    options={PRIORITIES}
                    disabled={isSubmitting}
                    placeholder="Select priority"
                  />
                </div>

                {/* Type of Test Case */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Type of Test Case
                  </label>
                  <select
                    value={formData.testCaseType}
                    onChange={(e) => handleInputChange('testCaseType', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm max-w-full"
                    disabled={isSubmitting}
                  >
                    {Object.entries(TEST_CASE_TYPES).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Automation Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Automation Status
                  </label>
                  <select
                    value={formData.automationStatus}
                    onChange={(e) => handleInputChange('automationStatus', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm max-w-full"
                    disabled={isSubmitting}
                  >
                    {Object.entries(AUTOMATION_STATUS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tags
                  </label>
                  <div className="max-w-full">
                    <TagSelector
                      availableTags={tags}
                      selectedTags={selectedTags}
                      onTagsChange={setSelectedTags}
                      onCreateTag={handleCreateTag}
                      disabled={isSubmitting}
                      placeholder="Search or create tags..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Moved inside sidebar */}
            <div className="border-t border-slate-700 pt-4 mt-4 flex-shrink-0">
              <div className="flex flex-col space-y-3">
                <Button variant="secondary" onClick={onClose} disabled={isSubmitting} className="w-full">
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Test Case'
                  )}
                </Button>
              </div>
            </div>
          </div>

        </form>
      </div>
    </Modal>
  );
};

export default UpdateTestCaseModal;