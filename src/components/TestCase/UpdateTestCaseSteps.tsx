import React from 'react';
import { Plus, Layers } from 'lucide-react';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import Button from '../UI/Button';
import DraggableTestStepWithAutoUpload from './DraggableTestStepWithAutoUpload';
import DraggableSharedStep from './DraggableSharedStep';
import { ProcessedSharedStep } from '../../services/testCaseDataService';
import { findSharedStepByCompositeOrderId, isSharedStepSuffixPivotOrOrder, parseSharedCompositeOrderId } from '../../utils/updateTestCaseHelpers';

interface TestStep {
  id: string;
  step: string;
  result: string;
  originalId?: string;
}

interface TestStepOrSharedStepInstance {
  type: 'step' | 'shared';
  id: string;
  step?: string;
  result?: string;
  originalId?: string;
  sharedStep?: ProcessedSharedStep;
}

interface UpdateTestCaseStepsProps {
  testSteps: TestStep[];
  sharedSteps: ProcessedSharedStep[];
  stepOrder: Array<{ type: 'step' | 'shared'; id: string }>;
  onAddTestStep: () => void;
  onUpdateTestStep: (id: string, field: 'step' | 'result', value: string) => void;
  onRemoveTestStep: (id: string) => void;
  onRemoveSharedStep: (sharedStepId: string) => void;
  onViewSharedStep: (sharedStep: ProcessedSharedStep) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onOpenSharedStepSelector: () => void;
  isSubmitting: boolean;
}

const UpdateTestCaseSteps: React.FC<UpdateTestCaseStepsProps> = ({
  testSteps,
  sharedSteps,
  stepOrder,
  onAddTestStep,
  onUpdateTestStep,
  onRemoveTestStep,
  onRemoveSharedStep,
  onViewSharedStep,
  onDragEnd,
  onOpenSharedStepSelector,
  isSubmitting
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Memoize the combined steps to prevent infinite re-renders
  const allSteps: TestStepOrSharedStepInstance[] = React.useMemo(() => {
    return stepOrder.map(orderItem => {
      if (orderItem.type === 'step') {
        const step = testSteps.find(s => s.id === orderItem.id);
        return step ? { type: 'step' as const, id: step.id, step: step.step, result: step.result, originalId: step.originalId } : null;
      }
      const sharedStep = findSharedStepByCompositeOrderId(sharedSteps, orderItem.id);
      return sharedStep ? { type: 'shared' as const, id: orderItem.id, sharedStep } : null;
    }).filter(Boolean) as TestStepOrSharedStepInstance[];
  }, [stepOrder, testSteps, sharedSteps]);

  return (
    <div>
      {/* Header - only show buttons here when list is empty */}
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-slate-600 dark:text-gray-300">
          Steps and Results
        </label>
        {allSteps.length === 0 && (
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Layers}
              onClick={onOpenSharedStepSelector}
              disabled={isSubmitting}
            >
              Add Shared Step
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={onAddTestStep}
              disabled={isSubmitting}
            >
              Add Step
            </Button>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {allSteps.length > 0 ? (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={allSteps.map(step => step.id)}
                strategy={verticalListSortingStrategy}
              >
                {allSteps.map((item, index) => (
                  item.type === 'step' ? (
                    <DraggableTestStepWithAutoUpload
                      key={item.id}
                      step={{
                        id: item.id,
                        step: item.step!,
                        result: item.result!,
                        originalId: item.originalId
                      }}
                      index={index}
                      onUpdate={onUpdateTestStep}
                      onRemove={onRemoveTestStep}
                      disabled={isSubmitting}
                    />
                  ) : (
                    <DraggableSharedStep
                      key={item.id}
                      sharedStep={item.sharedStep!}
                      uniqueId={item.id}
                      index={index}
                      onRemove={() => {
                        const parsed = parseSharedCompositeOrderId(item.id);
                        if (!parsed) {
                          onRemoveSharedStep(item.id);
                          return;
                        }
                        if (isSharedStepSuffixPivotOrOrder(parsed.suffix)) {
                          const pivotId =
                            item.sharedStep!.pivotId != null && item.sharedStep!.pivotId !== undefined
                              ? Number(item.sharedStep!.pivotId)
                              : parseInt(parsed.suffix, 10);
                          onRemoveSharedStep(`pivot-${pivotId}`);
                        } else {
                          onRemoveSharedStep(item.id);
                        }
                      }}
                      onView={onViewSharedStep}
                      disabled={isSubmitting}
                    />
                  )
                ))}
              </SortableContext>
            </DndContext>
            
            {/* Buttons below the list when there are entries */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Layers}
                onClick={onOpenSharedStepSelector}
                disabled={isSubmitting}
              >
                Add Shared Step
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={onAddTestStep}
                disabled={isSubmitting}
              >
                Add Step
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-gray-400 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
            <p>No steps added yet.</p>
            <p className="text-sm">Add test steps or shared steps to define the test case workflow.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateTestCaseSteps;