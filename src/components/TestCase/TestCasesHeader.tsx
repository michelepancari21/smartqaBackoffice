import React from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import Button from '../UI/Button';
import { Project } from '../../types';
import PermissionGuard from '../PermissionGuard';
import { PERMISSIONS } from '../../utils/permissions';

interface TestCasesHeaderProps {
  selectedProject: Project | null;
  totalItems: number;
  selectedFolder: { id: string; name: string } | null;
  onCreateTestCase: () => void;
  disabled: boolean;
}

const TestCasesHeader: React.FC<TestCasesHeaderProps> = ({
  selectedProject,
  selectedFolder,
  onCreateTestCase,
  disabled
}) => {
  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400">
        <span className="hover:text-slate-700 dark:hover:text-gray-200 cursor-pointer transition-colors">Projects</span>
        {selectedProject && (
          <>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hover:text-slate-700 dark:hover:text-gray-200 cursor-pointer transition-colors">
              {selectedProject.name}
            </span>
          </>
        )}
        {selectedFolder && (
          <>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hover:text-slate-700 dark:hover:text-gray-200 cursor-pointer transition-colors">
              {selectedFolder.name}
            </span>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-cyan-600 dark:text-cyan-400 font-medium">Test Cases</span>
      </div>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
            {selectedProject
              ? selectedProject.name
              : 'Test Cases'}
          </h1>
          {selectedProject?.description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400 max-w-2xl line-clamp-2">
              {selectedProject.description}
            </p>
          )}
          {!selectedProject && (
            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
              Please select a project to view test cases
            </p>
          )}
        </div>
        <PermissionGuard permission={PERMISSIONS.TEST_CASE.CREATE}>
          <Button
            icon={Plus}
            onClick={onCreateTestCase}
            disabled={disabled}
            title={!selectedProject ? 'Please select a project first' : 'Create new test case'}
            className="shrink-0"
          >
            Create new test case
          </Button>
        </PermissionGuard>
      </div>
    </div>
  );
};

export default TestCasesHeader;
