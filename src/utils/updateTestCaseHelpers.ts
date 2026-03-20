// Helper functions for UpdateTestCaseModal

/** step order ids: `shared-{sharedStepId}-{pivotId|order|timestamp}` — sharedStepId may contain hyphens */
const SHARED_ORDER_PREFIX = 'shared-';

/** Date.now() is ~1.7e12; pivot / order values stay below this */
const SHARED_SUFFIX_TIMESTAMP_THRESHOLD = 1_000_000_000_000;

export function parseSharedCompositeOrderId(orderId: string): { sharedStepId: string; suffix: string } | null {
  if (!orderId.startsWith(SHARED_ORDER_PREFIX)) return null;
  const rest = orderId.slice(SHARED_ORDER_PREFIX.length);
  const lastDash = rest.lastIndexOf('-');
  if (lastDash < 0) return null;
  return {
    sharedStepId: rest.slice(0, lastDash),
    suffix: rest.slice(lastDash + 1)
  };
}

export function isSharedStepSuffixPivotOrOrder(suffix: string): boolean {
  const n = parseInt(suffix, 10);
  return !Number.isNaN(n) && n < SHARED_SUFFIX_TIMESTAMP_THRESHOLD;
}

export function findSharedStepByCompositeOrderId<
  T extends { id: string | number; pivotId?: number | null; order?: number; instanceId?: string }
>(sharedSteps: T[], orderItemId: string): T | undefined {
  const parsed = parseSharedCompositeOrderId(orderItemId);
  if (!parsed) return undefined;
  const { sharedStepId, suffix } = parsed;

  if (isSharedStepSuffixPivotOrOrder(suffix)) {
    const suffixNum = parseInt(suffix, 10);
    return sharedSteps.find(s => {
      if (String(s.id) !== String(sharedStepId)) return false;
      if (s.pivotId != null && s.pivotId !== undefined) {
        return Number(s.pivotId) === suffixNum;
      }
      return Number(s.order) === suffixNum;
    });
  }
  return sharedSteps.find(s => s.instanceId === orderItemId);
}

export const getStateNumber = (status: string): number => {
  const stateMap = {
    'active': 1,
    'draft': 2,
    'in_review': 3,
    'outdated': 4,
    'rejected': 5
  };
  return stateMap[status as keyof typeof stateMap] || 1;
};

export const getPriorityNumber = (priority: string): number => {
  const priorityMap = {
    'low': 4,
    'medium': 1,
    'high': 3,
    'critical': 2
  };
  return priorityMap[priority as keyof typeof priorityMap] || 1;
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

interface StepResultRelationship {
  type: "StepResult";
  id: string;
  meta: {
    order: number;
  };
}

export const buildStepResultsRelationships = (
  stepOrder: Array<{ type: 'step' | 'shared'; id: string }>,
  testSteps: Array<{ id: string; step: string; result: string; originalId?: string }>
): StepResultRelationship[] => {
  const stepResultsRelationships: StepResultRelationship[] = [];
  
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

interface SharedStepRelationship {
  type: "SharedStep";
  id: string;
  meta: {
    order: number;
  };
}

export const buildSharedStepsRelationships = (
  stepOrder: Array<{ type: 'step' | 'shared'; id: string }>,
  sharedSteps: Array<{ id: string; title: string; pivotId?: number; instanceId?: string }>
): SharedStepRelationship[] => {
  const sharedStepsRelationships: SharedStepRelationship[] = [];

  for (let position = 0; position < stepOrder.length; position++) {
    const orderItem = stepOrder[position];
    const order = position + 1;

    if (orderItem.type === 'shared') {
      const sharedStep = findSharedStepByCompositeOrderId(sharedSteps, orderItem.id);
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