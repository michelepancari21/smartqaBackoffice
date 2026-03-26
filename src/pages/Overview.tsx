import React, { useState } from 'react';
import { LayoutGrid, Rocket } from 'lucide-react';
import OverviewLaunchesTable from '../components/Overview/OverviewLaunchesTable';
import OverviewWidgetsPanel from '../components/Overview/widgets/OverviewWidgetsPanel';

type TabType = 'widgets' | 'launches';

const Overview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('widgets');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Overview</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex -mb-px">
            <button
              type="button"
              onClick={() => setActiveTab('widgets')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'widgets'
                  ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Widgets
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('launches')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'launches'
                  ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <Rocket className="w-4 h-4" />
              Launches
            </button>
          </nav>
        </div>

        {activeTab === 'widgets' ? (
          <div className="p-6 bg-slate-50 dark:bg-slate-900/40">
            <OverviewWidgetsPanel />
          </div>
        ) : (
          <div className="p-6 min-h-[12rem] bg-slate-50 dark:bg-slate-900/40">
            <OverviewLaunchesTable />
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
