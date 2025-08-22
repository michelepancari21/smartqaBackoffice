import React, { useState, useEffect } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';
import Modal from '../UI/Modal';
import UpdateTestCaseForm from './UpdateTestCaseForm';
import UpdateTestCaseSteps from './UpdateTestCaseSteps';
import UpdateTestCaseAttachments from './UpdateTestCaseAttachments';
import UpdateTestCaseSidebar from './UpdateTestCaseSidebar';
import SharedStepSelectorModal from '../SharedStep/SharedStepSelectorModal';
import SharedStepViewModal from '../SharedStep/SharedStepViewModal';
import { useUsers } from '../../context/UsersContext';
import { useAuth } from '../../context/AuthContext';
import { useUpdateTestCaseData } from '../../hooks/useUpdateTestCaseData';
import { Tag } from '../../services/tagsApi';
import { SharedStep } from '../../services/sharedStepsApi';
import { TestCase } from '../../types';
import { attachmentsApiService } from '../../services/attachmentsApi';
import { getStateNumber, getPriorityNumber, getTestTypeNumber, buildStepResultsRelationships, buildSharedStepsRelationships } from '../../utils/updateTestCaseHelpers';

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
  availableTags: Tag[];
  onCreateTag: (label: string) => Promise<Tag>;
  tagsLoading: boolean;
  selectedProject: any;
}

const UpdateTestCaseModal: React.FC<UpdateTestCaseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  testCase,
  isSubmitting,
  availableTags,
  onCreateTag,
  tagsLoading,
  selectedProject
}) => {
  const { state: authState } = useAuth();
  const { users, loading: usersLoading } = useUsers();

  // Form state
  const [formData, setFormData] = useState({
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

  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<Array<{
    file: File;
    key: string;
    cloudFrontUrl: string;
    attachmentId?: string;
  }>>([]);

  // Modal states for shared step selection
  const [isSharedStepSelectorOpen, setIsSharedStepSelectorOpen] = useState(false);
  const [isSharedStepViewOpen, setIsSharedStepViewOpen] = useState(false);
  const [selectedSharedStepForView, setSelectedSharedStepForView] = useState<SharedStep | null>(null);

  // Use the custom hook for data management
  const {
    testSteps,
    setTestSteps,
    sharedSteps,
    setSharedSteps,
    stepOrder,
    setStepOrder,
    selectedTags,
    setSelectedTags,
    existingAttachments,
    setExistingAttachments,
    loadingAttachments,
    isLoadingData,
    loadTestCaseData,
    resetData
  } = useUpdateTestCaseData();

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
      // Populate form with existing test case data
      setFormData({
        title: testCase.title,
        template: 1,
        description: testCase.description,
        preconditions: testCase.preconditions || '',
        owner: '',
        state: getStateNumber(testCase.status),
        priority: getPriorityNumber(testCase.priority),
        testCaseType: getTestTypeNumber(testCase.type),
        automationStatus: testCase.automationStatus
      });

      setAttachments([]);
      loadTestCaseData(testCase, availableTags);
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
      setAttachments([]);
      resetData();
    }
  }, [isOpen, testCase, availableTags, loadTestCaseData, resetData]);

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
    setStepOrder(prev => [...prev, { type: 'step', id: newStep.id }]);
  };

  const updateTestStep = (id: string, field: 'step' | 'result', value: string) => {
    setTestSteps(prev => prev.map(step => 
      step.id === id ? { ...step, [field]: value } : step
    ));
  };

  const removeTestStep = (id: string) => {
    setTestSteps(prev => prev.filter(step => step.id !== id));
    setStepOrder(prev => prev.filter(item => !(item.type === 'step' && item.id === id)));
  };

  const addSharedStep = (sharedStep: SharedStep) => {
    const isAlreadyAdded = sharedSteps.some(existing => existing.id === sharedStep.id);
    if (isAlreadyAdded) {
      return;
    }
    
    setSharedSteps(prev => [...prev, sharedStep]);
    setStepOrder(prev => [...prev, { type: 'shared', id: `shared-${sharedStep.id}` }]);
  };

  const removeSharedStep = (sharedStepId: string) => {
    setSharedSteps(prev => prev.filter(step => step.id !== sharedStepId));
    setStepOrder(prev => prev.filter(item => !(item.type === 'shared' && item.id === `shared-${sharedStepId}`)));
  };

  const viewSharedStep = (sharedStep: SharedStep) => {
    setSelectedSharedStepForView(sharedStep);
    setIsSharedStepViewOpen(true);
  };

  const handleAttachmentUploaded = (uploadData: any) => {
    setUploadedAttachments(prev => [...prev, {
      file: uploadData.file,
      key: uploadData.key,
      cloudFrontUrl: uploadData.cloudFrontUrl,
      attachmentId: undefined
    }]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stepOrder.findIndex(item => item.id === active.id);
      const newIndex = stepOrder.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedOrder = arrayMove(stepOrder, oldIndex, newIndex);
        setStepOrder(reorderedOrder);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create NEW attachments via API
    const newlyCreatedAttachments: Array<{
      type: "Attachment";
      id: string;
    }> = [];
    
    const attachmentsToCreate = uploadedAttachments.filter(uploaded => {
      const alreadyExists = existingAttachments.some(existing => 
        existing.url === uploaded.cloudFrontUrl
      );
      return !alreadyExists;
    });
    
    if (attachmentsToCreate.length > 0 && authState.user?.id) {
      for (const uploadedAttachment of attachmentsToCreate) {
        try {
          const attachmentResponse = await attachmentsApiService.createAttachment({
            url: uploadedAttachment.cloudFrontUrl,
            userId: authState.user.id
          });
          
          newlyCreatedAttachments.push({
            type: "Attachment",
            id: `/api/attachments/${attachmentResponse.data.attributes.id}`
          });
        } catch (error) {
          console.error('📎 Failed to create attachment:', error);
          throw error;
        }
      }
    }
    
    // Combine existing attachments with newly created ones
    const allAttachmentsForPayload: Array<{
      type: "Attachment";
      id: string;
    }> = [
      ...existingAttachments.map(existing => ({
        type: "Attachment" as const,
        id: `/api/attachments/${existing.id}`
      })),
      ...newlyCreatedAttachments
    ];
    
    const stepResultsRelationships = buildStepResultsRelationships(stepOrder, testSteps);
    const sharedStepsRelationships = buildSharedStepsRelationships(stepOrder, sharedSteps);
    
    const submitData = {
      title: formData.title,
      description: formData.description,
      testSteps: testSteps,
      preconditions: formData.preconditions,
      owner: formData.owner,
      state: formData.state,
      priority: formData.priority,
      testCaseType: formData.testCaseType,
      automationStatus: formData.automationStatus,
      tags: selectedTags,
      stepResultsRelationships,
      sharedStepsRelationships,
      createdAttachments: allAttachmentsForPayload
    };
    
    await onSubmit(submitData);
  };

  const handleCreateTag = async (label: string): Promise<Tag> => {
    return await onCreateTag(label);
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
            <UpdateTestCaseForm
              formData={formData}
              onInputChange={handleInputChange}
              isSubmitting={isSubmitting}
            />

            <div className="mt-6">
              <UpdateTestCaseSteps
                testSteps={testSteps}
                sharedSteps={sharedSteps}
                stepOrder={stepOrder}
                onAddTestStep={addTestStep}
                onUpdateTestStep={updateTestStep}
                onRemoveTestStep={removeTestStep}
                onRemoveSharedStep={removeSharedStep}
                onViewSharedStep={viewSharedStep}
                onDragEnd={handleDragEnd}
                onOpenSharedStepSelector={() => setIsSharedStepSelectorOpen(true)}
                isSubmitting={isSubmitting}
              />
            </div>

            <div className="mt-6">
              <UpdateTestCaseAttachments
                existingAttachments={existingAttachments}
                attachments={attachments}
                onFilesChange={setAttachments}
                onFileUploaded={handleAttachmentUploaded}
                loadingAttachments={loadingAttachments}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>

          {/* Sidebar - 1/4 width */}
          <UpdateTestCaseSidebar
            formData={formData}
            onInputChange={handleInputChange}
            users={users}
            usersLoading={usersLoading}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            availableTags={availableTags}
            onCreateTag={handleCreateTag}
            isSubmitting={isSubmitting}
            onClose={onClose}
            onSubmit={handleSubmit}
          />
        </form>
      </div>

      {/* Shared Step Selector Modal */}
      <SharedStepSelectorModal
        isOpen={isSharedStepSelectorOpen}
        onClose={() => setIsSharedStepSelectorOpen(false)}
        onSelectSharedStep={addSharedStep}
        projectId={testCase?.projectId || null}
        disabled={isSubmitting}
      />

      {/* Shared Step View Modal */}
      <SharedStepViewModal
        isOpen={isSharedStepViewOpen}
        onClose={() => setIsSharedStepViewOpen(false)}
        sharedStep={selectedSharedStepForView}
      />
    </Modal>
  );
};

export default UpdateTestCaseModal;