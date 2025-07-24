import React from 'react';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader,
  TestTube,
  Layers,
  FolderOpen,
  Database,
  Share,
  Filter,
  MoreHorizontal,
  Info
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useApp } from '../context/AppContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { TEST_CASE_TYPES } from '../types';

const Dashboard: React.FC = () => {
  const { getSelectedProject, state } = useApp();
  const selectedProject = getSelectedProject();
  
  console.log('📊 Dashboard render:', {
    selectedProject: selectedProject?.name,
    selectedProjectId: selectedProject?.id,
    totalProjects: state.projects.length,
    timestamp: new Date().toISOString()
  });
  
  const { dashboardData, loading, error, refreshData } = useDashboardData(selectedProject, state.projects);

  // Helper function to get colors for different test case types
  const getTypeColor = (typeId: number): string => {
    const colors = {
      1: '#8B5CF6', // Other - Purple
      2: '#10B981', // Acceptance - Green
      3: '#06B6D4', // Accessibility - Cyan
      4: '#F59E0B', // Compatibility - Amber
      5: '#EF4444', // Destructive - Red
      6: '#10B981', // Functional - Green
      7: '#F97316', // Performance - Orange
      8: '#8B5CF6', // Regression - Purple
      9: '#DC2626', // Security - Red
      10: '#FBBF24', // Smoke & Sanity - Yellow
      11: '#06B6D4', // Usability - Cyan
    };
    return colors[typeId as keyof typeof colors] || '#6B7280';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="p-8 text-center">
          <div className="text-red-400 mb-4">
            <p className="text-lg font-medium">Failed to load dashboard data</p>
            <p className="text-sm text-gray-400 mt-2">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  // Prepare data for Active Test Runs (pie chart)
  const activeTestRunsData = [
    { name: 'Passed', value: dashboardData.actualPassed || 0, color: '#10B981' },
    { name: 'Failed', value: dashboardData.actualFailed || 0, color: '#EF4444' },
    { name: 'Blocked', value: dashboardData.actualBlocked || 0, color: '#8B5CF6' },
  ].filter(item => item.value > 0);

  // Helper function to calculate percentages that always add up to 100%
  const calculatePercentages = (values: number[], total: number): number[] => {
    if (total === 0) return values.map(() => 0);
    
    // Calculate exact percentages
    const exactPercentages = values.map(value => (value / total) * 100);
    
    // Get integer parts and remainders
    const integerParts = exactPercentages.map(p => Math.floor(p));
    const remainders = exactPercentages.map((p, i) => ({ index: i, remainder: p - integerParts[i] }));
    
    // Sort by remainder (largest first)
    remainders.sort((a, b) => b.remainder - a.remainder);
    
    // Calculate how many percentage points we need to distribute
    const totalInteger = integerParts.reduce((sum, p) => sum + p, 0);
    const pointsToDistribute = 100 - totalInteger;
    
    // Distribute the remaining points to items with largest remainders
    const finalPercentages = [...integerParts];
    for (let i = 0; i < pointsToDistribute && i < remainders.length; i++) {
      finalPercentages[remainders[i].index]++;
    }
    
    return finalPercentages;
  };

  // Calculate corrected percentages for active test runs
  const totalActiveTestCases = activeTestRunsData.reduce((sum, item) => sum + item.value, 0);
  const activeTestRunsPercentages = calculatePercentages(
    activeTestRunsData.map(item => item.value),
    totalActiveTestCases
  );

  // Prepare data for Closed Test Runs (line chart)
  const closedTestRunsLineData = dashboardData.closedTestRunsData.map(item => ({
    month: item.month,
    value: item.total
  }));

  // Prepare data for Results from Closed Test Runs (bar chart)
  const resultsFromClosedData = dashboardData.closedTestRunsData.map(item => ({
    month: item.month,
    Passed: item.passed || 0,
    Failed: item.failed || 0,
    Blocked: item.blocked || 0
  }));

  // Prepare data for Type of Test Cases (pie chart)
  const typeOfTestCasesData = Object.entries(dashboardData.testTypeDistribution || {})
    .map(([typeId, count]) => ({
      name: TEST_CASE_TYPES[parseInt(typeId) as keyof typeof TEST_CASE_TYPES],
      value: count,
      color: getTypeColor(parseInt(typeId))
    }))
    .filter(item => item.value > 0);

  // Calculate corrected percentages for type of test cases
  const typeOfTestCasesPercentages = calculatePercentages(
    typeOfTestCasesData.map(item => item.value),
    dashboardData.totalTestCases
  );

  console.log('🎨 Type of test cases data:', typeOfTestCasesData);
  console.log('🎨 Dashboard test type distribution:', dashboardData.testTypeDistribution);

  // Generate trend data based on real test type distribution
  const trendOfTestCasesData = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const currentFunctional = dashboardData.testTypeDistribution?.functional || 0;
  const currentRegression = dashboardData.testTypeDistribution?.regression || 0;
  const currentSmoke = dashboardData.testTypeDistribution?.smoke || 0;
  const currentIntegration = dashboardData.testTypeDistribution?.integration || 0;
  const currentPerformance = dashboardData.testTypeDistribution?.performance || 0;
  const currentTotal = dashboardData.totalTestCases;
  
  for (let i = 0; i < 12; i++) {
    const progress = i / 11; // 0 to 1
    
    // Calculate progressive values
    const monthlyFunctional = Math.floor(currentFunctional * progress);
    const monthlyRegression = Math.floor(currentRegression * progress);
    const monthlySmoke = Math.floor(currentSmoke * progress);
    const monthlyIntegration = Math.floor(currentIntegration * progress);
    const monthlyPerformance = Math.floor(currentPerformance * progress);
    const monthlyTotal = monthlyFunctional + monthlyRegression + monthlySmoke + monthlyIntegration + monthlyPerformance;
    
    trendOfTestCasesData.push({
      month: months[i],
      Functional: monthlyFunctional,
      Regression: monthlyRegression,
      Smoke: monthlySmoke,
      Integration: monthlyIntegration,
      Performance: monthlyPerformance,
      Total: monthlyTotal
    });
  }
  
  // Force December to match exactly the current values
  trendOfTestCasesData[11] = {
    month: 'Dec',
    Functional: currentFunctional,
    Regression: currentRegression,
    Smoke: currentSmoke,
    Integration: currentIntegration,
    Performance: currentPerformance,
    Total: currentTotal
  };

  const automatedTestCases = dashboardData.automationDistribution?.automated || 0;
  const notAutomatedTestCases = dashboardData.automationDistribution?.notAutomated || 0;
  const notRequiredTestCases = dashboardData.automationDistribution?.notRequired || 0;
  const cannotAutomateTestCases = dashboardData.automationDistribution?.cannotAutomate || 0;
  const obsoleteTestCases = dashboardData.automationDistribution?.obsolete || 0;
  const manualTestCases = notAutomatedTestCases + notRequiredTestCases + cannotAutomateTestCases + obsoleteTestCases;

  return (
    <div className="space-y-6">
      {/* Header with time filters */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
      </div>

      {/* Project Context */}
      {selectedProject && (
        <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Database className="w-5 h-5 mr-2 text-green-400" />
                📁 {selectedProject.name}
              </h3>
              <p className="text-sm text-gray-400">{selectedProject.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Total Test Cases</div>
              <div className="text-2xl font-bold text-cyan-400">{dashboardData.totalTestCases}</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Row - Active Test Runs and Closed Test Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Test Runs */}
        <Card gradient className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Active Test Runs</h3>
          </div>
          
          {totalActiveTestCases > 0 ? (
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={activeTestRunsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                  >
                    {activeTestRunsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6' 
                    }}
                  />
                  {/* Center text */}
                  <text 
                    x="50%" 
                    y="45%" 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className="fill-white text-2xl font-bold"
                  >
                    {totalActiveTestCases}
                  </text>
                  <text 
                    x="50%" 
                    y="55%" 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className="fill-gray-400 text-sm"
                  >
                    Total Test Cases
                  </text>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div className="ml-6 space-y-3 flex-1">
                {activeTestRunsData.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: entry.color }}></div>
                      <span className="text-sm text-gray-300">{entry.name}</span>
                    </div>
                    <span className="text-sm text-gray-300">
                      {entry.value} ({activeTestRunsPercentages[index]}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No active test runs</p>
                <p className="text-sm">Start executing tests to see the distribution</p>
              </div>
            </div>
          )}
        </Card>

        {/* Closed Test Runs */}
        <Card gradient className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Closed Test Runs</h3>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={closedTestRunsLineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6B7280" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6B7280" 
                  fontSize={12}
                  domain={[0, 'dataMax + 1']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6' 
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#06B6D4" 
                  strokeWidth={3}
                  dot={{ fill: '#06B6D4', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#06B6D4' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Results from Closed Test Runs */}
      <Card gradient className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Results from Closed Test Runs</h3>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={resultsFromClosedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="month" 
                stroke="#6B7280" 
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280" 
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6' 
                }}
                formatter={(value, name) => [
                  `${name}: ${value}`,
                  name
                ]}
              />
              <Bar dataKey="Passed" stackId="a" fill="#10B981" />
              <Bar dataKey="Failed" stackId="a" fill="#EF4444" />
              <Bar dataKey="Blocked" stackId="a" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Automation Coverage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card gradient className="p-6 text-center">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Automation Coverage</h3>
          <div className="text-3xl font-bold text-white mb-1">{dashboardData.automationCoverage || 0}%</div>
        </Card>
        
        <Card gradient className="p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <h3 className="text-sm font-medium text-gray-400 mr-1">Automated Test Cases</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{dashboardData.automatedTestCases || 0}</div>
        </Card>
        
        <Card gradient className="p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <h3 className="text-sm font-medium text-gray-400 mr-1">Manual Test Cases</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{dashboardData.manualTestCases || 0}</div>
        </Card>
        
        <Card gradient className="p-6 text-center">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Test Cases</h3>
          <div className="text-3xl font-bold text-white mb-1">{dashboardData.totalTestCases}</div>
        </Card>
      </div>

      {/* Bottom Row - Type of Test Cases and Trend of Test Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type of Test Cases */}
        <Card gradient className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Type of Test Cases</h3>
          </div>
          
          {dashboardData.totalTestCases > 0 ? (
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={typeOfTestCasesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                  >
                    {typeOfTestCasesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6' 
                    }}
                  />
                  {/* Center text */}
                  <text 
                    x="50%" 
                    y="45%" 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className="fill-white text-2xl font-bold"
                  >
                    {dashboardData.totalTestCases}
                  </text>
                  <text 
                    x="50%" 
                    y="55%" 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className="fill-gray-400 text-sm"
                  >
                    Total Test Cases
                  </text>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div className="ml-6 space-y-3 flex-1">
                {typeOfTestCasesData.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: entry.color }}></div>
                      <span className="text-sm text-gray-300">{entry.name}</span>
                    </div>
                    <span className="text-sm text-gray-300">
                      {entry.value} ({typeOfTestCasesPercentages[index]}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-400">
                <TestTube className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No test cases found</p>
                <p className="text-sm">Create test cases to see type distribution</p>
              </div>
            </div>
          )}
        </Card>

        {/* Trend of Test Cases */}
        <Card gradient className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Trend of Test Cases</h3>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendOfTestCasesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6B7280" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6B7280" 
                  fontSize={12}
                  domain={[0, 'dataMax + 1']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6' 
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="Functional" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                  name="Functional"
                />
                <Line 
                  type="monotone" 
                  dataKey="Regression" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 3 }}
                  name="Regression"
                />
                <Line 
                  type="monotone" 
                  dataKey="Smoke" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
                  name="Smoke"
                />
                <Line 
                  type="monotone" 
                  dataKey="Integration" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                  name="Integration"
                />
                <Line 
                  type="monotone" 
                  dataKey="Performance" 
                  stroke="#06B6D4" 
                  strokeWidth={2}
                  dot={{ fill: '#06B6D4', strokeWidth: 2, r: 3 }}
                  name="Performance"
                />
                <Line 
                  type="monotone" 
                  dataKey="Total" 
                  stroke="#FFFFFF" 
                  strokeWidth={3}
                  dot={{ fill: '#FFFFFF', strokeWidth: 2, r: 4 }}
                  name="Total"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;