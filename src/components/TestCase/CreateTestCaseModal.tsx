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
import { Tag } from '../../services/tagsApi';

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
}

interface CreateTestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
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
            {Object.entries(options).map(([optionValue, { label, icon: Icon, color }]) => (
              <button
                key={optionValue}
                type="button"
                onClick={() => {
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

const CreateTestCaseModal: React.FC<CreateTestCaseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Reset form
      setFormData({
        title: '',
        template: 1,
        description: '',
        preconditions: '',
        owner: '',
        state: 2,
        priority: 1,
        testCaseType: 6,
        automationStatus: 1
      });
      setTestSteps([]);
      setSelectedTags([]);
      setAttachments([]);
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: any) => {
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
    
    // Create any new tags before submitting
    const processedTags = [];
    for (const tag of selectedTags) {
      if (tag.id.startsWith('temp-')) {
        // This is a new tag, create it
        try {
          const newTag = await createTag(tag.label);
          processedTags.push(newTag);
        } catch (error) {
          console.error('Failed to create tag:', error);
          // Continue with the temporary tag if creation fails
          processedTags.push(tag);
        }
      } else {
        // Existing tag
        processedTags.push(tag);
      }
    }
    
    const submitData = {
      ...formData,
      testSteps,
      tags: processedTags,
      attachments
    };

    await onSubmit(submitData);
  };

  const handleCreateTag = async (label: string): Promise<Tag> => {
    return await createTag(label);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Create New Test Case"
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

          {/* Sidebar - 1/4 width - Optimisé en hauteur avec largeurs fixes et padding-left ajouté */}
          <div className="w-80 border-l border-slate-700 pl-6 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4 pl-2 pr-2"> {/* Ajout de padding-left de 0.5rem (pl-2) */}
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

                {/* State avec icônes dans la liste déroulante */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    State
                  </label>
                  <IconSelect
                    value={formData.state}
                    onChange={(value) => handleInputChange('state', value)}
                    options={STATES}
                    disabled={isSubmitting}
                    placeholder="Select state"
                  />
                </div>

                {/* Priority avec icônes dans la liste déroulante */}
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
                  <div className="max-w-full"> {/* Container pour limiter la largeur */}
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
                      Creating...
                    </>
                  ) : (
                    'Create Test Case'
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

export default CreateTestCaseModal;