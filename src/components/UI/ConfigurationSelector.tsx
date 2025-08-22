import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Settings as ConfigIcon } from 'lucide-react';
import { Configuration } from '../../services/configurationsApi';

interface ConfigurationSelectorProps {
  availableConfigurations: Configuration[];
  selectedConfigurations: Configuration[];
  onConfigurationsChange: (configurations: Configuration[]) => void;
  onCreateConfiguration?: (label: string) => Promise<Configuration>;
  disabled?: boolean;
  placeholder?: string;
}

const ConfigurationSelector: React.FC<ConfigurationSelectorProps> = ({
  availableConfigurations,
  selectedConfigurations,
  onConfigurationsChange,
  onCreateConfiguration,
  disabled = false,
  placeholder = 'Search configurations...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter available configurations based on search term and exclude already selected
  const filteredConfigurations = (availableConfigurations || []).filter(config => 
    config && config.label && 
    config.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedConfigurations.some(selected => selected && selected.id === config.id)
  );

  // Check if search term would create a new configuration
  const canCreateNew = searchTerm.trim() && 
    !(availableConfigurations || []).some(config => config.label.toLowerCase() === searchTerm.toLowerCase()) &&
    !selectedConfigurations.some(config => config.label.toLowerCase() === searchTerm.toLowerCase()) &&
    onCreateConfiguration;

  const handleConfigurationSelect = (config: Configuration) => {
    if (!selectedConfigurations.some(selected => selected.id === config.id)) {
      onConfigurationsChange([...selectedConfigurations, config]);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleConfigurationRemove = (configToRemove: Configuration) => {
    onConfigurationsChange(selectedConfigurations.filter(config => config.id !== configToRemove.id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (canCreateNew) {
        // Create a temporary configuration that will be created on form submission
        const tempConfig: Configuration = {
          id: `temp-${Date.now()}`,
          label: searchTerm.trim()
        };
        onConfigurationsChange([...selectedConfigurations, tempConfig]);
        setSearchTerm('');
        setIsOpen(false);
      } else if (filteredConfigurations.length > 0) {
        handleConfigurationSelect(filteredConfigurations[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Configurations */}
      {selectedConfigurations.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedConfigurations.map((config) => (
            <span
              key={config.id}
              className="inline-flex items-center px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm text-blue-400"
            >
              <ConfigIcon className="w-3 h-3 mr-1" />
              {config.label}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleConfigurationRemove(config)}
                  className="ml-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
        <ConfigIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {/* Existing configurations */}
          {filteredConfigurations.length > 0 && (
            filteredConfigurations.map((config) => (
              <button
                key={config.id}
                type="button"
                onClick={() => handleConfigurationSelect(config)}
                className="w-full px-4 py-3 text-left text-white hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center">
                  <ConfigIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <div>
                    <div className="font-medium">{config.label}</div>
                  </div>
                </div>
              </button>
            ))
          )}

          {/* Create new configuration option */}
          {canCreateNew && (
            <button
              type="button"
              onClick={() => {
                // Create a temporary configuration that will be created on form submission
                const tempConfig: Configuration = {
                  id: `temp-${Date.now()}`,
                  label: searchTerm.trim()
                };
                onConfigurationsChange([...selectedConfigurations, tempConfig]);
                setSearchTerm('');
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left text-cyan-400 hover:bg-slate-700 transition-colors flex items-center border-t border-slate-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create "{searchTerm}" (will be created on save)
            </button>
          )}

          {/* No results */}
          {filteredConfigurations.length === 0 && !canCreateNew && (
            <div className="px-4 py-3 text-gray-400 text-sm">
              {searchTerm ? 'No configurations found' : 'Start typing to search configurations'}
            </div>
          )}

          {availableConfigurations.length === 0 && (
            <div className="px-4 py-3 text-gray-400 text-sm">
              No configurations available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConfigurationSelector;