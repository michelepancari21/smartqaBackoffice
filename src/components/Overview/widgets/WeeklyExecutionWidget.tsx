import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { OverviewWeeklyTotals, OverviewWidgetsWindow } from '../../../services/overviewWidgetsApi';
import {
  formatOverviewWindowRangeShort,
  overviewWidgetsLastWeekTrendLabel,
} from '../../../utils/formatOverviewWindowRange';
import { DEFECT_CHART_TYPES } from '../../../constants/defectChartTypes';
import { WEEKLY_DEFECT_CLASSIFICATION_MOCK } from '../../../constants/weeklyDefectClassificationMock';
import {
  DashboardSection,
  DateFilter,
  DonutChartCard,
  SectionToolbar,
  TwoColumnGrid,
  ViewSwitch,
  WidgetContentBody,
  WidgetContentHeader,
} from './dashboard';

interface WeeklyExecutionWidgetProps {
  weeklyTotals: OverviewWeeklyTotals;
  window: OverviewWidgetsWindow;
}

const PASSED_COLOR = '#22C55E';
const FAILED_COLOR = '#EF4444';

const RADIAN = Math.PI / 180;

type PieSectorLabelArgs = {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
};

/**
 * Radial position at the geometric centre of the annulus (true middle of ring thickness vs outer edge).
 */
function ringLabelRadius(innerRadius: number, outerRadius: number): number {
  return innerRadius + (outerRadius - innerRadius) / 2;
}

/**
 * Percentage label centred in the donut band (matches design reference; avoids sitting against the outer rim).
 */
function renderDefectDonutLabel(props: PieSectorLabelArgs): React.ReactElement | null {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (percent < 0.1) {
    return null;
  }
  const r = ringLabelRadius(innerRadius, outerRadius);
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="#fff"
      fontSize={12}
      fontWeight={600}
      pointerEvents="none"
      style={{
        paintOrder: 'stroke',
        stroke: 'rgba(0,0,0,0.5)',
        strokeWidth: 3,
        strokeLinejoin: 'round',
      }}
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
}

/**
 * Pass/fail donut: show percent on slices large enough to read (same band-centred geometry as defect chart).
 */
function renderOverallDonutLabel(props: PieSectorLabelArgs): React.ReactElement | null {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (percent < 0.015) {
    return null;
  }
  const r = ringLabelRadius(innerRadius, outerRadius);
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="#fff"
      fontSize={12}
      fontWeight={600}
      pointerEvents="none"
      style={{
        paintOrder: 'stroke',
        stroke: 'rgba(0,0,0,0.45)',
        strokeWidth: 3,
        strokeLinejoin: 'round',
      }}
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
}

/**
 * Dual donut: live pass/fail totals for the previous calendar week and a static defect-type mix (placeholder).
 */
const WeeklyExecutionWidget: React.FC<WeeklyExecutionWidgetProps> = ({ weeklyTotals, window }) => {
  const { pass, fail } = weeklyTotals;
  const totalTests = pass + fail;

  const overallData = useMemo(() => {
    const rows = [];
    if (pass > 0) {
      rows.push({ name: 'Passed', value: pass, color: PASSED_COLOR });
    }
    if (fail > 0) {
      rows.push({ name: 'Failed', value: fail, color: FAILED_COLOR });
    }
    return rows;
  }, [pass, fail]);

  const defectChartData = useMemo(() => {
    const colorByTag = Object.fromEntries(DEFECT_CHART_TYPES.map(d => [d.key, d.color]));
    return WEEKLY_DEFECT_CLASSIFICATION_MOCK.filter(d => d.failCount > 0).map(d => ({
      name: d.label,
      value: d.failCount,
      color: colorByTag[d.tag] ?? '#94A3B8',
    }));
  }, []);

  const totalClassification = defectChartData.reduce((s, d) => s + d.value, 0);

  return (
    <DashboardSection
      title="Weekly Test Execution & Defects Overview"
      description={`It shows a summary of the test cases run for ${formatOverviewWindowRangeShort(window.from, window.to)} (previous calendar week, Mon–Sun), specifying passed and failed tests along with defect type classifications.`}
      icon="report"
    >
      <WidgetContentHeader>
        <SectionToolbar>
          <div className="flex flex-wrap items-center gap-4">
            <DateFilter value={overviewWidgetsLastWeekTrendLabel(window)} />
            <ViewSwitch options={['Overall statistics', 'Donut view']} />
          </div>
        </SectionToolbar>
      </WidgetContentHeader>

      <WidgetContentBody>
        <TwoColumnGrid>
        <DonutChartCard title="Execution Summary">
          <div className="flex flex-row items-center gap-3 sm:gap-4">
            <div
              className="flex shrink-0 flex-col justify-center gap-2.5 border-r border-slate-200 pr-3 dark:border-slate-600 sm:pr-4"
              aria-label="Pass and fail legend"
            >
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: PASSED_COLOR }} />
                Passed
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: FAILED_COLOR }} />
                Failed
              </span>
            </div>
            <div className="relative h-72 min-w-0 flex-1">
              {overallData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                    <Pie
                      data={overallData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={100}
                      paddingAngle={2}
                      label={renderOverallDonutLabel}
                      labelLine={false}
                    >
                      {overallData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value}`, name]}
                      contentStyle={{
                        backgroundColor: 'var(--tooltip-bg, #1e293b)',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
                  No execution totals in this period
                </div>
              )}
              {overallData.length > 0 ? (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalTests}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">SUM</span>
                </div>
              ) : null}
            </div>
          </div>
        </DonutChartCard>

        <DonutChartCard title="Issue Classification">
          <div className="flex flex-row items-center gap-3 sm:gap-4">
            <div className="relative h-72 min-w-0 flex-1">
              {defectChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                    <Pie
                      data={defectChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={100}
                      paddingAngle={1}
                      label={renderDefectDonutLabel}
                      labelLine={false}
                    >
                      {defectChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value}`, name]}
                      contentStyle={{
                        backgroundColor: 'var(--tooltip-bg, #1e293b)',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
                  No classification sample data
                </div>
              )}
              {defectChartData.length > 0 ? (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalClassification}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">ISSUES</span>
                </div>
              ) : null}
            </div>
            <div
              className="max-h-72 w-[10rem] shrink-0 overflow-y-auto overflow-x-hidden border-l border-slate-200 py-0.5 pl-3 dark:border-slate-600 sm:w-44 sm:pl-4"
              aria-label="Defect classification legend"
            >
              <div className="flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                {DEFECT_CHART_TYPES.map(d => (
                  <div key={d.key} className="flex min-w-0 items-center gap-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: d.color }} />
                    <span className="leading-tight break-words">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DonutChartCard>
      </TwoColumnGrid>
      </WidgetContentBody>
    </DashboardSection>
  );
};

export default WeeklyExecutionWidget;
