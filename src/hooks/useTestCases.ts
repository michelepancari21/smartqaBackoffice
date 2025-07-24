import { useState, useEffect, useRef, useCallback } from 'react';
import { testCasesApiService, TestCasesApiResponse } from '../services/testCasesApi';
import { foldersApiService } from '../services/foldersApi';
import { TestCase } from '../types';
import toast from 'react-hot-toast';

export const useTestCases = (projectId?: string | null, folderId?: string | null, onFoldersExtracted?: (folders: any[]) => void) => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [allTestCases, setAllTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilterMode, setCurrentFilterMode] = useState<'folder' | 'search' | 'automation' | 'all'>('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalItems: 0,
    itemsPerPage: 30,
    totalPages: 1
  });

  // Utiliser des refs pour tracker les changements sans déclencher de re-rendus
  const previousProjectId = useRef<string | null>(null);
  const previousFolderId = useRef<string | null>(null);
  const hasInitialLoad = useRef<boolean>(false);

  // Initial load - fetch all test cases for project and extract folders
  const fetchAllTestCasesAndExtractFolders = useCallback(async (targetProjectId?: string) => {
    const useProjectId = targetProjectId || projectId;
    
    if (!useProjectId) {
      console.log('🚫 Missing projectId, clearing all data');
      setTestCases([]);
      setAllTestCases([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Initial load: Fetching ALL test cases for project:', useProjectId);
      
      // Fetch all test cases for the project (without folder filter for initial load)
      let response: TestCasesApiResponse = await testCasesApiService.getTestCases(
        1, 
        1000, // Get many test cases to ensure we get all
        useProjectId
        // No folder parameter for initial load - will be sorted by creation date desc
      );
      
      console.log('📋 API Response:', response);
      
      if (!response) {
        response = testCasesApiService.getDefaultTestCasesResponse();
      }
      
      const responseData = response?.data || [];
      const responseMeta = response?.meta || {
        currentPage: 1,
        totalItems: 0,
        itemsPerPage: 30
      };
      
      console.log('📋 Raw API data:', responseData.length, 'test cases');
      
      const transformedTestCases = responseData.map(apiTestCase => 
        testCasesApiService.transformApiTestCase(apiTestCase, response.included)
      );
      
      // Wait for all transformations to complete (since they're now async)
      const resolvedTestCases = await Promise.all(transformedTestCases);
      
      console.log('📋 Transformed test cases:', transformedTestCases);
      
      // Store all test cases
      setAllTestCases(resolvedTestCases);
      setTestCases(resolvedTestCases); // Show all initially
      
      // Extract unique folders from test cases
      const folderMap = new Map();
      resolvedTestCases.forEach(testCase => {
        console.log('📁 Test case folder info:', testCase.id, 'folderId:', testCase.folderId);
        if (testCase.folderId) {
          if (!folderMap.has(testCase.folderId)) {
            folderMap.set(testCase.folderId, {
              id: testCase.folderId,
              name: `Folder ${testCase.folderId}`, // Temporary name, will be updated from API
              testCasesCount: 0
            });
          }
          const folder = folderMap.get(testCase.folderId);
          folder.testCasesCount++;
        }
      });
      
      const extractedFolders = Array.from(folderMap.values());
      console.log('📁 Extracted', extractedFolders.length, 'unique folders from test cases:', extractedFolders);
      
      // Notify parent about extracted folders
      if (onFoldersExtracted) {
        console.log('📁 Calling onFoldersExtracted with:', extractedFolders);
        onFoldersExtracted(extractedFolders);
      }
      
      console.log('✅ Fetched', resolvedTestCases.length, 'total test cases for project');
      
      setPagination({
        currentPage: 1,
        totalItems: resolvedTestCases.length,
        itemsPerPage: 30,
        totalPages: Math.ceil(resolvedTestCases.length / 30)
      });
      
      hasInitialLoad.current = true;
      
    } catch (err) {
      console.error('❌ Full error details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch test cases';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Error fetching test cases:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, onFoldersExtracted]);

  // Function to filter test cases by folder (client-side)
  const filterTestCasesByFolder = useCallback((targetFolderId?: string | null) => {
    const useFolderId = targetFolderId !== undefined ? targetFolderId : folderId;
    
    setCurrentFilterMode('folder');
    
    if (!useFolderId) {
      // Show all test cases
      setTestCases(allTestCases);
      setPagination({
        currentPage: 1,
        totalItems: allTestCases.length,
        itemsPerPage: 30,
        totalPages: Math.ceil(allTestCases.length / 30)
      });
    } else {
      // Filter by folder
      const filtered = allTestCases.filter(tc => tc.folderId === useFolderId);
      setTestCases(filtered);
      setPagination({
        currentPage: 1,
        totalItems: filtered.length,
        itemsPerPage: 30,
        totalPages: Math.ceil(filtered.length / 30)
      });
    }
  }, [allTestCases, folderId]);

  // Fonction fetchTestCases stable - now fetches by project and folder
  const fetchTestCases = useCallback(async (page: number = 1, targetProjectId?: string, targetFolderId?: string) => {
    const useProjectId = targetProjectId || projectId;
    const useFolderId = targetFolderId || folderId;
    
    if (!useProjectId) {
      console.log('🚫 Missing projectId, clearing test cases');
      setTestCases([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📋 Fetching test cases for project:', useProjectId, 'folder:', useFolderId, 'page:', page);
      
      let response: TestCasesApiResponse = await testCasesApiService.getTestCases(
        page, 
        30, 
        useProjectId,
        useFolderId
      );
      
      if (!response) {
        response = testCasesApiService.getDefaultTestCasesResponse();
      }
      
      const responseData = response?.data || [];
      const responseMeta = response?.meta || {
        currentPage: 1,
        totalItems: 0,
        itemsPerPage: 30
      };
      
      const transformedTestCases = responseData.map(apiTestCase => 
        testCasesApiService.transformApiTestCase(apiTestCase, response.included)
      );
      
      // Wait for all transformations to complete (since they're now async)
      const resolvedTestCases = await Promise.all(transformedTestCases);
      
      console.log('✅ Fetched', resolvedTestCases.length, 'test cases for folder:', useFolderId);
      
      setTestCases(resolvedTestCases);
      setPagination({
        currentPage: responseMeta.currentPage,
        totalItems: responseMeta.totalItems,
        itemsPerPage: responseMeta.itemsPerPage,
        totalPages: Math.ceil(responseMeta.totalItems / responseMeta.itemsPerPage)
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch test cases';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Error fetching test cases:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, folderId]);

  const searchTestCases = useCallback(async (searchTerm: string, page: number = 1, globalSearch: boolean = false) => {
    if (!projectId) {
      setTestCases([]);
      return;
    }

    setCurrentFilterMode('search');

    try {
      setLoading(true);
      setError(null);
      
      let response: TestCasesApiResponse = await testCasesApiService.searchTestCases(
        searchTerm, 
        page, 
        30, 
        projectId,
        undefined, // Always omit folderId for search to search across all folders
        'include=tags' // Include tag data
      );
      
      if (!response) {
        response = testCasesApiService.getDefaultTestCasesResponse();
      }
      
      const responseData = response?.data || [];
      const responseMeta = response?.meta || {
        currentPage: 1,
        totalItems: 0,
        itemsPerPage: 30
      };
      
      const transformedTestCases = responseData.map(apiTestCase => 
        testCasesApiService.transformApiTestCase(apiTestCase)
      );
      
      setTestCases(transformedTestCases);
      setPagination({
        currentPage: responseMeta.currentPage,
        totalItems: responseMeta.totalItems,
        itemsPerPage: responseMeta.itemsPerPage,
        totalPages: Math.ceil(responseMeta.totalItems / responseMeta.itemsPerPage)
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search test cases';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Error searching test cases:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]); // Remove folderId dependency

  const filterTestCasesByAutomation = useCallback(async (automationStatus: 1 | 2 | 3 | 4 | 5, page: number = 1) => {
    if (!projectId) {
      setTestCases([]);
      return;
    }

    setCurrentFilterMode('automation');

    try {
      setLoading(true);
      setError(null);
      
      let response: TestCasesApiResponse = await testCasesApiService.filterTestCasesByAutomation(
        automationStatus,
        page, 
        30, 
        projectId,
        folderId
      );
      
      if (!response) {
        response = testCasesApiService.getDefaultTestCasesResponse();
      }
      
      const responseData = response?.data || [];
      const responseMeta = response?.meta || {
        currentPage: 1,
        totalItems: 0,
        itemsPerPage: 30
      };
      
      const transformedTestCases = responseData.map(apiTestCase => 
        testCasesApiService.transformApiTestCase(apiTestCase)
      );
      
      setTestCases(transformedTestCases);
      setPagination({
        currentPage: responseMeta.currentPage,
        totalItems: responseMeta.totalItems,
        itemsPerPage: responseMeta.itemsPerPage,
        totalPages: Math.ceil(responseMeta.totalItems / responseMeta.itemsPerPage)
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to filter test cases';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Error filtering test cases:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, folderId]);

  const filterTestCasesByTags = useCallback(async (tagIds: string[], page: number = 1) => {
    if (!projectId) {
      setTestCases([]);
      return;
    }

    setCurrentFilterMode('tags');

    try {
      setLoading(true);
      setError(null);
      
      let response: TestCasesApiResponse = await testCasesApiService.filterTestCasesByTags(
        tagIds,
        page, 
        30, 
        projectId,
        folderId
      );
      
      if (!response) {
        response = testCasesApiService.getDefaultTestCasesResponse();
      }
      
      const responseData = response?.data || [];
      const responseMeta = response?.meta || {
        currentPage: 1,
        totalItems: 0,
        itemsPerPage: 30
      };
      
      const transformedTestCases = responseData.map(apiTestCase => 
        testCasesApiService.transformApiTestCase(apiTestCase)
      );
      
      setTestCases(transformedTestCases);
      setPagination({
        currentPage: responseMeta.currentPage,
        totalItems: responseMeta.totalItems,
        itemsPerPage: responseMeta.itemsPerPage,
        totalPages: Math.ceil(responseMeta.totalItems / responseMeta.itemsPerPage)
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to filter test cases by tags';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Error filtering test cases by tags:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, folderId]);

  const filterTestCasesByState = useCallback(async (state: 'draft' | 'active' | 'deprecated', page: number = 1) => {
    if (!projectId) {
      setTestCases([]);
      return;
    }

    setCurrentFilterMode('state');

    try {
      setLoading(true);
      setError(null);
      
      let response: TestCasesApiResponse = await testCasesApiService.filterTestCasesByState(
        state,
        page, 
        30, 
        projectId,
        folderId
      );
      
      if (!response) {
        response = testCasesApiService.getDefaultTestCasesResponse();
      }
      
      const responseData = response?.data || [];
      const responseMeta = response?.meta || {
        currentPage: 1,
        totalItems: 0,
        itemsPerPage: 30
      };
      
      const transformedTestCases = responseData.map(apiTestCase => 
        testCasesApiService.transformApiTestCase(apiTestCase, response.included)
      );
      
      setTestCases(transformedTestCases);
      setPagination({
        currentPage: responseMeta.currentPage,
        totalItems: responseMeta.totalItems,
        itemsPerPage: responseMeta.itemsPerPage,
        totalPages: Math.ceil(responseMeta.totalItems / responseMeta.itemsPerPage)
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to filter test cases by state';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Error filtering test cases by state:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, folderId]);

  const filterTestCasesByPriority = useCallback(async (priority: number, page: number = 1) => {
    if (!projectId) {
      setTestCases([]);
      return;
    }

    setCurrentFilterMode('priority');

    try {
      setLoading(true);
      setError(null);
      
      let response: TestCasesApiResponse = await testCasesApiService.filterTestCasesByPriority(
        priority,
        page, 
        30, 
        projectId,
        folderId
      );
      
      if (!response) {
        response = testCasesApiService.getDefaultTestCasesResponse();
      }
      
      const responseData = response?.data || [];
      const responseMeta = response?.meta || {
        currentPage: 1,
        totalItems: 0,
        itemsPerPage: 30
      };
      
      const transformedTestCases = responseData.map(apiTestCase => 
        testCasesApiService.transformApiTestCase(apiTestCase)
      );
      
      setTestCases(transformedTestCases);
      setPagination({
        currentPage: responseMeta.currentPage,
        totalItems: responseMeta.totalItems,
        itemsPerPage: responseMeta.itemsPerPage,
        totalPages: Math.ceil(responseMeta.totalItems / responseMeta.itemsPerPage)
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to filter test cases by priority';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Error filtering test cases by priority:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, folderId]);

  const filterTestCasesByType = useCallback(async (type: number, page: number = 1) => {
    if (!projectId) {
      setTestCases([]);
      return;
    }

    setCurrentFilterMode('type');

    try {
      setLoading(true);
      setError(null);
      
      let response: TestCasesApiResponse = await testCasesApiService.filterTestCasesByType(
        type,
        page, 
        30, 
        projectId,
        folderId
      );
      
      if (!response) {
        response = testCasesApiService.getDefaultTestCasesResponse();
      }
      
      const responseData = response?.data || [];
      const responseMeta = response?.meta || {
        currentPage: 1,
        totalItems: 0,
        itemsPerPage: 30
      };
      
      const transformedTestCases = responseData.map(apiTestCase => 
        testCasesApiService.transformApiTestCase(apiTestCase)
      );
      
      setTestCases(transformedTestCases);
      setPagination({
        currentPage: responseMeta.currentPage,
        totalItems: responseMeta.totalItems,
        itemsPerPage: responseMeta.itemsPerPage,
        totalPages: Math.ceil(responseMeta.totalItems / responseMeta.itemsPerPage)
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to filter test cases by type';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Error filtering test cases by type:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, folderId]);

  const filterTestCasesWithMultipleFilters = useCallback(async (filters: {
    automationStatus?: 1 | 2 | 3 | 4 | 5;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    type?: 'functional' | 'regression' | 'smoke' | 'integration' | 'performance';
    tagIds?: string[];
  }, page: number = 1) => {
    if (!projectId) {
      setTestCases([]);
      return;
    }

    setCurrentFilterMode('multiple');

    try {
      setLoading(true);
      setError(null);
      
      let response: TestCasesApiResponse = await testCasesApiService.filterTestCasesWithMultipleFilters(
        filters,
        page, 
        30, 
        projectId,
        folderId
      );
      
      if (!response) {
        response = testCasesApiService.getDefaultTestCasesResponse();
      }
      
      const responseData = response?.data || [];
      const responseMeta = response?.meta || {
        currentPage: 1,
        totalItems: 0,
        itemsPerPage: 30
      };
      
      const transformedTestCases = responseData.map(apiTestCase => 
        testCasesApiService.transformApiTestCase(apiTestCase)
      );
      
      setTestCases(transformedTestCases);
      setPagination({
        currentPage: responseMeta.currentPage,
        totalItems: responseMeta.totalItems,
        itemsPerPage: responseMeta.itemsPerPage,
        totalPages: Math.ceil(responseMeta.totalItems / responseMeta.itemsPerPage)
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to filter test cases';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Error filtering test cases with multiple filters:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, folderId]);

  const createTestCase = useCallback(async (testCaseData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    testType: 'functional' | 'regression' | 'smoke' | 'integration' | 'performance';
    status: 'draft' | 'active' | 'deprecated';
    automationStatus: 1 | 2 | 3 | 4 | 5;
    template: number;
    preconditions: string;
    tags: Tag[];
    testSteps?: Array<{
      id: string;
      step: string;
      result: string;
      originalId?: string;
    }>;
    creatorId?: string;
  }) => {
    try {
      setLoading(true);
      
      // Handle step results - create them first if they exist
      let stepResults: Array<{
        id: string;
        order: number;
      }> = [];
      
      if (testCaseData.testSteps && testCaseData.testSteps.length > 0 && testCaseData.creatorId) {
        console.log('🔄 Creating step results for new test case...');
        
        for (let i = 0; i < testCaseData.testSteps.length; i++) {
          const step = testCaseData.testSteps[i];
          
          if (step.originalId) {
            // Existing step result - just include in relationships (no POST needed)
            stepResults.push({
              id: step.originalId,
              order: i + 1 // Order starts from 1
            });
            
            console.log(`✅ Including existing step result ${step.originalId} with order ${i + 1}`);
          } else {
            const testStep = testCaseData.testSteps[i];
            // New step result - create it via POST request (only for new ones)
            try {
              const stepResultResponse = await testCasesApiService.createStepResult({
                step: testStep.step,
                result: testStep.result,
                userId: testCaseData.creatorId
              });
              
              stepResults.push({
                id: stepResultResponse.data.attributes.id.toString(),
                order: i + 1 // Order starts from 1
              });
              
              console.log(`Created step result ${i + 1}:`, stepResultResponse.data.id);
            } catch (stepError) {
              console.error(`Failed to create step result ${i + 1}:`, stepError);
              throw new Error(`Failed to create step result ${i + 1}: ${stepError instanceof Error ? stepError.message : 'Unknown error'}`);
            }
          }
        }
        
        console.log('All step results created:', stepResults);
      }
      
      // Create the test case with step results
      const response = await testCasesApiService.createTestCase({
        ...testCaseData,
        stepResults
      });
      
      const newTestCase = testCasesApiService.transformApiTestCase(response.data);
      setTestCases(prevTestCases => [newTestCase, ...prevTestCases]);
      
      setPagination(prev => ({
        ...prev,
        totalItems: prev.totalItems + 1,
        totalPages: Math.ceil((prev.totalItems + 1) / prev.itemsPerPage)
      }));
      
      toast.success('Test case created successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update test case';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTestCase = useCallback(async (id: string, testCaseData: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    testType: 'functional' | 'regression' | 'smoke' | 'integration' | 'performance';
    status: 'draft' | 'active' | 'deprecated';
    automationStatus: 1 | 2 | 3 | 4 | 5;
    template: number;
    preconditions: string;
    tags: Tag[];
    testSteps?: Array<{
      id: string;
      step: string;
      result: string;
      originalId?: string;
    }>;
    userId?: string;
  }) => {
    try {
      setLoading(true);
      
      // Handle step results - create new ones and prepare relationships
      let stepResultsRelationships: Array<{
        type: string;
        id: string;
        meta: {
          order: number;
        };
      }> = [];
      
      if (testCaseData.testSteps && testCaseData.testSteps.length > 0 && testCaseData.userId) {
        console.log('🔄 Processing step results for test case update...');
        
        for (let i = 0; i < testCaseData.testSteps.length; i++) {
          const step = testCaseData.testSteps[i];
          const order = i + 1; // Order starts from 1
          
          if (step.originalId) {
            // Existing step result - just include in relationships (no POST needed)
            stepResultsRelationships.push({
              type: "StepResult",
              id: `/api/step_results/${step.originalId}`,
              meta: {
                order: order
              }
            });
            
            console.log(`✅ Including existing step result ${step.originalId} with order ${order}`);
          } else {
            // New step result - create it via POST request
            try {
              const stepResultResponse = await testCasesApiService.createStepResult({
                step: step.step,
                result: step.result,
                userId: testCaseData.userId
              });
              
              stepResultsRelationships.push({
                type: "StepResult",
                id: `/api/step_results/${stepResultResponse.data.attributes.id}`,
                meta: {
                  order: order
                }
              });
              
              console.log(`✅ Created new step result ${order}:`, stepResultResponse.data.id);
            } catch (stepError) {
              console.error(`❌ Failed to create step result ${order}:`, stepError);
              throw new Error(`Failed to create step result ${order}: ${stepError instanceof Error ? stepError.message : 'Unknown error'}`);
            }
          }
        }
        
        console.log('✅ All step results processed:', stepResultsRelationships);
      }
      
      // Update the test case with step results relationships
      const response = await testCasesApiService.updateTestCase(id, {
        ...testCaseData,
        stepResultsRelationships
      });
      
      const updatedTestCase = await testCasesApiService.transformApiTestCase(response.data);
      setTestCases(prevTestCases => 
        prevTestCases.map(testCase => 
          testCase.id === id ? updatedTestCase : testCase
        )
      );
      
      toast.success('Test case updated successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update test case';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTestCase = useCallback(async (id: string) => {
    try {
      setLoading(true);
      
      await testCasesApiService.deleteTestCase(id);
      
      setTestCases(prevTestCases => prevTestCases.filter(testCase => testCase.id !== id));
      
      setPagination(prev => ({
        ...prev,
        totalItems: Math.max(0, prev.totalItems - 1),
        totalPages: Math.ceil(Math.max(0, prev.totalItems - 1) / prev.itemsPerPage)
      }));
      
      toast.success('Test case deleted successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete test case';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect for initial load when project changes
  useEffect(() => {
    const projectChanged = previousProjectId.current !== projectId;

    console.log('🔄 useTestCases project effect triggered:', {
      projectId,
      projectChanged
    });

    previousProjectId.current = projectId;

    if (projectId && projectChanged) {
      console.log('📂 Project changed, doing initial load for project:', projectId);
      hasInitialLoad.current = false;
      fetchAllTestCasesAndExtractFolders(projectId);
    } else if (!projectId) {
      console.log('🚫 No project selected, clearing test cases');
      setTestCases([]);
      setAllTestCases([]);
      setLoading(false);
      hasInitialLoad.current = false;
    }
  }, [projectId, fetchAllTestCasesAndExtractFolders]);

  // Effect for folder changes (filter existing data)
  useEffect(() => {
    const folderChanged = previousFolderId.current !== folderId;
    
    // Only apply folder filtering if we're in folder mode or switching from other modes
    if (folderChanged && hasInitialLoad.current && (currentFilterMode === 'folder' || currentFilterMode === 'all')) {
      previousFolderId.current = folderId;
      filterTestCasesByFolder(folderId);
    }
  }, [folderId, filterTestCasesByFolder, currentFilterMode]);

  return {
    testCases, // Filtered by selected folder
    allTestCases, // All test cases for the project
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
    filterTestCasesByTags,
    filterTestCasesByState,
    filterTestCasesWithMultipleFilters,
    createTestCase,
    updateTestCase,
    deleteTestCase
  };
};