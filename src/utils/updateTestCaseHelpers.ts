// Helper functions for UpdateTestCaseModal

export const getStateNumber = (status: string): number => {
  const stateMap = {
    'active': 1,
    'draft': 2,
    'in_review': 3,
    'outdated': 4,
    'rejected': 5
  };
  return stateMap[status as keyof typeof stateMap] || 2;
};

export const getPriorityNumber = (priority: string): number => {
  const priorityMap = {
    'low': 1,
    'medium': 2,
    'high': 3,
    'critical': 4
  };
  return priorityMap[priority as keyof typeof priorityMap] || 2;
};

export const getTestTypeNumber = (type: string): number => {
  const typeMap = {
    'other': 1,
    'acceptance': 2,
    'accessibility': 3,
    'compatibility': 4,
    'destructive': 5,
    'functional': 6,
    'performance': 7,
    'regression': 8,
    'security': 9,
    'smoke': 10,
    'usability': 11
  };
  return typeMap[type as keyof typeof typeMap] || 6;
};

export const buildStepResultsRelationships = (
  stepOrder: Array<{ type: 'step' | 'shared'; id: string }>,
  testSteps: Array<{ id: string; step: string; result: string; originalId?: string }>
) => {
  const stepResultsRelationships: any[] = [];
  
  for (let position = 0; position < stepOrder.length; position++) {
    const orderItem = stepOrder[position];
    const order = position + 1;

    if (orderItem.type === 'step') {
      const step = testSteps.find(s => s.id === orderItem.id);
      if (step) {
        stepResultsRelationships.push({
          type: "StepResult",
          id: step.id,
          meta: {
            order: order
          }
        });
      }
    }
  }
  
  return stepResultsRelationships;
};

export const buildSharedStepsRelationships = (
  stepOrder: Array<{ type: 'step' | 'shared'; id: string }>,
  sharedSteps: Array<{ id: string; title: string }>
) => {
  const sharedStepsRelationships: any[] = [];
  
  for (let position = 0; position < stepOrder.length; position++) {
    const orderItem = stepOrder[position];
    const order = position + 1;

    if (orderItem.type === 'shared') {
      const sharedStepId = orderItem.id.replace('shared-', '');
      const sharedStep = sharedSteps.find(s => s.id === sharedStepId);
      if (sharedStep) {
        sharedStepsRelationships.push({
          type: "SharedStep",
          id: `/api/shared_steps/${sharedStep.id}`,
          meta: {
            order: order
          }
        });
      }
    }
  }
  
  return sharedStepsRelationships;
};