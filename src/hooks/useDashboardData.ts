import { useState, useEffect } from 'react';
import { useCallback } from 'react';
import { Project, TestCase, TestExecution, SharedStep, TEST_CASE_TYPES } from '../types';
import { testCasesApiService } from '../services/testCasesApi';
import { sharedStepsApiService } from '../services/sharedStepsApi';
import { foldersApiService } from '../services/foldersApi';

interface DashboardData {
  // Real API Data
  totalProjects: number;
  activeProjects: number;
  totalTestCases: number;
  totalFolders: number;
  totalSharedSteps: number;
  totalTestRuns: number;
  
  // Real API Analysis
  automationDistribution: {
    notAutomated: number;
    automated: number;
    notRequired: number;
    cannotAutomate: number;
    obsolete: number;
  };
  
  testTypeDistribution: {
    1: number; // Other
    2: number; // Acceptance
    3: number; // Accessibility
    4: number; // Compatibility
    5: number; // Destructive
    6: number; // Functional
    7: number; // Performance
    8: number; // Regression
    9: number; // Security
    10: number; // Smoke & Sanity
    11: number; // Usability
  };
  
  statusDistribution: {
    draft: number;
    active: number;
    deprecated: number;
  };
  
  priorityDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  
  automationCoverage: number;
  automatedTestCases: number;
  manualTestCases: number;
  
  // Mock execution data (since we don't have execution API yet)
  passRate: number;
  failRate: number;
  executionRate: number;
  actualPassed: number;
  actualFailed: number;
  actualBlocked: number;
  trendsData: Array<{
    date: string;
    passed: number;
    failed: number;
    blocked: number;
  }>;
  recentExecutions: Array<{
    id: string;
    testCaseId: string;
    testCaseTitle: string;
    status: 'passed' | 'failed' | 'blocked';
    executedBy: string;
    executedAt: Date;
    duration: number;
  }>;
  closedTestRuns: any[];
  closedTestRunsData: Array<{
    month: string;
    total: number;
  }>;
}

