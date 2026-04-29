import React from 'react';
import { FolderPlus, Folder as FolderIcon } from 'lucide-react';
import Button from '../UI/Button';
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
  const totalCount = folderTree.reduce((acc, f) => acc + (f.testCasesCount || 0), 0);

  return (
    <div className="w-64 flex-shrink-0">
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl h-fit">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <FolderIcon className="w-4 h-4 text-slate-500 dark:text-gray-400" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Folders</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={FolderPlus}
            onClick={onCreateFolder}
            className="p-1.5 h-7 w-7 flex items-center justify-center"
            title="Create new folder"
          />
        </div>

        {/* All test cases option */}
        <div className="px-3 pt-2">
          <button
            onClick={() => onSelectFolder(null)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedFolderId === null
                ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 font-medium'
                : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            <span>All test cases</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              selectedFolderId === null
                ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-gray-400'
            }`}>
              {totalCount}
            </span>
          </button>
        </div>

        {/* Folder list */}
        <div className="p-3 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-280px)]">
          <DroppableFolderTree
            folders={folderTree}
            selectedFolderId={selectedFolderId}
            onSelectFolder={(folderId) => {
              if (folderId === null) {
                onSelectFolder(null);
              } else {
                onSelectFolder(folderId);
              }
            }}
            loading={foldersLoading}
            onEditFolder={onEditFolder}
            onDeleteFolder={onDeleteFolder}
            onTestCaseDropped={onTestCaseDropped}
          />
        </div>
      </div>
    </div>
  );
};

export default TestCasesFolderSidebar;
