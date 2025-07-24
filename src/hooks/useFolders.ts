import { useState, useEffect, useRef, useCallback } from 'react';
import { foldersApiService, Folder } from '../services/foldersApi';
import toast from 'react-hot-toast';

export const useFolders = (projectId?: string | null) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderTree, setFolderTree] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  // Cache pour éviter les rechargements inutiles
  const foldersCache = useRef<Map<string, { folders: Folder[]; tree: Folder[] }>>(new Map());
  const previousProjectId = useRef<string | null>(null);
  const isInitialized = useRef(false);

  // Function to update folders with extracted data from test cases
  const updateFoldersFromTestCases = useCallback(async (extractedFolders: any[], forceProjectId?: string) => {
    const targetProjectId = forceProjectId || projectId;
    
    console.log('📁 updateFoldersFromTestCases called with:', extractedFolders, 'project:', targetProjectId);
    
    if (!targetProjectId) {
      console.log('🚫 No project ID for folders');
      setFolders([]);
      setFolderTree([]);
      setSelectedFolderId(null);
      return;
    }

    console.log('📁 Processing', extractedFolders.length, 'extracted folders');
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📂 Fetching folder details and updating with test case counts');
      const response = await foldersApiService.getFolders(targetProjectId);
      
      console.log('📂 Folders API response:', response);
      console.log('📂 API returned', response.data.length, 'folders');
      
      // Verify all folders belong to the correct project
      const invalidFolders = response.data.filter(folder => {
        const folderProjectId = folder.relationships.project.data.id.split('/').pop();
        return folderProjectId !== targetProjectId;
      });
      
      if (invalidFolders.length > 0) {
        console.warn('⚠️ Found folders that do not belong to project', targetProjectId, ':', invalidFolders);
      }
      
      // Transform API folders to our internal format
      console.log('🔄 Transforming folders...');
      const transformedFolders: Folder[] = [];
      
      for (const apiFolder of response.data) {
        // Double-check project ownership during transformation
        const folderProjectId = apiFolder.relationships.project.data.id.split('/').pop();
        if (folderProjectId !== targetProjectId) {
          console.warn('⚠️ Skipping folder that belongs to different project:', apiFolder.attributes.name, 'belongs to:', folderProjectId, 'expected:', targetProjectId);
          continue;
        }
        
        const transformed = foldersApiService.transformApiFolder(apiFolder, targetProjectId);
        
        // Find matching extracted folder to get test case count
        const extractedFolder = extractedFolders.find(ef => ef.id === transformed.id);
        console.log('📊 Matching folder:', transformed.id, 'with extracted:', extractedFolder);
        if (extractedFolder) {
          transformed.testCasesCount = extractedFolder.testCasesCount;
          transformed.directTestCasesCount = extractedFolder.testCasesCount;
          console.log('📊 Set count for folder', transformed.name, ':', extractedFolder.testCasesCount);
        } else {
          console.log('⚠️ No test cases found for folder:', transformed.name, '(ID:', transformed.id, ')');
          transformed.testCasesCount = 0;
          transformed.directTestCasesCount = 0;
        }
        
        transformedFolders.push(transformed);
      }
      
      console.log('✅ Transformed', transformedFolders.length, 'folders');
      
      // Also check if there are extracted folders that don't exist in API response
      extractedFolders.forEach(extracted => {
        const found = transformedFolders.find(tf => tf.id === extracted.id);
        if (!found) {
          console.log('⚠️ Extracted folder not found in API:', extracted);
        }
      });
      
      // Build the folder tree (counts already set above)
      const tree = foldersApiService.buildFolderTree(transformedFolders, []);
      
      console.log('🌳 Built folder tree:', tree);
      console.log('🌳 Tree has', tree.length, 'root folders');
      
      // Mettre en cache les résultats
      foldersCache.current.set(targetProjectId, { folders: transformedFolders, tree });
      console.log('💾 Cached folders for project:', targetProjectId);
      
      setFolders(transformedFolders);
      setFolderTree(tree);
      
      // Auto-select the first folder SEULEMENT si aucun dossier n'est sélectionné OU si le projet a changé
      const projectChanged = previousProjectId.current !== targetProjectId;
      
      if ((!selectedFolderId || projectChanged) && tree.length > 0) {
        const firstFolder = foldersApiService.getFirstFolder(tree);
        if (firstFolder) {
          console.log('🎯 Auto-selecting first folder:', firstFolder.name, 'ID:', firstFolder.id);
          setSelectedFolderId(firstFolder.id);
        }
      } else if (tree.length === 0) {
        console.log('⚠️ No folders in tree, clearing selection');
        setSelectedFolderId(null);
      }
      
      // Update the previous project ID
      previousProjectId.current = targetProjectId;
      isInitialized.current = true;
      
    } catch (err) {
      console.error('❌ Full folder error details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch folders';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Error fetching folders:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fonction fetchFolders stable qui ne change pas à chaque render
  const fetchFolders = useCallback(async (forceProjectId?: string) => {
    const targetProjectId = forceProjectId || projectId;
    
    if (!targetProjectId) {
      console.log('🚫 No project ID, clearing folders');
      setFolders([]);
      setFolderTree([]);
      setSelectedFolderId(null);
      setLoading(false);
      return;
    }

    // Vérifier le cache d'abord
    const cached = foldersCache.current.get(targetProjectId);
    if (cached) {
      console.log('✅ Using cached folders for project:', targetProjectId);
      setFolders(cached.folders);
      setFolderTree(cached.tree);
      
      // Auto-select first folder if none selected
      if (!selectedFolderId && cached.tree.length > 0) {
        const firstFolder = foldersApiService.getFirstFolder(cached.tree);
        if (firstFolder) {
          console.log('🎯 Auto-selecting first folder from cache:', firstFolder.name);
          setSelectedFolderId(firstFolder.id);
        }
      }
      
      setLoading(false);
      return;
    }

    // If no cache, we'll wait for test cases to provide folder data
    console.log('⏳ Waiting for test cases to provide folder data...');
  }, [projectId, selectedFolderId]);

  const selectFolder = useCallback((folderId: string) => {
    console.log('👆 Manually selecting folder ID:', folderId);
    setSelectedFolderId(folderId);
  }, []);

  const getSelectedFolder = useCallback((): Folder | null => {
    if (!selectedFolderId) return null;
    
    // Search in the tree structure
    const found = foldersApiService.findFolderById(folderTree, selectedFolderId);
    if (found) {
      console.log('📁 Selected folder:', found.name, 'ID:', found.id, 'Test cases:', found.testCasesCount);
    }
    return found;
  }, [selectedFolderId, folderTree]);

  // Invalidate cache when project changes
  const invalidateCache = useCallback((projectId: string) => {
    console.log('🗑️ Invalidating cache for project:', projectId);
    foldersCache.current.delete(projectId);
  }, []);

  // Optimisation: utiliser le cache intelligent avec une logique plus stricte
  useEffect(() => {
    const projectChanged = previousProjectId.current !== projectId;
    
    console.log('🔄 useFolders effect triggered:', {
      projectId,
      projectChanged,
      isInitialized: isInitialized.current,
      previousProjectId: previousProjectId.current,
      hasCache: projectId ? foldersCache.current.has(projectId) : false
    });

    if (projectId) {
      const hasCache = foldersCache.current.has(projectId);
      
      if (hasCache) {
        // TOUJOURS utiliser le cache si disponible
        console.log('✅ Using cached folders for project:', projectId);
        const cached = foldersCache.current.get(projectId);
        if (cached) {
          setFolders(cached.folders);
          setFolderTree(cached.tree);
          setLoading(false);
          
          // Auto-select first folder if none selected
          if (!selectedFolderId && cached.tree.length > 0) {
            const firstFolder = foldersApiService.getFirstFolder(cached.tree);
            if (firstFolder) {
              console.log('🎯 Auto-selecting first folder from cache:', firstFolder.name);
              setSelectedFolderId(firstFolder.id);
            }
          }
        }
      } else {
        // Charger les dossiers seulement si pas de cache
        console.log('🚀 Loading folders for project:', projectId, '(no cache available)');
        fetchFolders(projectId);
      }
    } else {
      console.log('🚫 No project ID, clearing all folder data');
      setFolders([]);
      setFolderTree([]);
      setSelectedFolderId(null);
      setLoading(false);
      previousProjectId.current = null;
      isInitialized.current = false;
    }
  }, [projectId, fetchFolders]); // Ajouter fetchFolders comme dépendance

  return {
    folders,
    folderTree,
    loading,
    error,
    selectedFolderId,
    updateFoldersFromTestCases,
    fetchFolders,
    selectFolder,
    getSelectedFolder,
    invalidateCache
  };
};