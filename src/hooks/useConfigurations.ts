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

      const firstPage = await configurationsApiService.getConfigurations();
      let allConfigs = firstPage.data.map(c =>
        configurationsApiService.transformApiConfiguration(c)
      );

      const { totalItems, itemsPerPage } = firstPage.meta;
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      if (totalPages > 1) {
        const pagePromises = [];
        for (let page = 2; page <= totalPages; page++) {
          pagePromises.push(
            configurationsApiService.getConfigurations(page)
              .then(res => res.data.map(c =>
                configurationsApiService.transformApiConfiguration(c)
              ))
          );
        }
        const rest = await Promise.all(pagePromises);
        for (const pageConfigs of rest) {
          allConfigs = [...allConfigs, ...pageConfigs];
        }
      }

      setConfigurations(allConfigs);

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