import React from 'react';
import { Plus } from 'lucide-react';
import DroppableFolderTree from '../FolderTree/DroppableFolderTree';
import { Folder } from '../../services/foldersApi';

interface TestCasesFolderSidebarProps {
  folderTree: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  foldersLoading: boolean;
  onCreateFolder: () => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  onTestCaseDropped: (testCaseId: string, targetFolderId: string) => void;
  onClearIndividualFilter?: (filterType: string) => void;
}

const TestCasesFolderSidebar: React.FC<TestCasesFolderSidebarProps> = ({
  folderTree,
  selectedFolderId,
  onSelectFolder,
  foldersLoading,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onTestCaseDropped
}) => {
  return (
    <div className="w-64 flex-shrink-0">
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl h-fit">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M3 11h18" />
            </svg>
            <span className="text-sm font-bold text-slate-900 dark:text-white">Folders</span>
          </div>
          <button
            onClick={onCreateFolder}
            className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Create new folder"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Folder list */}
        <div className="p-3 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-280px)]">
          <DroppableFolderTree
            folders={folderTree}
            selectedFolderId={selectedFolderId}
            onSelectFolder={(folderId) => onSelectFolder(folderId)}
            loading={foldersLoading}
            onEditFolder={onEditFolder}
            onDeleteFolder={onDeleteFolder}
            onTestCaseDropped={onTestCaseDropped}
            showTestCaseCount={true}
          />
        </div>
      </div>
    </div>
  );
};

export default TestCasesFolderSidebar;
