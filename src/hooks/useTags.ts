import { useState, useEffect } from 'react';
import { tagsApiService, Tag } from '../services/tagsApi';
import toast from 'react-hot-toast';

export const useTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await tagsApiService.getTags();
      const transformedTags = response.data.map(apiTag => 
        tagsApiService.transformApiTag(apiTag)
      );
      
      setTags(transformedTags);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tags';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTag = async (label: string): Promise<Tag> => {
    try {
      const response = await tagsApiService.createTag(label);
      const newTag = tagsApiService.transformApiTag(response.data);
      
      // Add to local state
      setTags(prevTags => [...prevTags, newTag]);
      
      return newTag;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tag';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  return {
    tags,
    loading,
    error,
    fetchTags,
    createTag
  };
};