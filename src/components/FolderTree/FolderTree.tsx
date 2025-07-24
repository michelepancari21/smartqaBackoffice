import React from 'react';
import { Folder, ChevronRight, ChevronDown, FolderOpen, Loader } from 'lucide-react';
import { Folder as FolderType } from '../../services/foldersApi';

interface FolderNodeProps {
  folder: FolderType;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string) => void;
  level: number;
  expandedFolders: Set<string>;
  onToggleExpanded: (folderId: string) => void;
}

const FolderNode: React.FC<FolderNodeProps> = React.memo(({
  folder,
  selectedFolderId,
  onSelectFolder,
  level,
  expandedFolders,
  onToggleExpanded
}) => {
  const isSelected = selectedFolderId === folder.id;
  const isExpanded = expandedFolders.has(folder.id);
  const hasChildren = folder.children.length > 0;

  const handleToggle = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasChildren) {
      console.log('🔄 Toggling folder expansion:', folder.name);
      onToggleExpanded(folder.id);
    }
  }, [hasChildren, folder.id, folder.name, onToggleExpanded]);

  const handleSelect = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('👆 Folder clicked:', folder.name, 'ID:', folder.id, 'Test cases:', folder.testCasesCount);
    onSelectFolder(folder.id);
  }, [folder.id, folder.name, folder.testCasesCount, onSelectFolder]);

  // Utiliser directement le compteur calculé du dossier
  const testCasesCount = folder.testCasesCount;

  return (
    <div>
      <div
        className={`flex items-center py-2 px-3 cursor-pointer transition-colors rounded-lg ${
          isSelected
            ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30'
            : 'text-gray-300 hover:text-cyan-400 hover:bg-slate-800/50'
        }`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        onClick={handleSelect}
      >
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="flex items-center justify-center w-4 h-4 mr-2 text-gray-400 hover:text-cyan-400 transition-colors"
            type="button"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        ) : (
          <div className="w-4 h-4 mr-2" />
        )}
        
        <div className="flex items-center flex-1 min-w-0">
          {hasChildren ? (
            <FolderOpen className="w-4 h-4 mr-2 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 mr-2 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span className="truncate text-sm font-medium">{folder.name}</span>
              {/* TOUJOURS afficher le compteur avec des couleurs distinctes pour debug */}
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                testCasesCount > 0 
                  ? 'text-cyan-400 bg-cyan-500/20 border border-cyan-500/30' 
                  : 'text-gray-500 bg-slate-700/50 border border-slate-600'
              }`}>
                {testCasesCount}
              </span>
            </div>
            {/* Afficher la description uniquement pour le dossier sélectionné */}
            {isSelected && folder.description && (
              <div className="text-xs text-gray-400 mt-1 truncate">
                {folder.description}
              </div>
            )}
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {folder.children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              level={level + 1}
              expandedFolders={expandedFolders}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
});

FolderNode.displayName = 'FolderNode';

interface FolderTreeProps {
  folders: FolderType[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string) => void;
  loading: boolean;
}

const FolderTree: React.FC<FolderTreeProps> = React.memo(({
  folders,
  selectedFolderId,
  onSelectFolder,
  loading
}) => {
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());

  const handleToggleExpanded = React.useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId);
      } else {
        newExpanded.add(folderId);
      }
      return newExpanded;
    });
  }, []);

  const handleSelectFolder = React.useCallback((folderId: string) => {
    console.log('🎯 FolderTree: selecting folder', folderId);
    onSelectFolder(folderId);
  }, [onSelectFolder]);

  // Auto-expand folders that contain the selected folder
  React.useEffect(() => {
    if (selectedFolderId) {
      setExpandedFolders(prev => {
        const newExpanded = new Set(prev);
        
        // Find the path to the selected folder and expand all parents
        const findAndExpandParents = (folderList: FolderType[], targetId: string): boolean => {
          for (const folder of folderList) {
            if (folder.id === targetId) {
              return true;
            }
            
            if (folder.children.length > 0) {
              const found = findAndExpandParents(folder.children, targetId);
              if (found) {
                newExpanded.add(folder.id);
                return true;
              }
            }
          }
          return false;
        };
        
        findAndExpandParents(folders, selectedFolderId);
        return newExpanded;
      });
    }
  }, [selectedFolderId, folders]);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="flex items-center justify-center text-gray-400 text-sm">
          <Loader className="w-4 h-4 mr-2 animate-spin" />
          Loading folders...
        </div>
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-400 text-sm">No folders found</div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {folders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          selectedFolderId={selectedFolderId}
          onSelectFolder={handleSelectFolder}
          level={0}
          expandedFolders={expandedFolders}
          onToggleExpanded={handleToggleExpanded}
        />
      ))}
    </div>
  );
});

FolderTree.displayName = 'FolderTree';

export default FolderTree;