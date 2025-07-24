import { Project, TestCase, TestExecution, TestPlan, SharedStep, DashboardMetrics } from '../types';

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'E-commerce Application',
    description: 'Tests for the online sales platform',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-10'),
    testCasesCount: 45,
    testsPassedCount: 38,
    testsFailedCount: 7,
    testRunsCount: 45
  },
  {
    id: '2',
    name: 'Mobile Banking API',
    description: 'Integration tests for mobile banking API',
    status: 'active',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-12-08'),
    testCasesCount: 62,
    testsPassedCount: 55,
    testsFailedCount: 4,
    testRunsCount: 59
  },
  {
    id: '3',
    name: 'Enterprise CRM',
    description: 'Test suite for CRM system',
    status: 'inactive',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-11-30'),
    testCasesCount: 28,
    testsPassedCount: 20,
    testsFailedCount: 8,
    testRunsCount: 28
  }
];

export const mockTestCases: TestCase[] = [
  {
    id: '1',
    projectId: '1',
    title: 'Valid user login',
    description: 'Verify login with valid credentials',
    priority: 'high',
    type: 'functional',
    status: 'active',
    automationStatus: 2, // Automated
    steps: [
      { id: '1', action: 'Navigate to login page', expectedResult: 'Login page displays', order: 1 },
      { id: '2', action: 'Enter valid email', expectedResult: 'Email accepted', order: 2 },
      { id: '3', action: 'Enter valid password', expectedResult: 'Password masked', order: 3 },
      { id: '4', action: 'Click Sign In', expectedResult: 'Redirect to dashboard', order: 4 }
    ],
    sharedSteps: [],
    tags: ['login', 'authentication', 'smoke'],
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-12-01'),
    estimatedDuration: 5
  },
  {
    id: '2',
    projectId: '1',
    title: 'Add product to cart',
    description: 'Test adding a product to shopping cart',
    priority: 'medium',
    type: 'functional',
    status: 'active',
    automationStatus: 1, // Not automated
    steps: [
      { id: '5', action: 'Navigate to product catalog', expectedResult: 'Product list displayed', order: 1 },
      { id: '6', action: 'Select a product', expectedResult: 'Product details shown', order: 2 },
      { id: '7', action: 'Click Add to Cart', expectedResult: 'Product added, counter updated', order: 3 }
    ],
    sharedSteps: ['shared-1'],
    tags: ['cart', 'product', 'e-commerce'],
    createdAt: new Date('2024-11-05'),
    updatedAt: new Date('2024-12-02'),
    estimatedDuration: 8
  },
  {
    id: '3',
    projectId: '2',
    title: 'API Authentication',
    description: 'Test API authentication endpoint',
    priority: 'critical',
    type: 'integration',
    status: 'active',
    automationStatus: 2, // Automated
    steps: [
      { id: '8', action: 'Send POST request to /auth', expectedResult: 'Returns 200 status', order: 1 },
      { id: '9', action: 'Verify token in response', expectedResult: 'Token is present and valid', order: 2 }
    ],
    sharedSteps: [],
    tags: ['api', 'authentication', 'integration'],
    createdAt: new Date('2024-11-10'),
    updatedAt: new Date('2024-12-05'),
    estimatedDuration: 3
  },
  {
    id: '4',
    projectId: '2',
    title: 'Balance inquiry',
    description: 'Test balance inquiry functionality',
    priority: 'high',
    type: 'functional',
    status: 'active',
    automationStatus: 4, // Cannot be automated
    steps: [
      { id: '10', action: 'Login to mobile app', expectedResult: 'User logged in successfully', order: 1 },
      { id: '11', action: 'Navigate to balance section', expectedResult: 'Balance page displayed', order: 2 },
      { id: '12', action: 'Check balance display', expectedResult: 'Current balance shown correctly', order: 3 }
    ],
    sharedSteps: ['shared-1'],
    tags: ['balance', 'mobile', 'banking'],
    createdAt: new Date('2024-11-12'),
    updatedAt: new Date('2024-12-03'),
    estimatedDuration: 6
  },
  {
    id: '5',
    projectId: '3',
    title: 'Customer creation',
    description: 'Test customer creation in CRM',
    priority: 'medium',
    type: 'functional',
    status: 'draft',
    automationStatus: 3, // Automation not required
    steps: [
      { id: '13', action: 'Open customer form', expectedResult: 'Form displayed', order: 1 },
      { id: '14', action: 'Fill required fields', expectedResult: 'Fields accepted', order: 2 },
      { id: '15', action: 'Save customer', expectedResult: 'Customer created successfully', order: 3 }
    ],
    sharedSteps: [],
    tags: ['customer', 'crm', 'creation'],
    createdAt: new Date('2024-11-15'),
    updatedAt: new Date('2024-12-01'),
    estimatedDuration: 10
  }
];

export const mockSharedSteps: SharedStep[] = [
  {
    id: 'shared-1',
    title: 'Standard user login',
    description: 'Common steps for user authentication',
    steps: [
      { id: 's1', action: 'Open application', expectedResult: 'Application loaded', order: 1 },
      { id: 's2', action: 'Click Sign In', expectedResult: 'Login form displayed', order: 2 },
      { id: 's3', action: 'Enter credentials', expectedResult: 'Fields filled', order: 3 },
      { id: 's4', action: 'Submit login', expectedResult: 'User logged in', order: 4 }
    ],
    tags: ['login', 'common'],
    createdAt: new Date('2024-10-15'),
    usageCount: 15
  }
];

export const mockTestExecutions: TestExecution[] = [
  {
    id: '1',
    projectId: '1',
    testCaseId: '1',
    status: 'passed',
    executedBy: 'Marie Johnson',
    executedAt: new Date('2024-12-10T14:30:00'),
    duration: 4,
    notes: 'Execution successful without issues',
    environment: 'staging',
    browser: 'Chrome',
    version: '119.0'
  },
  {
    id: '2',
    projectId: '1',
    testCaseId: '2',
    status: 'failed',
    executedBy: 'John Smith',
    executedAt: new Date('2024-12-10T15:45:00'),
    duration: 6,
    notes: 'Error 500 when adding to cart',
    environment: 'production',
    browser: 'Firefox',
    version: '120.0'
  }
];

export const mockTestPlans: TestPlan[] = [
  {
    id: '1',
    projectId: '1',
    name: 'Sprint 24.12 - Regression Tests',
    description: 'Test plan for version 2.4.0',
    status: 'active',
    testCases: ['1', '2'],
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-15'),
    createdBy: 'Lead QA',
    createdAt: new Date('2024-11-28'),
    progress: 65,
    passRate: 78
  }
];

export const mockDashboardMetrics: DashboardMetrics = {
  totalProjects: 3,
  activeProjects: 2,
  totalTestCases: 135,
  executionRate: 87,
  passRate: 84,
  failRate: 16,
  trendsData: [
    { date: '2024-12-01', passed: 45, failed: 8, blocked: 2, total: 55 },
    { date: '2024-12-02', passed: 52, failed: 6, blocked: 1, total: 59 },
    { date: '2024-12-03', passed: 48, failed: 9, blocked: 3, total: 60 },
    { date: '2024-12-04', passed: 58, failed: 5, blocked: 2, total: 65 },
    { date: '2024-12-05', passed: 62, failed: 4, blocked: 1, total: 67 },
    { date: '2024-12-06', passed: 55, failed: 7, blocked: 2, total: 64 },
    { date: '2024-12-07', passed: 61, failed: 3, blocked: 1, total: 65 }
  ],
  recentExecutions: mockTestExecutions
};