// Helper functions for test case data transformations

export const getPriorityString = (priority: number): 'low' | 'medium' | 'high' | 'critical' => {
  const priorityMap = { 1: 'low', 2: 'medium', 3: 'high', 4: 'critical' } as const;
  return priorityMap[priority as keyof typeof priorityMap] || 'medium';
};

export const getTestTypeString = (type: number): 'other' | 'acceptance' | 'accessibility' | 'compatibility' | 'destructive' | 'functional' | 'performance' | 'regression' | 'security' | 'smoke' | 'usability' => {
  const typeMap = {
    1: 'other',
    2: 'acceptance',
    3: 'accessibility',
    4: 'compatibility',
    5: 'destructive',
    6: 'functional',
    7: 'performance',
    8: 'regression',
    9: 'security',
    10: 'smoke',
    11: 'usability'
  } as const;
  return typeMap[type as keyof typeof typeMap] || 'other';
};

export const getStatusString = (state: number): 'draft' | 'active' | 'deprecated' => {
  const stateMap = { 1: 'active', 2: 'draft', 4: 'deprecated' } as const;
  return stateMap[state as keyof typeof stateMap] || 'draft';
};

export const getPriorityNumber = (priority: 'low' | 'medium' | 'high' | 'critical'): number => {
  const priorityMap = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
  return priorityMap[priority];
};

export const getTestTypeNumber = (type: 'functional' | 'regression' | 'smoke' | 'integration' | 'performance'): number => {
  const typeMap = { 'functional': 6, 'regression': 8, 'smoke': 10, 'integration': 4, 'performance': 7 };
  return typeMap[type];
};

export const getStateNumber = (state: 'draft' | 'active' | 'deprecated'): number => {
  const stateMap = { 'active': 1, 'draft': 2, 'deprecated': 4 };
  return stateMap[state];
};