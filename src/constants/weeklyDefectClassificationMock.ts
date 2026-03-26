import { DEFECT_CHART_TYPES, type DefectChartKey } from './defectChartTypes';
import type { OverviewDefectMixItem } from '../services/overviewWidgetsApi';

/**
 * Counts mirror the weekly overview design reference (24 total): No Defect ~54.2%, Internal
 * Components Bug ~20.8%, To Investigate ~16.7%, plus small Automation Bug and Network slices.
 * Replace with API `defectMix` when classification data is persisted.
 */
const MOCK_FAIL_COUNT_BY_KEY: Record<DefectChartKey, number> = {
  productBug: 0,
  productMaintenance: 0,
  internalComponentsBug: 5,
  automationBug: 1,
  updateForNewFeature: 0,
  missingSpecifications: 0,
  systemIssue: 0,
  network: 1,
  gitlabIssue: 0,
  noDefect: 13,
  toInvestigate: 4,
  login: 0,
  other: 0,
};

const totalFails = Object.values(MOCK_FAIL_COUNT_BY_KEY).reduce((a, b) => a + b, 0);

/**
 * Static weekly defect-type mix for the overview donut (UI mock aligned with product mockup).
 */
export const WEEKLY_DEFECT_CLASSIFICATION_MOCK: OverviewDefectMixItem[] = DEFECT_CHART_TYPES.map(
  ({ key, label }) => {
    const failCount = MOCK_FAIL_COUNT_BY_KEY[key];
    return {
      tag: key,
      label,
      failCount,
      percent: totalFails > 0 ? Math.round((10000 * failCount) / totalFails) / 100 : null,
    };
  },
);
