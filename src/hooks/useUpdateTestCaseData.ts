import { useState, useEffect, useCallback } from 'react';
import { testCasesApiService } from '../services/testCasesApi';
import { sharedStepsApiService } from '../services/sharedStepsApi';
import { apiService } from '../services/api';
import { TestCase } from '../types';
import { Tag } from '../services/tagsApi';
import { SharedStep } from '../services/sharedStepsApi';

interface TestStep {
  id: string;
  step: string;
  result: string;
  originalId?: string;
}

interface UseUpdateTestCaseDataReturn {
  testSteps: TestStep[];
  setTestSteps: React.Dispatch<React.SetStateAction<TestStep[]>>;
  sharedSteps: SharedStep[];
  setSharedSteps: React.Dispatch<React.SetStateAction<SharedStep[]>>;
  stepOrder: Array<{ type: 'step' | 'shared'; id: string }>;
  setStepOrder: React.Dispatch<React.SetStateAction<Array<{ type: 'step' | 'shared'; id: string }>>>;
  selectedTags: Tag[];
  setSelectedTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  existingAttachments: Array<{ id: string; url: string; fileName: string }>;
  setExistingAttachments: React.Dispatch<React.SetStateAction<Array<{ id: string; url: string; fileName: string }>>>;
  loadingAttachments: boolean;
  isLoadingData: boolean;
  loadTestCaseData: (testCase: TestCase, availableTags: Tag[]) => Promise<void>;
  resetData: () => void;
}