export const useDashboardData = (selectedProject: Project | null, projects: Project[]) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get test type number from string type
  const getTestTypeNumber = (type: 'functional' | 'regression' | 'smoke' | 'integration' | 'performance'): number => {
    const typeMap = { 'functional': 6, 'regression': 8, 'smoke': 10, 'integration': 4, 'performance': 7 };
    return typeMap[type];
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setDashboardData(null); // Clear existing data to show loading

      console.log('🔄 Dashboard data fetch triggered at:', new Date().toISOString());
      console.log('📊 Selected project:', selectedProject?.name || 'All projects');
      console.log('📊 Project ID:', selectedProject?.id || 'none');
      console.log('📊 Project ID type:', typeof selectedProject?.id);
      console.log('📊 Project ID value check:', selectedProject?.id ? 'HAS ID' : 'NO ID');
      console.log('📊 Force fetching fresh data for project change');

      // Real API Data
      let totalTestCases = 0;
      let totalFolders = 0;
      let totalSharedSteps = 0;
      let testCases: TestCase[] = [];
      let sharedSteps: SharedStep[] = [];

      if (selectedProject) {
        console.log(`📊 Fetching data for project: ${selectedProject.name}`);
        console.log(`📊 Project ID for API calls: "${selectedProject.id}"`);
        
        // Validate project ID before making API calls
        if (!selectedProject.id || selectedProject.id === '' || selectedProject.id === 'undefined' || selectedProject.id === 'null') {
          console.error('❌ Invalid project ID, cannot make API calls:', selectedProject.id);
          throw new Error(`Invalid project ID: ${selectedProject.id}`);
        }
        
        // Always fetch folders for the project
        console.log(`📁 Making API call: /folders?project=${selectedProject.id}&itemsPerPage=1000`);
        const foldersResponse = await foldersApiService.getFolders(selectedProject.id);
        totalFolders = foldersResponse.data.length;
        console.log(`📁 API Response received: ${totalFolders} folders`);

        // CRITICAL: Always fetch all test cases for the project (across all folders)
        console.log(`🧪 Making API call: /test_cases?project=${selectedProject.id}&page=1&itemsPerPage=1000`);
        console.log(`🧪 API call will be made NOW for project ID: "${selectedProject.id}"`);
        const testCasesResponse = await testCasesApiService.getTestCases(1, 1000, selectedProject.id);
        console.log(`🧪 API Response received:`, testCasesResponse);
        console.log(`🧪 API Response data length:`, testCasesResponse.data?.length || 0);
        
        const transformedTestCases = testCasesResponse.data.map(apiTestCase => 
          testCasesApiService.transformApiTestCase(apiTestCase)
        );
        
        // Wait for all transformations to complete (since they're now async)
        testCases = await Promise.all(transformedTestCases);
        totalTestCases = testCases.length;
        console.log(`🧪 FINAL RESULT: Found ${totalTestCases} test cases for project ${selectedProject.name}`);

        // CRITICAL: Always fetch shared steps for the project
        console.log(`🔗 Making API call: /shared_steps?project=${selectedProject.id}&page=1&itemsPerPage=1000`);
        console.log(`🔗 API call will be made NOW for project ID: "${selectedProject.id}"`);
        const sharedStepsResponse = await sharedStepsApiService.getSharedSteps(selectedProject.id, 1, 1000);
        console.log(`🔗 API Response received:`, sharedStepsResponse);
        console.log(`🔗 API Response data length:`, sharedStepsResponse.data?.length || 0);
        
        sharedSteps = sharedStepsResponse.data.map(apiSharedStep => 
          sharedStepsApiService.transformApiSharedStep(apiSharedStep, sharedStepsResponse.included)
        );
        totalSharedSteps = sharedSteps.length;
        console.log(`🔗 FINAL RESULT: Found ${totalSharedSteps} shared steps for project ${selectedProject.name}`);
      } else {
        // For all projects view, use API calls without project parameter (much faster)
        console.log(`📊 All projects view - fetching data across all projects`);
        
        // Fetch all test cases without project filter
        console.log(`🧪 Making API call: /test_cases?page=1&itemsPerPage=1000 (no project filter)`);
        const allTestCasesResponse = await testCasesApiService.getTestCases(1, 1000);
        const transformedAllTestCases = allTestCasesResponse.data.map(apiTestCase => 
          testCasesApiService.transformApiTestCase(apiTestCase)
        );
        testCases = await Promise.all(transformedAllTestCases);
        totalTestCases = testCases.length;
        console.log(`🧪 RESULT: Found ${totalTestCases} test cases across all projects`);
        
        // Fetch all shared steps without project filter
        console.log(`🔗 Making API call: /shared_steps?page=1&itemsPerPage=1000 (no project filter)`);
        // Note: We need to call shared steps for each project since there's no global endpoint
        let allSharedSteps: SharedStep[] = [];
        for (const project of projects.slice(0, 5)) { // Limit to first 5 projects to avoid too many calls
          if (project.id && project.id !== '' && project.id !== 'undefined') {
            try {
              const projectSharedStepsResponse = await sharedStepsApiService.getSharedSteps(project.id, 1, 100);
              const projectSharedSteps = projectSharedStepsResponse.data.map(apiSharedStep => 
                sharedStepsApiService.transformApiSharedStep(apiSharedStep, projectSharedStepsResponse.included)
              );
              allSharedSteps = [...allSharedSteps, ...projectSharedSteps];
            } catch (error) {
              console.warn(`⚠️ Failed to fetch shared steps for project ${project.name}:`, error);
            }
          }
        }
        sharedSteps = allSharedSteps;
        totalSharedSteps = sharedSteps.length;
        console.log(`🔗 RESULT: Found ${totalSharedSteps} shared steps across projects`);
        
        // For folders, we'll estimate based on projects
        totalFolders = projects.length * 2; // Rough estimate
      }

      // Analyze real test case data
      const automationDistribution = {
        notAutomated: testCases.filter(tc => {
          const match = tc.automationStatus === 1 || tc.automationStatus === '1';
          return match;
        }).length,
        automated: testCases.filter(tc => {
          const match = tc.automationStatus === 2 || tc.automationStatus === '2';
          return match;
        }).length,
        notRequired: testCases.filter(tc => {
          const match = tc.automationStatus === 3 || tc.automationStatus === '3';
          return match;
        }).length,
        cannotAutomate: testCases.filter(tc => {
          const match = tc.automationStatus === 4 || tc.automationStatus === '4';
          return match;
        }).length,
        obsolete: testCases.filter(tc => {
          const match = tc.automationStatus === 5 || tc.automationStatus === '5';
          return match;
        }).length,
      };

      // Calculate automation metrics based on real data
      const automatedTestCases = automationDistribution.automated; // ID 2 = "Automated"
      const manualTestCases = automationDistribution.notAutomated + 
                             automationDistribution.notRequired + 
                             automationDistribution.cannotAutomate + 
                             automationDistribution.obsolete; // All other IDs
      
      const automationCoverage = (automatedTestCases + manualTestCases) > 0 ? 
        Math.round((automatedTestCases / (automatedTestCases + manualTestCases)) * 100) : 0;

      const testTypeDistribution = {
        1: testCases.filter(tc => getTestTypeNumber(tc.type) === 1).length, // Other
        2: testCases.filter(tc => getTestTypeNumber(tc.type) === 2).length, // Acceptance
        3: testCases.filter(tc => getTestTypeNumber(tc.type) === 3).length, // Accessibility
        4: testCases.filter(tc => getTestTypeNumber(tc.type) === 4).length, // Compatibility
        5: testCases.filter(tc => getTestTypeNumber(tc.type) === 5).length, // Destructive
        6: testCases.filter(tc => getTestTypeNumber(tc.type) === 6).length, // Functional
        7: testCases.filter(tc => getTestTypeNumber(tc.type) === 7).length, // Performance
        8: testCases.filter(tc => getTestTypeNumber(tc.type) === 8).length, // Regression
        9: testCases.filter(tc => getTestTypeNumber(tc.type) === 9).length, // Security
        10: testCases.filter(tc => getTestTypeNumber(tc.type) === 10).length, // Smoke & Sanity
        11: testCases.filter(tc => getTestTypeNumber(tc.type) === 11).length, // Usability
      };

      const statusDistribution = {
        draft: testCases.filter(tc => tc.status === 'draft').length,
        active: testCases.filter(tc => tc.status === 'active').length,
        deprecated: testCases.filter(tc => tc.status === 'deprecated').length,
      };

      const priorityDistribution = {
        low: testCases.filter(tc => tc.priority === 'low').length,
        medium: testCases.filter(tc => tc.priority === 'medium').length,
        high: testCases.filter(tc => tc.priority === 'high').length,
        critical: testCases.filter(tc => tc.priority === 'critical').length,
      };

      // Generate mock execution data based on REAL test case count
      const mockExecutionData = generateMockExecutionData(
        totalTestCases, 
        selectedProject?.id || 'all-projects'
      );

      const data: DashboardData = {
        // Real API Data
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        totalTestCases,
        totalTestRuns: selectedProject?.testRunsCount || projects.reduce((sum, p) => sum + (p.testRunsCount || 0), 0),
        totalFolders,
        totalSharedSteps,
        
        // Real API Analysis
        automationDistribution,
        automatedTestCases,
        manualTestCases,
        testTypeDistribution,
        statusDistribution,
        priorityDistribution,
        automationCoverage,
        
        // Mock execution data (until we have execution APIs)
        ...mockExecutionData
      };

      setDashboardData(data);

    } catch (err) {
      console.error('❌ CRITICAL ERROR in dashboard data generation:', err);
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        selectedProject: selectedProject?.name,
        projectId: selectedProject?.id,
        projectIdType: typeof selectedProject?.id
      });
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [selectedProject?.id, projects]);

  useEffect(() => {
    console.log('📊 Dashboard useEffect triggered for project:', selectedProject?.name || 'All projects', 'at:', new Date().toISOString());
    console.log('📊 Project ID changed to:', selectedProject?.id);
    console.log('📊 Project ID type:', typeof selectedProject?.id);
    
    if (selectedProject?.id) {
      console.log('📊 ✅ SPECIFIC PROJECT SELECTED - Will fetch data for:', selectedProject.name);
    } else {
      console.log('📊 ⚠️ NO PROJECT SELECTED - Will fetch aggregated data');
    }
    
    console.log('📊 Will trigger fetchDashboardData now...');
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { dashboardData, loading, error, refreshData: fetchDashboardData };
};

// Helper function to generate mock execution data based on actual test case count
function generateMockExecutionData(testCaseCount: number, projectId: string = 'default') {
  // Use project ID as seed for consistent data
  const seed = hashString(projectId);
  const rng = new SeededRandom(seed);

  console.log(`🎲 Generating mock execution data for ${testCaseCount} test cases (project: ${projectId})`);

  if (testCaseCount === 0) {
    return {
      passRate: 0,
      failRate: 0,
      executionRate: 0,
      actualPassed: 0,
      actualFailed: 0,
      actualBlocked: 0,
      trendsData: [],
      recentExecutions: [],
      closedTestRuns: [],
      closedTestRunsData: []
    };
  }

  // Mock some execution data based on ACTUAL test case count
  const executedCount = Math.min(testCaseCount, Math.floor(testCaseCount * rng.nextFloat(0.6, 1.0))); // 60-100% executed
  const passedCount = Math.floor(executedCount * rng.nextFloat(0.7, 0.9)); // 70-90% pass rate
  const failedCount = Math.floor((executedCount - passedCount) * rng.nextFloat(0.5, 0.8)); // Some failures
  const blockedCount = executedCount - passedCount - failedCount; // Rest blocked

  const passRate = executedCount > 0 ? Math.round((passedCount / executedCount) * 100) : 0;
  const failRate = executedCount > 0 ? Math.round((failedCount / executedCount) * 100) : 0;
  const executionRate = testCaseCount > 0 ? Math.round((executedCount / testCaseCount) * 100) : 0;

  console.log(`📈 Mock execution data:`, {
    totalTestCases: testCaseCount,
    executed: executedCount,
    passed: passedCount,
    failed: failedCount,
    blocked: blockedCount,
    passRate,
    failRate,
    executionRate
  });

  // Generate trends data for last 7 days - distribute actual counts
  const trendsData = [];
  const basePassedPerDay = Math.floor(passedCount / 7);
  const baseFailedPerDay = Math.floor(failedCount / 7);
  const baseBlockedPerDay = Math.floor(blockedCount / 7);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    
    // Distribute actual counts across days
    const dailyPassed = basePassedPerDay + (i < (passedCount % 7) ? 1 : 0);
    const dailyFailed = baseFailedPerDay + (i < (failedCount % 7) ? 1 : 0);
    const dailyBlocked = baseBlockedPerDay + (i < (blockedCount % 7) ? 1 : 0);
    
    trendsData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      passed: Math.max(0, dailyPassed),
      failed: Math.max(0, dailyFailed),
      blocked: Math.max(0, dailyBlocked),
    });
  }

  // Generate recent executions based on actual counts
  const recentExecutions = [];
  const executors = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'Alex Chen'];
  
  // Create executions that match our totals
  const allExecutions = [
    ...Array(passedCount).fill('passed'),
    ...Array(failedCount).fill('failed'),
    ...Array(blockedCount).fill('blocked')
  ];
  
  // Shuffle the executions
  for (let i = allExecutions.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [allExecutions[i], allExecutions[j]] = [allExecutions[j], allExecutions[i]];
  }
  
  // Take recent executions (up to 10)
  const recentCount = Math.min(10, executedCount);
  for (let i = 0; i < recentCount; i++) {
    recentExecutions.push({
      id: `exec-${projectId}-${i + 1}`,
      testCaseId: `${i + 1}`,
      testCaseTitle: `Test Case #${i + 1}`,
      status: allExecutions[i] as 'passed' | 'failed' | 'blocked',
      executedBy: executors[Math.floor(rng.next() * executors.length)],
      executedAt: new Date(Date.now() - rng.next() * 7 * 24 * 60 * 60 * 1000),
      duration: Math.floor(rng.next() * 25) + 5,
    });
  }

  // Generate closed test runs data
  const closedTestRunsData = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    closedTestRunsData.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      total: Math.floor(rng.next() * Math.min(testCaseCount, 20)) + 1, // Based on actual test case count
    });
  }

  return {
    passRate,
    failRate,
    executionRate,
    actualPassed: passedCount,
    actualFailed: failedCount,
    actualBlocked: blockedCount,
    trendsData,
    recentExecutions,
    closedTestRuns: [],
    closedTestRunsData
  };
}

// Seeded random number generator for consistent results
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}

// Hash function to convert string to number
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}