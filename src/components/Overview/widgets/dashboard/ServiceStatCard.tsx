import React from 'react';

interface ServiceStatCardProps {
  /** Service name, country name, or other row label. */
  serviceName: string;
  passingRate: string;
  testCases: number;
  status: 'failed' | 'passed';
  /** When set, card is interactive (e.g. drill down from service list). */
  onClick?: () => void;
}

/**
 * Single service/country execution summary card (coloured top bar only).
 */
export const ServiceStatCard: React.FC<ServiceStatCardProps> = ({
  serviceName,
  passingRate,
  testCases,
  status,
  onClick,
}) => {
  const topBar = status === 'passed' ? 'border-t-4 border-green-500' : 'border-t-4 border-red-500';
  const baseClass = `rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800 ${topBar}`;

  const body = (
    <>
      <h4
        className="mb-4 truncate text-sm font-bold text-slate-900 dark:text-white"
        title={serviceName}
      >
        {serviceName}
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Passing rate</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">{passingRate}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Test cases</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">{testCases}</div>
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClass} w-full cursor-pointer text-left transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400`}
        aria-label={`View ${serviceName} breakdown by country`}
      >
        {body}
      </button>
    );
  }

  return <div className={baseClass}>{body}</div>;
};
