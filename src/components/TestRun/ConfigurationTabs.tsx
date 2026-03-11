import React from 'react';
import { Monitor, Cpu } from 'lucide-react';

export type ConfigTab = 'manual' | 'automated';

interface ConfigurationTabsProps {
  activeTab: ConfigTab;
  onTabChange: (tab: ConfigTab) => void;
  manualCount: number;
  automatedCount: number;
  hasAutomatedConfigs: boolean;
}

const ConfigurationTabs: React.FC<ConfigurationTabsProps> = ({
  activeTab,
  onTabChange,
  manualCount,
  automatedCount,
  hasAutomatedConfigs,
}) => {
  if (!hasAutomatedConfigs) return null;

  return (
    <div className="flex border-b border-slate-200 dark:border-slate-700">
      <button
        onClick={() => onTabChange('manual')}
        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative ${
          activeTab === 'manual'
            ? 'text-cyan-600 dark:text-cyan-400'
            : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
        }`}
      >
        <Monitor className="w-4 h-4" />
        <span>Manual</span>
        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          activeTab === 'manual'
            ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-gray-400'
        }`}>
          {manualCount}
        </span>
        {activeTab === 'manual' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 dark:bg-cyan-400" />
        )}
      </button>
      <button
        onClick={() => onTabChange('automated')}
        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative ${
          activeTab === 'automated'
            ? 'text-cyan-600 dark:text-cyan-400'
            : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300'
        }`}
      >
        <Cpu className="w-4 h-4" />
        <span>Automated</span>
        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          activeTab === 'automated'
            ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-gray-400'
        }`}>
          {automatedCount}
        </span>
        {activeTab === 'automated' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 dark:bg-cyan-400" />
        )}
      </button>
    </div>
  );
};

export default ConfigurationTabs;