export const useUpdateTestCaseData = (): UseUpdateTestCaseDataReturn => {
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [sharedSteps, setSharedSteps] = useState<SharedStep[]>([]);
  const [stepOrder, setStepOrder] = useState<Array<{ type: 'step' | 'shared'; id: string }>>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Array<{
    id: string;
    url: string;
    fileName: string;
  }>>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const loadExistingAttachments = useCallback(async (testCaseId: string) => {
    try {
      setLoadingAttachments(true);
      console.log('📎 Loading existing attachments for test case:', testCaseId);
      
      const testCaseResponse = await testCasesApiService.getTestCase(testCaseId);
      const attachmentRelationships = testCaseResponse.data.relationships?.attachments?.data || [];
      
      if (attachmentRelationships.length === 0) {
        setExistingAttachments([]);
        return;
      }
      
      const attachmentPromises = attachmentRelationships.map(async (attachmentRef: any) => {
        try {
          const attachmentId = attachmentRef.id.split('/').pop();
          const attachmentResponse = await apiService.authenticatedRequest(`/attachments/${attachmentId}`);
          
          return {
            id: attachmentId,
            url: attachmentResponse.data.attributes.url,
            fileName: attachmentResponse.data.attributes.url.split('/').pop() || 'attachment'
          };
        } catch (error) {
          console.error('📎 Failed to fetch attachment details:', error);
          return null;
        }
      });
      
      const attachmentDetails = (await Promise.all(attachmentPromises)).filter(Boolean);
      setExistingAttachments(attachmentDetails);
      
    } catch (error) {
      console.error('📎 Failed to load existing attachments:', error);
      setExistingAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  }, []);

  const loadTestCaseData = useCallback(async (testCase: TestCase, availableTags: Tag[]) => {
    setIsLoadingData(true);
    
    try {
      console.log('🔄 Fetching test case with includes:', testCase.id);
      
      const response = await testCasesApiService.getTestCaseWithIncludes(testCase.id);
      console.log('✅ Received test case with includes:', response);
      
      const allItemsWithOrder: Array<{
        id: string;
        originalId?: string;
        step?: string;
        result?: string;
        sharedStepId?: string;
        order: number;
        type: 'step' | 'shared';
        includedData?: any;
      }> = [];
      
      if (response.included) {
        for (const includedItem of response.included) {
          if (includedItem.type === 'StepResult') {
            const stepResultId = includedItem.id.split('/').pop() || includedItem.attributes.id.toString();
            allItemsWithOrder.push({
              id: stepResultId,
              originalId: stepResultId,
              step: includedItem.attributes.step,
              result: includedItem.attributes.result,
              order: includedItem.attributes.order || 0,
              type: 'step'
            });
          } else if (includedItem.type === 'SharedStep') {
            const sharedStepId = includedItem.id.split('/').pop() || includedItem.attributes.id.toString();
            allItemsWithOrder.push({
              id: `shared-${sharedStepId}`,
              sharedStepId: sharedStepId,
              order: includedItem.attributes.order || 0,
              type: 'shared',
              includedData: includedItem
            });
          }
        }
      }
      
      allItemsWithOrder.sort((a, b) => a.order - b.order);
      
      const processedTestSteps = allItemsWithOrder
        .filter(item => item.type === 'step')
        .map(item => ({
          id: item.id,
          originalId: item.originalId!,
          step: item.step!,
          result: item.result!
        }));
        
      setTestSteps(processedTestSteps);
      
      const basicSharedSteps = allItemsWithOrder
        .filter(item => item.type === 'shared')
        .map(item => {
          const includedData = item.includedData;
          return {
            id: item.sharedStepId!,
            title: includedData.attributes.title || 'Shared Step',
            description: includedData.attributes.description || '',
            projectId: testCase.projectId,
            stepsCount: 0,
            usedInCount: 0,
            stepResults: [],
            createdBy: {
              id: '',
              name: 'Unknown',
              email: ''
            },
            createdAt: new Date(includedData.attributes.createdAt || new Date()),
            updatedAt: new Date(includedData.attributes.updatedAt || new Date())
          };
        });
        
      setSharedSteps(basicSharedSteps);
      
      const orderedSteps = allItemsWithOrder.map(item => ({
        type: item.type,
        id: item.id
      }));
      setStepOrder(orderedSteps);
      
      // Fetch full shared step data
      const sharedStepIds = allItemsWithOrder
        .filter(item => item.type === 'shared')
        .map(item => item.sharedStepId!);
        
      if (sharedStepIds.length > 0) {
        try {
          const sharedStepPromises = sharedStepIds.map(async (sharedStepId) => {
            try {
              const sharedStepResponse = await sharedStepsApiService.getSharedStep(sharedStepId);
              return {
                id: sharedStepId,
                data: sharedStepsApiService.transformApiSharedStep(sharedStepResponse.data, sharedStepResponse.included)
              };
            } catch (error) {
              console.error(`❌ Failed to fetch shared step ${sharedStepId}:`, error);
              return null;
            }
          });
          
          const fetchedSharedStepsResults = (await Promise.all(sharedStepPromises)).filter(Boolean);
          
          setSharedSteps(prevSharedSteps => {
            const fetchedMap = new Map(fetchedSharedStepsResults.map(result => [result!.id, result!.data]));
            return prevSharedSteps.map(prevStep => {
              const fullStep = fetchedMap.get(prevStep.id);
              return fullStep || prevStep;
            });
          });
        } catch (error) {
          console.error('❌ Failed to fetch shared step details:', error);
        }
      }
      
      await loadExistingAttachments(testCase.id);
      
      // Process tags
      let existingTags: Tag[] = [];
      if (testCase.tags && testCase.tags.length > 0) {
        existingTags = testCase.tags
          .filter(tagLabel => tagLabel && typeof tagLabel === 'string')
          .map(tagLabel => {
            const foundTag = availableTags.find(availableTag => availableTag.label === tagLabel);
            return foundTag || {
              id: tagLabel,
              label: tagLabel
            };
          })
          .filter(tag => tag !== null && tag !== undefined);
      }
      setSelectedTags(existingTags);
      
    } catch (error) {
      console.error('❌ Failed to fetch test case with includes:', error);
      setTestSteps([]);
      setSharedSteps([]);
      setStepOrder([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [loadExistingAttachments]);

  const resetData = useCallback(() => {
    setTestSteps([]);
    setSharedSteps([]);
    setStepOrder([]);
    setSelectedTags([]);
    setExistingAttachments([]);
    setIsLoadingData(false);
  }, []);

  return {
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
  };
};