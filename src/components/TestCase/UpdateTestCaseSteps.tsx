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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import Button from '../UI/Button';
import DraggableTestStepWithAutoUpload from './DraggableTestStepWithAutoUpload';
import DraggableSharedStep from './DraggableSharedStep';
import { SharedStep } from '../../services/sharedStepsApi';

interface TestStep {
  id: string;
  step: string;
  result: string;
  originalId?: string;
}

interface TestStepOrSharedStep {
  type: 'step' | 'shared';
  id: string;
  step?: string;
  result?: string;
  originalId?: string;
  sharedStep?: SharedStep;
}

interface UpdateTestCaseStepsProps {
  testSteps: TestStep[];
  sharedSteps: SharedStep[];
  stepOrder: Array<{ type: 'step' | 'shared'; id: string }>;
  onAddTestStep: () => void;
  onUpdateTestStep: (id: string, field: 'step' | 'result', value: string) => void;
  onRemoveTestStep: (id: string) => void;
  onRemoveSharedStep: (sharedStepId: string) => void;
  onViewSharedStep: (sharedStep: SharedStep) => void;
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

  // Combine test steps and shared steps for drag and drop
  const allSteps: TestStepOrSharedStep[] = stepOrder.map(orderItem => {
    if (orderItem.type === 'step') {
      const step = testSteps.find(s => s.id === orderItem.id);
      return step ? { type: 'step' as const, id: step.id, step: step.step, result: step.result, originalId: step.originalId } : null;
    } else {
      const sharedStepId = orderItem.id.replace('shared-', '');
      const sharedStep = sharedSteps.find(s => s.id === sharedStepId);
      return sharedStep ? { type: 'shared' as const, id: orderItem.id, sharedStep } : null;
    }
  }).filter(Boolean) as TestStepOrSharedStep[];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-gray-300">
          Steps and Results
        </label>
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
      </div>
      
      <div className="space-y-4">
        {allSteps.length > 0 ? (
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
                    index={index}
                    onRemove={onRemoveSharedStep}
                    onView={onViewSharedStep}
                    disabled={isSubmitting}
                  />
                )
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed border-slate-600 rounded-lg">
            <p>No steps added yet.</p>
            <p className="text-sm">Add test steps or shared steps to define the test case workflow.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateTestCaseSteps;