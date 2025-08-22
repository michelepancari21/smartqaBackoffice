import { useState, useEffect } from 'react';
import { configurationsApiService, Configuration } from '../services/configurationsApi';
import toast from 'react-hot-toast';

export const useConfigurations = () => {
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await configurationsApiService.getConfigurations();
      const transformedConfigurations = response.data.map(apiConfiguration => 
        configurationsApiService.transformApiConfiguration(apiConfiguration)
      );
      
      setConfigurations(transformedConfigurations);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch configurations';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching configurations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, []);

  return {
    configurations,
    loading,
    error,
    fetchConfigurations
  };
};